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
  const [totalDeposits, setTotalDeposits] = useState<number>(0); // New state for deposits total

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
            {settings?.showDelete && ( // Changed from settings.enableEditDelete
              <span style={styles.editBadge}>✏️</span>
            )}
          </button>
        </div>
      </div>

      {/* Top Stats Cards - Three in one row */}
      <div style={styles.statsRow}>
        {/* Card 1: Total Balance */}
        <div style={styles.statCard} onClick={() => navigate("/banking")}>
          <div style={styles.cardIcon} className="card-icon-1">
            💰
          </div>
          <div style={styles.cardTitle}>Total Balance</div>
          <div style={styles.cardValue}>{formatLakhs(totalBalance)}</div>
          <div style={styles.cardSubtitle}>{formatCurrency(totalBalance)}</div>
          <div style={styles.cardDetail}>Savings + Adjusted Deposits</div>
        </div>

        {/* Card 2: Total Deposits (Updated to show adjusted amount) */}
        <div style={styles.statCard} onClick={() => navigate("/banking")}>
          <div style={styles.cardIcon} className="card-icon-2">
            📈
          </div>
          <div style={styles.cardTitle}>Total Deposits</div>
          <div style={styles.cardValue}>{formatLakhs(totalDeposits)}</div>
          <div style={styles.cardSubtitle}>{formatCurrency(totalDeposits)}</div>
          <div style={styles.cardDetail}>
            {activeDepositsCount} active deposit
            {activeDepositsCount !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Card 3: Total Accounts */}
        <div
          style={styles.statCard}
          onClick={() => navigate("/banking/accounts")}
        >
          <div style={styles.cardIcon} className="card-icon-3">
            🏦
          </div>
          <div style={styles.cardTitle}>Bank Accounts</div>
          <div style={styles.cardValue}>{accounts.length}</div>
          <div style={styles.cardSubtitle}>Across all banks</div>
          <div style={styles.cardDetail}>Manage accounts →</div>
        </div>
      </div>

      {/* Upcoming Maturities Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>📅</span>
            Upcoming Maturities
          </div>
          <button
            style={styles.viewAllButton}
            onClick={() => navigate("/banking/deposits")}
          >
            View All
          </button>
        </div>

        {upcomingMaturities.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📅</div>
            <div style={styles.emptyText}>No upcoming maturities</div>
            <div style={styles.emptySubtext}>Next 30 days are clear</div>
          </div>
        ) : (
          <div style={styles.maturitiesList}>
            {upcomingMaturities.map((deposit, _index) => (
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
                    {deposit.active ? "● Active" : "● Matured"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Placeholder Section for Future Features */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>🔮</span>
            Coming Soon
          </div>
        </div>
        <div style={styles.placeholderCard}>
          <div style={styles.placeholderIcon}>✨</div>
          <div style={styles.placeholderTitle}>Advanced Analytics</div>
          <div style={styles.placeholderText}>
            Investment insights, growth projections, and performance reports
            will be available here soon.
          </div>
        </div>
      </div>

      {/* Module Navigation - Bottom Navigation Bar */}
      <div style={styles.navContainer}>
        <div style={styles.navTitle}>Quick Access</div>
        <div style={styles.navGrid}>
          {/* Banking Module */}
          <div
            style={styles.navItem}
            onClick={() => {
              console.log("Banking clicked");
              navigate("/banking");
            }}
          >
            <div
              style={
                {
                  ...styles.navIcon,
                  backgroundColor: "#4285f4" + "20",
                  color: "#4285f4",
                } as React.CSSProperties
              }
            >
              🏦
            </div>
            <div style={styles.navItemName}>Banking</div>
            <div style={styles.navItemDesc}>Accounts, Deposits, Summary</div>
          </div>

          {/* Jewellery Module */}
          <div style={styles.navItem} onClick={() => navigate("/jewellery")}>
            <div
              style={
                {
                  ...styles.navIcon,
                  backgroundColor: "#FFD700" + "20",
                  color: "#FFD700",
                } as React.CSSProperties
              }
            >
              💎
            </div>
            <div style={styles.navItemName}>Jewellery</div>
            <div style={styles.navItemDesc}>Gold & Diamond Tracking</div>
          </div>

          {/* Properties Module */}
          <div style={styles.navItem} onClick={() => navigate("/properties")}>
            <div
              style={
                {
                  ...styles.navIcon,
                  backgroundColor: "#34a853" + "20",
                  color: "#34a853",
                } as React.CSSProperties
              }
            >
              🏠
            </div>
            <div style={styles.navItemName}>Properties</div>
            <div style={styles.navItemDesc}>Real Estate Assets</div>
          </div>

          {/* Online Module */}
          <div style={styles.navItem} onClick={() => navigate("/online")}>
            <div
              style={
                {
                  ...styles.navIcon,
                  backgroundColor: "#ea4335" + "20",
                  color: "#ea4335",
                } as React.CSSProperties
              }
            >
              🌐
            </div>
            <div style={styles.navItemName}>Online</div>
            <div style={styles.navItemDesc}>
              Digital Accounts & Subscriptions
            </div>
          </div>
        </div>
      </div>
      {/* Bottom Spacing */}
      <div style={{ height: "80px" }}></div>
    </div>
  );
};

