import React, { useState } from "react";
import {
  BarChart, Bar,
  LineChart, Line,
  ScatterChart, Scatter,
  AreaChart, Area,
  PieChart, Pie,
  RadarChart, Radar,
  ComposedChart, // Added composed chart
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  ResponsiveContainer, Cell, LabelList
} from "recharts";

interface ChartConfig {
  chartType: "bar" | "line" | "scatter" | "area" | "pie" | "radar" | "composed";
  colors: string[];
  xAxisLabel: string;
  yAxisLabel: string;
  showGrid: boolean;
  gridStroke: string;
  tickFontSize: number;
  barSize: number;
  lineType: "monotone" | "linear" | "step";
  pieInnerRadius: number;
  pieOuterRadius: number;
  labelPosition: "top" | "inside" | "outside";
  // Additional options for composed chart:
  composedChartMargin?: { top: number; right: number; left: number; bottom: number };
}

interface DatasetVisualizerProps {
  data: {
    chartData: {
      [key: string]: { label?: string; data?: number[]; x?: number; y?: number }[];
    };
  };
}

const DEFAULT_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF69B4", "#A52A2A", "#2E8B57"];

const DatasetVisualizer: React.FC<DatasetVisualizerProps> = ({ data }) => {
  if (!data || !data.chartData) {
    return <p>No chart data available.</p>;
  }

  const chartKeys = Object.keys(data.chartData);
  const [selectedDataset, setSelectedDataset] = useState<string>(chartKeys[0]);

  // Configuration state with additional options
  const [config, setConfig] = useState<ChartConfig>({
    chartType: "bar",
    colors: DEFAULT_COLORS,
    xAxisLabel: "X-Axis",
    yAxisLabel: "Y-Axis",
    showGrid: true,
    gridStroke: "#ccc",
    tickFontSize: 12,
    barSize: 40,
    lineType: "monotone",
    pieInnerRadius: 50,
    pieOuterRadius: 100,
    labelPosition: "top",
    composedChartMargin: { top: 20, right: 30, left: 20, bottom: 30 }
  });

  const currentDataset = data.chartData[selectedDataset] || [];

  // Handle configuration changes
  const updateConfig = (key: keyof ChartConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const renderChart = () => {
    switch (config.chartType) {
      case "bar":
        return (
          <ResponsiveContainer>
            <BarChart data={currentDataset} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              {config.showGrid && <CartesianGrid stroke={config.gridStroke} strokeDasharray="4 4" />}
              <XAxis
                dataKey="label"
                label={{ value: config.xAxisLabel, position: "insideBottom", offset: -5 }}
                tick={{ fontSize: config.tickFontSize }}
              />
              <YAxis
                label={{ value: config.yAxisLabel, angle: -90, position: "insideLeft" }}
                tick={{ fontSize: config.tickFontSize }}
              />
              <Tooltip />
              <Legend />
              {currentDataset.map((_, index) => (
                <Bar
                  key={index}
                  dataKey="data[0]"
                  fill={config.colors[index % config.colors.length]}
                  barSize={config.barSize}
                >
                  <LabelList dataKey="data[0]" position={config.labelPosition} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer>
            <LineChart data={currentDataset} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              {config.showGrid && <CartesianGrid stroke={config.gridStroke} strokeDasharray="4 4" />}
              <XAxis
                dataKey="label"
                label={{ value: config.xAxisLabel, position: "insideBottom", offset: -5 }}
                tick={{ fontSize: config.tickFontSize }}
              />
              <YAxis
                label={{ value: config.yAxisLabel, angle: -90, position: "insideLeft" }}
                tick={{ fontSize: config.tickFontSize }}
              />
              <Tooltip />
              <Legend />
              <Line type={config.lineType} dataKey="data[0]" stroke={config.colors[0]} />
            </LineChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              {config.showGrid && <CartesianGrid stroke={config.gridStroke} strokeDasharray="4 4" />}
              <XAxis type="number" dataKey="x" tick={{ fontSize: config.tickFontSize }} name={config.xAxisLabel} />
              <YAxis type="number" dataKey="y" tick={{ fontSize: config.tickFontSize }} name={config.yAxisLabel} />
              <Tooltip />
              <Scatter name="Data Points" data={currentDataset} fill={config.colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer>
            <AreaChart data={currentDataset} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              {config.showGrid && <CartesianGrid stroke={config.gridStroke} strokeDasharray="4 4" />}
              <XAxis dataKey="label" tick={{ fontSize: config.tickFontSize }} />
              <YAxis tick={{ fontSize: config.tickFontSize }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="data[0]" stroke={config.colors[0]} fill={config.colors[1]} fillOpacity={0.7} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer>
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie
                data={currentDataset}
                dataKey="data[0]"
                nameKey="label"
                innerRadius={config.pieInnerRadius}
                outerRadius={config.pieOuterRadius}
              >
                {currentDataset.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={config.colors[index % config.colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      case "radar":
        return (
          <ResponsiveContainer>
            <RadarChart data={currentDataset} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              <PolarGrid stroke={config.gridStroke} />
              <PolarAngleAxis dataKey="label" tick={{ fontSize: config.tickFontSize }} />
              <PolarRadiusAxis />
              <Radar name="Data" dataKey="data[0]" stroke={config.colors[0]} fill={config.colors[1]} fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );

      case "composed":
        return (
          <ResponsiveContainer>
            <ComposedChart
              data={currentDataset}
              margin={config.composedChartMargin}
            >
              {config.showGrid && <CartesianGrid stroke={config.gridStroke} strokeDasharray="4 4" />}
              <XAxis
                dataKey="label"
                label={{ value: config.xAxisLabel, position: "insideBottom", offset: -5 }}
                tick={{ fontSize: config.tickFontSize }}
              />
              <YAxis
                label={{ value: config.yAxisLabel, angle: -90, position: "insideLeft" }}
                tick={{ fontSize: config.tickFontSize }}
              />
              <Tooltip />
              <Legend />
              {/* Combining Bar and Line */}
              <Bar dataKey="data[0]" fill={config.colors[0]} barSize={config.barSize}>
                <LabelList dataKey="data[0]" position={config.labelPosition} />
              </Bar>
              <Line type={config.lineType} dataKey="data[0]" stroke={config.colors[1]} />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return <p>Unsupported chart type.</p>;
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Configuration Panel */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "15px",
          alignItems: "center",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "10px",
          marginBottom: "20px"
        }}
      >
        <div style={{ flex: "1 1 200px" }}>
          <label>Chart Type:&nbsp;</label>
          <select
            value={config.chartType}
            onChange={(e) => updateConfig("chartType", e.target.value)}
          >
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="scatter">Scatter</option>
            <option value="area">Area</option>
            <option value="pie">Pie</option>
            <option value="radar">Radar</option>
            <option value="composed">Composed</option>
          </select>
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <label>Dataset:&nbsp;</label>
          <select value={selectedDataset} onChange={(e) => setSelectedDataset(e.target.value)}>
            {chartKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <label>Show Grid:&nbsp;</label>
          <input
            type="checkbox"
            checked={config.showGrid}
            onChange={(e) => updateConfig("showGrid", e.target.checked)}
          />
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <label>X-Axis Label:&nbsp;</label>
          <input
            type="text"
            value={config.xAxisLabel}
            onChange={(e) => updateConfig("xAxisLabel", e.target.value)}
          />
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <label>Y-Axis Label:&nbsp;</label>
          <input
            type="text"
            value={config.yAxisLabel}
            onChange={(e) => updateConfig("yAxisLabel", e.target.value)}
          />
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <label>Grid Stroke:&nbsp;</label>
          <input
            type="text"
            value={config.gridStroke}
            onChange={(e) => updateConfig("gridStroke", e.target.value)}
          />
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <label>Tick Font Size:&nbsp;</label>
          <input
            type="number"
            value={config.tickFontSize}
            onChange={(e) => updateConfig("tickFontSize", parseInt(e.target.value, 10))}
          />
        </div>
        {config.chartType === "bar" && (
          <div style={{ flex: "1 1 150px" }}>
            <label>Bar Size:&nbsp;</label>
            <input
              type="number"
              value={config.barSize}
              onChange={(e) => updateConfig("barSize", parseInt(e.target.value, 10))}
            />
          </div>
        )}
        {config.chartType === "line" && (
          <div style={{ flex: "1 1 150px" }}>
            <label>Line Type:&nbsp;</label>
            <select
              value={config.lineType}
              onChange={(e) => updateConfig("lineType", e.target.value)}
            >
              <option value="monotone">Monotone</option>
              <option value="linear">Linear</option>
              <option value="step">Step</option>
            </select>
          </div>
        )}
        {config.chartType === "pie" && (
          <>
            <div style={{ flex: "1 1 150px" }}>
              <label>Pie Inner Radius:&nbsp;</label>
              <input
                type="number"
                value={config.pieInnerRadius}
                onChange={(e) => updateConfig("pieInnerRadius", parseInt(e.target.value, 10))}
              />
            </div>
            <div style={{ flex: "1 1 150px" }}>
              <label>Pie Outer Radius:&nbsp;</label>
              <input
                type="number"
                value={config.pieOuterRadius}
                onChange={(e) => updateConfig("pieOuterRadius", parseInt(e.target.value, 10))}
              />
            </div>
          </>
        )}
        <div style={{ flex: "1 1 150px" }}>
          <label>Label Position:&nbsp;</label>
          <select
            value={config.labelPosition}
            onChange={(e) => updateConfig("labelPosition", e.target.value)}
          >
            <option value="top">Top</option>
            <option value="inside">Inside</option>
            <option value="outside">Outside</option>
          </select>
        </div>
        <div style={{ flex: "1 1 300px" }}>
          <label>Colors (comma separated):&nbsp;</label>
          <input
            type="text"
            value={config.colors.join(",")}
            onChange={(e) => updateConfig("colors", e.target.value.split(",").map((c) => c.trim()))}
          />
        </div>
      </div>

      {/* Chart Container */}
      <div
        style={{
          width: "100%",
          height: "500px",
          border: "1px solid #ddd",
          borderRadius: "8px"
        }}
      >
        {renderChart()}
      </div>
    </div>
  );
};

export default DatasetVisualizer;
