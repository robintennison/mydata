import { useNavigate } from "react-router-dom";
import { useBankingData } from "../hooks/useBankingData";
import { bankingStyles } from "../styles";

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

  // MATCH ANDROID CALCULATION EXACTLY:
  // For each account: baseDeposits + adjustmentsTotal
  const totalDeposits = accounts.reduce((total, account) => {
    const accountId = account.id;

    // 1. Base deposits for this account
    const baseDeposits = filteredDeposits
      .filter((deposit) => deposit.accountId === accountId)
      .reduce((sum, deposit) => sum + deposit.amount, 0);

    // 2. Adjustments for this account
    const adjustmentsTotal = adjustments
      .filter((adj) => adj.accountId === accountId)
      .reduce((sum, adj) => sum + (adj.adjustmentAmount || 0), 0);

    // 3. Add them together (Android logic)
    return total + baseDeposits + adjustmentsTotal;
  }, 0);

  // Calculate for comparison
  const totalBaseDeposits = filteredDeposits.reduce(
    (sum, deposit) => sum + deposit.amount,
    0
  );

  const totalAdjustments = adjustments.reduce(
    (sum, adj) => sum + (adj.adjustmentAmount || 0),
    0
  );

  // DEBUG
  console.log("=== ANDROID-STYLE CALCULATION ===");
  console.log("Total base deposits:", totalBaseDeposits);
  console.log("Total adjustments:", totalAdjustments);
  console.log(
    "Total (base + adjustments):",
    totalBaseDeposits + totalAdjustments
  );
  console.log("Our calculation:", totalDeposits);

  const hasAdjustments = adjustments.length > 0;

  // Get last 6 months history
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

      {/* Top Navigation with Home Button */}
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

      {/* Stats Cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          padding: "15px",
        }}
      >
        {/* Total Savings Card */}
        <div style={bankingStyles.statsCard}>
          <div style={bankingStyles.statsLabel}>Total Savings</div>
          <div style={bankingStyles.statsValue}>
            {formatCurrency(totalSavings)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#34a853" }}>
            From {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Total Deposits Card */}
        <div style={bankingStyles.statsCard}>
          <div style={bankingStyles.statsLabel}>Total Deposits</div>
          <div style={bankingStyles.statsValue}>
            {formatCurrency(totalDeposits)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#4285f4" }}>
            {filteredDeposits.length} deposit
            {filteredDeposits.length !== 1 ? "s" : ""}
            {hasAdjustments && (
              <span
                style={{
                  fontSize: "0.7rem",
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
                padding: "6px",
                backgroundColor: "#f8f9fa",
                borderRadius: "6px",
                fontSize: "0.75rem",
                color: "#495057",
                borderLeft: "3px solid #4285f4",
              }}
            >
              <div style={{ marginBottom: "4px" }}>
                <strong>Breakdown (Android calculation):</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Principal (base deposits):</span>
                <span>{formatCurrency(totalBaseDeposits)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
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
                  marginTop: "4px",
                  paddingTop: "4px",
                  borderTop: "1px dashed #ddd",
                  fontWeight: "500",
                }}
              >
                <span>Total (principal + interest):</span>
                <span>{formatCurrency(totalDeposits)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Total Bank Balance Card */}
        <div
          style={{
            ...bankingStyles.statsCard,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
          }}
        >
          <div
            style={{
              ...bankingStyles.statsLabel,
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "0.9rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Total Bank Balance
          </div>
          <div
            style={{
              ...bankingStyles.statsValue,
              fontSize: "1.8rem",
              fontWeight: "700",
              margin: "8px 0",
            }}
          >
            {formatCurrency(totalBankBalance)}
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "rgba(255, 255, 255, 0.8)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "4px",
            }}
          >
            <span>Savings: {formatCurrency(totalSavings)}</span>
            <span style={{ margin: "0 8px" }}>•</span>
            <span>Deposits: {formatCurrency(totalDeposits)}</span>
          </div>
        </div>

        {/* EMW Calculation Card */}
        <div
          style={{
            ...bankingStyles.statsCard,
            backgroundColor: "#f8f9fa",
            border: "2px solid #e9ecef",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative corner */}
          <div
            style={{
              position: "absolute",
              top: "0",
              right: "0",
              width: "0",
              height: "0",
              borderTop: "60px solid #f0f9ff",
              borderLeft: "60px solid transparent",
              zIndex: 0,
            }}
          ></div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  ...bankingStyles.statsLabel,
                  color: "#1e40af",
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    backgroundColor: "#3b82f6",
                    color: "white",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                  }}
                >
                  EMW
                </span>
                Equated Monthly Withdrawal
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  backgroundColor: "#dbeafe",
                  color: "#1e40af",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  fontWeight: "500",
                }}
              >
                5% interest
              </div>
            </div>

            <div
              style={{
                fontSize: "1.4rem",
                fontWeight: "700",
                color: "#1e40af",
                margin: "12px 0",
                textAlign: "center",
              }}
            >
              {formatCurrency(emwAmount)}
            </div>

            <div
              style={{
                fontSize: "0.85rem",
                color: "#4b5563",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              per month to empty account by
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "white",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                marginBottom: "12px",
              }}
            >
              <div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  Target Date
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  {formattedTargetDate}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  Total Balance
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  {formatCurrency(totalBankBalance)}
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                lineHeight: "1.4",
                backgroundColor: "#f3f4f6",
                padding: "8px 10px",
                borderRadius: "6px",
                borderLeft: "3px solid #3b82f6",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                }}
              >
                <span style={{ color: "#3b82f6" }}>💡</span>
                <span style={{ fontWeight: "500" }}>What is EMW?</span>
              </div>
              <div>
                The monthly amount you can withdraw to completely empty your
                account by the target date, assuming 5% annual interest.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div style={bankingStyles.card}>
        <div style={bankingStyles.cardTitle}>
          <span>📅</span>
          <span>Recent History (Last 6 Months)</span>
        </div>

        {last6Months.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "20px", color: "#6c757d" }}
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

              return (
                <div
                  key={record.month}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom:
                      index < last6Months.length - 1
                        ? "1px solid #eee"
                        : "none",
                  }}
                >
                  <div style={{ fontWeight: "500", color: "#333" }}>
                    {monthName}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#4285f4",
                        fontWeight: "600",
                      }}
                    >
                      {formatCurrency(record.totalDeposits)}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>
                      Total:{" "}
                      {formatCurrency(record.savings + record.totalDeposits)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation Icons */}
      <div style={bankingStyles.navGrid}>
        {/* Accounts */}
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate("/banking/accounts");
          }}
          style={{
            ...bankingStyles.navIcon,
            borderColor: "#4285f4",
            backgroundColor: "#e8f0fe",
          }}
        >
          <div style={{ fontSize: "1.8rem" }}>🏦</div>
          <div style={bankingStyles.navIconText}>Accounts</div>
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
            ...bankingStyles.navIcon,
            borderColor: "#34a853",
            backgroundColor: "#e8f5e9",
          }}
        >
          <div style={{ fontSize: "1.8rem" }}>💰</div>
          <div style={bankingStyles.navIconText}>Deposits</div>
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
            ...bankingStyles.navIcon,
            borderColor: "#fbbc04",
            backgroundColor: "#fff8e1",
          }}
        >
          <div style={{ fontSize: "1.8rem" }}>📈</div>
          <div style={bankingStyles.navIconText}>History</div>
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
            ...bankingStyles.navIcon,
            borderColor: "#9c27b0",
            backgroundColor: "#f3e5f5",
          }}
        >
          <div style={{ fontSize: "1.8rem" }}>📊</div>
          <div style={bankingStyles.navIconText}>Summary</div>
          <div style={{ fontSize: "0.8rem", color: "#666" }}>View reports</div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default BankingHomePage;
