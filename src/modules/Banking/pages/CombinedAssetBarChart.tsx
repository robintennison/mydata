import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import ChartDataLabels, { Context } from "chartjs-plugin-datalabels";
import styles from "../../../MyDataHomepage.module.css";

// Register Chart.js components for Bar chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
);

interface CombinedAssetBarChartProps {
  accounts: any[];
  deposits: any[];
  adjustments: any[];
  showInactive?: boolean;
}

const CombinedAssetBarChart: React.FC<CombinedAssetBarChartProps> = ({
  accounts,
  deposits,
  adjustments,
  showInactive = false,
}) => {
  // Prepare data for bar chart
  const chartData = useMemo(() => {
    if (!accounts.length) return null;

    // Filter active deposits if needed
    const filteredDeposits = showInactive
      ? deposits
      : deposits.filter((d) => d.active !== false);

    const summaries = accounts.map((account) => {
      // 1. Savings from account
      const savings = account.savingsAmount || 0;

      // 2. Base deposits for this account
      const baseDeposits = filteredDeposits
        .filter((deposit) => deposit.accountId === account.id)
        .reduce((sum, deposit) => sum + deposit.amount, 0);

      // 3. Adjustments for this account
      const adjustmentsTotal = adjustments
        .filter((adj) => adj.accountId === account.id)
        .reduce((sum, adj) => sum + (adj.adjustmentAmount || 0), 0);

      // Total assets = savings + deposits + adjustments
      return {
        label: account.acctCode || account.id,
        fullLabel: account.acctName || account.acctCode || account.id,
        value: (savings + baseDeposits + adjustmentsTotal) / 100000, // in Lakhs
      };
    });

    // Filter out accounts with 0 assets for the chart clarity
    const activeSummaries = summaries.filter((s) => s.value > 0);

    // Group items < 10 lakhs into "Others"
    const threshold = 10;
    const majorSummaries = activeSummaries.filter((s) => s.value >= threshold);
    const minorSummaries = activeSummaries.filter((s) => s.value < threshold);

    let finalSummaries = [...majorSummaries];

    if (minorSummaries.length > 0) {
      const othersValue = minorSummaries.reduce((sum, s) => sum + s.value, 0);
      finalSummaries.push({
        label: "Others",
        fullLabel: "Other Accounts",
        value: othersValue,
      });
    }

    if (finalSummaries.length === 0) return null;

    // Sort by value descending
    finalSummaries.sort((a, b) => b.value - a.value);

    // Limit to top 8 for better readability
    const displaySummaries = finalSummaries.slice(0, 8);

    const data: ChartData<"bar"> = {
      labels: displaySummaries.map((s) => s.label),
      datasets: [
        {
          label: "Assets (in Lakhs)",
          data: displaySummaries.map((s) => s.value),
          backgroundColor: displaySummaries.map((_, index) =>
            index === displaySummaries.length - 1 &&
            displaySummaries[displaySummaries.length - 1].label === "Others"
              ? "rgba(121, 85, 72, 0.7)" // Different color for "Others"
              : "rgba(66, 133, 244, 0.7)",
          ),
          borderColor: displaySummaries.map((_, index) =>
            index === displaySummaries.length - 1 &&
            displaySummaries[displaySummaries.length - 1].label === "Others"
              ? "#795548"
              : "#4285f4",
          ),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };

    // Store full labels for tooltips
    const fullLabels = displaySummaries.map((s) => s.fullLabel);

    return { chartData: data, fullLabels };
  }, [accounts, deposits, adjustments, showInactive]);

  const chartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const, // Horizontal bar chart
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: true,
        },
        ticks: {
          callback: function (value: string | number) {
            if (typeof value === "number") {
              return `${value} L`;
            }
            return value;
          },
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: "Amount (in Lakhs)",
          font: {
            size: 12,
            weight: "bold" as const,
          },
          padding: { top: 10, bottom: 0 },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
            weight: 500,
          } as any,
          callback: function (
            value: string | number,
            index: number,
            //    ticks: any[],
          ) {
            if (
              typeof value === "number" &&
              this.chart?.scales?.y?.getLabels?.()
            ) {
              const labels = this.chart.scales.y.getLabels();
              if (index >= 0 && index < labels.length) {
                const label = labels[index];
                // Truncate first 3 characters for account codes
                return label && label.length > 3 && label !== "Others"
                  ? label.substring(3)
                  : label;
              }
            }
            return value;
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const fullLabels = chartData?.fullLabels;
            if (fullLabels && index >= 0 && index < fullLabels.length) {
              return fullLabels[index];
            }
            return context[0].label;
          },
          label: (context) => {
            const value = context.parsed.x;
            if (typeof value === "number") {
              return `Assets: ${value.toFixed(2)} Lakhs`;
            }
            return `Assets: ${value}`;
          },
        },
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#1a202c",
        bodyColor: "#4a5568",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
      datalabels: {
        anchor: "end" as const,
        align: "end" as const,
        color: "#4a5568",
        font: {
          weight: 600,
          size: 10,
        } as any,
        formatter: (value: number) => {
          return `${value.toFixed(1)} L`;
        },
        display: (context: Context) => {
          const value = context.dataset.data[context.dataIndex];
          return typeof value === "number" && value >= 1; // Only show labels for values >= 1 Lakh
        },
      },
    },
    layout: {
      padding: {
        left: 10,
        right: 20,
        top: 20,
        bottom: 20,
      },
    },
  };

  if (!chartData) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader} style={{ marginBottom: "15px" }}>
          <div className={styles.sectionTitle}>
            <span>📊</span> Asset Distribution
          </div>
        </div>
        <div
          className={styles.emptyState}
          style={{
            height: "360px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div>
            <div className={styles.emptyText}>No asset data available</div>
            <div className={styles.emptySubtext}>
              Add accounts and deposits to see the distribution
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader} style={{ marginBottom: "15px" }}>
        <div className={styles.sectionTitle}>
          <span>📊</span> Asset Distribution
        </div>
      </div>
      <div style={{ height: "360px", position: "relative" }}>
        <Bar data={chartData.chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default CombinedAssetBarChart;
