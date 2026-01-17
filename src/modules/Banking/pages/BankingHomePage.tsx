// src/modules/BankingHomePage/index.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useBankingData } from "../hooks/useBankingData";
import { bankingStyles } from "../styles/BankingStyles"; // CHANGED: Use same styles as AccountsPage

const BankingHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { loading, accounts, deposits, history, adjustments, settings } =
    useBankingData();

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

  // Calculate for comparison - FIXED: Use 0 if adjustmentAmount is undefined
  const totalBaseDeposits = filteredDeposits.reduce(
    (sum, deposit) => sum + deposit.amount,
    0
  );

  const totalAdjustments = adjustments.reduce(
    (sum, adj) => sum + (adj.adjustmentAmount || 0),
    0
  );

  const hasAdjustments = adjustments.length > 0;

  // Get last 6 months history (sorted by date)
  const last6Months = [...history]
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 6)
    .reverse(); // Reverse to get chronological order (oldest to newest)

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

  // Calculate total bank balance (savings + deposits)
  const totalBankBalance = totalSavings + totalDeposits;

  // Hardcoded target date: November 2044
  const targetDate = new Date(2044, 10, 1); // November 2044 (month is 0-indexed)

  // Calculate EMW
  const emwAmount = calculateEMW(totalBankBalance, targetDate, 5);

  // Format target date for display
  const formattedTargetDate = targetDate.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
  });

  // Calculate actual withdrawal rate from last 6 months history
  const calculateActualWithdrawalRate = () => {
    if (last6Months.length < 2)
      return {
        monthlyRate: 0,
        totalDrop: 0,
        monthsCount: 0,
        firstMonth: 0,
        lastMonth: 0,
      };

    // Calculate total balance (savings + deposits) for each month
    const monthlyBalances = last6Months.map((record) => ({
      month: record.month,
      totalBalance: record.savings + record.totalDeposits,
      savings: record.savings,
      deposits: record.totalDeposits,
    }));

    // Sort by date (oldest first)
    monthlyBalances.sort((a, b) => a.month.localeCompare(b.month));

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
      firstMonth: firstMonth.totalBalance,
      lastMonth: lastMonth.totalBalance,
    };
  };

  const actualWithdrawalData = calculateActualWithdrawalRate();

  // Calculate last month's withdrawal (difference between current and previous month)
  const calculateLastMonthWithdrawal = () => {
    if (last6Months.length < 2) return 0;

    // Sort by date (newest first)
    const sortedHistory = [...last6Months].sort((a, b) =>
      b.month.localeCompare(a.month)
    );

    const currentMonth = sortedHistory[0];
    const previousMonth = sortedHistory[1];

    if (!currentMonth || !previousMonth) return 0;

    const currentBalance = currentMonth.savings + currentMonth.totalDeposits;
    const previousBalance = previousMonth.savings + previousMonth.totalDeposits;

    return previousBalance - currentBalance; // Positive = withdrawal, Negative = deposit
  };

  const lastMonthWithdrawal = calculateLastMonthWithdrawal();

  // // Get month names for display
  // const getMonthName = (monthString: string) => {
  //   try {
  //     const date = new Date(monthString + "-01");
  //     return date.toLocaleDateString("en-IN", {
  //       month: "short",
  //       year: "2-digit",
  //     });
  //   } catch (e) {
  //     return monthString;
  //   }
  // };

  if (loading) {
    return (
      <div style={bankingStyles.container}>
        <div style={bankingStyles.loading}>
          <div style={bankingStyles.spinner}></div>
          <p>Loading banking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={bankingStyles.container}>
      {/* Header */}
      <div style={bankingStyles.header}>
        <h1 style={bankingStyles.headerTitle}>🏦 Banking</h1>
        <div style={bankingStyles.headerSubtitle}>
          Manage your accounts and deposits
        </div>
      </div>

      {/* Top Navigation */}
      <div style={bankingStyles.topNav}>
        <button
          onClick={() => navigate("/")}
          style={bankingStyles.navButton}
          title="Back to Home"
        >
          🏠
        </button>
        <div style={bankingStyles.navTitle}>Banking Dashboard</div>
        <button
          onClick={() => navigate("/settings")}
          style={bankingStyles.navButton}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* ALL CONTENT INSIDE THIS DIV - This ensures centering */}
      <div style={{ width: "100%" }}>
        {/* Stats Cards */}
        <div style={{ padding: "15px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* Total Savings Card */}
            <div style={bankingStyles.statsCard}>
              <div style={bankingStyles.statsLabel}>Total Savings</div>
              <div style={bankingStyles.statsValue}>
                {formatCurrency(totalSavings)}
              </div>
              <div style={{ fontSize: "12px", color: "#34a853" }}>
                From {accounts.length} account{accounts.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Total Deposits Card */}
            <div style={bankingStyles.statsCard}>
              <div style={bankingStyles.statsLabel}>Total Deposits</div>
              <div style={bankingStyles.statsValue}>
                {formatCurrency(totalDeposits)}
              </div>
              <div style={{ fontSize: "12px", color: "#4285f4" }}>
                {filteredDeposits.length} deposit
                {filteredDeposits.length !== 1 ? "s" : ""}
                {hasAdjustments && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#666",
                      marginLeft: "4px",
                      fontStyle: "italic",
                    }}
                  >
                    (with adjustments)
                  </span>
                )}
              </div>

              {/* Show adjustment breakdown */}
              {hasAdjustments && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "8px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    border: "1px solid #e9ecef",
                  }}
                >
                  <div style={{ marginBottom: "3px", fontWeight: "500" }}>
                    Breakdown:
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      marginBottom: "2px",
                    }}
                  >
                    <span>Principal (base deposits):</span>
                    <span>{formatCurrency(totalBaseDeposits)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      marginBottom: "2px",
                    }}
                  >
                    <span>Adjustments (interest):</span>
                    <span>
                      {totalAdjustments >= 0 ? "+" : ""}
                      {formatCurrency(totalAdjustments)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      fontWeight: "600",
                      marginTop: "4px",
                      paddingTop: "4px",
                      borderTop: "1px solid #dee2e6",
                    }}
                  >
                    <span>Total:</span>
                    <span>{formatCurrency(totalDeposits)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Total Bank Balance Card */}
            <div
              style={{
                ...bankingStyles.statsCard,
                backgroundColor: "#1e40af",
                border: "none",
                color: "white",
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  opacity: 0.9,
                  marginBottom: "4px",
                }}
              >
                Total Bank Balance
              </div>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  marginBottom: "8px",
                }}
              >
                {formatCurrency(totalBankBalance)}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  opacity: 0.8,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Savings: {formatCurrency(totalSavings)}</span>
                <span>Deposits: {formatCurrency(totalDeposits)}</span>
              </div>
            </div>

            {/* EMW Calculation Card */}
            <div style={bankingStyles.statsCard}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
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
                  Monthly Withdrawal
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    backgroundColor: "#dbeafe",
                    color: "#1e40af",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontWeight: "600",
                  }}
                >
                  5% interest
                </div>
              </div>

              {/* EMW Calculation */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#f0f9ff",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #e0f2fe",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                      marginBottom: "4px",
                    }}
                  >
                    Calculated EMW
                  </div>
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "700",
                      color: "#1e40af",
                      marginBottom: "2px",
                    }}
                  >
                    {formatCurrency(emwAmount)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                    }}
                  >
                    per month
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #dcfce7",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                      marginBottom: "4px",
                    }}
                  >
                    Actual Rate (6m)
                  </div>
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "700",
                      color:
                        actualWithdrawalData.monthlyRate >= emwAmount
                          ? "#dc2626"
                          : "#059669",
                      marginBottom: "2px",
                    }}
                  >
                    {formatCurrency(actualWithdrawalData.monthlyRate)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                    }}
                  >
                    avg/month
                  </div>
                </div>
              </div>

              {/* Last Month Withdrawal */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                      marginBottom: "2px",
                    }}
                  >
                    Last Month
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: lastMonthWithdrawal >= 0 ? "#dc2626" : "#059669",
                    }}
                  >
                    {lastMonthWithdrawal >= 0 ? "Withdrawal: " : "Deposit: "}
                    {formatCurrency(Math.abs(lastMonthWithdrawal))}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor:
                      lastMonthWithdrawal >= 0 ? "#fee2e2" : "#d1fae5",
                    color: lastMonthWithdrawal >= 0 ? "#dc2626" : "#059669",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                  }}
                >
                  {lastMonthWithdrawal >= 0 ? "🔼" : "🔽"}
                </div>
              </div>

              {/* EMW Info */}
              <div
                style={{
                  backgroundColor: "#eff6ff",
                  padding: "8px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  border: "1px solid #dbeafe",
                }}
              >
                <div
                  style={{
                    fontWeight: "600",
                    marginBottom: "4px",
                    color: "#1e40af",
                  }}
                >
                  {actualWithdrawalData.monthlyRate >= emwAmount
                    ? `⚠️ Faster than needed for ${formattedTargetDate}`
                    : `✓ Sustainable until ${formattedTargetDate}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent History */}
        <div style={{ padding: "0 15px 15px 15px" }}>
          <div style={bankingStyles.card}>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#333",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>📅</span>
              <span>Recent History (Last 6 Months)</span>
            </div>

            {last6Months.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "16px",
                  color: "#6c757d",
                  fontSize: "13px",
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
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom:
                          index < last6Months.length - 1
                            ? "1px solid #eee"
                            : "none",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: "500",
                            fontSize: "0.95rem",
                            color: "#333",
                          }}
                        >
                          {monthName}
                        </div>
                        {monthlyChange !== 0 && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: monthlyChange > 0 ? "#dc2626" : "#059669",
                              marginTop: "2px",
                            }}
                          >
                            {monthlyChange > 0 ? "▼" : "▲"}{" "}
                            {formatCurrency(Math.abs(monthlyChange))}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "1rem",
                            fontWeight: "600",
                            color: "#333",
                          }}
                        >
                          {formatCurrency(totalBalance)}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#6c757d",
                            display: "flex",
                            gap: "8px",
                            marginTop: "2px",
                          }}
                        >
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

        {/* Navigation Icons */}
        <div style={{ padding: "0 15px 15px 15px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
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
                border: "1px solid #4285f4",
                borderRadius: "12px",
                padding: "15px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(66, 133, 244, 0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>🏦</div>
              <div
                style={{
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  color: "#333",
                  marginBottom: "4px",
                }}
              >
                Accounts
              </div>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>
                {accounts.length} account{accounts.length !== 1 ? "s" : ""}
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
                border: "1px solid #34a853",
                borderRadius: "12px",
                padding: "15px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(52, 168, 83, 0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>💰</div>
              <div
                style={{
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  color: "#333",
                  marginBottom: "4px",
                }}
              >
                Deposits
              </div>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>
                {deposits.length} deposit{deposits.length !== 1 ? "s" : ""}
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
                border: "1px solid #fbbc04",
                borderRadius: "12px",
                padding: "15px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(251, 188, 4, 0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>📈</div>
              <div
                style={{
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  color: "#333",
                  marginBottom: "4px",
                }}
              >
                History
              </div>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>
                {history.length} record{history.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* History Chart */}
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate("/banking/summary");
              }}
              style={{
                backgroundColor: "#f3e5f5",
                border: "1px solid #9c27b0",
                borderRadius: "12px",
                padding: "15px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(156, 39, 176, 0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>📊</div>
              <div
                style={{
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  color: "#333",
                  marginBottom: "4px",
                }}
              >
                Summary
              </div>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>
                View reports
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
