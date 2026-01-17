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

  // Format target date for display
  const formattedTargetDate = emwSettings.targetDate.toLocaleDateString(
    "en-IN",
    {
      year: "numeric",
      month: "long",
    }
  );

  // Format interest rate for display
  const formattedInterestRate = `${emwSettings.interestRate}%`;

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

  // Get month names for display
  const getMonthName = (monthString: string) => {
    try {
      const date = new Date(monthString + "-01");
      return date.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });
    } catch (e) {
      return monthString;
    }
  };

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
      {/* Header */}
      <div style={bankingHomeStyles.header}>
        <h1 style={bankingHomeStyles.headerTitle}>
          <span>🏦</span>
          <span>Banking</span>
        </h1>
        <div style={bankingHomeStyles.headerSubtitle}>
          Manage your accounts and deposits
        </div>
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
        {/* Stats Cards */}
        <div style={bankingHomeStyles.sectionPadding}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* Total Savings Card */}
            <div style={bankingHomeStyles.statsCard}>
              <div style={bankingHomeStyles.statsLabel}>Total Savings</div>
              <div style={bankingHomeStyles.statsValue}>
                {formatCurrency(totalSavings)}
              </div>
              <div style={{ fontSize: "12px", color: "#34a853" }}>
                From {accounts.length} account{accounts.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Total Deposits Card */}
            <div style={bankingHomeStyles.statsCard}>
              <div style={bankingHomeStyles.statsLabel}>Total Deposits</div>
              <div style={bankingHomeStyles.statsValue}>
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
                <div style={bankingHomeStyles.adjustmentBreakdown}>
                  <div style={{ marginBottom: "3px", fontWeight: "500" }}>
                    Breakdown:
                  </div>
                  <div style={bankingHomeStyles.breakdownItem}>
                    <span>Principal (base deposits):</span>
                    <span>{formatCurrency(totalBaseDeposits)}</span>
                  </div>
                  <div style={bankingHomeStyles.breakdownItem}>
                    <span>Adjustments (interest):</span>
                    <span>
                      {totalAdjustments >= 0 ? "+" : ""}
                      {formatCurrency(totalAdjustments)}
                    </span>
                  </div>
                  <div style={bankingHomeStyles.breakdownTotal}>
                    <span>Total:</span>
                    <span>{formatCurrency(totalDeposits)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Total Bank Balance Card */}
            <div
              style={{
                ...bankingHomeStyles.statsCard,
                ...bankingHomeStyles.totalBalanceCard,
              }}
            >
              <div style={bankingHomeStyles.totalBalanceLabel}>
                Total Bank Balance
              </div>
              <div style={bankingHomeStyles.totalBalanceValue}>
                {formatCurrency(totalBankBalance)}
              </div>
              <div style={bankingHomeStyles.totalBalanceSubtext}>
                <span>Savings: {formatCurrency(totalSavings)}</span>
                <span style={{ margin: "0 6px" }}>•</span>
                <span>Deposits: {formatCurrency(totalDeposits)}</span>
              </div>
            </div>

            {/* EMW Calculation Card */}
            <div
              style={{
                ...bankingHomeStyles.statsCard,
                ...bankingHomeStyles.emwCard,
              }}
            >
              {/* Decorative corner */}
              <div style={bankingHomeStyles.emwDecorativeCorner}></div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <div style={bankingHomeStyles.emwTitle}>
                    <span style={bankingHomeStyles.emwBadge}>EMW</span>
                    Monthly Withdrawal
                  </div>
                  <div style={bankingHomeStyles.interestBadge}>
                    {formattedInterestRate} interest
                  </div>
                </div>

                {/* EMW Calculation */}
                <div style={bankingHomeStyles.emwGrid}>
                  <div style={bankingHomeStyles.emwBox}>
                    <div style={bankingHomeStyles.emwBoxLabel}>
                      Calculated EMW
                    </div>
                    <div
                      style={{
                        ...bankingHomeStyles.emwBoxValue,
                        color: "#1e40af",
                      }}
                    >
                      {formatCurrency(emwAmount)}
                    </div>
                    <div style={bankingHomeStyles.emwBoxSubtext}>per month</div>
                  </div>

                  <div style={bankingHomeStyles.emwBox}>
                    <div style={bankingHomeStyles.emwBoxLabel}>
                      Actual Rate (6m)
                    </div>
                    <div
                      style={{
                        ...bankingHomeStyles.emwBoxValue,
                        color:
                          actualWithdrawalData.monthlyRate >= emwAmount
                            ? "#dc2626"
                            : "#059669",
                      }}
                    >
                      {formatCurrency(actualWithdrawalData.monthlyRate)}
                    </div>
                    <div style={bankingHomeStyles.emwBoxSubtext}>avg/month</div>
                  </div>
                </div>

                {/* Last Month Withdrawal */}
                <div style={bankingHomeStyles.lastMonthBox}>
                  <div>
                    <div style={bankingHomeStyles.lastMonthLabel}>
                      Last Month
                    </div>
                    <div
                      style={{
                        ...bankingHomeStyles.lastMonthValue,
                        color: lastMonthWithdrawal >= 0 ? "#dc2626" : "#059669",
                      }}
                    >
                      {lastMonthWithdrawal >= 0 ? "Withdrawal: " : "Deposit: "}
                      {formatCurrency(Math.abs(lastMonthWithdrawal))}
                    </div>
                  </div>
                  <div
                    style={{
                      ...bankingHomeStyles.trendBadge,
                      backgroundColor:
                        lastMonthWithdrawal >= 0 ? "#fee2e2" : "#d1fae5",
                      color: lastMonthWithdrawal >= 0 ? "#dc2626" : "#059669",
                    }}
                  >
                    {lastMonthWithdrawal >= 0 ? "🔼" : "🔽"}
                  </div>
                </div>

                {/* Actual Withdrawal Details */}
                {actualWithdrawalData.monthsCount > 0 && (
                  <div style={bankingHomeStyles.infoBox}>
                    <div style={bankingHomeStyles.infoBoxTitle}>
                      <span style={{ color: "#3b82f6" }}>📊</span>
                      <span>
                        Last {actualWithdrawalData.monthsCount + 1} months
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "3px",
                      }}
                    >
                      <span>{getMonthName(last6Months[0]?.month || "")}:</span>
                      <span style={{ fontWeight: "500" }}>
                        {formatCurrency(actualWithdrawalData.firstMonth)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "2px",
                      }}
                    >
                      <span>
                        {getMonthName(
                          last6Months[last6Months.length - 1]?.month || ""
                        )}
                        :
                      </span>
                      <span style={{ fontWeight: "500" }}>
                        {formatCurrency(actualWithdrawalData.lastMonth)}
                      </span>
                    </div>
                  </div>
                )}

                {/* EMW Info */}
                <div style={bankingHomeStyles.infoBox}>
                  <div style={bankingHomeStyles.infoBoxTitle}>
                    <span style={{ color: "#3b82f6" }}>💡</span>
                    <span>Analysis</span>
                  </div>
                  <div>
                    {actualWithdrawalData.monthlyRate >= emwAmount ? (
                      <span
                        style={{
                          color: "#dc2626",
                          fontWeight: "500",
                          fontSize: "11px",
                        }}
                      >
                        ⚠️ Faster than needed for {formattedTargetDate}
                      </span>
                    ) : (
                      <span
                        style={{
                          color: "#059669",
                          fontWeight: "500",
                          fontSize: "11px",
                        }}
                      >
                        ✓ Sustainable until {formattedTargetDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent History */}
        <div
          style={{
            padding: "0 15px 15px 15px",
          }}
        >
          <div style={bankingHomeStyles.card}>
            <div style={bankingHomeStyles.cardTitle}>
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

        {/* Navigation Icons */}
        <div
          style={{
            padding: "0 15px 15px 15px",
          }}
        >
          <div style={bankingHomeStyles.navGrid}>
            {/* Accounts */}
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate("/banking/accounts");
              }}
              style={{
                ...bankingHomeStyles.navIcon,
                borderColor: "#4285f4",
                backgroundColor: "#e8f0fe",
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
              <div style={{ fontSize: "1.5rem" }}>🏦</div>
              <div style={bankingHomeStyles.navIconText}>Accounts</div>
              <div style={{ fontSize: "11px", color: "#666" }}>
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
                ...bankingHomeStyles.navIcon,
                borderColor: "#34a853",
                backgroundColor: "#e8f5e9",
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
              <div style={{ fontSize: "1.5rem" }}>💰</div>
              <div style={bankingHomeStyles.navIconText}>Deposits</div>
              <div style={{ fontSize: "11px", color: "#666" }}>
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
                ...bankingHomeStyles.navIcon,
                borderColor: "#fbbc04",
                backgroundColor: "#fff8e1",
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
              <div style={{ fontSize: "1.5rem" }}>📈</div>
              <div style={bankingHomeStyles.navIconText}>History</div>
              <div style={{ fontSize: "11px", color: "#666" }}>
                {history.length} record{history.length !== 1 ? "s" : ""}
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
                ...bankingHomeStyles.navIcon,
                borderColor: "#9c27b0",
                backgroundColor: "#f3e5f5",
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
              <div style={{ fontSize: "1.5rem" }}>📊</div>
              <div style={bankingHomeStyles.navIconText}>Summary</div>
              <div style={{ fontSize: "11px", color: "#666" }}>
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
