import React, { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBankingData } from "./modules/Banking/hooks/useBankingData";
import { useSettings } from "./contexts/SettingsContext";
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

  // Updated date format to show 8 characters (dd/mm/yy)
  const formatDateShort = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }); // Format: "dd/mm/yy" (8 characters)
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
      <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-4 px-2 sm:px-4 box-border overflow-x-hidden">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-gray-700">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p>Loading MyData...</p>
        </div>
      </div>
    );
  }

  const hasUpcomingMaturities = upcomingMaturities.length > 0;
  const hasExpiredMaturities = expiredMaturities.length > 0;
  const hasUpcomingRenewals = upcomingRenewals.length > 0;
  const hasExpiredRenewals = expiredRenewals.length > 0;
  const hasAnyMaturities = hasUpcomingMaturities || hasExpiredMaturities;
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
      {/* EMW Stats Row - Compact for mobile */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 p-0 mb-4">
        {/* EMW Card */}
        <div className="bg-white rounded-lg p-2 sm:p-3 text-center shadow-sm border border-gray-200 transition-all duration-200 cursor-pointer flex flex-col justify-center min-h-[60px] sm:min-h-[70px] hover:shadow-md hover:-translate-y-0.5">
          <div className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-0.5 sm:mb-1">
            <div className="flex items-center gap-0.5 sm:gap-1 justify-center">
              <span className="bg-blue-600 text-white px-1 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs">
                EMW
              </span>
              <span className="hidden sm:inline">Monthly</span>
              <span className="inline sm:hidden">Mon</span>
            </div>
          </div>
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-900 my-0.5 sm:my-1 md:my-2 break-all leading-tight">
            {formatLakhs(emwAmount)}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-600">
            {emwSettings.interestRate}%
          </div>
        </div>

        {/* Total Balance Card */}
        <div
          className="bg-white rounded-lg p-2 sm:p-3 text-center shadow-sm border border-gray-200 transition-all duration-200 cursor-pointer flex flex-col justify-center min-h-[60px] sm:min-h-[70px] hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => navigate("/banking")}
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/banking");
            }
          }}
        >
          <div className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-0.5 sm:mb-1">
            Total Balance
          </div>
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600 my-0.5 sm:my-1 md:my-2 break-all leading-tight">
            {formatLakhs(totalBalance)}
          </div>
        </div>

        {/* Total Accounts Card */}
        <div
          className="bg-white rounded-lg p-2 sm:p-3 text-center shadow-sm border border-gray-200 transition-all duration-200 cursor-pointer flex flex-col justify-center min-h-[60px] sm:min-h-[70px] hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => navigate("/banking/accounts")}
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/banking/accounts");
            }
          }}
        >
          <div className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-0.5 sm:mb-1">
            Accounts
          </div>
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600 my-0.5 sm:my-1 md:my-2 break-all leading-tight">
            {accounts.length}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-600">
            {activeDepositsCount} dep
          </div>
        </div>
      </div>

      {/* Upcoming Renewals Section - Compact */}
      <div
        className="bg-white rounded-lg my-3 p-3 sm:p-4 shadow-sm border border-gray-200 shrink-0"
        style={{
          minHeight: hasAnyRenewals ? "auto" : "60px",
          marginTop: "8px",
        }}
      >
        <div
          className="flex justify-between items-center mb-2 sm:mb-3"
          style={{ marginBottom: hasAnyRenewals ? "12px" : "0" }}
        >
          <div className="text-sm font-semibold text-gray-800">
            Due Dates
            {hasAnyRenewals && (
              <span className="text-xs text-gray-600 ml-2 font-normal hidden sm:inline">
                ({hasUpcomingRenewals ? upcomingRenewals.length : 0} upcoming,{" "}
                {hasExpiredRenewals ? expiredRenewals.length : 0} expired)
              </span>
            )}
          </div>
          {hasAnyRenewals && (
            <button
              className="bg-transparent text-blue-500 border border-blue-500 rounded-md sm:rounded-lg py-1 px-2 sm:py-2 sm:px-3 text-xs font-medium cursor-pointer hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() =>
                navigate("/online", { state: { activeTab: "renewals" } })
              }
            >
              View All
            </button>
          )}
        </div>

        {renewalsLoading ? (
          <div className="text-center p-4 sm:p-8 text-gray-600">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 sm:border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2 sm:mb-4"></div>
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
              Loading renewals...
            </div>
          </div>
        ) : !hasAnyRenewals ? (
          <div className="text-center p-4 sm:p-8 text-gray-600">
            <div className="text-2xl sm:text-4xl mb-2 sm:mb-4 opacity-50">
              🔄
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
              No renewals found
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">
              Add renewals to track them
            </div>
          </div>
        ) : (
          <>
            {/* Upcoming Renewals */}
            {hasUpcomingRenewals && (
              <div className="mb-4 sm:mb-6">
                <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-4">
                  Upcoming
                </div>
                <div className="flex flex-col gap-1 sm:gap-2">
                  {upcomingRenewals.map((renewal) => {
                    const daysUntil = Math.ceil(
                      (renewal.endDate - Date.now()) / (1000 * 60 * 60 * 24),
                    );
                    const isImmediate = daysUntil <= 1;

                    return (
                      <div
                        key={renewal.id}
                        className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white text-xs sm:text-sm flex-nowrap overflow-hidden min-h-6 sm:min-h-8 border-b border-gray-100 last:border-b-0 ${isImmediate ? "bg-orange-50 border-l-2 border-orange-300" : ""}`}
                      >
                        <div className="flex items-center overflow-hidden text-center flex-2 min-w-0">
                          <span className="text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm text-center">
                            {renewal.name}
                          </span>
                        </div>
                        <div className="flex items-center overflow-hidden text-center flex-1 min-w-0">
                          <span className="text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm text-right min-w-[60px] sm:min-w-[70px]">
                            {formatDateShort(renewal.endDate)}
                            {isImmediate && (
                              <span className="bg-red-600 text-white text-[10px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded ml-1 sm:ml-2 whitespace-nowrap">
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
                <div className="text-xs sm:text-sm font-semibold text-red-600 mb-2 sm:mb-4">
                  Expired
                </div>
                <div className="flex flex-col gap-1 sm:gap-2">
                  {expiredRenewals.map((renewal) => {
                    return (
                      <div
                        key={renewal.id}
                        className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white text-xs sm:text-sm flex-nowrap overflow-hidden min-h-6 sm:min-h-8 border-b border-gray-100 last:border-b-0 opacity-70 text-gray-500"
                      >
                        <div className="flex items-center overflow-hidden text-center flex-2 min-w-0">
                          <span className="text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm text-center line-through">
                            {renewal.name}
                          </span>
                        </div>
                        <div className="flex items-center overflow-hidden text-center flex-1 min-w-0">
                          <span className="text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm text-center">
                            {getShortComments(renewal.comments || "")}
                          </span>
                        </div>
                        <div className="flex items-center overflow-hidden text-center flex-1 min-w-0">
                          <span className="text-red-600 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm text-right min-w-[60px] sm:min-w-[70px]">
                            {formatDateShort(renewal.endDate)}
                            <span className="ml-1 sm:ml-2 bg-red-100 text-red-700 text-[10px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded">
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

      {/* Maturities Section - Compact */}
      <div
        className="bg-white rounded-lg my-3 p-3 sm:p-4 shadow-sm border border-gray-200 shrink-0"
        style={{
          minHeight: hasAnyMaturities ? "auto" : "60px",
          marginTop: "8px",
        }}
      >
        <div
          className="flex justify-between items-center mb-2 sm:mb-3"
          style={{ marginBottom: hasAnyMaturities ? "12px" : "0" }}
        >
          <div className="text-sm font-semibold text-gray-800">
            Maturities
            {hasAnyMaturities && (
              <span className="text-xs text-gray-600 ml-2 font-normal hidden sm:inline">
                ({hasUpcomingMaturities ? upcomingMaturities.length : 0}{" "}
                upcoming, {hasExpiredMaturities ? expiredMaturities.length : 0}{" "}
                expired)
              </span>
            )}
          </div>
          {hasAnyMaturities && (
            <button
              className="bg-transparent text-blue-500 border border-blue-500 rounded-md sm:rounded-lg py-1 px-2 sm:py-2 sm:px-3 text-xs font-medium cursor-pointer hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() =>
                navigate("/banking", { state: { activeTab: "deposits" } })
              }
            >
              View All
            </button>
          )}
        </div>

        {!hasAnyMaturities ? (
          <div className="text-center p-4 sm:p-8 text-gray-600">
            <div className="text-2xl sm:text-4xl mb-2 sm:mb-4 opacity-50">
              📅
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
              No maturities found
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">
              No active deposits with maturity dates
            </div>
          </div>
        ) : (
          <>
            {/* Upcoming Maturities */}
            {hasUpcomingMaturities && (
              <div className="mb-4 sm:mb-6">
                <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-4">
                  Upcoming
                </div>
                <div className="flex flex-col gap-1 sm:gap-2">
                  {upcomingMaturities.map((deposit) => {
                    const daysUntil = Math.ceil(
                      (deposit.endDate - Date.now()) / (1000 * 60 * 60 * 24),
                    );
                    const isImmediate = daysUntil <= 1;

                    return (
                      <div
                        key={deposit.id}
                        className={`flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-2 bg-white text-xs sm:text-sm flex-nowrap overflow-hidden min-h-6 sm:min-h-8 border-b border-gray-100 last:border-b-0 ${isImmediate ? "bg-orange-50 border-l-2 border-orange-300" : ""}`}
                      >
                        {/* Account Column */}
                        <div className="flex items-center overflow-hidden text-center flex-1 min-w-0">
                          <span className="text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm text-center">
                            {getAccountName(deposit.accountId)}
                          </span>
                        </div>

                        {/* Amount Column */}
                        <div className="flex items-center overflow-hidden text-center flex-1 min-w-0">
                          <span className="text-blue-900 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm text-center">
                            {formatLakhs(deposit.amount)}
                          </span>
                        </div>

                        {/* Comments Column */}
                        <div className="flex items-center overflow-hidden text-center flex-1 min-w-0 hidden sm:flex">
                          <span className="text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm text-center">
                            {getShortComments(deposit.comments || "")}
                          </span>
                        </div>

                        {/* Date Column */}
                        <div className="flex items-center overflow-hidden text-center flex-1 min-w-0">
                          <span className="text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm text-right min-w-[60px] sm:min-w-[70px]">
                            {formatDateShort(deposit.endDate)}
                            {isImmediate && (
                              <span className="bg-red-600 text-white text-[10px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded ml-1 sm:ml-2 whitespace-nowrap">
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
                <div className="text-xs sm:text-sm font-semibold text-red-600 mb-2 sm:mb-4">
                  Expired
                </div>
                <div className="flex flex-col gap-1 sm:gap-2">
                  {expiredMaturities.map((deposit) => {
                    return (
                      <div
                        key={deposit.id}
                        className="flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-2 bg-white text-xs sm:text-sm flex-nowrap overflow-hidden min-h-6 sm:min-h-8 border-b border-gray-100 last:border-b-0 opacity-70 text-gray-500"
                      >
                        {/* Account Column */}
                        <div className="flex items-center overflow-hidden text-center flex-1 min-w-0">
                          <span className="text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm text-center line-through">
                            {getAccountName(deposit.accountId)}
                          </span>
                        </div>

                        {/* Amount Column */}
                        <div className="flex items-center overflow-hidden text-center flex-1 min-w-0">
                          <span className="text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm text-center">
                            {formatLakhs(deposit.amount)}
                          </span>
                        </div>

                        {/* Comments Column - Hidden on mobile */}
                        <div className="flex items-center overflow-hidden text-center flex-1 min-w-0 hidden sm:flex">
                          <span className="text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm text-center">
                            {getShortComments(deposit.comments || "")}
                          </span>
                        </div>

                        {/* Date Column */}
                        <div className="flex items-center overflow-hidden text-center flex-1 min-w-0">
                          <span className="text-red-600 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm text-right min-w-[60px] sm:min-w-[70px]">
                            {formatDateShort(deposit.endDate)}
                            <span className="ml-1 sm:ml-2 bg-red-100 text-red-700 text-[10px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded">
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
          </>
        )}
      </div>

      {/* Asset Distribution Chart */}
      <div className="mt-4 mb-2">
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
