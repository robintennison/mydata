import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBankingData } from "../hooks/useBankingData";
import { useSettings } from "../../../contexts/SettingsContext";
import Header from "../../../components/Layout/Header";

// Import the tab components
import AccountsTab from "./AccountsTab";
import DepositsTab from "./DepositsTab";
import HistoryTab from "./HistoryTab";
import HistoryDetailTab from "./HistoryDetailTab";
import LiabilityHistoryTab from "./LiabilityHistoryTab";

// Import the pie chart components
import DepositPieChart from "./DepositPieChart";
import SavingsPieChart from "./SavingsPieChart";

// Define the tab type
type TabType = "dashboard" | "accounts" | "deposits" | "history" | "historydetail" | "liabilities";

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

  // Format numbers in lakhs with 2 decimals
  const formatLakhs = (amount: number): string => {
    return (amount / 100000).toFixed(2);
  };

  // Get current month in YYYY-MM format
  const getCurrentMonth = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
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

    const totalBankBalance = totalSavings + totalDeposits;

    return {
      totalSavings,
      totalDeposits,
      totalBankBalance,
    };
  };

  // Get last 6 months history from history_detail (sorted by date - newest first)
  const getLast6MonthsFromHistoryDetail = () => {
    if (!historyDetail || historyDetail.length === 0) return [];

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

    // Convert map to array and sort by month (newest first)
    const sortedMonths = Array.from(monthMap.values())
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6);

    return sortedMonths;
  };

  // Get current month data for top cards
  const currentMonthData = getCurrentMonthData();
  const totalSavings = currentMonthData.totalSavings;
  const totalDeposits = currentMonthData.totalDeposits;
  const totalBankBalance = currentMonthData.totalBankBalance;

  // Get last 6 months from history_detail for recent history section
  const last6MonthsFromHistoryDetail = getLast6MonthsFromHistoryDetail();

  // Dashboard content component
  const DashboardContent = () => (
    <>
      {/* Top 3 Cards in Single Row - Compact */}
      <div className="px-2 py-2">
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {/* Total Savings Card */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs text-gray-500 mb-0.5">Water</div>
            <div className="text-base font-bold text-gray-900 leading-tight">
              {formatLakhs(totalSavings)}
            </div>
          </div>

          {/* Total Deposits Card */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs text-gray-500 mb-0.5"> Steam </div>
            <div className="text-base font-bold text-gray-900 leading-tight">
              {formatLakhs(totalDeposits)}
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

      {/* Recent History - Compact */}
      <div className="px-2 pb-2">
        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
          <div className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
            <span>📅</span>
            <span>Recent History (6 Months)</span>
          </div>

          {last6MonthsFromHistoryDetail.length === 0 ? (
            <div className="text-center py-2 text-gray-500 text-xs">
              No history data available
            </div>
          ) : (
            <div>
              {/* Table Header */}
              <div className="flex items-center py-1 px-0 bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-700">
                <div className="flex-1 px-0.5 min-w-[45px]">Month</div>
                <div className="flex-1 px-0.5 text-right min-w-[40px]">
                  Water
                </div>
                <div className="flex-1 px-0.5 text-right min-w-[40px]">
                  Steam
                </div>
                <div className="flex-1 px-0.5 text-right min-w-[40px]">
                  Liquid
                </div>
              </div>

              {/* Table Rows */}
              {last6MonthsFromHistoryDetail.map((record) => {
                const savingsDisplay = formatLakhs(record.savings);
                const depositsDisplay = formatLakhs(record.deposits);
                const totalDisplay = formatLakhs(
                  record.savings + record.deposits,
                );

                const [year, month] = record.month.split("-");
                const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                const monthName = date.toLocaleDateString("en-IN", {
                  month: "short",
                  year: "2-digit",
                });

                return (
                  <div
                    key={record.month}
                    className="flex items-center py-1 px-0 border-b border-gray-100 min-h-6 last:border-b-0"
                  >
                    <div className="flex-1 px-0.5 text-xs text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap min-w-[45px]">
                      {monthName}
                    </div>
                    <div className="flex-1 px-0.5 text-xs font-semibold text-green-600 text-right min-w-[40px]">
                      {savingsDisplay}
                    </div>
                    <div className="flex-1 px-0.5 text-xs font-semibold text-orange-500 text-right min-w-[40px]">
                      {depositsDisplay}
                    </div>
                    <div className="flex-1 px-0.5 text-xs font-semibold text-blue-600 text-right min-w-[40px]">
                      {totalDisplay}
                    </div>
                  </div>
                );
              })}

              <div className="text-xs text-gray-400 text-center py-1 border-t border-gray-100 bg-gray-50">
                {Math.min(last6MonthsFromHistoryDetail.length, 6)} of{" "}
                {historyDetail?.length || 0} records
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