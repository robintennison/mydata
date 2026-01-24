import React, { useMemo, useEffect, useState } from "react";
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
import { getFirestore, collection, getDocs } from "firebase/firestore";

interface Renewal {
  id: string;
  name: string;
  startDate: number;
  endDate: number;
  comments: string;
  createdAt: number;
  updatedAt: number;
}

const MyDataHomepage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { accounts, deposits, adjustments, loading } = useBankingData();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [renewalsLoading, setRenewalsLoading] = useState(true);

  // Fetch renewals data
  useEffect(() => {
    const fetchRenewals = async () => {
      try {
        setRenewalsLoading(true);
        const db = getFirestore();
        const renewalsRef = collection(db, "renewals");
        const snapshot = await getDocs(renewalsRef);

        const renewalsList: Renewal[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();

          const convertToTimestamp = (field: any): number => {
            if (!field) return Date.now();
            if (field && typeof field === "object" && "toDate" in field) {
              return field.toDate().getTime();
            }
            if (typeof field === "number") return field;
            if (typeof field === "string") {
              const parsed = Date.parse(field);
              return isNaN(parsed) ? Date.now() : parsed;
            }
            return Date.now();
          };

          renewalsList.push({
            id: doc.id,
            name: data.name || "",
            startDate: convertToTimestamp(data.startDate),
            endDate: convertToTimestamp(data.endDate),
            comments: data.comments || "",
            createdAt: convertToTimestamp(data.createdAt),
            updatedAt: convertToTimestamp(data.updatedAt),
          });
        });

        // Sort by end date ascending (soonest first)
        renewalsList.sort((a, b) => a.endDate - b.endDate);
        setRenewals(renewalsList);
      } catch (error) {
        console.error("Error fetching renewals:", error);
      } finally {
        setRenewalsLoading(false);
      }
    };

    fetchRenewals();
  }, []);

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

  // Filter active renewals and get next 5
  const upcomingRenewals = useMemo(() => {
    const currentTime = Date.now();
    // Filter out past renewals and get next 5 upcoming
    return renewals
      .filter((renewal) => renewal.endDate > currentTime)
      .slice(0, 5);
  }, [renewals]);

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
  const hasRenewals = upcomingRenewals.length > 0;

  return (
    <div className={styles.container}>
      {/* Page title text removed - Now goes directly to content */}

      {/* Compact Top Stats Cards - Added top padding */}
      <div className={styles.statsRow} style={{ paddingTop: "10px" }}>
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

      {/* Upcoming Renewals Section */}
      <div
        className={styles.section}
        style={{
          minHeight: hasRenewals ? "auto" : "80px",
          marginTop: "20px",
        }}
      >
        <div
          className={styles.sectionHeader}
          style={{ marginBottom: hasRenewals ? "15px" : "0" }}
        >
          <div className={styles.sectionTitle}>
            Upcoming Renewals
            {hasRenewals && (
              <span className={styles.maturityCount}>
                ({upcomingRenewals.length})
              </span>
            )}
          </div>
          {hasRenewals && (
            <button
              className={styles.viewAllButton}
              onClick={() => navigate("/online/renewals")}
            >
              View All
            </button>
          )}
        </div>

        {renewalsLoading ? (
          <div className={styles.emptyState}>
            <div
              className={styles.spinner}
              style={{ margin: "0 auto 10px" }}
            ></div>
            <div className={styles.emptyText}>Loading renewals...</div>
          </div>
        ) : !hasRenewals ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔄</div>
            <div className={styles.emptyText}>No upcoming renewals</div>
            <div className={styles.emptySubtext}>
              Add renewals to track them
            </div>
          </div>
        ) : (
          <div className={styles.tableResponsiveContainer}>
            {/* Desktop Table View */}
            <table className={styles.responsiveTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Comments</th>
                  <th>Renewal Date</th>
                </tr>
              </thead>
              <tbody>
                {upcomingRenewals.map((renewal) => {
                  const daysUntil = Math.ceil(
                    (renewal.endDate - Date.now()) / (1000 * 60 * 60 * 24),
                  );
                  const isImmediate = daysUntil <= 1;

                  return (
                    <tr
                      key={renewal.id}
                      className={isImmediate ? styles.immediateRow : ""}
                      onClick={() =>
                        navigate(`/online/renewals/view/${renewal.id}`)
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ fontWeight: "500" }}>{renewal.name}</td>
                      <td>{getShortComments(renewal.comments || "")}</td>
                      <td>
                        <div className={styles.dateCell}>
                          <span className={styles.dateText}>
                            {formatDateShort(renewal.endDate)}
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
              {upcomingRenewals.map((renewal) => {
                const daysUntil = Math.ceil(
                  (renewal.endDate - Date.now()) / (1000 * 60 * 60 * 24),
                );
                const isImmediate = daysUntil <= 1;

                return (
                  <div
                    key={renewal.id}
                    className={`${styles.mobileCard} ${isImmediate ? styles.immediateRow : ""}`}
                    onClick={() =>
                      navigate(`/online/renewals/view/${renewal.id}`)
                    }
                  >
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Name:</span>
                      <span className={styles.mobileCardValue}>
                        {renewal.name}
                      </span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Comments:</span>
                      <span className={styles.mobileCardValue}>
                        {getShortComments(renewal.comments || "")}
                      </span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Renewal:</span>
                      <span className={styles.mobileCardValue}>
                        <div className={styles.dateCell}>
                          <span className={styles.dateText}>
                            {formatDateShort(renewal.endDate)}
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
