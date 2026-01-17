// src/modules/BankingHomePage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useBankingData } from "../hooks/useBankingData";
import { useSettings } from "../../../contexts/SettingsContext";
import { bankingHomeStyles } from "../styles/BankingHomePage.styles";

const BankingHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { loading, accounts, deposits, history, adjustments, settings } =
    useBankingData();
  const { settings: appSettings } = useSettings();

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
  const totalSavings = accounts.reduce(
    (sum, account) => sum + account.savingsAmount,
    0
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
    annualInterestRate: number = 5
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
    emwSettings.interestRate
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
    <div style={bankingHomeStyles.centeredContainer}>
      {/* Header - Removed subtitle */}
      <div style={bankingHomeStyles.header}>
        <h1 style={bankingHomeStyles.headerTitle}>
          <span>🏦</span>
          <span>Banking</span>
        </h1>
      </div>

      {/* Top Navigation */}
      <div style={bankingHomeStyles.topNav}>
        <button
          onClick={() => navigate("/")}
          style={bankingHomeStyles.navButton}
          title="Back to Home"
        >
          🏠
        </button>
        <div style={bankingHomeStyles.navTitle}>Banking Dashboard</div>
        <button
          onClick={() => navigate("/settings")}
          style={bankingHomeStyles.navButton}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* ALL CONTENT INSIDE THIS DIV - This ensures centering */}
      <div style={bankingHomeStyles.contentWrapper}>
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
              <div style={bankingHomeStyles.statsValue}>
                {formatCurrency(totalSavings)}
              </div>
            </div>

            {/* Total Deposits Card */}
            <div style={bankingHomeStyles.statsCard}>
              <div style={bankingHomeStyles.statsLabel}>Deposits</div>
              <div style={bankingHomeStyles.statsValue}>
                {formatCurrency(totalDeposits)}
              </div>
            </div>

            {/* Total Bank Balance Card */}
            <div
              style={{
                ...bankingHomeStyles.statsCard,
                backgroundColor: "#1e40af",
                color: "white",
                border: "none",
              }}
            >
              <div style={bankingHomeStyles.statsLabel}>Total Balance</div>
              <div style={bankingHomeStyles.statsValue}>
                {formatCurrency(totalBankBalance)}
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
                {formatCurrency(emwAmount)}
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
                {formatCurrency(actualWithdrawalData.monthlyRate)}
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
                {formatCurrency(Math.abs(lastMonthWithdrawal))}
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

        {/* Recent History - Sorted newest first */}
        <div
          style={{
            padding: "0 15px 15px 15px",
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
                            {formatCurrency(Math.abs(monthlyChange))}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={bankingHomeStyles.historyBalance}>
                          {formatCurrency(totalBalance)}
                        </div>
                        <div style={bankingHomeStyles.historyDetails}>
                          <span>S: {formatCurrency(record.savings)}</span>
                          <span>D: {formatCurrency(record.totalDeposits)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Icons - 4 in Single Row */}
        <div
          style={{
            padding: "0 15px 15px 15px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
            }}
          >
            {/* Accounts */}
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate("/banking/accounts");
              }}
              style={{
                backgroundColor: "#e8f0fe",
                borderRadius: "10px",
                padding: "12px 8px",
                border: "1px solid #4285f4",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "center",
                minHeight: "70px",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 8px rgba(66, 133, 244, 0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>🏦</div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Accounts
              </div>
            </div>

            {/* Deposits */}
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate("/banking/deposits");
              }}
              style={{
                backgroundColor: "#e8f5e9",
                borderRadius: "10px",
                padding: "12px 8px",
                border: "1px solid #34a853",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "center",
                minHeight: "70px",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 8px rgba(52, 168, 83, 0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>💰</div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Deposits
              </div>
            </div>

            {/* History */}
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate("/banking/history");
              }}
              style={{
                backgroundColor: "#fff8e1",
                borderRadius: "10px",
                padding: "12px 8px",
                border: "1px solid #fbbc04",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "center",
                minHeight: "70px",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 8px rgba(251, 188, 4, 0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>📈</div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                History
              </div>
            </div>

            {/* Summary */}
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate("/banking/summary");
              }}
              style={{
                backgroundColor: "#f3e5f5",
                borderRadius: "10px",
                padding: "12px 8px",
                border: "1px solid #9c27b0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "center",
                minHeight: "70px",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 8px rgba(156, 39, 176, 0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>📊</div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Summary
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacing */}
        <div style={{ height: "20px" }}></div>
      </div>
    </div>
  );
};

export default BankingHomePage;
