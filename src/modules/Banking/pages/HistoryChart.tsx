
import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels,
);

interface History {
  month: string;
  savings: number;
  totalDeposits: number;
  totalAssets?: number; // Add totalAssets field
}

interface HistoryChartProps {
  history: History[];
  compact?: boolean;
}

const HistoryChart: React.FC<HistoryChartProps> = ({
  history,
  compact = false,
}) => {
  const [chartData, setChartData] = useState<ChartData<"line"> | null>(null);
  const [yAxisMin, setYAxisMin] = useState<number | undefined>(undefined);

  // Format month for chart display
  const formatMonthForChart = (month: string): string => {
    try {
      const [year, monthNum] = month.split("-");
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      const monthName = monthNames[parseInt(monthNum) - 1] || monthNum;
      const shortYear = year.slice(2);
      return `${monthName} '${shortYear}`;
    } catch {
      return month;
    }
  };

  // Prepare chart data
  useEffect(() => {
    if (history.length < 2) return;

    // Get last 12 months, sorted chronologically
    const chartHistory = [...history]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // 🔁 changed from -6 to -12

    const labels = chartHistory.map((record) =>
      formatMonthForChart(record.month),
    );
    
    // Calculate Total Assets (Savings + Deposits - Liabilities)
    // If totalAssets is provided, use it; otherwise calculate from savings and deposits
    const totalAssetsData = chartHistory.map((record) => {
      if (record.totalAssets !== undefined) {
        return parseFloat((record.totalAssets / 100000).toFixed(2));
      }
      // Fallback for backward compatibility
      return parseFloat(((record.savings + record.totalDeposits) / 100000).toFixed(2));
    });

    // Calculate y-axis min to show variations (start from 80% of minimum value)
    const minValue = Math.min(...totalAssetsData);
    const maxValue = Math.max(...totalAssetsData);
    const range = maxValue - minValue;
    // Start from 10% below the minimum value to show variation, but not below 0
    const calculatedMin = Math.max(0, minValue - (range * 0.15));
    setYAxisMin(calculatedMin);

    const data: ChartData<"line"> = {
      labels,
      datasets: [
        {
          label: "Total Assets",
          data: totalAssetsData,
          borderColor: "#4CAF50",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: compact ? 4 : 5,
          pointHoverRadius: compact ? 6 : 7,
          borderWidth: 2,
          pointBackgroundColor: "#4CAF50",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
        },
      ],
    };

    setChartData(data);
  }, [history, compact]);

  // Chart options - optimized for mobile viewing with better variation display
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        display: !compact,
        labels: {
          font: { size: 10 },
          padding: 4,
          boxWidth: 8,
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 6,
        cornerRadius: 4,
        titleFont: { size: 10 },
        bodyFont: { size: 10 },
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            if (value === null || value === undefined) {
              return `${context.dataset.label}: No data`;
            }
            return `${context.dataset.label}: ${value.toFixed(2)}`;
          },
        },
      },
      datalabels: {
        display: true, // Show on all data points
        color: "#4CAF50",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: 4,
        padding: { top: 2, bottom: 2, left: 4, right: 4 },
        font: { size: compact ? 9 : 10, weight: "bold" },
        formatter: (value) => `${value.toFixed(2)}`,
        align: "top",
        offset: 6,
        clip: false,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0, 0, 0, 0.05)", drawTicks: !compact },
        ticks: { 
          font: { size: compact ? 9 : 10 }, 
          maxRotation: compact ? 45 : 0, 
          padding: 2 
        },
        title: {
          display: !compact,
          text: "Months",
          font: { size: 10, weight: 500 },
          padding: { top: 4, bottom: 2 },
        },
      },
      y: {
        beginAtZero: false, // Don't force zero to show variations
        min: yAxisMin, // Start from calculated minimum to show variations
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          font: { size: compact ? 9 : 10 },
          padding: 2,
          callback: (value) => {
            if (value === null || value === undefined) return "";
            if (typeof value === "number") return `${value.toFixed(1)}`;
            return value;
          },
        },
        title: {
          display: !compact,
          text: "Amount",
          font: { size: 10, weight: 500 },
          padding: { top: 2, bottom: 4 },
        },
      },
    },
    interaction: { intersect: false, mode: "index" },
    layout: { 
      padding: compact ? { top: 20, bottom: 5, left: 5, right: 5 } : { top: 30, bottom: 10, left: 10, right: 10 }
    },
  };

  if (history.length < 2) {
    return (
      <div
        className={
          compact
            ? ""
            : "bg-white rounded-xl my-3 p-3 shadow-sm border border-gray-200"
        }
      >
        {!compact && (
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <span>📈</span>
              Total Assets Trend
            </div>
          </div>
        )}
        <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
          <div className="text-3xl mb-2 opacity-50">📊</div>
          <div className="text-sm font-medium text-gray-600 mb-1">
            {history.length === 0
              ? "No history data"
              : "Need more data for chart"}
          </div>
          <div className="text-xs text-gray-500">
            Add at least 2 months of history
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? ""
          : "bg-white rounded-xl my-3 p-3 shadow-sm border border-gray-200"
      }
    >
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <span>📈</span>
            Total Assets Trend (Last 12 Months) {/* 🔁 updated text */}
          </div>
        </div>
      )}
      {chartData && (
        <div className={compact ? "h-40" : "h-64"}>
          <Line
            data={chartData}
            options={chartOptions}
            plugins={[ChartDataLabels]}
          />
        </div>
      )}
    </div>
  );
};

export default HistoryChart;
