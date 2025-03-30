import React, { useState } from 'react';
import DatasetVisualizer from './DatasetVisualizer';

interface DatasetInfo {
    shape: number[];
    columns: string[];
    summary: string;
    head: string;
    memoryUsage: string;
    missingValues: Record<string, number>;
    cardinality: Record<string, number>;
    duplicates: number;
    constantCols: string[];
    outliers: Record<string, number>;
    basicStats: Record<string, any>;
    chartData: any;
}

const DatasetManager: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [fileInfo, setFileInfo] = useState<DatasetInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setFileInfo(null);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const isElectron = !!(window && (window as any).electron);

            if (isElectron && (file as any).path) {
                // For Electron, use file path
                const filePath = (file as any).path;

                const result: DatasetInfo = await (window as any).electron.invokeCommand(
                    'ai:process-dataset',
                    { filePath, isContent: false }
                );

                setFileInfo(result);

            } else {
                // For Web, read file content
                const reader = new FileReader();
                
                reader.onload = async (event) => {
                    const content = event.target?.result as string;

                    if (!content) {
                        setError('Failed to read file content.');
                        return;
                    }

                    const result: DatasetInfo = await (window as any).electron.invokeCommand(
                        'ai:process-dataset',
                        { filePath: content, isContent: true }
                    );

                    setFileInfo(result);
                };

                reader.onerror = () => {
                    setError('Error reading file.');
                };

                reader.readAsText(file);
            }
        } catch (err: any) {
            console.error('Error processing file:', err);
            setError(err.message || 'Failed to process the file.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>📁 Upload Dataset</h1>
            
            <input
                type="file"
                onChange={handleFileChange}
                accept=".csv,.json,.jsonl,.txt"
                style={{ marginBottom: '10px' }}
            />
            
            <button onClick={handleUpload} disabled={loading} style={{ marginLeft: '10px' }}>
                {loading ? 'Uploading...' : 'Upload and Analyze'}
            </button>

            {loading && <p>Loading dataset...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {fileInfo && (
                <>
                    {/* Dataset Information Section */}
                    <div style={{ marginTop: '20px' }}>
                        <h2>📊 Dataset Info</h2>

                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div>
                                <strong>🔹 Shape:</strong> {JSON.stringify(fileInfo.shape)}
                            </div>
                            <div>
                                <strong>🔹 Columns:</strong> {fileInfo.columns.join(', ')}
                            </div>
                            <div>
                                <strong>🔹 Memory Usage:</strong> {fileInfo.memoryUsage}
                            </div>
                            <div>
                                <strong>🔹 Duplicates:</strong> {fileInfo.duplicates}
                            </div>
                            <div>
                                <strong>🔹 Constant Columns:</strong> {fileInfo.constantCols.join(', ') || 'None'}
                            </div>
                        </div>

                        <h3>📈 Basic Stats</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                            {Object.keys(fileInfo.basicStats).map((col) => (
                                <div key={col} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
                                    <h4>{col}</h4>
                                    <pre>{JSON.stringify(fileInfo.basicStats[col], null, 2)}</pre>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dataset Visualization */}
                    <div className="chart-container" style={{ marginTop: '30px' }}>
                        <h2>📊 Visualization</h2>
                        <DatasetVisualizer 
                            data={fileInfo} 
                            config={{
                                chartType: "bar", 
                                colors: ["#FF5733", "#33FF57", "#3357FF"], 
                                xAxisKey: "label",
                                yAxisKey: "data",
                                customXAxisLabel: "X-Axis",
                                customYAxisLabel: "Y-Axis",
                                showGrid: true
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default DatasetManager;
