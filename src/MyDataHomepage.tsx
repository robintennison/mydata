import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBankingData } from "./modules/Banking/hooks/useBankingData";
import { useSettings } from "./contexts/SettingsContext";
import styles from "./MyDataHomepage.module.css";
import {
  calculateTotalBalance,
  calculateTotalDeposits,
  getUpcomingMaturities,
} from "./modules/Banking/utils/bankingCalculations";
import CombinedAssetBarChart from "./modules/Banking/pages/CombinedAssetBarChart";

const MyDataHomepage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { accounts, deposits, adjustments, loading } = useBankingData();

  // Handle logout
  const handleLogout = () => {
    // Clear any auth tokens or user data from localStorage/sessionStorage
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("userData");

    // Redirect to login page
    navigate("/login");

    // Optional: Clear any other app state
    window.location.reload(); // Full refresh to clear state
  };

  // Memoize calculations for better performance
  const { totalBalance, totalDeposits, upcomingMaturities } = useMemo(() => {
    if (loading || accounts.length === 0) {
      return { totalBalance: 0, totalDeposits: 0, upcomingMaturities: [] };
    }

    return {
      totalBalance: calculateTotalBalance(
        accounts,
        deposits,
        adjustments,
        settings?.showInactive,
      ),
      totalDeposits: calculateTotalDeposits(
        accounts,
        deposits,
        adjustments,
        settings?.showInactive,
      ),
      upcomingMaturities: getUpcomingMaturities(deposits, 30, 5),
    };
  }, [accounts, deposits, adjustments, settings?.showInactive, loading]);

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
      {/* Header with Settings Button and Logout */}
      <div className={styles.header}>
        <div className={styles.headerTopRow}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>MyData / Dashboard</h1>
            <p className={styles.subtitle}>
              Personal Finance & Assets Overview
            </p>
          </div>

          {/* Header Right Section with Settings and Logout */}
          <div className={styles.headerRight}>
            {/* Settings Button */}
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

            {/* Logout Button */}
            <button
              className={styles.logoutButton}
              onClick={handleLogout}
              title="Logout"
            >
              <svg
                className={styles.logoutIcon}
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path
                  fill="currentColor"
                  d="M14.08,15.59L16.67,13H7V11H16.67L14.08,8.41L15.5,7L20.5,12L15.5,17L14.08,15.59M19,3A2,2 0 0,1 21,5V9.67L19,7.67V5H5V19H19V16.33L21,14.33V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H19Z"
                />
              </svg>
              <span className={styles.logoutText}>Logout</span>
            </button>
          </div>
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

      {/* Asset Distribution Chart */}
      <CombinedAssetBarChart
        accounts={accounts}
        deposits={deposits}
        adjustments={adjustments}
        showInactive={settings?.showInactive}
      />

      {/* Enhanced Upcoming Maturities Section */}
      <div
        className={styles.section}
        style={{ minHeight: hasMaturities ? "auto" : "80px" }}
      >
        <div
          className={styles.sectionHeader}
          style={{ marginBottom: hasMaturities ? "15px" : "0" }}
        >
          <div className={styles.sectionTitle}>
            Upcoming Maturities
            {hasMaturities && (
              <span className={styles.maturityCount}>
                ({upcomingMaturities.length})
              </span>
            )}
          </div>
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
            <div className={styles.emptyIcon}>📅</div>
            <div className={styles.emptyText}>No upcoming maturities</div>
            <div className={styles.emptySubtext}>Next 30 days are clear</div>
          </div>
        ) : (
          <div className={styles.maturitiesList}>
            {upcomingMaturities.map((deposit) => {
              const daysUntil = Math.ceil(
                (deposit.endDate - Date.now()) / (1000 * 60 * 60 * 24),
              );

              return (
                <div
                  key={deposit.id}
                  className={styles.maturityCard}
                  onClick={() =>
                    navigate(`/banking/deposits/edit/${deposit.id}`)
                  }
                >
                  <div className={styles.maturityLeft}>
                    <div className={styles.maturityDate}>
                      {formatDate(deposit.endDate)}
                    </div>
                    <div className={styles.maturityAccount}>
                      {getAccountName(deposit.accountId)}
                    </div>
                    <div className={styles.maturityDays}>
                      {daysUntil === 0
                        ? "Today"
                        : `${daysUntil} day${daysUntil !== 1 ? "s" : ""}`}
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
              );
            })}
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
