import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBankingData } from "./modules/Banking/hooks/useBankingData";
import { useSettings } from "./contexts/SettingsContext";
import styles from "./MyDataHomepage.module.css";

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
        .slice(0, 5);

      setUpcomingMaturities(upcoming);
    }
  }, [accounts, deposits, adjustments, settings?.showInactive]);

  // Format lakhs for display - REMOVED "L" suffix
  const formatLakhs = (amount: number): string => {
    return (amount / 100000).toFixed(2); // Just the number, no "L"
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? account.acctCode : "Unknown";
  };

  // Calculate active deposits count
  const activeDepositsCount = deposits.filter((d) => d.active !== false).length;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading MyData...</p>
        </div>
      </div>
    );
  }

  const hasMaturities = upcomingMaturities.length > 0;

  return (
    <div className={styles.container}>
      {/* Header with Settings Button */}
      <div className={styles.header}>
        <div className={styles.headerTopRow}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>MyData Dashboard</h1>
            <p className={styles.subtitle}>
              Personal Finance & Assets Overview
            </p>
          </div>
          <button
            className={styles.settingsButton}
            onClick={() => navigate("/settings")}
            title="Settings"
          >
            ⚙️
            {settings?.showDelete && (
              <span className={styles.editBadge}>✏️</span>
            )}
          </button>
        </div>
      </div>

      {/* Compact Top Stats Cards */}
      <div className={styles.statsRow}>
        {/* Card 1: Total Balance */}
        <div className={styles.statCard} onClick={() => navigate("/banking")}>
          <div className={styles.cardTitle}>Total Balance</div>
          <div className={styles.cardValue}>{formatLakhs(totalBalance)}</div>
        </div>

        {/* Card 2: Total Deposits */}
        <div className={styles.statCard} onClick={() => navigate("/banking")}>
          <div className={styles.cardTitle}>Total Deposits</div>
          <div className={styles.cardValue}>{formatLakhs(totalDeposits)}</div>
        </div>

        {/* Card 3: Total Accounts */}
        <div
          className={styles.statCard}
          onClick={() => navigate("/banking/accounts")}
        >
          <div className={styles.cardTitle}>Accounts</div>
          <div className={styles.cardValue}>{accounts.length}</div>
          <div className={styles.cardSubtitle}>
            {activeDepositsCount} deposits
          </div>
        </div>
      </div>

      {/* Upcoming Maturities Section - Compact */}
      <div
        className={styles.section}
        style={{ minHeight: hasMaturities ? "auto" : "80px" }}
      >
        <div
          className={styles.sectionHeader}
          style={{ marginBottom: hasMaturities ? "15px" : "0" }}
        >
          <div className={styles.sectionTitle}>Upcoming Maturities</div>
          {hasMaturities && (
            <button
              className={styles.viewAllButton}
              onClick={() => navigate("/banking/deposits")}
            >
              View All
            </button>
          )}
        </div>

        {!hasMaturities ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyText}>No upcoming maturities</div>
            <div className={styles.emptySubtext}>Next 30 days are clear</div>
          </div>
        ) : (
          <div className={styles.maturitiesList}>
            {upcomingMaturities.map((deposit) => (
              <div
                key={deposit.id}
                className={styles.maturityCard}
                onClick={() => navigate(`/banking/deposits/edit/${deposit.id}`)}
              >
                <div className={styles.maturityLeft}>
                  <div className={styles.maturityDate}>
                    {formatDate(deposit.endDate)}
                  </div>
                  <div className={styles.maturityAccount}>
                    {getAccountName(deposit.accountId)}
                  </div>
                </div>
                <div className={styles.maturityRight}>
                  <div className={styles.maturityAmount}>
                    {formatLakhs(deposit.amount)}
                  </div>
                  <div
                    className={styles.maturityStatus}
                    style={{ color: deposit.active ? "#34a853" : "#ea4335" }}
                  >
                    ●
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Placeholder Section for Future Features - Compact */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} style={{ marginBottom: "15px" }}>
          <div className={styles.sectionTitle}>Coming Soon</div>
        </div>
        <div className={styles.placeholderCard}>
          <div className={styles.placeholderTitle}>Advanced Analytics</div>
          <div className={styles.placeholderText}>
            Investment insights, growth projections, and performance reports
            coming soon.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDataHomepage;
