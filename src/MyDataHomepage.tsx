import React, { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBankingData } from "./modules/Banking/hooks/useBankingData";
import { useSettings } from "./contexts/SettingsContext";
import { useJewellerySettings } from "./modules/Jewellery/hooks/useSettingsData";
import {
  getNextMaturities,
  getExpiredMaturities,
} from "./modules/Banking/utils/bankingCalculations";
import { calculateEMW, getEmwSettings } from "./utils/emwCalculations";
import CombinedAssetBarChart from "./modules/Banking/pages/CombinedAssetBarChart";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { getCurrentMonth, formatLakhs, formatDateShort } from "./utils/formatters";

// Add OnlineItem interface
interface OnlineItem {
  id: string;
  name: string;
  detail: string;
  category: string;
  startDate: number | null;
  endDate: number | null;
  file1: string;
  file2: string;
  file1Type: string;
  file2Type: string;
  file1Name: string;
  file2Name: string;
  createdAt: number;
  updatedAt: number;
}

// Add JewelleryItem interface (matching the structure from Firestore)
interface JewelleryItem {
  id: string;
  code: string;
  description: string;
  weight: number;
  location: string;
  boughtFor: string;
  purchaseDate: number;
  imageUrl: string;
  active: boolean;
  billId?: string;
  lastVerified?: number;
  verificationStatus?: string;
  verificationNotes?: string;
}

// Add HistoryDetail interface
interface HistoryDetail {
  acctCode: string;
  month: string;
  savings: number;
  deposits: number;
}

// Add LiabilityHistory interface
interface LiabilityHistory {
  id: string;
  month: string;
  description: string;
  amount: number;
}

