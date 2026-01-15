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
