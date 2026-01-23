import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBankingData } from "./modules/Banking/hooks/useBankingData";
import { useSettings } from "./contexts/SettingsContext";
import styles from "./MyDataHomepage.module.css";
import {
  calculateTotalBalance,
  calculateTotalDeposits,
  getNextMaturities,
} from "./modules/Banking/utils/bankingCalculations";
import CombinedAssetBarChart from "./modules/Banking/pages/CombinedAssetBarChart";

const MyDataHomepage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { accounts, deposits, adjustments, loading } = useBankingData();

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
      upcomingMaturities: getNextMaturities(deposits, 5),
    };
  }, [accounts, deposits, adjustments, settings?.showInactive, loading]);

  // Format lakhs for display
  const formatLakhs = (amount: number): string => {
    return (amount / 100000).toFixed(2);
  };

  const formatDateShort = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? account.acctCode : "Unknown";
  };

  // Get first 5 characters of comments or empty string
  const getShortComments = (comments: string): string => {
    if (!comments || comments.trim().length === 0) return "-";
    return comments.substring(0, 5) + (comments.length > 5 ? "..." : "");
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
      {/* Header with Settings Button Only */}
      <div className={styles.header}>
        <div className={styles.headerTopRow}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>MyData / Dashboard</h1>
            <p className={styles.subtitle}>
              Personal Finance & Assets Overview
            </p>
          </div>

          {/* Header Right Section with Settings Only */}
          <div className={styles.headerRight}>
            {/* Settings Button Only */}
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
            <div className={styles.emptySubtext}>No active deposits found</div>
          </div>
        ) : (
          <div className={styles.tableResponsiveContainer}>
            {/* Desktop Table View */}
            <table className={styles.responsiveTable}>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Amount (L)</th>
                  <th>Comments</th>
                  <th>Maturity Date</th>
                </tr>
              </thead>
              <tbody>
                {upcomingMaturities.map((deposit) => {
                  const daysUntil = Math.ceil(
                    (deposit.endDate - Date.now()) / (1000 * 60 * 60 * 24),
                  );
                  const isImmediate = daysUntil <= 1;

                  return (
                    <tr
                      key={deposit.id}
                      className={isImmediate ? styles.immediateRow : ""}
                      onClick={() =>
                        navigate(`/banking/deposits/edit/${deposit.id}`)
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <td>{getAccountName(deposit.accountId)}</td>
                      <td>{formatLakhs(deposit.amount)}</td>
                      <td>{getShortComments(deposit.comments || "")}</td>
                      <td>
                        <div className={styles.dateCell}>
                          <span className={styles.dateText}>
                            {formatDateShort(deposit.endDate)}
                          </span>
                          {isImmediate && (
                            <span className={styles.immediateBadge}>
                              {daysUntil === 0 ? "Today" : "Tomorrow"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Card View - Only shows on mobile */}
            <div className={styles.mobileCardView}>
              {upcomingMaturities.map((deposit) => {
                const daysUntil = Math.ceil(
                  (deposit.endDate - Date.now()) / (1000 * 60 * 60 * 24),
                );
                const isImmediate = daysUntil <= 1;

                return (
                  <div
                    key={deposit.id}
                    className={`${styles.mobileCard} ${isImmediate ? styles.immediateRow : ""}`}
                    onClick={() =>
                      navigate(`/banking/deposits/edit/${deposit.id}`)
                    }
                  >
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Account:</span>
                      <span className={styles.mobileCardValue}>
                        {getAccountName(deposit.accountId)}
                      </span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Amount:</span>
                      <span className={styles.mobileCardValue}>
                        {formatLakhs(deposit.amount)} L
                      </span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Comments:</span>
                      <span className={styles.mobileCardValue}>
                        {getShortComments(deposit.comments || "")}
                      </span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Maturity:</span>
                      <span className={styles.mobileCardValue}>
                        <div className={styles.dateCell}>
                          <span className={styles.dateText}>
                            {formatDateShort(deposit.endDate)}
                          </span>
                          {isImmediate && (
                            <span className={styles.immediateBadge}>
                              {daysUntil === 0 ? "Today" : "Tomorrow"}
                            </span>
                          )}
                        </div>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDataHomepage;
