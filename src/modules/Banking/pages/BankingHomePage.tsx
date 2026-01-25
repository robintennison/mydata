import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBankingData } from "../hooks/useBankingData";
import { useSettings } from "../../../contexts/SettingsContext";
import { bankingHomeStyles } from "../styles/BankingHomePage.styles";

// Import the tab components
import AccountsTab from "./AccountsTab";
import DepositsTab from "./DepositsTab";
import HistoryTab from "./HistoryTab";
import SummaryTab from "./SummaryTab";

const BankingHomePage: React.FC = () => {
  const navigate = useNavigate();
  // const location = useLocation();

  const { loading, accounts, deposits, history, adjustments, settings } =
    useBankingData();
  const { settings: appSettings } = useSettings();

  // State for active tab
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "accounts" | "deposits" | "history" | "summary"
  >("dashboard");

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

  // Dashboard content component
  const DashboardContent = () => (
    <>
      {/* Top 3 Cards in Single Row */}
      <div style={bankingHomeStyles.sectionPadding}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          {/* Total Savings Card */}
          <div style={bankingHomeStyles.statsCard}>
            <div style={bankingHomeStyles.statsLabel}>Savings</div>
            <div
              style={{
                ...bankingHomeStyles.statsValue,
                fontSize: "0.95rem",
              }}
            >
              {formatLakhs(totalSavings)}
            </div>
          </div>

          {/* Total Deposits Card */}
          <div style={bankingHomeStyles.statsCard}>
            <div style={bankingHomeStyles.statsLabel}>Deposits</div>
            <div
              style={{
                ...bankingHomeStyles.statsValue,
                fontSize: "0.95rem",
              }}
            >
              {formatLakhs(totalDeposits)}
            </div>
          </div>

          {/* Total Bank Balance Card */}
          <div style={bankingHomeStyles.statsCard}>
            <div style={bankingHomeStyles.statsLabel}>Total</div>
            <div
              style={{
                ...bankingHomeStyles.statsValue,
                fontSize: "0.95rem",
              }}
            >
              {formatLakhs(totalBankBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* EMW Section - Single Row */}
      <div style={bankingHomeStyles.sectionPadding}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          {/* EMW Card */}
          <div style={bankingHomeStyles.statsCard}>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#1e40af",
                marginBottom: "5px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span
                style={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "0.7rem",
                }}
              >
                EMW
              </span>
              <span>Monthly</span>
            </div>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#1e40af",
              }}
            >
              {formatLakhs(emwAmount)}
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "#6b7280",
                marginTop: "2px",
              }}
            >
              {emwSettings.interestRate}% interest
            </div>
          </div>

          {/* Actual Rate Card */}
          <div style={bankingHomeStyles.statsCard}>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#64748b",
                marginBottom: "5px",
              }}
            >
              Actual (6m)
            </div>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color:
                  actualWithdrawalData.monthlyRate >= emwAmount
                    ? "#dc2626"
                    : "#059669",
              }}
            >
              {formatLakhs(actualWithdrawalData.monthlyRate)}
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "#6b7280",
                marginTop: "2px",
              }}
            >
              avg/month
            </div>
          </div>

          {/* Last Month Card */}
          <div style={bankingHomeStyles.statsCard}>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#64748b",
                marginBottom: "5px",
              }}
            >
              Last Month
            </div>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: lastMonthWithdrawal >= 0 ? "#dc2626" : "#059669",
              }}
            >
              {lastMonthWithdrawal >= 0 ? "-" : "+"}
              {formatLakhs(Math.abs(lastMonthWithdrawal))}
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "#6b7280",
                marginTop: "2px",
              }}
            >
              {lastMonthWithdrawal >= 0 ? "withdrawal" : "deposit"}
            </div>
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div
        style={{
          padding: "0 0 15px 0",
        }}
      >
        <div style={bankingHomeStyles.card}>
          <div style={bankingHomeStyles.cardTitle}>
            <span>📅</span>
            <span>Recent History</span>
          </div>

          {last6Months.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "12px",
                color: "#6c757d",
                fontSize: "12px",
              }}
            >
              No history data available
            </div>
          ) : (
            <div>
              {last6Months.map((record, index) => {
                const date = new Date(record.month + "-01");
                const monthName = date.toLocaleDateString("en-IN", {
                  month: "short",
                  year: "2-digit",
                });

                const totalBalance = record.savings + record.totalDeposits;
                const prevRecord = index > 0 ? last6Months[index - 1] : null;
                const prevBalance = prevRecord
                  ? prevRecord.savings + prevRecord.totalDeposits
                  : 0;
                const monthlyChange = prevRecord
                  ? prevBalance - totalBalance
                  : 0;

                return (
                  <div
                    key={record.month}
                    style={{
                      ...bankingHomeStyles.historyItem,
                      borderBottom:
                        index < last6Months.length - 1
                          ? "1px solid #eee"
                          : "none",
                    }}
                  >
                    <div>
                      <div style={bankingHomeStyles.historyMonth}>
                        {monthName}
                      </div>
                      {monthlyChange !== 0 && (
                        <div
                          style={{
                            ...bankingHomeStyles.monthlyChange,
                            color: monthlyChange > 0 ? "#dc2626" : "#059669",
                          }}
                        >
                          {monthlyChange > 0 ? "▼" : "▲"}{" "}
                          {formatLakhs(Math.abs(monthlyChange))}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={bankingHomeStyles.historyBalance}>
                        {formatLakhs(totalBalance)}
                      </div>
                      <div style={bankingHomeStyles.historyDetails}>
                        <span>S: {formatLakhs(record.savings)}</span>
                        <span>D: {formatLakhs(record.totalDeposits)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div style={bankingHomeStyles.centeredContainer}>
        <div style={bankingHomeStyles.loading}>
          <div style={bankingHomeStyles.spinner}></div>
          <p>Loading banking data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Tabs Navigation - FIXED: Use inline styles like JewelleryHome */}
      <div
        style={{
          width: "100%",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            padding: "0 4px",
            gap: "1px",
          }}
        >
          <button
            onClick={() => setActiveTab("dashboard")}
            style={{
              flex: "1 1 0",
              minWidth: "0",
              padding: "10px 4px",
              backgroundColor:
                activeTab === "dashboard" ? "#f0f9ff" : "transparent",
              border: "none",
              borderBottom:
                activeTab === "dashboard"
                  ? "3px solid #3b82f6"
                  : "3px solid transparent",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: activeTab === "dashboard" ? "#3b82f6" : "#6b7280",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              transition: "all 0.2s ease",
            }}
            title="Dashboard"
          >
            📊 Dash
          </button>

          <button
            onClick={() => setActiveTab("accounts")}
            style={{
              flex: "1 1 0",
              minWidth: "0",
              padding: "10px 4px",
              backgroundColor:
                activeTab === "accounts" ? "#f0f9ff" : "transparent",
              border: "none",
              borderBottom:
                activeTab === "accounts"
                  ? "3px solid #3b82f6"
                  : "3px solid transparent",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: activeTab === "accounts" ? "#3b82f6" : "#6b7280",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              transition: "all 0.2s ease",
            }}
            title="Accounts"
          >
            👥 Acct
          </button>

          <button
            onClick={() => setActiveTab("deposits")}
            style={{
              flex: "1 1 0",
              minWidth: "0",
              padding: "10px 4px",
              backgroundColor:
                activeTab === "deposits" ? "#f0f9ff" : "transparent",
              border: "none",
              borderBottom:
                activeTab === "deposits"
                  ? "3px solid #3b82f6"
                  : "3px solid transparent",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: activeTab === "deposits" ? "#3b82f6" : "#6b7280",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              transition: "all 0.2s ease",
            }}
            title="Deposits"
          >
            💰 Depo
          </button>

          <button
            onClick={() => setActiveTab("history")}
            style={{
              flex: "1 1 0",
              minWidth: "0",
              padding: "10px 4px",
              backgroundColor:
                activeTab === "history" ? "#f0f9ff" : "transparent",
              border: "none",
              borderBottom:
                activeTab === "history"
                  ? "3px solid #3b82f6"
                  : "3px solid transparent",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: activeTab === "history" ? "#3b82f6" : "#6b7280",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              transition: "all 0.2s ease",
            }}
            title="History"
          >
            📅 Hist
          </button>

          <button
            onClick={() => setActiveTab("summary")}
            style={{
              flex: "1 1 0",
              minWidth: "0",
              padding: "10px 4px",
              backgroundColor:
                activeTab === "summary" ? "#f0f9ff" : "transparent",
              border: "none",
              borderBottom:
                activeTab === "summary"
                  ? "3px solid #3b82f6"
                  : "3px solid transparent",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: activeTab === "summary" ? "#3b82f6" : "#6b7280",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              transition: "all 0.2s ease",
            }}
            title="Summary"
          >
            📈 Summ
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "800px",
          padding:
            activeTab === "history" ||
            activeTab === "summary" ||
            activeTab === "dashboard"
              ? "16px 0"
              : "16px",
          overflowY: "auto",
        }}
      >
        {activeTab === "dashboard" && <DashboardContent />}
        {activeTab === "accounts" && <AccountsTab />}
        {activeTab === "deposits" && <DepositsTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "summary" && <SummaryTab />}
      </div>

      {/* Add button */}
      {shouldShowAddButton() && (
        <button
          onClick={handleAddClick}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            backgroundColor: "#10b981",
            color: "#ffffff",
            border: "none",
            borderRadius: "50%",
            padding: "16px",
            fontSize: "20px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            transition: "background-color 0.2s, transform 0.2s",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 100,
          }}
          title={getAddButtonTitle()}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#059669")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#10b981")
          }
        >
          ➕
        </button>
      )}
    </>
  );
};

export default BankingHomePage;
