import * as dfd from 'danfojs-node';
import fs from 'fs';

interface FileParams {
  filePath: string;
  isContent: boolean;
}

export interface DatasetInfo {
  shape: number[];
  columns: string[];
  memoryUsage: string;
  missingValues: Record<string, number>;
  cardinality: Record<string, number>;
  duplicates: number;
  constantCols: string[];
  outliers: Record<string, number>;
  basicStats: Record<string, any>;
  chartData: {
    histogram: { label: string; data: any[] }[];
    scatter: { x: any[]; y: any[] }[];
  };
}

/**
 * ✅ Sanitize the object to prevent serialization issues
 * - Converts NaN, Infinity to null
 * - Replaces function references with actual values
 */
function sanitizeForIPC(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForIPC(item));
  }

  const sanitized: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === 'function') {
        // ✅ Extract the mode values from the function reference
        try {
          sanitized[key] = value().values ?? null;
        } catch {
          sanitized[key] = null;
        }
      } else if (typeof value === 'number') {
        // ✅ Replace Infinity or NaN with null
        sanitized[key] = isFinite(value) ? value : null;
      } else if (typeof value === 'bigint') {
        sanitized[key] = value.toString();  // Convert BigInt to string
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeForIPC(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * ✅ Manually calculates the quantile
 */
function calculateQuantile(values: number[], quantile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = quantile * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sorted[lower];
  }

  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * ✅ Outlier detection using manual IQR calculation
 */
function detectOutliers(series: dfd.Series): number {
  const values = series.values.map(Number).filter((v) => !isNaN(v));

  if (values.length === 0) return 0;

  const q1 = calculateQuantile(values, 0.25);
  const q3 = calculateQuantile(values, 0.75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return values.filter((v) => v < lowerBound || v > upperBound).length;
}

/**
 * ✅ Removes duplicates manually.
 */
function removeDuplicates(df: dfd.DataFrame): dfd.DataFrame {
  const combined = df.columns.map((col) => df[col].values.map((v) => JSON.stringify(v))).flat();
  const uniqueSet = new Set(combined);
  const uniqueData = Array.from(uniqueSet).map((row) => JSON.parse(row));
  return new dfd.DataFrame(uniqueData);
}

/**
 * ✅ Processes the file and generates dataset information.
 */
export async function processFile(params: FileParams): Promise<DatasetInfo> {
  try {
    const { filePath, isContent } = params;
    let df: dfd.DataFrame;

    console.log(`📂 Processing file: ${filePath} | isContent: ${isContent}`);

    if (isContent) {
      const content: string = typeof filePath === 'string' ? filePath.trim() : '';
      if (!content) throw new Error("Content is empty or invalid.");

      if (content.startsWith('{') || content.startsWith('[')) {
        const jsonData = JSON.parse(content);
        df = new dfd.DataFrame(Array.isArray(jsonData) ? jsonData : [jsonData]);
      } else if (content.includes(',')) {
        const lines = content.split('\n').filter((line) => line.trim() !== '');
        const headers = lines[0].split(',');
        const rows = lines.slice(1).map((line) => line.split(','));
        const data = rows.map((row) => {
          const obj: Record<string, string> = {};
          headers.forEach((header, index) => {
            obj[header.trim()] = row[index] ? row[index].trim() : '';
          });
          return obj;
        });
        df = new dfd.DataFrame(data);
      } else {
        const textData = content.split('\n').map((line) => ({ text: line }));
        df = new dfd.DataFrame(textData);
      }
    } else {
      const ext = filePath.split('.').pop()?.toLowerCase();
      if (ext === 'csv') {
        df = await dfd.readCSV(filePath);
      } else if (ext === 'json') {
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        df = new dfd.DataFrame(Array.isArray(jsonData) ? jsonData : [jsonData]);
      } else {
        throw new Error(`Unsupported file format: ${ext}`);
      }
    }

    if (df.shape[0] === 0 || df.shape[1] === 0) {
      throw new Error("No valid data found in the file.");
    }

    const cleanedDf = removeDuplicates(df);
    const duplicates = df.shape[0] - cleanedDf.shape[0];

    const basicStats: Record<string, any> = {};
    const numericCols = df.columns.filter((col: string) => {
      const dtype = (df[col] as any).dtype as string;
      return dtype === 'float32' || dtype === 'int32';
    });

    numericCols.forEach((col: string) => {
      const series = df[col];
      basicStats[col] = {
        mean: isFinite(series.mean()) ? series.mean() : null,
        median: series.median(),
        mode: series.mode().values ?? [],
        min: series.min(),
        max: series.max(),
        std: isFinite(series.std()) ? series.std() : null,
        variance: isFinite(series.var()) ? series.var() : null,
        range: series.max() - series.min(),
      };
    });

    const chartData = {
      histogram: numericCols.map((col: string) => ({
        label: col,
        data: df[col].values,
      })),
      scatter: numericCols.length >= 2
        ? [{ x: df[numericCols[0]].values, y: df[numericCols[1]].values }]
        : [],
    };

    const info: DatasetInfo = sanitizeForIPC({
      shape: df.shape,
      columns: df.columns,
      memoryUsage: `${(df.size * 8 / (1024 * 1024)).toFixed(2)} MB`,
      missingValues: {},
      cardinality: {},
      duplicates,
      constantCols: [],
      outliers: {},
      basicStats,
      chartData,
    });

    console.log(`✅ Data processed successfully:`, info);
    return info;

  } catch (error) {
    console.error(`❌ Error in data processing:`, error);
    throw error;
  }
}
