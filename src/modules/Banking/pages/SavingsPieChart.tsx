import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { bankingHomeStyles as styles } from "../styles/BankingHomePage.styles";

// Register Chart.js components for Pie chart
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface SavingsPieChartProps {
  accounts: any[];
}

const SavingsPieChart: React.FC<SavingsPieChartProps> = ({ accounts }) => {
  // Prepare data for pie chart
  const chartData = useMemo(() => {
    if (!accounts.length) return null;

    const summaries = accounts.map((account) => ({
      label: account.acctCode || account.id,
      value: Math.floor(account.savingsAmount / 1000), // in Thousands, floor to ignore decimals
    }));

    const activeSummaries = summaries.filter((s) => s.value > 0);

    // Group items < 10,000 (10 Thousands) into "Others"
    const threshold = 10;
    const majorSummaries = activeSummaries.filter((s) => s.value >= threshold);
    const minorSummaries = activeSummaries.filter((s) => s.value < threshold);

    let finalSummaries = [...majorSummaries];

    if (minorSummaries.length > 0) {
      const othersValue = minorSummaries.reduce((sum, s) => sum + s.value, 0);
      finalSummaries.push({
        label: "Others",
        value: othersValue,
      });
    }

    if (finalSummaries.length === 0) return null;

    // Sort by value descending
    finalSummaries.sort((a, b) => b.value - a.value);

    const data: ChartData<"pie"> = {
      labels: finalSummaries.map((s) => s.label),
      datasets: [
        {
          data: finalSummaries.map((s) => s.value),
          backgroundColor: [
            "rgba(52, 168, 83, 0.7)",   // green
            "rgba(66, 133, 244, 0.7)",  // blue
            "rgba(251, 188, 5, 0.7)",   // yellow
            "rgba(234, 67, 53, 0.7)",   // red
            "rgba(156, 39, 176, 0.7)",  // purple
            "rgba(0, 188, 212, 0.7)",   // cyan
            "rgba(255, 152, 0, 0.7)",   // orange
            "rgba(121, 85, 72, 0.7)",   // brown
            "rgba(96, 125, 139, 0.7)",  // blue grey
          ],
          borderColor: [
            "#34a853",
            "#4285f4",
            "#fbbc05",
            "#ea4335",
            "#9c27b0",
            "#00bcd4",
            "#ff9800",
            "#795548",
            "#607d8b",
          ],
          borderWidth: 1,
        },
      ],
    };

    return data;
  }, [accounts]);

  const chardOptions: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.parsed;
            return ` ${label}: ${value}`;
          },
        },
      },
      datalabels: {
        anchor: "end",
        align: "end",
        offset: 8,
        color: "#4b5563",
        font: {
          weight: "bold",
          size: 10,
        },
        formatter: (value: number, context: any) => {
          const label = context.chart.data.labels?.[context.dataIndex] as string || "";
          
          if (label === "Others") {
            return `Others\n${value}`;
          }
          
          const displayLabel = label.length > 3 ? label.substring(3) : label;
          return `${displayLabel}\n${value}`;
        },
        textAlign: "center",
        padding: 4,
        clip: false,
        display: (context) => {
          const label = context.chart.data.labels?.[context.dataIndex] as string;
          if (label === "Others") return true; 
          const value = context.dataset.data[context.dataIndex] as number;
          return value >= 0.01; // Show even small labels if they aren't 'Others'
        },
      },
    },
    layout: {
      padding: {
        left: 45,
        right: 45,
        top: 60,
        bottom: 60,
      },
    },
  };

  if (!chartData) return null;

  return (
    <div style={{ ...styles.sectionPadding, paddingTop: 0 }}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>📊</span>
          <span>Savings Distribution</span>
        </div>
        <div style={{ height: "360px", position: "relative" }}>
          <Pie data={chartData} options={chardOptions} />
        </div>
      </div>
    </div>
  );
};

export default SavingsPieChart;
