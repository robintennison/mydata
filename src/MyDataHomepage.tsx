import React, { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBankingData } from "./modules/Banking/hooks/useBankingData";
import { useSettings } from "./contexts/SettingsContext";
import { tw } from "./utils/tailwindMapping"; // Import your Tailwind mapping
import {
  calculateTotalBalance,
  getNextMaturities,
  getExpiredMaturities,
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
  const { settings: appSettings } = useSettings();
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

        // Sort by end date ascending (soonest first, including expired)
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
  const { totalBalance, upcomingMaturities, expiredMaturities } =
    useMemo(() => {
      if (loading || accounts.length === 0) {
        return {
          totalBalance: 0,
          upcomingMaturities: [],
          expiredMaturities: [],
        };
      }

      return {
        totalBalance: calculateTotalBalance(
          accounts,
          deposits,
          adjustments,
          appSettings?.showInactive,
        ),
        upcomingMaturities: getNextMaturities(deposits, 5),
        expiredMaturities: getExpiredMaturities(deposits, 5, true), // true = only active deposits
      };
    }, [accounts, deposits, adjustments, appSettings?.showInactive, loading]);

  // Get upcoming and expired renewals
  const { upcomingRenewals, expiredRenewals } = useMemo(() => {
    const currentTime = Date.now();

    // Separate upcoming and expired renewals
    const upcoming = renewals
      .filter((renewal) => renewal.endDate >= currentTime)
      .slice(0, 5);

    const expired = renewals
      .filter((renewal) => renewal.endDate < currentTime)
      .slice(0, 5);

    return { upcomingRenewals: upcoming, expiredRenewals: expired };
  }, [renewals]);

  // Format lakhs for display (without L suffix)
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
    return account ? account.acctCode : "";
  };

  // Get first 5 characters of comments or empty string
  const getShortComments = (comments: string): string => {
    if (!comments || comments.trim().length === 0) return "";
    return comments.substring(0, 5) + (comments.length > 5 ? "..." : "");
  };

  // Calculate active deposits count
  const activeDepositsCount = deposits.filter((d) => d.active !== false).length;

  // Calculate EMW (Equivalent Monthly Withdrawal)
  const calculateEMW = (
    currentBalance: number,
    targetDate: Date,
    annualInterestRate: number = 5,
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
    totalBalance,
    emwSettings.targetDate,
    emwSettings.interestRate,
  );

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
        <div className={tw.loading}>
          <div className={tw.spinner}></div>
          <p>Loading MyData...</p>
        </div>
      </div>
    );
  }

  const hasUpcomingMaturities = upcomingMaturities.length > 0;
  const hasExpiredMaturities = expiredMaturities.length > 0;
  const hasUpcomingRenewals = upcomingRenewals.length > 0;
  const hasExpiredRenewals = expiredRenewals.length > 0;
  //const hasAnyMaturities = hasUpcomingMaturities || hasExpiredMaturities;
  const hasAnyRenewals = hasUpcomingRenewals || hasExpiredRenewals;

  // Helper function to calculate days ago for expired items
  const getDaysAgo = (endDate: number): string => {
    const daysAgo = Math.floor((Date.now() - endDate) / (1000 * 60 * 60 * 24));
    if (daysAgo === 0) return "Today";
    if (daysAgo === 1) return "1 day ago";
    return `${daysAgo} days ago`;
  };

  return (
    <>
      {/* EMW Stats Row */}
      <div className={tw.statsRow}>
        {/* EMW Card */}
        <div className={tw.statCard}>
          <div className={tw.cardTitle}>
            <div className="flex items-center gap-1">
              <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs">
                EMW
              </span>
              <span>Monthly</span>
            </div>
          </div>
          <div className={`${tw.cardValue} text-blue-900`}>
            {formatLakhs(emwAmount)}
          </div>
          <div className={tw.cardSubtitle}>
            {emwSettings.interestRate}% interest
          </div>
        </div>

        {/* Total Balance Card */}
        <div
          className={`${tw.statCard} cursor-pointer`}
          onClick={() => navigate("/banking")}
        >
          <div className={tw.cardTitle}>Total Balance</div>
          <div className={tw.cardValue}>{formatLakhs(totalBalance)}</div>
        </div>

        {/* Total Accounts Card */}
        <div
          className={`${tw.statCard} cursor-pointer`}
          onClick={() => navigate("/banking/accounts")}
        >
          <div className={tw.cardTitle}>Accounts</div>
          <div className={tw.cardValue}>{accounts.length}</div>
          <div className={tw.cardSubtitle}>{activeDepositsCount} deposits</div>
        </div>
      </div>
      {/* Upcoming Renewals Section */}
      <div
        className={tw.section}
        style={{
          minHeight: hasAnyRenewals ? "auto" : "80px",
          marginTop: "10px",
        }}
      >
        <div
          className={tw.sectionHeader}
          style={{ marginBottom: hasAnyRenewals ? "15px" : "0" }}
        >
          <div className={tw.sectionTitle}>
            Due Dates
            {hasAnyRenewals && (
              <span className={tw.maturityCount}>
                ({hasUpcomingRenewals ? upcomingRenewals.length : 0} upcoming,{" "}
                {hasExpiredRenewals ? expiredRenewals.length : 0} expired)
              </span>
            )}
          </div>
          {hasAnyRenewals && (
            <button
              className={tw.viewAllButton}
              onClick={() =>
                navigate("/online", { state: { activeTab: "renewals" } })
              }
            >
              View All
            </button>
          )}
        </div>

        {renewalsLoading ? (
          <div className={tw.emptyState}>
            <div className={`${tw.spinner} mx-auto mb-2.5`}></div>
            <div className={tw.emptyText}>Loading renewals...</div>
          </div>
        ) : !hasAnyRenewals ? (
          <div className={tw.emptyState}>
            <div className={tw.emptyIcon}>🔄</div>
            <div className={tw.emptyText}>No renewals found</div>
            <div className={tw.emptySubtext}>Add renewals to track them</div>
          </div>
        ) : (
          <>
            {/* Upcoming Renewals */}
            {hasUpcomingRenewals && (
              <div className="mb-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  Upcoming
                </div>
                <div className={tw.compactTable}>
                  {upcomingRenewals.map((renewal) => {
                    const daysUntil = Math.ceil(
                      (renewal.endDate - Date.now()) / (1000 * 60 * 60 * 24),
                    );
                    const isImmediate = daysUntil <= 1;

                    return (
                      <div
                        key={renewal.id}
                        className={`${tw.compactRow} ${isImmediate ? tw.immediateRow : ""}`}
                        style={{
                          fontSize: "0.95rem",
                          lineHeight: "1.2",
                        }}
                      >
                        <div className={`${tw.compactCell} ${tw.cellFlex2}`}>
                          <span
                            className={tw.compactCellValue}
                            style={{ fontSize: "0.95rem" }}
                          >
                            {renewal.name}
                          </span>
                        </div>
                        <div className={`${tw.compactCell} ${tw.cellFlex1}`}>
                          <span
                            className={tw.compactCellValue}
                            style={{ fontSize: "0.95rem" }}
                          >
                            {getShortComments(renewal.comments || "")}
                          </span>
                        </div>
                        <div className={`${tw.compactCell} ${tw.cellFlex1}`}>
                          <span
                            className={`${tw.compactCellValue} whitespace-nowrap text-right`}
                            style={{ fontSize: "0.95rem" }}
                          >
                            {formatDateShort(renewal.endDate)}
                            {isImmediate && (
                              <span className={tw.immediateBadge}>
                                {daysUntil === 0 ? "Today" : "Tomorrow"}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Expired Renewals */}
            {hasExpiredRenewals && (
              <div>
                <div className="text-sm font-semibold text-red-600 mb-2">
                  Expired
                </div>
                <div className={tw.compactTable}>
                  {expiredRenewals.map((renewal) => {
                    return (
                      <div
                        key={renewal.id}
                        className={tw.compactRow}
                        style={{
                          fontSize: "0.95rem",
                          lineHeight: "1.2",
                          opacity: 0.7,
                          color: "#6b7280",
                        }}
                      >
                        <div className={`${tw.compactCell} ${tw.cellFlex2}`}>
                          <span
                            className={`${tw.compactCellValue} line-through`}
                            style={{ fontSize: "0.95rem" }}
                          >
                            {renewal.name}
                          </span>
                        </div>
                        <div className={`${tw.compactCell} ${tw.cellFlex1}`}>
                          <span
                            className={tw.compactCellValue}
                            style={{
                              fontSize: "0.95rem",
                              color: "#6b7280",
                            }}
                          >
                            {getShortComments(renewal.comments || "")}
                          </span>
                        </div>
                        <div className={`${tw.compactCell} ${tw.cellFlex1}`}>
                          <span
                            className={`${tw.compactCellValue} whitespace-nowrap text-right text-red-600`}
                            style={{ fontSize: "0.95rem" }}
                          >
                            {formatDateShort(renewal.endDate)}
                            <span className="ml-1 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded">
                              {getDaysAgo(renewal.endDate)}
                            </span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upcoming Maturities */}
      {hasUpcomingMaturities && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            Upcoming Maturities
          </div>
          <div className={tw.compactTable}>
            {upcomingMaturities.map((deposit) => {
              const daysUntil = Math.ceil(
                (deposit.endDate - Date.now()) / (1000 * 60 * 60 * 24),
              );
              const isImmediate = daysUntil <= 1;

              return (
                <div
                  key={deposit.id}
                  className={`${tw.compactRow} ${isImmediate ? tw.immediateRow : ""}`}
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: "1.2",
                  }}
                >
                  {/* Account Column */}
                  <div className={`${tw.compactCell} ${tw.cellFlex1}`}>
                    <span
                      className={tw.compactCellValue}
                      style={{ fontSize: "0.95rem" }}
                    >
                      {getAccountName(deposit.accountId)}
                    </span>
                  </div>

                  {/* Amount Column */}
                  <div className={`${tw.compactCell} ${tw.cellFlex1}`}>
                    <span
                      className={`${tw.compactCellValue} text-blue-900`}
                      style={{ fontSize: "0.95rem" }}
                    >
                      {formatLakhs(deposit.amount)}
                    </span>
                  </div>

                  {/* Comments Column */}
                  <div className={`${tw.compactCell} ${tw.cellFlex1}`}>
                    <span
                      className={tw.compactCellValue}
                      style={{ fontSize: "0.95rem" }}
                    >
                      {getShortComments(deposit.comments || "")}
                    </span>
                  </div>

                  {/* Date Column */}
                  <div className={`${tw.compactCell} ${tw.cellFlex1}`}>
                    <span
                      className={`${tw.compactCellValue} whitespace-nowrap text-right`}
                      style={{ fontSize: "0.95rem" }}
                    >
                      {formatDateShort(deposit.endDate)}
                      {isImmediate && (
                        <span className={tw.immediateBadge}>
                          {daysUntil === 0 ? "Today" : "Tomorrow"}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Expired Maturities (only active deposits) */}
      {hasExpiredMaturities && (
        <div>
          <div className="text-sm font-semibold text-red-600 mb-2">Expired</div>
          <div className={tw.compactTable}>
            {expiredMaturities.map((deposit) => {
              return (
                <div
                  key={deposit.id}
                  className={tw.compactRow}
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: "1.2",
                    opacity: 0.7,
                    color: "#6b7280",
                  }}
                >
                  {/* Account Column */}
                  <div className={`${tw.compactCell} ${tw.cellFlex1}`}>
                    <span
                      className={`${tw.compactCellValue} line-through`}
                      style={{ fontSize: "0.95rem" }}
                    >
                      {getAccountName(deposit.accountId)}
                    </span>
                  </div>

                  {/* Amount Column */}
                  <div className={`${tw.compactCell} ${tw.cellFlex1}`}>
                    <span
                      className={tw.compactCellValue}
                      style={{
                        fontSize: "0.95rem",
                        color: "#6b7280",
                      }}
                    >
                      {formatLakhs(deposit.amount)}
                    </span>
                  </div>

                  {/* Comments Column */}
                  <div className={`${tw.compactCell} ${tw.cellFlex1}`}>
                    <span
                      className={tw.compactCellValue}
                      style={{
                        fontSize: "0.95rem",
                        color: "#6b7280",
                      }}
                    >
                      {getShortComments(deposit.comments || "")}
                    </span>
                  </div>

                  {/* Date Column */}
                  <div className={`${tw.compactCell} ${tw.cellFlex1}`}>
                    <span
                      className={`${tw.compactCellValue} whitespace-nowrap text-right text-red-600`}
                      style={{ fontSize: "0.95rem" }}
                    >
                      {formatDateShort(deposit.endDate)}
                      <span className="ml-1 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded">
                        {getDaysAgo(deposit.endDate)}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Asset Distribution Chart */}
      <div className="mt-3.5 mb-1">
        <CombinedAssetBarChart
          accounts={accounts}
          deposits={deposits}
          adjustments={adjustments}
          showInactive={appSettings?.showInactive}
        />
      </div>
    </>
  );
};

export default MyDataHomepage;
