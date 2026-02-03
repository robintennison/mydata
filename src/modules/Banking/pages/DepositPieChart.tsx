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

// Register Chart.js components for Pie chart
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface DepositPieChartProps {
  accounts: any[];
  deposits: any[];
  adjustments: any[];
  showInactive?: boolean;
}

const DepositPieChart: React.FC<DepositPieChartProps> = ({
  accounts,
  deposits,
  adjustments,
  showInactive = false,
}) => {
  // Prepare data for pie chart
  const chartData = useMemo(() => {
    if (!accounts.length) return null;

    // Filter active deposits if needed
    const filteredDeposits = showInactive
      ? deposits
      : deposits.filter((d) => d.active !== false);

    const summaries = accounts.map((account) => {
      // Calculate base deposits for this account
      const baseDeposits = filteredDeposits
        .filter((deposit) => deposit.accountId === account.id)
        .reduce((sum, deposit) => sum + deposit.amount, 0);

      // Calculate adjustments for this account
      const adjustmentsTotal = adjustments
        .filter((adj) => adj.accountId === account.id)
        .reduce((sum, adj) => sum + (adj.adjustmentAmount || 0), 0);

      // Total deposits = base deposits + adjustments
      return {
        label: account.acctCode || account.id,
        value: (baseDeposits + adjustmentsTotal) / 100000, // in Lakhs
      };
    });

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
            "rgba(66, 133, 244, 0.7)", // blue
            "rgba(52, 168, 83, 0.7)", // green
            "rgba(251, 188, 5, 0.7)", // yellow
            "rgba(234, 67, 53, 0.7)", // red
            "rgba(156, 39, 176, 0.7)", // purple
            "rgba(0, 188, 212, 0.7)", // cyan
            "rgba(255, 152, 0, 0.7)", // orange
            "rgba(121, 85, 72, 0.7)", // brown
            "rgba(96, 125, 139, 0.7)", // blue grey
          ],
          borderColor: [
            "#4285f4",
            "#34a853",
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
  }, [accounts, deposits, adjustments, showInactive]);

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
            return ` ${label}: ${value.toFixed(2)}`;
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
          const label =
            (context.chart.data.labels?.[context.dataIndex] as string) || "";

          // Don't truncate "Others"
          if (label === "Others") {
            return `Others\n${value.toFixed(2)}`;
          }

          // Truncate first 3 characters for other accounts
          const displayLabel = label.length > 3 ? label.substring(3) : label;
          return `${displayLabel}\n${value.toFixed(2)}`;
        },
        textAlign: "center",
        padding: 4,
        clip: false, // Ensure labels are never clipped
        display: (context) => {
          const label = context.chart.data.labels?.[
            context.dataIndex
          ] as string;
          if (label === "Others") return true;
          const value = context.dataset.data[context.dataIndex] as number;
          return value >= 0.1;
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
    <div className="pb-2">
      <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
        <div className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>Deposit Distribution</span>
        </div>
        <div className="h-[360px] relative">
          <Pie data={chartData} options={chardOptions} />
        </div>
      </div>
    </div>
  );
};

export default DepositPieChart;
