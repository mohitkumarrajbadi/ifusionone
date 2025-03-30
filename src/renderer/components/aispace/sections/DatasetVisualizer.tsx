import React, { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, AreaChart, Area, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, Cell
} from "recharts";

interface ChartConfig {
  chartType: "bar" | "line" | "scatter" | "area" | "pie" | "radar";
  colors?: string[];
  xAxisKey?: string;
  yAxisKey?: string;
  customXAxisLabel?: string;
  customYAxisLabel?: string;
  showGrid?: boolean;
  tickFormatter?: (value: any) => string;
  xAxisRange?: [number, number];
  yAxisRange?: [number, number];
}

interface DatasetVisualizerProps {
  data: {
    chartData: {
      [key: string]: { label?: string; data?: number[]; x?: number; y?: number }[];
    };
  };
  config?: ChartConfig;
}

const DEFAULT_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF69B4", "#A52A2A", "#2E8B57"];

const DatasetVisualizer: React.FC<DatasetVisualizerProps> = ({ data, config }) => {
  if (!data || !data.chartData) {
    return <p>No chart data available.</p>;
  }

  const chartKeys = Object.keys(data.chartData);
  const [selectedDataset, setSelectedDataset] = useState<string>(chartKeys[0]);
  const [chartType, setChartType] = useState<ChartConfig["chartType"]>("bar");
  const [colors, setColors] = useState<string[]>(config?.colors || DEFAULT_COLORS);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [xAxisLabel, setXAxisLabel] = useState<string>("X-Axis");
  const [yAxisLabel, setYAxisLabel] = useState<string>("Y-Axis");
  const [xAxisRange, setXAxisRange] = useState<[number, number]>([0, 100]);
  const [yAxisRange, setYAxisRange] = useState<[number, number]>([0, 100]);

  const currentDataset = data.chartData[selectedDataset] || [];

  const handleDatasetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDataset(event.target.value);
  };

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index] = color;
    setColors(newColors);
  };

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer>
            <BarChart data={currentDataset}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="label" label={{ value: xAxisLabel, position: "insideBottom", offset: -5 }} />
              <YAxis label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              {currentDataset.map((_, index) => (
                <Bar key={index} dataKey="data[0]" fill={colors[index % colors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer>
            <LineChart data={currentDataset}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="label" label={{ value: xAxisLabel, position: "insideBottom", offset: -5 }} />
              <YAxis label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="data[0]" stroke={colors[0]} />
            </LineChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer>
            <ScatterChart>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis type="number" dataKey="x" name={xAxisLabel} />
              <YAxis type="number" dataKey="y" name={yAxisLabel} />
              <Tooltip />
              <Scatter name="Data Points" data={currentDataset} fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer>
            <AreaChart data={currentDataset}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="label" label={{ value: xAxisLabel, position: "insideBottom", offset: -5 }} />
              <YAxis label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="data[0]" stroke={colors[0]} fill={colors[1]} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer>
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie data={currentDataset} dataKey="data[0]" nameKey="label" outerRadius={100}>
                {currentDataset.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      case "radar":
        return (
          <ResponsiveContainer>
            <RadarChart data={currentDataset}>
              <PolarGrid />
              <PolarAngleAxis dataKey="label" />
              <PolarRadiusAxis />
              <Radar name="Data" dataKey="data[0]" stroke={colors[0]} fill={colors[1]} fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return <p>Unsupported chart type.</p>;
    }
  };

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Chart Configuration Controls */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <label>📊 Chart Type:</label>
        <select value={chartType} onChange={(e) => setChartType(e.target.value as ChartConfig["chartType"])}>
          <option value="bar">Bar</option>
          <option value="line">Line</option>
          <option value="scatter">Scatter</option>
          <option value="area">Area</option>
          <option value="pie">Pie</option>
          <option value="radar">Radar</option>
        </select>

        <label>📁 Dataset:</label>
        <select value={selectedDataset} onChange={handleDatasetChange}>
          {chartKeys.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>

        <label>🟡 Grid:</label>
        <input type="checkbox" checked={showGrid} onChange={() => setShowGrid(!showGrid)} />

        <label>🛠️ X-Label:</label>
        <input type="text" value={xAxisLabel} onChange={(e) => setXAxisLabel(e.target.value)} />

        <label>🛠️ Y-Label:</label>
        <input type="text" value={yAxisLabel} onChange={(e) => setYAxisLabel(e.target.value)} />
      </div>

      <div style={{ width: "100%", height: "500px" }}>
        {renderChart()}
      </div>
    </div>
  );
};

export default DatasetVisualizer;