const MyDataHomepage: React.FC = () => {
  const navigate = useNavigate();
  const { settings: appSettings } = useSettings();
  const { goldRate, settings: jewellerySettings } = useJewellerySettings();
  const { accounts, deposits, loading: bankingLoading } = useBankingData();
  const [onlineItems, setOnlineItems] = useState<OnlineItem[]>([]);
  const [onlineItemsLoading, setOnlineItemsLoading] = useState(true);
  const [jewelleryItems, setJewelleryItems] = useState<JewelleryItem[]>([]);
  const [jewelleryLoading, setJewelleryLoading] = useState(true);

  // State for history_detail data
  const [currentMonthHistory, setCurrentMonthHistory] = useState<
    HistoryDetail[]
  >([]);
  const [allHistoryData, setAllHistoryData] = useState<HistoryDetail[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // State for liabilities data
  const [currentMonthLiabilities, setCurrentMonthLiabilities] = useState<number>(0);
  const [allLiabilitiesData, setAllLiabilitiesData] = useState<LiabilityHistory[]>([]);
  const [liabilitiesLoading, setLiabilitiesLoading] = useState(true);

  // Get resale discount percentage from jewellery settings
  const resaleDiscountPercent = jewellerySettings?.resaleDiscountPercent || 0;

  // Fetch liabilities for a specific month
  const getLiabilitiesForMonth = async (month: string): Promise<number> => {
    try {
      const db = getFirestore();
      const liabilityHistoryRef = collection(db, "liability_history");
      const q = query(liabilityHistoryRef, where("month", "==", month));
      const querySnapshot = await getDocs(q);
      
      let total = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data() as LiabilityHistory;
        total += data.amount || 0;
      });
      
      return total;
    } catch (error) {
      console.error(`Error fetching liabilities for ${month}:`, error);
      return 0;
    }
  };

  // Fetch ALL liabilities data
  useEffect(() => {
    const fetchAllLiabilitiesData = async () => {
      try {
        setLiabilitiesLoading(true);
        const db = getFirestore();
        const liabilityHistoryRef = collection(db, "liability_history");
        const querySnapshot = await getDocs(liabilityHistoryRef);

        const allLiabilities: LiabilityHistory[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          allLiabilities.push({
            id: doc.id,
            month: data.month || "",
            description: data.description || "",
            amount: data.amount || 0,
          });
        });

        setAllLiabilitiesData(allLiabilities);

        // Get current month liabilities
        const currentMonth = getCurrentMonth();
        const currentLiabilities = await getLiabilitiesForMonth(currentMonth);
        setCurrentMonthLiabilities(currentLiabilities);
      } catch (error) {
        console.error("Error fetching liabilities data:", error);
      } finally {
        setLiabilitiesLoading(false);
      }
    };

    fetchAllLiabilitiesData();
  }, []);

  // Fetch ALL history_detail data
  useEffect(() => {
    const fetchAllHistoryData = async () => {
      try {
        setHistoryLoading(true);
        const historyDetailRef = collection(getFirestore(), "history_detail");
        const querySnapshot = await getDocs(historyDetailRef);

        const allRecords: HistoryDetail[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          allRecords.push({
            acctCode: data.acctCode || "",
            month: data.month || "",
            savings: data.savings || 0,
            deposits: data.deposits || 0,
          });
        });

        setAllHistoryData(allRecords);

        // Also filter for current month separately
        const currentMonth = getCurrentMonth();
        const currentMonthRecords = allRecords.filter(
          (record) => record.month === currentMonth,
        );
        setCurrentMonthHistory(currentMonthRecords);
      } catch (error) {
        console.error("Error fetching history_detail data:", error);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchAllHistoryData();
  }, []);

  // Fetch online items
  useEffect(() => {
    const fetchOnlineItems = async () => {
      try {
        setOnlineItemsLoading(true);
        const db = getFirestore();
        const itemsRef = collection(db, "online");
        const itemsSnapshot = await getDocs(itemsRef);

        const itemsList: OnlineItem[] = [];
        itemsSnapshot.forEach((doc) => {
          const data: DocumentData = doc.data();

          // Check if this is old data (has image fields) or new data (has file fields)
          const hasOldImageFields =
            data.image1 !== undefined || data.image2 !== undefined;

          itemsList.push({
            id: doc.id,
            name: data.name || "",
            detail: data.detail || "",
            category: data.category || "",
            // Handle nullable dates - if field doesn't exist or is null, set to null
            startDate: data.startDate !== undefined ? data.startDate : null,
            endDate: data.endDate !== undefined ? data.endDate : null,
            // Handle both old and new field names
            file1: data.file1 || data.image1 || "",
            file2: data.file2 || data.image2 || "",
            // Determine file types based on what's available
            file1Type: data.file1Type || (data.image1 ? "image" : "none"),
            file2Type: data.file2Type || (data.image2 ? "image" : "none"),
            file1Name:
              data.file1Name ||
              (hasOldImageFields && data.image1 ? "Legacy Image" : ""),
            file2Name:
              data.file2Name ||
              (hasOldImageFields && data.image2 ? "Legacy Image" : ""),
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
          });
        });

        // Filter items with end dates and sort by end date ascending
        const itemsWithEndDates = itemsList
          .filter((item) => item.endDate != null)
          .sort((a, b) => (a.endDate || 0) - (b.endDate || 0))
          .slice(0, 5); // Get first 5 items

        setOnlineItems(itemsWithEndDates);
      } catch (error) {
        console.error("Error fetching online items:", error);
      } finally {
        setOnlineItemsLoading(false);
      }
    };

    fetchOnlineItems();
  }, []);

  // Fetch jewellery items
  useEffect(() => {
    const fetchJewelleryItems = async () => {
      try {
        setJewelleryLoading(true);
        const db = getFirestore();
        const itemsRef = collection(db, "jewellery");
        const itemsSnapshot = await getDocs(itemsRef);

        const itemsList: JewelleryItem[] = [];
        itemsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          itemsList.push({
            id: doc.id,
            code: data.code || "",
            description: data.description || "",
            weight: data.weight || 0,
            location: data.location || "",
            boughtFor: data.boughtFor || "",
            purchaseDate: data.purchaseDate || 0,
            imageUrl: data.imageUrl || "",
            active: data.active !== false,
            billId: data.billId,
            lastVerified: data.lastVerified || 0,
            verificationStatus: data.verificationStatus,
            verificationNotes: data.verificationNotes || "",
          });
        });

        setJewelleryItems(itemsList);
      } catch (error) {
        console.error("Error fetching jewellery items:", error);
      } finally {
        setJewelleryLoading(false);
      }
    };

    fetchJewelleryItems();
  }, []);

  // Memoize calculations using all history_detail data and liabilities
  const {
    totalSavings,
    totalDeposits,
    totalLiabilities,
    totalBankBalance,
    emwAmount,
    actualWithdrawalData,
    lastMonthWithdrawal,
  } = useMemo(() => {
    // Use current month history data
    if (currentMonthHistory.length === 0) {
      return {
        totalSavings: 0,
        totalDeposits: 0,
        totalLiabilities: 0,
        totalBankBalance: 0,
        emwAmount: 0,
        actualWithdrawalData: { monthlyRate: 0, totalDrop: 0, monthsCount: 0 },
        lastMonthWithdrawal: 0,
      };
    }

    // Calculate totals from current month history
    let totalSavings = 0;
    let totalDeposits = 0;

    currentMonthHistory.forEach((record) => {
      totalSavings += record.savings;
      totalDeposits += record.deposits;
    });

    // Use current month liabilities
    const totalLiabilities = currentMonthLiabilities;
    const totalBankBalance = totalSavings + totalDeposits - totalLiabilities;

    // Calculate EMW using settings (based on total bank balance after liabilities)
    const emwSettings = getEmwSettings(appSettings);
    const emwAmount = calculateEMW(
      totalBankBalance,
      emwSettings.targetDate,
      emwSettings.interestRate,
    );

    // Calculate monthly balances from all history data and liabilities
    const monthlyBalancesMap = new Map<string, number>();

    allHistoryData.forEach((record) => {
      const month = record.month;
      const totalBalance = record.savings + record.deposits;

      if (monthlyBalancesMap.has(month)) {
        const existing = monthlyBalancesMap.get(month)!;
        monthlyBalancesMap.set(month, existing + totalBalance);
      } else {
        monthlyBalancesMap.set(month, totalBalance);
      }
    });

    // Subtract liabilities for each month
    allLiabilitiesData.forEach((liability) => {
      const month = liability.month;
      if (monthlyBalancesMap.has(month)) {
        const currentBalance = monthlyBalancesMap.get(month)!;
        monthlyBalancesMap.set(month, currentBalance - liability.amount);
      } else {
        monthlyBalancesMap.set(month, -liability.amount);
      }
    });

    // Convert to array and sort by month (newest first)
    const monthlyBalances = Array.from(monthlyBalancesMap.entries())
      .map(([month, totalBalance]) => ({ month, totalBalance }))
      .sort((a, b) => b.month.localeCompare(a.month));

    // Get last 6 months
    const last6Months = monthlyBalances.slice(0, 6);

    // Calculate actual withdrawal rate from last 6 months history
    const calculateActualWithdrawalRate = () => {
      if (last6Months.length < 2)
        return {
          monthlyRate: 0,
          totalDrop: 0,
          monthsCount: 0,
        };

      const firstMonth = last6Months[last6Months.length - 1]; // oldest in the 6-month window
      const lastMonth = last6Months[0]; // newest
      const totalDrop = firstMonth.totalBalance - lastMonth.totalBalance;
      const monthsCount = last6Months.length - 1;
      const monthlyRate = monthsCount > 0 ? totalDrop / monthsCount : 0;

      return {
        monthlyRate,
        totalDrop,
        monthsCount,
      };
    };

    // Calculate last month's withdrawal
    const calculateLastMonthWithdrawal = () => {
      if (monthlyBalances.length < 2) return 0;

      const currentMonthBalance = monthlyBalances[0]?.totalBalance || 0;
      const previousMonthBalance = monthlyBalances[1]?.totalBalance || 0;

      return previousMonthBalance - currentMonthBalance;
    };

    return {
      totalSavings,
      totalDeposits,
      totalLiabilities,
      totalBankBalance,
      emwAmount,
      actualWithdrawalData: calculateActualWithdrawalRate(),
      lastMonthWithdrawal: calculateLastMonthWithdrawal(),
    };
  }, [currentMonthHistory, allHistoryData, allLiabilitiesData, currentMonthLiabilities, appSettings]);

  // Memoize jewellery calculations separately
  const { totalJewelleryWeight, totalJewellerySellValue, totalAssets } =
    useMemo(() => {
      // Calculate jewellery stats (only active items)
      const activeJewelleryItems = jewelleryItems.filter(
        (item) => item.active !== false,
      );
      const totalJewelleryWeight = activeJewelleryItems.reduce(
        (sum, item) => sum + (item.weight || 0),
        0,
      );

      // Calculate sell value exactly as in JewelleryHome component:
      // goldValue = totalWeight * goldRate
      // sellValue = goldValue * (1 - resaleDiscountPercent / 100)
      const goldValue = totalJewelleryWeight * goldRate;
      const totalJewellerySellValue =
        goldValue * (1 - resaleDiscountPercent / 100);

      // Calculate total assets
      const totalAssets = totalBankBalance + totalJewellerySellValue;

      return {
        totalJewelleryWeight,
        totalJewellerySellValue,
        totalAssets,
      };
    }, [jewelleryItems, goldRate, resaleDiscountPercent, totalBankBalance]);

  // Memoize maturities calculations (still need deposits for this)
  const { upcomingMaturities, expiredMaturities } = useMemo(() => {
    if (bankingLoading || deposits.length === 0) {
      return {
        upcomingMaturities: [],
        expiredMaturities: [],
      };
    }

    return {
      upcomingMaturities: getNextMaturities(deposits, 5),
      expiredMaturities: getExpiredMaturities(deposits, 5, true),
    };
  }, [deposits, bankingLoading]);

  // Format weight in grams
  const formatWeight = (weight: number): string => {
    return weight.toFixed(1) + "g";
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

  // Get EMW settings for display
  const emwSettings = getEmwSettings(appSettings);

  // Combined loading state (including liabilities loading)
  const isLoading = historyLoading || bankingLoading || jewelleryLoading || liabilitiesLoading;

  if (isLoading) {
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
  const hasAnyMaturities = hasUpcomingMaturities || hasExpiredMaturities;
  const hasOnlineItems = onlineItems.length > 0;

  // Helper function to calculate days ago for expired items
  const getDaysAgo = (endDate: number): string => {
    const daysAgo = Math.floor((Date.now() - endDate) / (1000 * 60 * 60 * 24));
    if (daysAgo === 0) return "Today";
    if (daysAgo === 1) return "1 day ago";
    return `${daysAgo} days ago`;
  };

  // Helper function to calculate days until for upcoming items
  const getDaysUntil = (endDate: number): number => {
    return Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      {/* Top Row - EMW Cards */}
      <div className="px-2 py-3">
        <div className="grid grid-cols-3 gap-1.5 mb-1">
          {/* EMW Card - Based on history_detail data */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs font-semibold text-blue-800 mb-1 flex items-center justify-center gap-1">
              <span className="bg-blue-500 text-white px-1 py-0.5 rounded text-xs">
                EMW
              </span>
              <span className="hidden sm:inline">Monthly</span>
              <span className="sm:hidden">Mon</span>
            </div>
            <div className="text-base font-bold text-blue-800 leading-tight">
              {formatLakhs(emwAmount)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              @ {emwSettings.interestRate}%
            </div>
          </div>

          {/* Actual Rate Card - Based on history_detail historical data */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs font-semibold text-gray-700 mb-1">
              Actual (6m)
            </div>
            <div
              className={`text-base font-bold leading-tight ${
                actualWithdrawalData.monthlyRate >= emwAmount
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {formatLakhs(actualWithdrawalData.monthlyRate)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">avg/month</div>
          </div>

          {/* Last Month Card - Based on history_detail historical data */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs font-semibold text-gray-700 mb-1">
              Last Month
            </div>
            <div
              className={`text-base font-bold leading-tight ${
                lastMonthWithdrawal >= 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {lastMonthWithdrawal >= 0 ? "-" : "+"}
              {formatLakhs(Math.abs(lastMonthWithdrawal))}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {lastMonthWithdrawal >= 0 ? "withdraw" : "deposit"}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Asset Cards - Based on history_detail data with liabilities */}
      <div className="px-2 py-1">
        <div className="grid grid-cols-3 gap-1.5 mb-1">
          {/* Total Bank Balance Card - From history_detail current month minus liabilities */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs text-gray-500 mb-0.5">Liquid</div>
            <div className="text-base font-bold text-blue-600 leading-tight">
              {formatLakhs(totalBankBalance)}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {formatLakhs(totalSavings)} + {formatLakhs(totalDeposits)} - {formatLakhs(totalLiabilities)}
            </div>
          </div>

          {/* Jewellery Sell Value Card - Still from jewellery table */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center">
            <div className="text-xs text-gray-500 mb-0.5">Ice</div>
            <div className="text-base font-bold text-amber-600 leading-tight">
              {formatLakhs(totalJewellerySellValue)}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {formatWeight(totalJewelleryWeight)} | -{resaleDiscountPercent}%
            </div>
          </div>

          {/* Total Assets Card - Combines history_detail bank balance + jewellery */}
          <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100 min-h-[60px] flex flex-col justify-center bg-gradient-to-br from-blue-50 to-amber-50">
            <div className="text-xs font-semibold text-gray-700 mb-0.5">
              Total
            </div>
            <div className="text-base font-bold text-purple-700 leading-tight">
              {formatLakhs(totalAssets)}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">Liquid + Ice</div>
          </div>
        </div>
      </div>

      {/* Online Items with End Dates Section - Unchanged */}
      <div
        className="bg-white rounded-lg my-3 p-3 sm:p-4 shadow-sm border border-gray-200 shrink-0"
        style={{
          minHeight: hasOnlineItems ? "auto" : "60px",
          marginTop: "8px",
        }}
      >
        <div
          className="flex justify-between items-center mb-2 sm:mb-3"
          style={{ marginBottom: hasOnlineItems ? "12px" : "0" }}
        >
          <div className="text-sm font-semibold text-gray-800">
            Renewals
            {hasOnlineItems && (
              <span className="text-xs text-gray-600 ml-2 font-normal hidden sm:inline">
                ({onlineItems.length} items)
              </span>
            )}
          </div>
          {hasOnlineItems && (
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

        {onlineItemsLoading ? (
          <div className="text-center p-4 sm:p-8 text-gray-600">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 sm:border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2 sm:mb-4"></div>
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
              Loading online items...
            </div>
          </div>
        ) : !hasOnlineItems ? (
          <div className="text-center p-4 sm:p-8 text-gray-600">
            <div className="text-2xl sm:text-4xl mb-2 sm:mb-4 opacity-50">
              📋
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
              No online items with end dates
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">
              Add end dates to online items to track them
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 sm:gap-2">
            {onlineItems.map((item) => {
              const daysUntil = getDaysUntil(item.endDate!);
              const isImmediate = daysUntil <= 1;
              const isExpired = item.endDate! < Date.now();

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white text-xs sm:text-sm flex-nowrap overflow-hidden min-h-6 sm:min-h-8 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                    isExpired
                      ? "opacity-70 text-gray-500"
                      : isImmediate
                        ? "bg-orange-50 border-l-2 border-orange-300"
                        : ""
                  }`}
                  onClick={() => navigate(`/online/items/view/${item.id}`)}
                >
                  <div className="flex items-center overflow-hidden text-center flex-2 min-w-0">
                    <span
                      className={`whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm text-center ${
                        isExpired
                          ? "text-gray-500 line-through"
                          : "text-gray-700"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center overflow-hidden text-center flex-1 min-w-0">
                    <span
                      className={`whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm text-right min-w-[60px] sm:min-w-[70px] ${
                        isExpired ? "text-red-600" : "text-gray-700"
                      }`}
                    >
                      {formatDateShort(item.endDate!)}
                      {isExpired && (
                        <span className="ml-1 sm:ml-2 bg-red-100 text-red-700 text-[10px] sm:text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded whitespace-nowrap">
                          {getDaysAgo(item.endDate!)}
                        </span>
                      )}
                      {!isExpired && isImmediate && (
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
        )}
      </div>

      {/* Maturities Section - Compact (still uses deposits table) */}
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
        <CombinedAssetBarChart />
      </div>
    </>
  );
};

export default MyDataHomepage;