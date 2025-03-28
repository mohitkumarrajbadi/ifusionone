import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, ScatterChart, Scatter } from 'recharts';

interface DatasetVisualizerProps {
    data: {
        chartData: {
            histogram?: { label: string; data: number[] }[];
            scatter?: { x: number; y: number }[];
        };
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const DatasetVisualizer: React.FC<DatasetVisualizerProps> = ({ data }) => {
    if (!data || !data.chartData) {
        return <p>No chart data available.</p>;
    }

    const { histogram = [], scatter = [] } = data.chartData;

    // Ensure chart data is properly formatted
    const isValidHistogram = Array.isArray(histogram) && histogram.length > 0;
    const isValidScatter = Array.isArray(scatter) && scatter.length > 0;

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', height: '100%' }}>
            
            {/* Histogram Bar Chart */}
            {isValidHistogram ? (
                <div style={{ width: '45%', height: '400px', marginBottom: '30px' }}>
                    <h3>📊 Histogram</h3>
                    <BarChart width={400} height={300} data={histogram}>
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {histogram.map((entry, index) => (
                            <Bar
                                key={index}
                                dataKey="data"
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </BarChart>
                </div>
            ) : (
                <p>No valid histogram data available.</p>
            )}

            {/* Line Chart */}
            {isValidHistogram ? (
                <div style={{ width: '45%', height: '400px', marginBottom: '30px' }}>
                    <h3>📈 Line Chart</h3>
                    <LineChart width={400} height={300} data={histogram}>
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="data"
                            stroke="#82ca9d"
                        />
                    </LineChart>
                </div>
            ) : (
                <p>No valid line chart data available.</p>
            )}

            {/* Scatter Chart */}
            {isValidScatter ? (
                <div style={{ width: '45%', height: '400px', marginBottom: '30px' }}>
                    <h3>📉 Scatter Chart</h3>
                    <ScatterChart width={400} height={300}>
                        <XAxis type="number" dataKey="x" name="X-Axis" />
                        <YAxis type="number" dataKey="y" name="Y-Axis" />
                        <Tooltip />
                        <Scatter name="Data Points" data={scatter} fill="#8884d8" />
                    </ScatterChart>
                </div>
            ) : (
                <p>No valid scatter chart data available.</p>
            )}
        </div>
    );
};

export default DatasetVisualizer;