// Define styles with explicit React.CSSProperties type
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: "100%",
    maxWidth: "500px",
    margin: "0 auto",
    backgroundColor: "#f5f7fa",
    minHeight: "100vh",
    paddingBottom: "20px",
  },
  header: {
    background: "linear-gradient(135deg, #4285f4 0%, #5c9cff 100%)",
    color: "white",
    padding: "25px 20px 30px 20px",
    borderRadius: "0 0 20px 20px",
    marginBottom: "20px",
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
    fontSize: "1.8rem",
    fontWeight: 700,
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "0.95rem",
    opacity: 0.9,
    margin: 0,
  },
  settingsButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    color: "white",
    cursor: "pointer",
    position: "relative" as "relative",
    transition: "all 0.2s",
    marginLeft: "15px",
  },
  editBadge: {
    position: "absolute" as "absolute",
    top: "-2px",
    right: "-2px",
    fontSize: "0.7rem",
    backgroundColor: "#34a853",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    padding: "0 15px",
    marginBottom: "25px",
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "18px 15px",
    textAlign: "center" as "center",
    boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
    transition: "transform 0.2s",
    cursor: "pointer",
  },
  cardIcon: {
    fontSize: "1.8rem",
    marginBottom: "10px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px auto",
  },
  cardTitle: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#666",
    marginBottom: "8px",
  },
  cardValue: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#333",
    marginBottom: "5px",
  },
  cardSubtitle: {
    fontSize: "0.8rem",
    color: "#888",
    marginBottom: "8px",
  },
  cardDetail: {
    fontSize: "0.75rem",
    color: "#4285f4",
    fontWeight: 500,
  },
  section: {
    backgroundColor: "white",
    borderRadius: "16px",
    margin: "15px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e9ecef",
    marginBottom: "20px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#333",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  sectionIcon: {
    fontSize: "1.3rem",
  },
  viewAllButton: {
    backgroundColor: "transparent",
    color: "#4285f4",
    border: "1px solid #4285f4",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "0.85rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  maturitiesList: {
    display: "flex",
    flexDirection: "column" as "column",
    gap: "12px",
  },
  maturityCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    borderLeft: "4px solid #4285f4",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  maturityLeft: {
    flex: 1,
  },
  maturityDate: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#333",
    marginBottom: "4px",
  },
  maturityAccount: {
    fontSize: "0.85rem",
    color: "#666",
  },
  maturityRight: {
    textAlign: "right" as "right",
  },
  maturityAmount: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#34a853",
    marginBottom: "4px",
  },
  maturityStatus: {
    fontSize: "0.8rem",
    fontWeight: 500,
  },
  emptyState: {
    textAlign: "center" as "center",
    padding: "30px 20px",
    color: "#6c757d",
  },
  emptyIcon: {
    fontSize: "2.5rem",
    marginBottom: "15px",
    opacity: 0.5,
  },
  emptyText: {
    fontSize: "1rem",
    fontWeight: 500,
    marginBottom: "5px",
  },
  emptySubtext: {
    fontSize: "0.85rem",
  },
  placeholderCard: {
    backgroundColor: "#f0f7ff",
    borderRadius: "12px",
    padding: "25px",
    textAlign: "center" as "center",
    border: "2px dashed #c2e0ff",
  },
  placeholderIcon: {
    fontSize: "2.5rem",
    marginBottom: "15px",
    opacity: 0.7,
  },
  placeholderTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#4285f4",
    marginBottom: "10px",
  },
  placeholderText: {
    fontSize: "0.9rem",
    color: "#666",
    lineHeight: 1.5,
  },
  navContainer: {
    backgroundColor: "white",
    borderRadius: "16px",
    margin: "15px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e9ecef",
    marginBottom: "20px",
  },
  navTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#333",
    marginBottom: "20px",
    textAlign: "center" as "center",
  },
  navGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "15px",
  },
  navItem: {
    textAlign: "center" as "center",
    cursor: "pointer",
    padding: "15px",
    borderRadius: "12px",
    backgroundColor: "#f8f9fa",
    transition: "all 0.2s",
    border: "1px solid transparent",
  },
  navIcon: {
    fontSize: "1.8rem",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px auto",
    transition: "all 0.2s",
  },
  navItemName: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#333",
    marginBottom: "5px",
  },
  navItemDesc: {
    fontSize: "0.8rem",
    color: "#666",
    lineHeight: 1.4,
  },
};

// Add CSS for card icons
const cardIconsStyle = `
  .card-icon-1 {
    background-color: #e8f0fe;
    color: #4285f4;
  }
  .card-icon-2 {
    background-color: #e6f4ea;
    color: #34a853;
  }
  .card-icon-3 {
    background-color: #fce8e6;
    color: #ea4335;
  }
  
  /* Add hover effects */
  .statCard:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  .navItem:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border-color: #4285f4;
  }
  
  .navItem:hover .navIcon {
    transform: scale(1.1);
  }
  
  .maturityCard:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .settingsButton:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = cardIconsStyle;
  document.head.appendChild(styleSheet);
}

export default MyDataHomepage;
