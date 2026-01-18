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

      // Total deposits = base deposits + adjustments
      const totalDeposits = baseDeposits + adjustmentsTotal;

      return {
        label: account.acctCode || account.id,
        fullLabel: account.acctName || account.acctCode || account.id,
        savings: savings / 100000, // in Lakhs
        deposits: totalDeposits / 100000, // in Lakhs
        total: (savings + totalDeposits) / 100000, // Total in Lakhs
      };
    });

    // Filter out accounts with 0 total assets for the chart clarity
    const activeSummaries = summaries.filter((s) => s.total > 0);

    // Group items < 10 lakhs total into "Others"
    const threshold = 10;
    const majorSummaries = activeSummaries.filter((s) => s.total >= threshold);
    const minorSummaries = activeSummaries.filter((s) => s.total < threshold);

    let finalSummaries = [...majorSummaries];

    if (minorSummaries.length > 0) {
      const othersSavings = minorSummaries.reduce(
        (sum, s) => sum + s.savings,
        0,
      );
      const othersDeposits = minorSummaries.reduce(
        (sum, s) => sum + s.deposits,
        0,
      );
      finalSummaries.push({
        label: "Others",
        fullLabel: "Other Accounts",
        savings: othersSavings,
        deposits: othersDeposits,
        total: othersSavings + othersDeposits,
      });
    }

    if (finalSummaries.length === 0) return null;

    // Sort by total value descending
    finalSummaries.sort((a, b) => b.total - a.total);

    // Limit to top 8 for better readability
    const displaySummaries = finalSummaries.slice(0, 8);

    const data: ChartData<"bar"> = {
      labels: displaySummaries.map((s) => s.label),
      datasets: [
        {
          label: "Savings",
          data: displaySummaries.map((s) => s.savings),
          backgroundColor: "rgba(52, 168, 83, 0.7)", // Green for savings
          borderColor: "#34a853",
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          stack: "Stack 0",
        },
        {
          label: "Deposits",
          data: displaySummaries.map((s) => s.deposits),
          backgroundColor: displaySummaries.map(
            (s) =>
              s.label === "Others"
                ? "rgba(121, 85, 72, 0.7)" // Brown for "Others" deposits
                : "rgba(66, 133, 244, 0.7)", // Blue for regular deposits
          ),
          borderColor: displaySummaries.map((s) =>
            s.label === "Others" ? "#795548" : "#4285f4",
          ),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          stack: "Stack 0",
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
              return value.toFixed(1); // Remove "L" suffix
            }
            return value;
          },
          font: {
            size: 11,
          },
        },
        title: {
          display: false, // Hide the x-axis title to remove reference to "Lakhs"
        },
        stacked: true,
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
          callback: function (value: string | number, index: number) {
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
        stacked: true,
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11,
          },
          usePointStyle: true,
        },
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
            const label = context.dataset.label || "";
            const value = context.parsed.x;
            if (typeof value === "number") {
              return `${label}: ${value.toFixed(1)}`; // Remove "Lakhs"
            }
            return `${label}: ${value}`;
          },
          footer: (context) => {
            const savings = context[0].parsed._stacks?.x[0] || 0;
            const deposits = context[0].parsed._stacks?.x[1] || 0;
            const total = savings + deposits;
            return `Total: ${total.toFixed(1)}`; // Remove "Lakhs"
          },
        },
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#1a202c",
        bodyColor: "#4a5568",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
      },
      datalabels: {
        anchor: "end" as const,
        align: "end" as const,
        color: "#4a5568",
        font: {
          weight: 600,
          size: 10,
        } as any,
        formatter: (context: Context) => {
          // Show both savings and deposits values
          if (context.datasetIndex === 1) {
            // Deposits dataset (top of stack)
            const savings = context.chart.data.datasets[0].data[
              context.dataIndex
            ] as number;
            const deposits = context.chart.data.datasets[1].data[
              context.dataIndex
            ] as number;
            const total = savings + deposits;

            if (total >= 0.5) {
              // Show for totals >= 0.5
              // Create a multi-line label showing both values
              return `S: ${savings.toFixed(1)}\nD: ${deposits.toFixed(1)}`;
            }
          }
          return "";
        },
        display: (context: Context) => {
          // Only show on deposits dataset (top of stack)
          if (context.datasetIndex === 1) {
            const savings = context.chart.data.datasets[0].data[
              context.dataIndex
            ] as number;
            const deposits = context.chart.data.datasets[1].data[
              context.dataIndex
            ] as number;
            const total = savings + deposits;
            return total >= 0.5; // Show for totals >= 0.5
          }
          return false;
        },
        padding: {
          top: 2,
          bottom: 2,
        },
      },
    },
    layout: {
      padding: {
        left: 10,
        right: 20,
        top: 40,
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
      <div style={{ height: "400px", position: "relative" }}>
        <Bar data={chartData.chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default CombinedAssetBarChart;
