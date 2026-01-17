import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBankingData } from "./modules/Banking/hooks/useBankingData";
import { useSettings } from "./contexts/SettingsContext";
import { bankingStyles } from "./modules/Banking/styles/BankingStyles";

const MyDataHomepage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { accounts, deposits, adjustments, loading } = useBankingData();

  const [upcomingMaturities, setUpcomingMaturities] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [totalDeposits, setTotalDeposits] = useState<number>(0);

  // Calculate total balance (savings + adjusted deposits) AND total deposits
  useEffect(() => {
    if (accounts.length > 0 && deposits.length > 0) {
      // Calculate total savings from all accounts
      const totalSavings = accounts.reduce(
        (sum, account) => sum + account.savingsAmount,
        0
      );

      // Apply same filtering as BankingHomePage
      const filteredDeposits = settings?.showInactive
        ? deposits
        : deposits.filter((deposit) => deposit.active !== false);

      // Calculate total deposits (matching BankingHomePage logic)
      const calculatedTotalDeposits = accounts.reduce((total, account) => {
        const accountId = account.id;

        // 1. Base deposits for this account
        const baseDeposits = filteredDeposits
          .filter((deposit) => deposit.accountId === accountId)
          .reduce((sum, deposit) => sum + deposit.amount, 0);

        // 2. Adjustments for this account
        const adjustmentsTotal = adjustments
          .filter((adj) => adj.accountId === accountId)
          .reduce((sum, adj) => sum + (adj.adjustmentAmount || 0), 0);

        // 3. Add them together (Android/BankingHomePage logic)
        return total + baseDeposits + adjustmentsTotal;
      }, 0);

      setTotalDeposits(calculatedTotalDeposits);

      // Total balance = savings + adjusted deposits
      const calculatedTotalBalance = totalSavings + calculatedTotalDeposits;
      setTotalBalance(calculatedTotalBalance);

      // Calculate upcoming maturities (next 30 days)
      const today = Date.now();
      const thirtyDaysFromNow = today + 30 * 24 * 60 * 60 * 1000;

      const upcoming = deposits
        .filter(
          (deposit) =>
            deposit.endDate > today && deposit.endDate <= thirtyDaysFromNow
        )
        .sort((a, b) => a.endDate - b.endDate)
        .slice(0, 5); // Show only next 5 maturities

      setUpcomingMaturities(upcoming);
    }
  }, [accounts, deposits, adjustments, settings?.showInactive]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatLakhs = (amount: number): string => {
    return (amount / 100000).toFixed(2) + " L";
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? account.acctCode : "Unknown";
  };

  // Calculate active deposits count
  const activeDepositsCount = deposits.filter((d) => d.active !== false).length;

  if (loading) {
    return (
      <div style={bankingStyles.container}>
        <div style={bankingStyles.loading}>
          <div style={bankingStyles.spinner}></div>
          <p>Loading MyData...</p>
        </div>
      </div>
    );
  }

  // Create styles dynamically based on the data
  const getStyles = (hasMaturities: boolean) => ({
    container: {
      width: "100%",
      maxWidth: "500px",
      margin: "0 auto",
      backgroundColor: "#f5f7fa",
      minHeight: "calc(100vh - 80px)",
      paddingBottom: "100px",
    },
    header: {
      background: "linear-gradient(135deg, #4285f4 0%, #5c9cff 100%)",
      color: "white",
      padding: "20px 15px 25px 15px",
      borderRadius: "0 0 20px 20px",
      marginBottom: "15px",
      boxShadow: "0 4px 12px rgba(66, 133, 244, 0.3)",
    },
    headerTopRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: "1.5rem",
      fontWeight: 700,
      margin: "0 0 6px 0",
    },
    subtitle: {
      fontSize: "0.85rem",
      opacity: 0.9,
      margin: 0,
    },
    settingsButton: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      border: "none",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.2rem",
      color: "white",
      cursor: "pointer",
      position: "relative" as "relative",
      transition: "all 0.2s",
      marginLeft: "10px",
    },
    editBadge: {
      position: "absolute" as "absolute",
      top: "-2px",
      right: "-2px",
      fontSize: "0.7rem",
      backgroundColor: "#34a853",
      borderRadius: "50%",
      width: "16px",
      height: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    statsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "10px",
      padding: "0 12px",
      marginBottom: "20px",
    },
    statCard: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "12px 10px",
      textAlign: "center" as "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      border: "1px solid #e9ecef",
      transition: "transform 0.2s",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column" as "column",
      justifyContent: "center",
      minHeight: "80px",
    },
    cardTitle: {
      fontSize: "0.75rem",
      fontWeight: 600,
      color: "#666",
      marginBottom: "6px",
    },
    cardValue: {
      fontSize: "1.1rem",
      fontWeight: 700,
      color: "#333",
      marginBottom: "3px",
    },
    cardSubtitle: {
      fontSize: "0.7rem",
      color: "#888",
    },
    section: {
      backgroundColor: "white",
      borderRadius: "12px",
      margin: "12px",
      padding: "15px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      border: "1px solid #e9ecef",
      marginBottom: "15px",
      minHeight: hasMaturities ? "auto" : "80px",
    },
    sectionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: hasMaturities ? "15px" : "0",
    },
    sectionTitle: {
      fontSize: "1rem",
      fontWeight: 600,
      color: "#333",
    },
    viewAllButton: {
      backgroundColor: "transparent",
      color: "#4285f4",
      border: "1px solid #4285f4",
      borderRadius: "6px",
      padding: "4px 10px",
      fontSize: "0.75rem",
      fontWeight: 500,
      cursor: "pointer",
    },
    maturitiesList: {
      display: "flex",
      flexDirection: "column" as "column",
      gap: "10px",
    },
    maturityCard: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px",
      backgroundColor: "#f8f9fa",
      borderRadius: "10px",
      borderLeft: "3px solid #4285f4",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    maturityLeft: {
      flex: 1,
    },
    maturityDate: {
      fontSize: "0.85rem",
      fontWeight: 600,
      color: "#333",
      marginBottom: "3px",
    },
    maturityAccount: {
      fontSize: "0.75rem",
      color: "#666",
    },
    maturityRight: {
      textAlign: "right" as "right",
      display: "flex",
      flexDirection: "column" as "column",
      alignItems: "flex-end",
      gap: "3px",
    },
    maturityAmount: {
      fontSize: "0.9rem",
      fontWeight: 700,
      color: "#34a853",
    },
    maturityStatus: {
      fontSize: "0.7rem",
      fontWeight: 500,
    },
    emptyState: {
      textAlign: "center" as "center",
      padding: "15px 10px",
      color: "#6c757d",
    },
    emptyText: {
      fontSize: "0.9rem",
      fontWeight: 500,
      marginBottom: "3px",
    },
    emptySubtext: {
      fontSize: "0.75rem",
    },
    placeholderCard: {
      backgroundColor: "#f0f7ff",
      borderRadius: "10px",
      padding: "15px",
      textAlign: "center" as "center",
      border: "2px dashed #c2e0ff",
    },
    placeholderTitle: {
      fontSize: "1rem",
      fontWeight: 600,
      color: "#4285f4",
      marginBottom: "8px",
    },
    placeholderText: {
      fontSize: "0.8rem",
      color: "#666",
      lineHeight: 1.4,
    },
  });

  const hasMaturities = upcomingMaturities.length > 0;
  const styles = getStyles(hasMaturities);

  return (
    <div style={styles.container}>
      {/* Header with Settings Button */}
      <div style={styles.header}>
        <div style={styles.headerTopRow}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>MyData Dashboard</h1>
            <p style={styles.subtitle}>Personal Finance & Assets Overview</p>
          </div>
          <button
            style={styles.settingsButton}
            onClick={() => navigate("/settings")}
            title="Settings"
          >
            ⚙️
            {settings?.showDelete && <span style={styles.editBadge}>✏️</span>}
          </button>
        </div>
      </div>

      {/* Compact Top Stats Cards */}
      <div style={styles.statsRow}>
        {/* Card 1: Total Balance */}
        <div style={styles.statCard} onClick={() => navigate("/banking")}>
          <div style={styles.cardTitle}>Total Balance</div>
          <div style={styles.cardValue}>{formatLakhs(totalBalance)}</div>
          <div style={styles.cardSubtitle}>{formatCurrency(totalBalance)}</div>
        </div>

        {/* Card 2: Total Deposits */}
        <div style={styles.statCard} onClick={() => navigate("/banking")}>
          <div style={styles.cardTitle}>Total Deposits</div>
          <div style={styles.cardValue}>{formatLakhs(totalDeposits)}</div>
          <div style={styles.cardSubtitle}>{formatCurrency(totalDeposits)}</div>
        </div>

        {/* Card 3: Total Accounts */}
        <div
          style={styles.statCard}
          onClick={() => navigate("/banking/accounts")}
        >
          <div style={styles.cardTitle}>Accounts</div>
          <div style={styles.cardValue}>{accounts.length}</div>
          <div style={styles.cardSubtitle}>{activeDepositsCount} deposits</div>
        </div>
      </div>

      {/* Upcoming Maturities Section - Compact */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>Upcoming Maturities</div>
          {hasMaturities && (
            <button
              style={styles.viewAllButton}
              onClick={() => navigate("/banking/deposits")}
            >
              View All
            </button>
          )}
        </div>

        {!hasMaturities ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyText}>No upcoming maturities</div>
            <div style={styles.emptySubtext}>Next 30 days are clear</div>
          </div>
        ) : (
          <div style={styles.maturitiesList}>
            {upcomingMaturities.map((deposit) => (
              <div
                key={deposit.id}
                style={styles.maturityCard}
                onClick={() => navigate(`/banking/deposits/edit/${deposit.id}`)}
              >
                <div style={styles.maturityLeft}>
                  <div style={styles.maturityDate}>
                    {formatDate(deposit.endDate)}
                  </div>
                  <div style={styles.maturityAccount}>
                    {getAccountName(deposit.accountId)}
                  </div>
                </div>
                <div style={styles.maturityRight}>
                  <div style={styles.maturityAmount}>
                    {formatCurrency(deposit.amount)}
                  </div>
                  <div
                    style={
                      {
                        ...styles.maturityStatus,
                        color: deposit.active ? "#34a853" : "#ea4335",
                      } as React.CSSProperties
                    }
                  >
                    {deposit.active ? "●" : "●"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Placeholder Section for Future Features - Compact */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>Coming Soon</div>
        </div>
        <div style={styles.placeholderCard}>
          <div style={styles.placeholderTitle}>Advanced Analytics</div>
          <div style={styles.placeholderText}>
            Investment insights, growth projections, and performance reports
            coming soon.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDataHomepage;
