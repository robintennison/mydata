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
  Scale,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import ChartDataLabels, { Context } from "chartjs-plugin-datalabels";

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

  // Type-safe callback function for y-axis ticks
  const getYTickCallback = (isMobile: boolean) => {
    return function (this: any, value: string | number, index: number): string {
      if (typeof value === "number" && this.chart?.scales?.y?.getLabels) {
        const labels = this.chart.scales.y.getLabels();
        if (index >= 0 && index < labels.length) {
          const label = labels[index];
          if (label === "Others") return "Others";

          if (isMobile) {
            // On mobile, show only last 3-4 characters
            if (label && label.length > 5) {
              return label.substring(Math.max(0, label.length - 4));
            }
          } else {
            // On desktop, truncate first 3 characters for account codes
            if (label && label.length > 3) {
              return label.substring(3);
            }
          }
          return label || "";
        }
      }
      return value.toString();
    };
  };

  // Mobile-first chart options
  const getChartOptions = (): ChartOptions<"bar"> => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

    const baseOptions: ChartOptions<"bar"> = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y" as const,
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            display: false,
          },
          ticks: {
            display: false,
          },
          title: {
            display: false,
          },
          stacked: true,
        },
        y: {
          grid: {
            display: false,
          },
          stacked: true,
        },
      },
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            usePointStyle: true,
          },
        },
        tooltip: {
          enabled: false,
        },
        datalabels: {
          anchor: "end" as const,
          align: "end" as const,
          color: "#1a202c",
        },
      },
      layout: {
        padding: {},
      },
    };

    // Mobile-specific overrides
    if (isMobile) {
      return {
        ...baseOptions,
        scales: {
          ...baseOptions.scales,
          y: {
            ...baseOptions.scales?.y,
            ticks: {
              font: {
                size: 10,
                weight: 500,
              } as any,
              callback: getYTickCallback(true),
            },
            afterFit: function (scale: Scale) {
              scale.width = 40;
            },
          },
        },
        plugins: {
          ...baseOptions.plugins,
          legend: {
            ...baseOptions.plugins?.legend,
            labels: {
              boxWidth: 10,
              padding: 10,
              font: {
                size: 10,
              },
              usePointStyle: true,
            },
          },
          datalabels: {
            ...baseOptions.plugins?.datalabels,
            font: {
              weight: 600,
              size: 8,
            } as any,
            formatter: (_value: number, context: Context) => {
              if (context.datasetIndex === 1) {
                const savings = context.chart.data.datasets[0].data[
                  context.dataIndex
                ] as number;
                const deposits = context.chart.data.datasets[1].data[
                  context.dataIndex
                ] as number;
                const total = savings + deposits;

                if (total >= 0.1) {
                  const savingsFormatted = savings.toFixed(
                    savings >= 10 ? 0 : 1,
                  );
                  const depositsFormatted = deposits.toFixed(
                    deposits >= 10 ? 0 : 1,
                  );
                  return `S:${savingsFormatted} D:${depositsFormatted}`;
                }
              }
              return "";
            },
            display: (context: Context) => {
              if (context.datasetIndex === 1) {
                const savings = context.chart.data.datasets[0].data[
                  context.dataIndex
                ] as number;
                const deposits = context.chart.data.datasets[1].data[
                  context.dataIndex
                ] as number;
                const total = savings + deposits;
                return total >= 0.1;
              }
              return false;
            },
            padding: {
              right: 2,
            },
            offset: 4,
          },
        },
        layout: {
          padding: {
            left: 5,
            right: 60,
            top: 30,
            bottom: 10,
          },
        },
      };
    }

    // Desktop-specific overrides
    return {
      ...baseOptions,
      scales: {
        ...baseOptions.scales,
        y: {
          ...baseOptions.scales?.y,
          ticks: {
            font: {
              size: 11,
              weight: 500,
            } as any,
            callback: getYTickCallback(false),
          },
          afterFit: function (scale: Scale) {
            scale.width = 60;
          },
        },
      },
      plugins: {
        ...baseOptions.plugins,
        legend: {
          ...baseOptions.plugins?.legend,
          labels: {
            boxWidth: 12,
            padding: 15,
            font: {
              size: 11,
            },
            usePointStyle: true,
          },
        },
        datalabels: {
          ...baseOptions.plugins?.datalabels,
          font: {
            weight: 600,
            size: 9,
          } as any,
          formatter: (_value: number, context: Context) => {
            if (context.datasetIndex === 1) {
              const savings = context.chart.data.datasets[0].data[
                context.dataIndex
              ] as number;
              const deposits = context.chart.data.datasets[1].data[
                context.dataIndex
              ] as number;
              const total = savings + deposits;

              if (total >= 0.1) {
                const savingsFormatted = savings.toFixed(savings >= 10 ? 0 : 1);
                const depositsFormatted = deposits.toFixed(
                  deposits >= 10 ? 0 : 1,
                );
                return `S:${savingsFormatted}\nD:${depositsFormatted}`;
              }
            }
            return "";
          },
          display: (context: Context) => {
            if (context.datasetIndex === 1) {
              const savings = context.chart.data.datasets[0].data[
                context.dataIndex
              ] as number;
              const deposits = context.chart.data.datasets[1].data[
                context.dataIndex
              ] as number;
              const total = savings + deposits;
              return total >= 0.1;
            }
            return false;
          },
          padding: {
            right: 4,
          },
          offset: 8,
        },
      },
      layout: {
        padding: {
          left: 10,
          right: 80,
          top: 40,
          bottom: 20,
        },
      },
    };
  };

  if (!chartData) {
    return (
      <div className="bg-white rounded-lg my-3 p-3 shadow-sm border border-gray-200 mb-3">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-semibold text-gray-800">
            <span>📊</span> Asset Distribution
          </div>
        </div>
        <div
          className="text-center p-3 text-gray-500 flex items-center justify-center"
          style={{
            height: "300px",
          }}
        >
          <div>
            <div className="text-sm font-medium mb-0.5">
              No asset data available
            </div>
            <div className="text-xs">
              Add accounts and deposits to see the distribution
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg my-3 p-3 shadow-sm border border-gray-200 mb-3">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-semibold text-gray-800">
          <span>📊</span> Asset Distribution
        </div>
        <div className="text-xs text-gray-600 font-normal hidden sm:block">
          S=Savings | D=Deposits
        </div>
        <div className="text-xs text-gray-600 font-normal sm:hidden">
          S=Sav D=Dep
        </div>
      </div>
      {/* Responsive height - taller on mobile to utilize space */}
      <div className="h-[380px] sm:h-[450px] relative">
        <Bar data={chartData.chartData} options={getChartOptions()} />
      </div>
    </div>
  );
};

export default CombinedAssetBarChart;
