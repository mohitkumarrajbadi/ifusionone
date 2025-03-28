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
                const filePath = (file as any).path;

                const result: DatasetInfo = await (window as any).electron.invokeCommand(
                    'ai:process-dataset',
                    { filePath, isContent: false }
                );

                setFileInfo(result);
            } else {
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
            <h1>Upload Dataset</h1>
            <input 
                type="file" 
                onChange={handleFileChange} 
                accept=".csv,.json,.jsonl,.txt" 
            />
            <button onClick={handleUpload} disabled={loading} style={{ marginLeft: '10px' }}>
                {loading ? 'Uploading...' : 'Upload and Analyze'}
            </button>

            {loading && <p>Loading dataset...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {fileInfo && (
                <>
                    <div style={{ background: '#f4f4f4', padding: '20px', margin: '20px 0', borderRadius: '8px' }}>
                        <h2>Dataset Info:</h2>
                        <pre>Shape: {JSON.stringify(fileInfo.shape, null, 2)}</pre>
                        <pre>Columns: {JSON.stringify(fileInfo.columns, null, 2)}</pre>
                        <pre>Memory Usage: {fileInfo.memoryUsage}</pre>
                        <pre>Duplicates: {fileInfo.duplicates}</pre>
                        <pre>Constant Columns: {JSON.stringify(fileInfo.constantCols)}</pre>
                        <pre>Outliers: {JSON.stringify(fileInfo.outliers)}</pre>

                        <h3>Basic Stats:</h3>
                        {Object.keys(fileInfo.basicStats).map((col) => (
                            <div key={col}>
                                <h4>{col}</h4>
                                <pre>{JSON.stringify(fileInfo.basicStats[col], null, 2)}</pre>
                            </div>
                        ))}
                    </div>

                    <div className="chart-container">
                        <DatasetVisualizer data={fileInfo} />
                    </div>
                </>
            )}
        </div>
    );
};

export default DatasetManager;
