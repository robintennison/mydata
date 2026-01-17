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
import styles from "../styles/HistoryListPage.styles";

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
  ChartDataLabels // Register datalabels plugin
);

interface HistoryChartProps {
  history: any[];
}

const HistoryChart: React.FC<HistoryChartProps> = ({ history }) => {
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
      formatMonthForChart(record.month)
    );
    const depositsData = chartHistory.map((record) =>
      parseFloat((record.totalDeposits / 100000).toFixed(2))
    );
    const totalData = chartHistory.map((record) =>
      parseFloat(((record.savings + record.totalDeposits) / 100000).toFixed(2))
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
          pointRadius: 3,
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
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2,
          pointBackgroundColor: "#4CAF50",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
        },
      ],
    };

    setChartData(data);
  }, [history]);

  // Chart options - optimized for mobile viewing
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 11,
          },
          padding: 8,
          boxWidth: 10,
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 8,
        cornerRadius: 4,
        titleFont: {
          size: 11,
        },
        bodyFont: {
          size: 11,
        },
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            if (value === null || value === undefined) {
              return `${context.dataset.label}: No data`;
            }
            return `${context.dataset.label}: ${value.toFixed(2)} L`;
          },
        },
      },
      datalabels: {
        display: (context) => {
          // Show labels only for the "Total" dataset (datasetIndex: 1)
          return context.datasetIndex === 1;
        },
        color: "#4CAF50",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: 4,
        padding: {
          top: 4,
          bottom: 4,
          left: 6,
          right: 6,
        },
        font: {
          size: 10,
          weight: "bold",
        },
        formatter: (value) => {
          return `${value.toFixed(2)} L`;
        },
        align: "top",
        offset: 8,
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            size: 10,
          },
          maxRotation: 0,
          padding: 4,
        },
        title: {
          display: true,
          text: "Months",
          font: {
            size: 11,
            weight: 500,
          },
          padding: { top: 8, bottom: 4 },
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            size: 10,
          },
          padding: 4,
          callback: function (value) {
            if (value === null || value === undefined) return "";
            if (typeof value === "number") return `${value} L`;
            return value;
          },
        },
        title: {
          display: true,
          text: "Amount (in Lakhs)",
          font: {
            size: 11,
            weight: 500,
          },
          padding: { top: 4, bottom: 8 },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  return (
    <div style={styles.chartSection}>
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>📈</span>
          Last 6 Months Trend
        </div>
      </div>

      {history.length < 2 ? (
        <div style={styles.emptyChart}>
          <div style={styles.emptyChartIcon}>📊</div>
          <div style={styles.emptyChartText}>
            {history.length === 0
              ? "No history data"
              : "Need more data for chart"}
          </div>
          <div style={styles.emptyChartSubtext}>
            Add at least 2 months of history
          </div>
        </div>
      ) : chartData ? (
        <div style={styles.chartWrapper}>
          <Line
            data={chartData}
            options={chartOptions}
            plugins={[ChartDataLabels]}
          />
        </div>
      ) : null}
    </div>
  );
};

export default HistoryChart;
