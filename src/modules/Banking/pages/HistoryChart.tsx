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
  totalDeposits: number; // Keep using totalDeposits to match your existing data structure
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

  // Format month for chart display
  const formatMonthForChart = (month: string): string => {
    try {
      const [year, monthNum] = month.split("-");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
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

    // Get last 6 months, sorted chronologically
    const chartHistory = [...history]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    const labels = chartHistory.map((record) =>
      formatMonthForChart(record.month),
    );
    const depositsData = chartHistory.map((record) =>
      parseFloat((record.totalDeposits / 100000).toFixed(2)),
    );
    const totalData = chartHistory.map((record) =>
      parseFloat(((record.savings + record.totalDeposits) / 100000).toFixed(2)),
    );

    const data: ChartData<"line"> = {
      labels,
      datasets: [
        {
          label: "Deposits",
          data: depositsData,
          borderColor: "#2196F3",
          backgroundColor: "rgba(33, 150, 243, 0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: compact ? 2 : 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          pointBackgroundColor: "#2196F3",
        },
        {
          label: "Total (Deposits + Savings)",
          data: totalData,
          borderColor: "#4CAF50",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: compact ? 3 : 5,
          pointHoverRadius: 7,
          borderWidth: 2,
          pointBackgroundColor: "#4CAF50",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
        },
      ],
    };

    setChartData(data);
  }, [history, compact]);

  // Chart options - optimized for mobile viewing
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
        display: (context) => context.datasetIndex === 1,
        color: "#4CAF50",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: 4,
        padding: { top: 2, bottom: 2, left: 4, right: 4 },
        font: { size: 9, weight: "bold" },
        formatter: (value) => `${value.toFixed(2)}`,
        align: "top",
        offset: 4,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0, 0, 0, 0.05)", drawTicks: !compact },
        ticks: { font: { size: 9 }, maxRotation: 0, padding: 2 },
        title: {
          display: !compact,
          text: "Months",
          font: { size: 10, weight: 500 },
          padding: { top: 4, bottom: 2 },
        },
      },
      y: {
        beginAtZero: false,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          font: { size: 9 },
          padding: 2,
          display: !compact,
          callback: (value) => {
            if (value === null || value === undefined) return "";
            if (typeof value === "number") return `${value}`;
            return value;
          },
        },
        title: {
          display: !compact,
          text: "Amount (Lakhs)",
          font: { size: 10, weight: 500 },
          padding: { top: 2, bottom: 4 },
        },
      },
    },
    interaction: { intersect: false, mode: "index" },
    layout: { padding: compact ? 0 : undefined },
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
              Last 6 Months Trend
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
            Last 6 Months Trend
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
