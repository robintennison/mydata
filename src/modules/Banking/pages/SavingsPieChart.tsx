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
import { getCurrentMonth, formatLakhs } from "../../../utils/formatters";

// Register Chart.js components for Pie chart
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface SavingsPieChartProps {
  accounts?: any[]; // Keep for backward compatibility but won't be used
}

interface AccountSummary {
  acctCode: string;
  savingsAmount: number;
}

const SavingsPieChart: React.FC<SavingsPieChartProps> = ({
  accounts: propAccounts,
}) => {
  const [currentMonthData, setCurrentMonthData] = useState<AccountSummary[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  // REMOVED: Local getCurrentMonth function definition (now imported from formatters)
  // REMOVED: Local formatLakhs function (now imported from formatters)

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
        const accountMap = new Map<string, number>();

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const month = data.month;
          const acctCode = data.acctCode;
          const savings = data.savings || 0;

          // Only include records from current month
          if (month === currentMonth && acctCode && savings > 0) {
            if (accountMap.has(acctCode)) {
              const existing = accountMap.get(acctCode)!;
              accountMap.set(acctCode, existing + savings);
            } else {
              accountMap.set(acctCode, savings);
            }
          }
        });

        // Convert map to array of AccountSummary
        const accountSummaries: AccountSummary[] = [];
        accountMap.forEach((savingsAmount, acctCode) => {
          accountSummaries.push({
            acctCode: acctCode,
            savingsAmount: savingsAmount,
          });
        });

        setCurrentMonthData(accountSummaries);
      } catch (error) {
        console.error("Error fetching history_detail for pie chart:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentMonthData();
  }, []);

  // Calculate total savings
  const totalSavings = useMemo(() => {
    const dataSource =
      currentMonthData.length > 0 ? currentMonthData : propAccounts || [];
    
    return dataSource.reduce((total, account) => total + (account.savingsAmount || 0), 0);
  }, [currentMonthData, propAccounts]);

  // Prepare data for pie chart using current month data from history_detail
  const chartData = useMemo(() => {
    // If we have prop accounts and no data from history_detail, fall back to props
    const dataSource =
      currentMonthData.length > 0 ? currentMonthData : propAccounts || [];

    if (!dataSource.length) return null;

    const summaries = dataSource.map((account) => ({
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
            "rgba(52, 168, 83, 0.7)", // green
            "rgba(66, 133, 244, 0.7)", // blue
            "rgba(251, 188, 5, 0.7)", // yellow
            "rgba(234, 67, 53, 0.7)", // red
            "rgba(156, 39, 176, 0.7)", // purple
            "rgba(0, 188, 212, 0.7)", // cyan
            "rgba(255, 152, 0, 0.7)", // orange
            "rgba(121, 85, 72, 0.7)", // brown
            "rgba(96, 125, 139, 0.7)", // blue grey
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
  }, [currentMonthData, propAccounts]);

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
          const label =
            (context.chart.data.labels?.[context.dataIndex] as string) || "";

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
          const label = context.chart.data.labels?.[
            context.dataIndex
          ] as string;
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

  if (loading) {
    return (
      <div className="pb-2">
        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
          <div className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Savings Distribution</span>
          </div>
          <div className="h-[360px] relative flex items-center justify-center">
            <div className="text-gray-500">Loading savings data...</div>
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
            <span>Savings Distribution</span>
          </div>
          <div className="h-[360px] relative flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <div className="text-4xl mb-2">📭</div>
              <div>No savings data available for current month</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-2">
      <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <span>📊</span>
            <span>Savings Distribution</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Total Savings</div>
            <div className="text-lg font-bold text-green-600">
              {formatLakhs(totalSavings)}
            </div>
          </div>
        </div>
        <div className="h-[360px] relative">
          <Pie data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default SavingsPieChart;