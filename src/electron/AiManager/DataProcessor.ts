import * as dfd from 'danfojs-node';
import fs from 'fs';

interface FileParams {
  filePath: string;
  isContent: boolean;
}

export interface DatasetInfo {
  shape: number[];
  columns: string[];
  head: any[];                // First few rows as a preview
  summary: Record<string, any>;  // Summary statistics for each column
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
 * Sanitize an object for IPC communication:
 * - Replace NaN/Infinity with null.
 * - Convert functions to their return values if possible.
 */
function sanitizeForIPC(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForIPC);
  
  const sanitized: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === 'function') {
        try {
          sanitized[key] = value().values ?? null;
        } catch {
          sanitized[key] = null;
        }
      } else if (typeof value === 'number') {
        sanitized[key] = isFinite(value) ? value : null;
      } else if (typeof value === 'bigint') {
        sanitized[key] = value.toString();
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
 * Calculates the quantile for an array of numbers.
 */
function calculateQuantile(values: number[], quantile: number): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const index = quantile * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Detects outliers using the IQR method on a numeric Series.
 */
function detectOutliers(series: dfd.Series): number {
  const values = series.values.map((v: any) => parseFloat(v)).filter((v: number) => !isNaN(v));
  if (values.length === 0) return 0;
  const q1 = calculateQuantile(values, 0.25);
  const q3 = calculateQuantile(values, 0.75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  return values.filter((v) => v < lowerBound || v > upperBound).length;
}

/**
 * Removes duplicate rows from a DataFrame.
 */
function removeDuplicates(df: dfd.DataFrame): dfd.DataFrame {
  const rowSet = new Set<string>();
  const uniqueRows: any[][] = [];
  for (let i = 0; i < df.shape[0]; i++) {
    const row = df.iloc({ rows: [i] }).values[0];
    const rowStr = JSON.stringify(row);
    if (!rowSet.has(rowStr)) {
      rowSet.add(rowStr);
      uniqueRows.push(row);
    }
  }
  return new dfd.DataFrame(uniqueRows, { columns: df.columns });
}

/**
 * Processes the file and generates extensive dataset information.
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

    // Duplicate Removal and Count
    const cleanedDf = removeDuplicates(df);
    const duplicates = df.shape[0] - cleanedDf.shape[0];

    // Calculate Missing Values for Each Column
    const missingValues: Record<string, number> = {};
    df.columns.forEach((col: string) => {
      const series = df[col] as dfd.Series;
      missingValues[col] = (series.isNa() as any).sum();
    });

    // Cardinality for Each Column
    const cardinality: Record<string, number> = {};
    df.columns.forEach((col: string) => {
      const series = df[col] as dfd.Series;
      cardinality[col] = (series.unique() as any).values.length;
    });

    // Identify Constant Columns (only one unique value)
    const constantCols: string[] = df.columns.filter((col: string) => {
      const series = df[col] as dfd.Series;
      return (series.unique() as any).values.length === 1;
    });

    // Outlier detection for numeric columns
    const outliers: Record<string, number> = {};
    const numericCols = df.columns.filter((col: string) => {
      const dtype = (df[col] as any).dtype as string;
      return dtype === 'float32' || dtype === 'int32';
    });
    numericCols.forEach((col: string) => {
      const series = df[col] as dfd.Series;
      outliers[col] = detectOutliers(series);
    });

    // Basic statistics for numeric columns
    const basicStats: Record<string, any> = {};
    numericCols.forEach((col: string) => {
      const series = df[col] as dfd.Series;
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

    // Extract sample rows (head)
    const head = df.head(5).values;

    // Chart data for visualization (example: histogram and scatter)
    const chartData = {
      histogram: numericCols.map((col: string) => ({
        label: col,
        data: (df[col] as dfd.Series).values,
      })),
      scatter: numericCols.length >= 2
        ? [{
            x: (df[numericCols[0]] as dfd.Series).values,
            y: (df[numericCols[1]] as dfd.Series).values,
          }]
        : [],
    };

    // Compile all information into DatasetInfo
    const info: DatasetInfo = sanitizeForIPC({
      shape: df.shape,
      columns: df.columns,
      head, // first 5 rows of data
      summary: df.describe().toString(), // basic description as a string
      memoryUsage: `${(df.size * 8 / (1024 * 1024)).toFixed(2)} MB`,
      missingValues,
      cardinality,
      duplicates,
      constantCols,
      outliers,
      basicStats,
      chartData,
    });

    console.log("✅ Data processed successfully ");
    return info;
  } catch (error) {
    console.error("❌ Error in data processing:", error);
    throw error;
  }
}
