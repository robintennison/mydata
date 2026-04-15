import React, { useMemo, useState, useEffect } from "react";
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
import { collection, query, getDocs } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";

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
  // No props needed - will fetch data directly
}

interface AccountData {
  acctCode: string;
  savings: number;
  deposits: number;
}

const CombinedAssetBarChart: React.FC<CombinedAssetBarChartProps> = () => {
  const [accountData, setAccountData] = useState<AccountData[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current month in YYYY-MM format
  const getCurrentMonth = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // Fetch data from history_detail for current month
  useEffect(() => {
    const fetchCurrentMonthData = async () => {
      try {
        setLoading(true);
        const currentMonth = getCurrentMonth();
        const historyDetailRef = collection(firestore, "history_detail");
        const q = query(historyDetailRef);
        const querySnapshot = await getDocs(q);

        // Map to store account data for current month
        const accountMap = new Map<string, AccountData>();

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const month = data.month;
          const acctCode = data.acctCode;
          const savings = data.savings || 0;
          const deposits = data.deposits || 0;

          // Only include records from current month
          if (month === currentMonth && acctCode) {
            if (accountMap.has(acctCode)) {
              const existing = accountMap.get(acctCode)!;
              accountMap.set(acctCode, {
                acctCode: acctCode,
                savings: existing.savings + savings,
                deposits: existing.deposits + deposits,
              });
            } else {
              accountMap.set(acctCode, {
                acctCode: acctCode,
                savings: savings,
                deposits: deposits,
              });
            }
          }
        });

        // Convert map to array
        const accountSummaries: AccountData[] = [];
        accountMap.forEach((data) => {
          // Only include accounts with either savings or deposits > 0
          if (data.savings > 0 || data.deposits > 0) {
            accountSummaries.push(data);
          }
        });

        console.log(
          "Fetched account data for current month:",
          accountSummaries,
        );
        setAccountData(accountSummaries);
      } catch (error) {
        console.error("Error fetching history_detail for bar chart:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentMonthData();
  }, []);

  // Prepare data for bar chart
  const chartData = useMemo(() => {
    if (!accountData.length) return null;

    // Convert to lakhs for display
    let summaries = accountData.map((account) => ({
      label: account.acctCode,
      fullLabel: account.acctCode,
      savings: account.savings / 100000, // in Lakhs
      deposits: account.deposits / 100000, // in Lakhs
      total: (account.savings + account.deposits) / 100000,
    }));

    // Filter out accounts with 0 total
    summaries = summaries.filter((s) => s.total > 0);

    if (summaries.length === 0) return null;

    // Group items < 10 lakhs total into "Others"
    const threshold = 10;
    const majorSummaries = summaries.filter((s) => s.total >= threshold);
    const minorSummaries = summaries.filter((s) => s.total < threshold);

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

    // Sort by total value descending
    finalSummaries.sort((a, b) => b.total - a.total);

    // Limit to top 8 for better readability
    const displaySummaries = finalSummaries.slice(0, 8);

    const data: ChartData<"bar"> = {
      labels: displaySummaries.map((s) => s.label),
      datasets: [
        {
          label: "Water",
          data: displaySummaries.map((s) => s.savings),
          backgroundColor: "rgba(52, 168, 83, 0.7)", // Green for savings
          borderColor: "#34a853",
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          stack: "Stack 0",
        },
        {
          label: "Steam",
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

    return { chartData: data, displaySummaries };
  }, [accountData]);

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
          ticks: {
            font: {
              size: isMobile ? 9 : 11,
            },
            callback: function (
              this: any,
              value: string | number,
              index: number,
            ): string {
              if (
                typeof value === "number" &&
                this.chart?.scales?.y?.getLabels
              ) {
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
                    // On desktop, show full label
                    if (label && label.length > 10) {
                      return label.substring(0, 8) + "...";
                    }
                  }
                  return label || "";
                }
              }
              return value.toString();
            },
          },
        },
      },
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            usePointStyle: true,
            font: {
              size: isMobile ? 10 : 11,
            },
          },
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (context: any) {
              const label = context.dataset.label || "";
              const value = context.raw;
              return `${label}: ${value.toFixed(2)} Lakhs`;
            },
            footer: function (tooltipItems: any[]) {
              if (tooltipItems.length === 2) {
                const total = tooltipItems.reduce(
                  (sum, item) => sum + item.raw,
                  0,
                );
                return `Total: ${total.toFixed(2)} Lakhs`;
              }
              return "";
            },
          },
        },
        datalabels: {
          anchor: "end" as const,
          align: "end" as const,
          color: "#1a202c",
          font: {
            weight: 600,
            size: isMobile ? 8 : 9,
          },
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
                if (isMobile) {
                  return `S:${savingsFormatted} D:${depositsFormatted}`;
                }
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
          padding: isMobile ? { right: 2 } : { right: 4 },
          offset: isMobile ? 4 : 8,
        },
      },
      layout: {
        padding: {
          left: isMobile ? 5 : 10,
          right: isMobile ? 50 : 70,
          top: isMobile ? 20 : 30,
          bottom: isMobile ? 10 : 20,
        },
      },
    };

    // Adjust y-axis width based on mobile/desktop
    if (isMobile) {
      (baseOptions.scales?.y as any).afterFit = function (scale: Scale) {
        scale.width = 45;
      };
    } else {
      (baseOptions.scales?.y as any).afterFit = function (scale: Scale) {
        scale.width = 70;
      };
    }

    return baseOptions;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg my-3 p-3 shadow-sm border border-gray-200 mb-3">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-semibold text-gray-800">
            <span>📊</span> Liquid Distribution
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
              Loading asset data...
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              No history data found for current month
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
          <span>📊</span> Liquid Distribution
        </div>
        <div className="text-xs text-gray-600 font-normal hidden sm:block">
          S=Water | D=Steam
        </div>
        <div className="text-xs text-gray-600 font-normal sm:hidden">
          S=Sav D=Dep
        </div>
      </div>
      {/* Responsive height */}
      <div className="h-[400px] sm:h-[450px] relative">
        <Bar data={chartData.chartData} options={getChartOptions()} />
      </div>
    </div>
  );
};

export default CombinedAssetBarChart;
