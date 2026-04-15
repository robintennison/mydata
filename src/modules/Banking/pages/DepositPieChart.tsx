import React, { useMemo, useState, useEffect } from "react";
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
import { collection, query, getDocs } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";

// Register Chart.js components for Pie chart
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface DepositPieChartProps {
  accounts?: any[];
  deposits?: any[];
  adjustments?: any[];
  showInactive?: boolean;
}

interface AccountDepositSummary {
  acctCode: string;
  deposits: number;
}

const DepositPieChart: React.FC<DepositPieChartProps> = ({
  accounts: propAccounts,
  deposits: propDeposits,
  adjustments: propAdjustments,
  showInactive = false,
}) => {
  const [currentMonthData, setCurrentMonthData] = useState<
    AccountDepositSummary[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Get current month in YYYY-MM format
  const getCurrentMonth = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // Fetch deposit data from history_detail for current month
  useEffect(() => {
    const fetchCurrentMonthDeposits = async () => {
      try {
        setLoading(true);
        const currentMonth = getCurrentMonth();
        const historyDetailRef = collection(firestore, "history_detail");
        const q = query(historyDetailRef);
        const querySnapshot = await getDocs(q);

        // Map to store deposit data for current month
        const accountMap = new Map<string, number>();

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const month = data.month;
          const acctCode = data.acctCode;
          const deposits = data.deposits || 0;

          // Only include records from current month
          if (month === currentMonth && acctCode && deposits > 0) {
            if (accountMap.has(acctCode)) {
              const existing = accountMap.get(acctCode)!;
              accountMap.set(acctCode, existing + deposits);
            } else {
              accountMap.set(acctCode, deposits);
            }
          }
        });

        // Convert map to array of AccountDepositSummary
        const accountSummaries: AccountDepositSummary[] = [];
        accountMap.forEach((deposits, acctCode) => {
          accountSummaries.push({
            acctCode: acctCode,
            deposits: deposits,
          });
        });

        setCurrentMonthData(accountSummaries);
      } catch (error) {
        console.error(
          "Error fetching history_detail for deposit pie chart:",
          error,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentMonthDeposits();
  }, []);

  // Prepare data for pie chart using current month data from history_detail
  const chartData = useMemo(() => {
    // If we have data from history_detail, use it; otherwise fall back to props for backward compatibility
    let dataSource: AccountDepositSummary[] = [];

    if (currentMonthData.length > 0) {
      dataSource = currentMonthData;
    } else if (propAccounts && propAccounts.length > 0) {
      // Fall back to props-based calculation for backward compatibility
      const filteredDeposits = showInactive
        ? propDeposits || []
        : (propDeposits || []).filter((d) => d.active !== false);

      const summaries = propAccounts.map((account) => {
        const baseDeposits = filteredDeposits
          .filter((deposit) => deposit.accountId === account.id)
          .reduce((sum, deposit) => sum + deposit.amount, 0);

        const adjustmentsTotal = (propAdjustments || [])
          .filter((adj) => adj.accountId === account.id)
          .reduce((sum, adj) => sum + (adj.adjustmentAmount || 0), 0);

        return {
          acctCode: account.acctCode || account.id,
          deposits: baseDeposits + adjustmentsTotal,
        };
      });

      dataSource = summaries;
    }

    if (!dataSource.length) return null;

    const summaries = dataSource.map((account) => ({
      label: account.acctCode,
      value: account.deposits / 100000, // in Lakhs
    }));

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
  }, [
    currentMonthData,
    propAccounts,
    propDeposits,
    propAdjustments,
    showInactive,
  ]);

  const chartOptions: ChartOptions<"pie"> = {
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

  if (loading) {
    return (
      <div className="pb-2">
        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
          <div className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Deposit Distribution</span>
          </div>
          <div className="h-[360px] relative flex items-center justify-center">
            <div className="text-gray-500">Loading deposit data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="pb-2">
        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
          <div className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Deposit Distribution</span>
          </div>
          <div className="h-[360px] relative flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <div className="text-4xl mb-2">📭</div>
              <div>No deposit data available for current month</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-2">
      <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
        <div className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span>📊</span>
          <span> Fog Distribution </span>
        </div>
        <div className="h-[360px] relative">
          <Pie data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default DepositPieChart;
