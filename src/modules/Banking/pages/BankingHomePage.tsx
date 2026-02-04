// src/modules/banking/BankingHomePage.tsx (Tailwind Version)
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBankingData } from "../hooks/useBankingData";
import { useSettings } from "../../../contexts/SettingsContext";
import Header from "../../../components/Layout/Header"; // Import Header

// Import the tab components
import AccountsTab from "./AccountsTab";
import DepositsTab from "./DepositsTab";
import HistoryTab from "./HistoryTab";
import SummaryTab from "./SummaryTab";

// Import the pie chart components
import DepositPieChart from "./DepositPieChart";
import SavingsPieChart from "./SavingsPieChart";

interface BankingHomePageProps {
  // Add any props if needed
}

const BankingHomePage: React.FC<BankingHomePageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, accounts, deposits, history, adjustments, settings } =
    useBankingData();
  const { settings: appSettings } = useSettings();

  // State for active tab
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "accounts" | "deposits" | "history" | "summary"
  >("dashboard");

  // Handle navigation state to set active tab
  useEffect(() => {
    // Check if there's state in the location (passed from navigation)
    if (location.state && location.state.activeTab) {
      const tabFromState = location.state.activeTab;
      if (
        ["dashboard", "accounts", "deposits", "history", "summary"].includes(
          tabFromState,
        )
      ) {
        setActiveTab(tabFromState as any);

        // Clear the state after using it to prevent issues on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state]);

  // Handle Add button click - UPDATED to be passed to Header
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
      case "summary":
        alert("Use edit buttons in the summary table to modify values");
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

  // Format numbers in lakhs with 2 decimals (no currency symbol or "L" label)
  const formatLakhs = (amount: number): string => {
    return (amount / 100000).toFixed(2);
  };

  // Calculate totals for dashboard tab
  const totalSavings = accounts.reduce(
    (sum, account) => sum + account.savingsAmount,
    0,
  );

  // Apply filtering based on settings (same as Android)
  const filteredDeposits = settings.showInactive
    ? deposits
    : deposits.filter((deposit) => deposit.active !== false);

  // FIXED: Handle undefined adjustmentAmount with default value 0
  const totalDeposits = accounts.reduce((total, account) => {
    const accountId = account.id;

    // 1. Base deposits for this account
    const baseDeposits = filteredDeposits
      .filter((deposit) => deposit.accountId === accountId)
      .reduce((sum, deposit) => sum + deposit.amount, 0);

    // 2. Adjustments for this account - FIXED: Use 0 if adjustmentAmount is undefined
    const adjustmentsTotal = adjustments
      .filter((adj) => adj.accountId === accountId)
      .reduce((sum, adj) => sum + (adj.adjustmentAmount || 0), 0);

    // 3. Add them together (Android logic)
    return total + baseDeposits + adjustmentsTotal;
  }, 0);

  // Calculate total bank balance (savings + deposits)
  const totalBankBalance = totalSavings + totalDeposits;

  // Get last 6 months history (sorted by date - newest first)
  const last6Months = [...history]
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 6);

  // EMW Calculation
  const calculateEMW = (
    currentBalance: number,
    targetDate: Date,
    annualInterestRate: number = 5,
  ): number => {
    if (currentBalance <= 0) return 0;

    const today = new Date();
    if (targetDate <= today) return 0;

    // Calculate number of months until target date
    const monthsDiff =
      (targetDate.getFullYear() - today.getFullYear()) * 12 +
      (targetDate.getMonth() - today.getMonth());

    if (monthsDiff <= 0) return currentBalance;

    // Convert annual interest rate to monthly rate
    const monthlyInterestRate = annualInterestRate / 12 / 100;

    // Calculate EMW using the formula: PMT = PV × r / [1 - (1 + r)^-n]
    const numerator = currentBalance * monthlyInterestRate;
    const denominator = 1 - Math.pow(1 + monthlyInterestRate, -monthsDiff);

    if (denominator <= 0) {
      return currentBalance / monthsDiff; // Simple division without interest
    }

    const emw = numerator / denominator;

    // Round to 2 decimal places
    return Math.round(emw * 100) / 100;
  };

  // Get EMW settings from app settings
  const getEmwSettings = () => {
    // Default values
    let interestRate = 5; // 5% default
    let targetDateStr = "2044-10"; // November 2044 default

    if (appSettings) {
      // Use EMW_Interest from settings or default
      interestRate =
        appSettings.EMW_interest !== undefined ? appSettings.EMW_interest : 5;

      // Use EMW_Date from settings or default
      targetDateStr = appSettings.EMW_Date || "2044-10";
    }

    // Parse target date string (format: YYYY-MM)
    let targetDate: Date;
    try {
      const [year, month] = targetDateStr.split("-").map(Number);
      targetDate = new Date(year, month - 1, 1); // month is 0-indexed
    } catch (error) {
      // Fallback to default date if parsing fails
      console.error("Error parsing EMW date:", error);
      targetDate = new Date(2044, 10, 1); // November 2044
      targetDateStr = "2044-10";
    }

    return {
      interestRate,
      targetDate,
      targetDateStr,
    };
  };

  // Get EMW settings
  const emwSettings = getEmwSettings();

  // Calculate EMW using settings values
  const emwAmount = calculateEMW(
    totalBankBalance,
    emwSettings.targetDate,
    emwSettings.interestRate,
  );

  // Calculate actual withdrawal rate from last 6 months history
  const calculateActualWithdrawalRate = () => {
    if (last6Months.length < 2)
      return {
        monthlyRate: 0,
        totalDrop: 0,
        monthsCount: 0,
      };

    // Calculate total balance (savings + deposits) for each month
    const monthlyBalances = last6Months.map((record) => ({
      month: record.month,
      totalBalance: record.savings + record.totalDeposits,
    }));

    // Calculate total drop over the period
    const firstMonth = monthlyBalances[0];
    const lastMonth = monthlyBalances[monthlyBalances.length - 1];
    const totalDrop = firstMonth.totalBalance - lastMonth.totalBalance;

    // Calculate monthly average drop
    const monthsCount = monthlyBalances.length - 1; // Number of intervals
    const monthlyRate = monthsCount > 0 ? totalDrop / monthsCount : 0;

    return {
      monthlyRate,
      totalDrop,
      monthsCount,
    };
  };

  const actualWithdrawalData = calculateActualWithdrawalRate();

  // Calculate last month's withdrawal (difference between current and previous month)
  const calculateLastMonthWithdrawal = () => {
    if (last6Months.length < 2) return 0;

    const currentMonth = last6Months[0]; // Already sorted newest first
    const previousMonth = last6Months[1];

    if (!currentMonth || !previousMonth) return 0;

    const currentBalance = currentMonth.savings + currentMonth.totalDeposits;
    const previousBalance = previousMonth.savings + previousMonth.totalDeposits;

    return previousBalance - currentBalance; // Positive = withdrawal, Negative = deposit
  };

  const lastMonthWithdrawal = calculateLastMonthWithdrawal();

  // Dashboard content component with HistoryTab-style table and Pie Charts
  const DashboardContent = () => (
    <>
      {/* Top 3 Cards in Single Row - Compact */}
      <div className="px-2 py-2">
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {/* Total Savings Card */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs text-gray-500 mb-0.5">Savings</div>
            <div className="text-base font-bold text-gray-900 leading-tight">
              {formatLakhs(totalSavings)}
            </div>
          </div>

          {/* Total Deposits Card */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs text-gray-500 mb-0.5">Deposits</div>
            <div className="text-base font-bold text-gray-900 leading-tight">
              {formatLakhs(totalDeposits)}
            </div>
          </div>

          {/* Total Bank Balance Card */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs text-gray-500 mb-0.5">Total</div>
            <div className="text-base font-bold text-gray-900 leading-tight">
              {formatLakhs(totalBankBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* EMW Section - Single Row - Compact */}
      <div className="px-2 py-2">
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {/* EMW Card */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs font-semibold text-blue-800 mb-1 flex items-center justify-center gap-1">
              <span className="bg-blue-500 text-white px-1 py-0.5 rounded text-xs">
                EMW
              </span>
              <span className="hidden sm:inline">Monthly</span>
              <span className="sm:hidden">Mon</span>
            </div>
            <div className="text-base font-bold text-blue-800 leading-tight">
              {formatLakhs(emwAmount)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {emwSettings.interestRate}%
            </div>
          </div>

          {/* Actual Rate Card */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs font-semibold text-gray-700 mb-1">
              Actual (6m)
            </div>
            <div
              className={`text-base font-bold leading-tight ${
                actualWithdrawalData.monthlyRate >= emwAmount
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {formatLakhs(actualWithdrawalData.monthlyRate)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">avg/month</div>
          </div>

          {/* Last Month Card */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs font-semibold text-gray-700 mb-1">
              Last Month
            </div>
            <div
              className={`text-base font-bold leading-tight ${
                lastMonthWithdrawal >= 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {lastMonthWithdrawal >= 0 ? "-" : "+"}
              {formatLakhs(Math.abs(lastMonthWithdrawal))}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {lastMonthWithdrawal >= 0 ? "withdraw" : "deposit"}
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

          {last6Months.length === 0 ? (
            <div className="text-center py-2 text-gray-500 text-xs">
              No history data available
            </div>
          ) : (
            <div>
              {/* Table Header - Compact */}
              <div className="flex items-center py-1 px-0 bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-700">
                <div className="flex-1 px-0.5 min-w-[45px]">Month</div>
                <div className="flex-1 px-0.5 text-right min-w-[40px]">Sav</div>
                <div className="flex-1 px-0.5 text-right min-w-[40px]">Dep</div>
                <div className="flex-1 px-0.5 text-right min-w-[40px]">
                  Total
                </div>
              </div>

              {/* Table Rows - Compact */}
              {last6Months.map((record) => {
                // Use formatLakhs function to convert rupees to lakhs with 2 decimals
                const savingsDisplay = formatLakhs(record.savings);
                const depositsDisplay = formatLakhs(record.totalDeposits);
                const totalDisplay = formatLakhs(
                  record.savings + record.totalDeposits,
                );

                // Format month to "MMM YY" format
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
                    {/* Month */}
                    <div className="flex-1 px-0.5 text-xs text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap min-w-[45px]">
                      {monthName}
                    </div>

                    {/* Savings */}
                    <div className="flex-1 px-0.5 text-xs font-semibold text-green-600 text-right min-w-[40px]">
                      {savingsDisplay}
                    </div>

                    {/* Deposits */}
                    <div className="flex-1 px-0.5 text-xs font-semibold text-orange-500 text-right min-w-[40px]">
                      {depositsDisplay}
                    </div>

                    {/* Total */}
                    <div className="flex-1 px-0.5 text-xs font-semibold text-blue-600 text-right min-w-[40px]">
                      {totalDisplay}
                    </div>
                  </div>
                );
              })}

              {/* Show count of records - Compact */}
              <div className="text-xs text-gray-400 text-center py-1 border-t border-gray-100 bg-gray-50">
                {Math.min(last6Months.length, 6)} of {history.length} records
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pie Charts Section - Below Recent History Table */}
      <div className="flex flex-col gap-2 px-2 pb-2">
        {/* Top: Savings Pie Chart */}
        <SavingsPieChart accounts={accounts} />

        {/* Bottom: Deposit Pie Chart */}
        <DepositPieChart
          accounts={accounts}
          deposits={deposits}
          adjustments={adjustments}
          showInactive={settings.showInactive}
        />
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-3 text-sm text-gray-500">Loading banking data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header with Add button */}
      <Header
        showAddButton={shouldShowAddButton()}
        onAddClick={handleAddClick}
        addButtonTitle={getAddButtonTitle()}
      />

      {/* Tabs Navigation - Mobile First */}
      <div className="w-full bg-white border-b border-gray-200 sticky top-14 z-10">
        <div className="flex overflow-x-auto px-1 py-0 gap-0.5">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 min-w-0 px-0.5 py-2 border-none text-xs font-medium cursor-pointer whitespace-nowrap flex items-center justify-center gap-0.5 transition-all duration-200 ${
              activeTab === "dashboard"
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                : "bg-transparent text-gray-500 border-b-2 border-transparent"
            }`}
            title="Dashboard"
          >
            <span className="text-xs">📊</span>
            <span className="hidden xs:inline">Dash</span>
          </button>

          <button
            onClick={() => setActiveTab("accounts")}
            className={`flex-1 min-w-0 px-0.5 py-2 border-none text-xs font-medium cursor-pointer whitespace-nowrap flex items-center justify-center gap-0.5 transition-all duration-200 ${
              activeTab === "accounts"
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                : "bg-transparent text-gray-500 border-b-2 border-transparent"
            }`}
            title="Accounts"
          >
            <span className="text-xs">👥</span>
            <span className="hidden xs:inline">Acct</span>
          </button>

          <button
            onClick={() => setActiveTab("deposits")}
            className={`flex-1 min-w-0 px-0.5 py-2 border-none text-xs font-medium cursor-pointer whitespace-nowrap flex items-center justify-center gap-0.5 transition-all duration-200 ${
              activeTab === "deposits"
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                : "bg-transparent text-gray-500 border-b-2 border-transparent"
            }`}
            title="Deposits"
          >
            <span className="text-xs">💰</span>
            <span className="hidden xs:inline">Depo</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 min-w-0 px-0.5 py-2 border-none text-xs font-medium cursor-pointer whitespace-nowrap flex items-center justify-center gap-0.5 transition-all duration-200 ${
              activeTab === "history"
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                : "bg-transparent text-gray-500 border-b-2 border-transparent"
            }`}
            title="History"
          >
            <span className="text-xs">📅</span>
            <span className="hidden xs:inline">Hist</span>
          </button>

          <button
            onClick={() => setActiveTab("summary")}
            className={`flex-1 min-w-0 px-0.5 py-2 border-none text-xs font-medium cursor-pointer whitespace-nowrap flex items-center justify-center gap-0.5 transition-all duration-200 ${
              activeTab === "summary"
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                : "bg-transparent text-gray-500 border-b-2 border-transparent"
            }`}
            title="Summary"
          >
            <span className="text-xs">📈</span>
            <span className="hidden xs:inline">Summ</span>
          </button>
        </div>
      </div>

      {/* Tab Content - Mobile First */}
      <div
        className={`flex-1 w-full mx-auto overflow-y-auto ${
          activeTab === "dashboard" ||
          activeTab === "history" ||
          activeTab === "summary"
            ? "px-0" // No horizontal padding
            : "p-2" // Small padding for other tabs
        }`}
      >
        {activeTab === "dashboard" && <DashboardContent />}
        {activeTab === "accounts" && <AccountsTab />}
        {activeTab === "deposits" && <DepositsTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "summary" && <SummaryTab />}
      </div>
    </div>
  );
};

export default BankingHomePage;
