import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBankingData } from "../hooks/useBankingData";
import { useSettings } from "../../../contexts/SettingsContext";
import Header from "../../../components/Layout/Header";
import { getCurrentMonth, formatLakhs } from "../../../utils/formatters";
import { LiabilityHistory, MonthlyDataWithLiabilities } from "../../../types/banking.types";

// Import the tab components
import AccountsTab from "./AccountsTab";
import DepositsTab from "./DepositsTab";
import HistoryTab from "./HistoryTab";
import HistoryDetailTab from "./HistoryDetailTab";
import LiabilityHistoryTab from "./LiabilityHistoryTab";

// Import the pie chart components
import DepositPieChart from "./DepositPieChart";
import SavingsPieChart from "./SavingsPieChart";

// Import Firestore functions
import { collection, query, getDocs, where } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";

// Define the tab type
type TabType = "dashboard" | "accounts" | "deposits" | "history" | "historydetail" | "liabilities";

// Interface for monthly data with liabilities (now imported from types)
// This interface is now defined in banking.types.ts as MonthlyDataWithLiabilities

interface BankingHomePageProps {
  // Add any props if needed
}

const BankingHomePage: React.FC<BankingHomePageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Use only one settings source - from SettingsContext
  const {
    loading: bankingLoading,
    accounts,
    deposits,
    adjustments,
    historyDetail, // Get historyDetail data
  } = useBankingData();
  const { settings: appSettings, loading: settingsLoading } = useSettings();

  // State for active tab
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  
  // State for monthly data with liabilities
  const [monthlyDataWithLiabilities, setMonthlyDataWithLiabilities] = useState<MonthlyDataWithLiabilities[]>([]);
  const [currentMonthLiabilities, setCurrentMonthLiabilities] = useState<number>(0);

  // Get liabilities for a specific month
  const getLiabilitiesForMonth = async (month: string): Promise<number> => {
    try {
      const liabilityHistoryRef = collection(firestore, "liability_history");
      const q = query(liabilityHistoryRef, where("month", "==", month));
      const querySnapshot = await getDocs(q);
      
      let total = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data() as LiabilityHistory;
        total += data.amount || 0;
      });
      
      return total;
    } catch (error) {
      console.error(`Error fetching liabilities for ${month}:`, error);
      return 0;
    }
  };

  // Fetch aggregated data with liabilities
  useEffect(() => {
    const fetchDataWithLiabilities = async () => {
      if (!historyDetail || historyDetail.length === 0) {
        // If no history detail, still try to get current month liabilities
        const currentMonth = getCurrentMonth();
        const liabilities = await getLiabilitiesForMonth(currentMonth);
        setCurrentMonthLiabilities(liabilities);
        setMonthlyDataWithLiabilities([]);
        return;
      }

      // Group by month and aggregate savings and deposits
      const monthMap = new Map();

      historyDetail.forEach((record) => {
        const month = record.month;
        if (!monthMap.has(month)) {
          monthMap.set(month, {
            month: month,
            savings: 0,
            deposits: 0,
          });
        }
        const monthData = monthMap.get(month);
        monthData.savings += record.savings || 0;
        monthData.deposits += record.deposits || 0;
      });

      // Get liabilities for each month
      const monthlyDataArray: MonthlyDataWithLiabilities[] = [];
      for (const [month, data] of monthMap) {
        const liabilities = await getLiabilitiesForMonth(month);
        monthlyDataArray.push({
          month: month,
          savings: data.savings,
          deposits: data.deposits,
          liabilities: liabilities,
          total: data.savings + data.deposits - liabilities,
        });
      }

      // Sort by month (newest first)
      monthlyDataArray.sort((a, b) => b.month.localeCompare(a.month));
      
      setMonthlyDataWithLiabilities(monthlyDataArray);
      
      // Get current month liabilities
      const currentMonth = getCurrentMonth();
      const currentLiabilities = await getLiabilitiesForMonth(currentMonth);
      setCurrentMonthLiabilities(currentLiabilities);
    };

    fetchDataWithLiabilities();
  }, [historyDetail]);

  // Handle navigation state to set active tab
  useEffect(() => {
    if (location.state && location.state.activeTab) {
      const tabFromState = location.state.activeTab;
      if (
        [
          "dashboard",
          "accounts",
          "deposits",
          "history",
          "historydetail",
          "liabilities",
        ].includes(tabFromState)
      ) {
        setActiveTab(tabFromState as TabType);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state]);

  // Handle Add button click
  const handleAddClick = () => {
    switch (activeTab) {
      case "accounts":
        navigate("/banking/accounts/add", {
          state: { returnTo: "/banking", activeTab: "accounts" },
        });
        break;
      case "deposits":
        navigate("/banking/deposits/add", {
          state: { returnTo: "/banking", activeTab: "deposits" },
        });
        break;
      case "history":
        // No action needed
        break;
      case "historydetail":
        // No action needed for history detail
        break;
      case "liabilities":
        // Liabilities have their own Add button inside the tab
        break;
      case "dashboard":
      default:
        alert("Select Accounts or Deposits tab to add items");
        break;
    }
  };

  // Check if current tab should show Add button
  const shouldShowAddButton = () => {
    return activeTab === "accounts" || activeTab === "deposits";
  };

  // Get button title based on active tab
  const getAddButtonTitle = () => {
    switch (activeTab) {
      case "accounts":
        return "Add New Account";
      case "deposits":
        return "Add New Deposit";
      default:
        return "Add";
    }
  };

  // Get data for current month from history_detail
  const getCurrentMonthData = () => {
    const currentMonth = getCurrentMonth();
    const currentMonthRecords =
      historyDetail?.filter((record) => record.month === currentMonth) || [];

    // Calculate totals for current month
    const totalSavings = currentMonthRecords.reduce(
      (sum, record) => sum + (record.savings || 0),
      0,
    );

    const totalDeposits = currentMonthRecords.reduce(
      (sum, record) => sum + (record.deposits || 0),
      0,
    );

    const totalBankBalance = totalSavings + totalDeposits - currentMonthLiabilities;

    return {
      totalSavings,
      totalDeposits,
      totalBankBalance,
      totalLiabilities: currentMonthLiabilities,
    };
  };

  // Get last 6 months history from history_detail with liabilities (sorted by date - newest first)
  const getLast6MonthsWithLiabilities = () => {
    if (!monthlyDataWithLiabilities || monthlyDataWithLiabilities.length === 0) return [];
    
    // Return the first 6 items (already sorted newest first)
    return monthlyDataWithLiabilities.slice(0, 6);
  };

  // Get current month data for top cards
  const currentMonthData = getCurrentMonthData();
  const totalSavings = currentMonthData.totalSavings;
  const totalDeposits = currentMonthData.totalDeposits;
  const totalLiabilities = currentMonthData.totalLiabilities;
  const totalBankBalance = currentMonthData.totalBankBalance;

  // Get last 6 months with liabilities for recent history section
  const last6MonthsWithLiabilities = getLast6MonthsWithLiabilities();

  // Dashboard content component
  const DashboardContent = () => (
    <>
      {/* Top 4 Cards in Grid - Mobile optimized */}
      <div className="px-2 py-2">
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {/* Total Savings Card */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs text-gray-500 mb-0.5">Water</div>
            <div className="text-base font-bold text-gray-900 leading-tight">
              {formatLakhs(totalSavings)}
            </div>
          </div>

          {/* Total Deposits Card */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs text-gray-500 mb-0.5">Steam</div>
            <div className="text-base font-bold text-gray-900 leading-tight">
              {formatLakhs(totalDeposits)}
            </div>
          </div>

          {/* Total Liabilities Card */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs text-gray-500 mb-0.5">Liabilities</div>
            <div className="text-base font-bold text-red-600 leading-tight">
              {formatLakhs(totalLiabilities)}
            </div>
          </div>

          {/* Total Bank Balance Card */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs text-gray-500 mb-0.5">Liquid</div>
            <div className="text-base font-bold text-gray-900 leading-tight">
              {formatLakhs(totalBankBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Recent History with Liabilities - Mobile Friendly */}
      <div className="px-2 pb-2">
        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
          <div className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
            <span>📅</span>
            <span>Recent History (6 Months)</span>
          </div>

          {last6MonthsWithLiabilities.length === 0 ? (
            <div className="text-center py-2 text-gray-500 text-xs">
              No history data available
            </div>
          ) : (
            <div>
              {/* Mobile-friendly header */}
              <div className="flex flex-wrap items-center py-1 px-0 bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-700">
                <div className="w-1/5 min-w-[45px]">Month</div>
                <div className="w-1/5 text-right">Wtr</div>
                <div className="w-1/5 text-right">Stm</div>
                <div className="w-1/5 text-right">Lbl</div>
                <div className="w-1/5 text-right">Liq</div>
              </div>

              {/* Table Rows - Mobile-friendly layout */}
              {last6MonthsWithLiabilities.map((record) => {
                const savingsDisplay = formatLakhs(record.savings);
                const depositsDisplay = formatLakhs(record.deposits);
                const liabilitiesDisplay = formatLakhs(record.liabilities);
                const totalDisplay = formatLakhs(record.total);

                const [year, month] = record.month.split("-");
                const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                const monthName = date.toLocaleDateString("en-IN", {
                  month: "short",
                  year: "2-digit",
                });

                return (
                  <div
                    key={record.month}
                    className="flex flex-wrap items-center py-1 px-0 border-b border-gray-100 min-h-6 last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="w-1/5 text-xs text-gray-900 font-medium overflow-hidden text-ellipsis whitespace-nowrap min-w-[45px]">
                      {monthName}
                    </div>
                    <div className="w-1/5 text-xs font-semibold text-green-600 text-right">
                      {savingsDisplay}
                    </div>
                    <div className="w-1/5 text-xs font-semibold text-orange-500 text-right">
                      {depositsDisplay}
                    </div>
                    <div className="w-1/5 text-xs font-semibold text-red-600 text-right">
                      {liabilitiesDisplay}
                    </div>
                    <div className="w-1/5 text-xs font-semibold text-blue-600 text-right">
                      {totalDisplay}
                    </div>
                  </div>
                );
              })}

              <div className="text-xs text-gray-400 text-center py-1 border-t border-gray-100 bg-gray-50">
                {Math.min(last6MonthsWithLiabilities.length, 6)} of{" "}
                {monthlyDataWithLiabilities.length || 0} records
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pie Charts Section */}
      <div className="flex flex-col gap-2 px-2 pb-2">
        {/* Top: Savings Pie Chart */}
        <SavingsPieChart accounts={accounts} />

        {/* Bottom: Deposit Pie Chart - Using appSettings for showInactive */}
        <DepositPieChart
          accounts={accounts}
          deposits={deposits}
          adjustments={adjustments}
          showInactive={appSettings?.showInactive || false}
        />
      </div>
    </>
  );

  // Combined loading state
  if (bankingLoading || settingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-3 text-sm text-gray-500">Loading banking data...</p>
      </div>
    );
  }

  // Debug log to check active tab
  console.log("Active tab:", activeTab);

  return (
    <div className="flex flex-col h-screen">
      {/* Header with Add button */}
      <Header
        showAddButton={shouldShowAddButton()}
        onAddClick={handleAddClick}
        addButtonTitle={getAddButtonTitle()}
      />

      {/* Tabs Navigation */}
      <div className="w-full bg-white border-b border-gray-200 sticky top-14 z-10">
        <div className="flex overflow-x-auto px-1 py-0 gap-0.5">
          <button
            onClick={() => {
              console.log("Setting active tab to dashboard");
              setActiveTab("dashboard");
            }}
            className={`flex-1 min-w-0 px-0.5 py-2 border-none text-xs font-medium cursor-pointer whitespace-nowrap flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              activeTab === "dashboard"
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                : "bg-transparent text-gray-500 border-b-2 border-transparent"
            }`}
            title="Dashboard"
          >
            <span className="text-base">📊</span>
            <span className="hidden xs:block text-[10px] mt-0.5">Dash</span>
          </button>

          <button
            onClick={() => {
              console.log("Setting active tab to accounts");
              setActiveTab("accounts");
            }}
            className={`flex-1 min-w-0 px-0.5 py-2 border-none text-xs font-medium cursor-pointer whitespace-nowrap flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              activeTab === "accounts"
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                : "bg-transparent text-gray-500 border-b-2 border-transparent"
            }`}
            title="Accounts"
          >
            <span className="text-base">👥</span>
            <span className="hidden xs:block text-[10px] mt-0.5">Acct</span>
          </button>

          <button
            onClick={() => {
              console.log("Setting active tab to deposits");
              setActiveTab("deposits");
            }}
            className={`flex-1 min-w-0 px-0.5 py-2 border-none text-xs font-medium cursor-pointer whitespace-nowrap flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              activeTab === "deposits"
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                : "bg-transparent text-gray-500 border-b-2 border-transparent"
            }`}
            title="Deposits"
          >
            <span className="text-base">💰</span>
            <span className="hidden xs:block text-[10px] mt-0.5">Depo</span>
          </button>

          <button
            onClick={() => {
              console.log("Setting active tab to history");
              setActiveTab("history");
            }}
            className={`flex-1 min-w-0 px-0.5 py-2 border-none text-xs font-medium cursor-pointer whitespace-nowrap flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              activeTab === "history"
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                : "bg-transparent text-gray-500 border-b-2 border-transparent"
            }`}
            title="History"
          >
            <span className="text-base">📅</span>
            <span className="hidden xs:block text-[10px] mt-0.5">Hist</span>
          </button>

          <button
            onClick={() => {
              console.log("Setting active tab to historydetail");
              setActiveTab("historydetail");
            }}
            className={`flex-1 min-w-0 px-0.5 py-2 border-none text-xs font-medium cursor-pointer whitespace-nowrap flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              activeTab === "historydetail"
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                : "bg-transparent text-gray-500 border-b-2 border-transparent"
            }`}
            title="History Detail"
          >
            <span className="text-base">📋</span>
            <span className="hidden xs:block text-[10px] mt-0.5">Detl</span>
          </button>

          <button
            onClick={() => {
              console.log("Setting active tab to liabilities");
              setActiveTab("liabilities");
            }}
            className={`flex-1 min-w-0 px-0.5 py-2 border-none text-xs font-medium cursor-pointer whitespace-nowrap flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
              activeTab === "liabilities"
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                : "bg-transparent text-gray-500 border-b-2 border-transparent"
            }`}
            title="Liability History"
          >
            <span className="text-base">💰</span>
            <span className="hidden xs:block text-[10px] mt-0.5">Liab</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div
        className={`flex-1 w-full mx-auto overflow-y-auto ${
          activeTab === "dashboard" ||
          activeTab === "history" ||
          activeTab === "historydetail" ||
          activeTab === "liabilities"
            ? "px-0"
            : "p-2"
        }`}
      >
        {activeTab === "dashboard" && <DashboardContent />}
        {activeTab === "accounts" && <AccountsTab />}
        {activeTab === "deposits" && <DepositsTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "historydetail" && <HistoryDetailTab />}
        {activeTab === "liabilities" && <LiabilityHistoryTab />}
      </div>
    </div>
  );
};

export default BankingHomePage;