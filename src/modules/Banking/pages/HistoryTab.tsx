import React, { useState, useEffect } from "react";
import HistoryChart from "./HistoryChart";
import { useBankingData } from "../hooks/useBankingData";
import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  getDocs,
  where,
} from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { useSettings } from "../../../contexts/SettingsContext";
import { formatLakhs } from "../../../utils/formatters";
import { LiabilityHistory, MonthlySummary } from "../../../types/banking.types";
import DeleteConfirmationDialog from "../../../components/DeleteConfirmationDialog";

// Date of birth: 17th October 1959
const DOB = new Date(1959, 9, 17); // Month is 0-indexed, so 9 = October

const HistoryTab: React.FC = () => {
  const { settings } = useSettings();
  const { loading: bankingDataLoading } = useBankingData();

  // State for aggregated monthly data
  const [monthlyData, setMonthlyData] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editedSavings, setEditedSavings] = useState("");
  const [editedDeposits, setEditedDeposits] = useState("");
  const [deleteConfirmMonth, setDeleteConfirmMonth] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for age prediction
  const [zeroBalanceAge, setZeroBalanceAge] = useState<number | null>(null);
  const [monthlyConsumption, setMonthlyConsumption] = useState<number | null>(
    null,
  );

  // Get total liabilities for a specific month from liability_history
  const getLiabilitiesForMonth = async (month: string): Promise<number> => {
    try {
      const liabilityHistoryRef = collection(firestore, "liability_history");
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

  // Check if a month has liability records
  const hasLiabilityRecords = async (month: string): Promise<boolean> => {
    try {
      const liabilityHistoryRef = collection(firestore, "liability_history");
      const q = query(liabilityHistoryRef, where("month", "==", month));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error(`Error checking liability records for ${month}:`, error);
      return false;
    }
  };

  // Fetch and aggregate data from history_detail table
  useEffect(() => {
    const fetchAndAggregateHistoryDetail = async () => {
      try {
        setLoading(true);
        
        const historyDetailRef = collection(firestore, "history_detail");
        const q = query(historyDetailRef);
        const querySnapshot = await getDocs(q);

        // Map to store aggregated data by month
        const aggregatedData = new Map<
          string,
          { savings: number; deposits: number; hasStoredLiabilities: boolean }
        >();

        // First pass: collect all months and aggregate savings/deposits
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          const month = data.month;

          if (!month || month.trim() === "") {
            continue;
          }

          const savings = data.savings || 0;
          const deposits = data.deposits || 0;

          if (aggregatedData.has(month)) {
            const existing = aggregatedData.get(month)!;
            aggregatedData.set(month, {
              savings: existing.savings + savings,
              deposits: existing.deposits + deposits,
              hasStoredLiabilities: existing.hasStoredLiabilities,
            });
          } else {
            // Check if this month has liability records
            const hasLiabilities = await hasLiabilityRecords(month);
            
            aggregatedData.set(month, {
              savings: savings,
              deposits: deposits,
              hasStoredLiabilities: hasLiabilities,
            });
          }
        }

        // Convert map to array of MonthlySummary
        const monthlySummaries: MonthlySummary[] = [];
        let hasMissingLiabilities = false;
        
        for (const [month, value] of aggregatedData) {
          const liabilities = await getLiabilitiesForMonth(month);
          if (!value.hasStoredLiabilities) {
            hasMissingLiabilities = true;
          }
          
          const totalSavingsDeposits = value.savings + value.deposits;
          const totalAssets = totalSavingsDeposits - liabilities;
          
          monthlySummaries.push({
            month: month,
            savings: value.savings,
            deposits: value.deposits,
            liabilities: liabilities,
            totalAssets: totalAssets,
            hasStoredLiabilities: value.hasStoredLiabilities,
          });
        }

        setMonthlyData(monthlySummaries);
        setShowWarning(hasMissingLiabilities);
      } catch (error) {
        console.error("Error fetching history_detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndAggregateHistoryDetail();
  }, []);

  // Calculate target age from EMW_Date in settings
  const getTargetAgeFromSettings = (): number | null => {
    if (!settings?.EMW_Date) return null;

    try {
      const [year, month] = settings.EMW_Date.split("-").map(Number);
      const targetDate = new Date(year, month - 1, 1);

      let age = targetDate.getFullYear() - DOB.getFullYear();
      const monthDiff = targetDate.getMonth() - DOB.getMonth();

      if (monthDiff < 0) {
        age--;
      }

      return age;
    } catch (e) {
      return null;
    }
  };

  // Calculate age when balance will become zero using aggregated data
  useEffect(() => {
    if (monthlyData.length < 2) {
      setZeroBalanceAge(null);
      setMonthlyConsumption(null);
      return;
    }

    const sortedHistory = [...monthlyData]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    if (sortedHistory.length < 2) return;

    const assets = sortedHistory.map((record) => record.totalAssets);
    const firstAsset = assets[0];
    const lastAsset = assets[assets.length - 1];
    const monthsDiff = sortedHistory.length - 1;
    const totalReduction = firstAsset - lastAsset;
    const monthlyRate = totalReduction / monthsDiff;

    setMonthlyConsumption(monthlyRate / 100000);

    if (monthlyRate > 0) {
      const monthsUntilZero = lastAsset / monthlyRate;
      const lastMonthStr = sortedHistory[sortedHistory.length - 1].month;
      const [year, month] = lastMonthStr.split("-").map(Number);
      const lastRecordDate = new Date(year, month - 1, 1);
      const zeroDate = new Date(lastRecordDate);
      zeroDate.setMonth(zeroDate.getMonth() + Math.ceil(monthsUntilZero));

      let age = zeroDate.getFullYear() - DOB.getFullYear();
      const m = zeroDate.getMonth() - DOB.getMonth();
      if (m < 0 || (m === 0 && zeroDate.getDate() < DOB.getDate())) {
        age--;
      }

      setZeroBalanceAge(age);
    } else {
      setZeroBalanceAge(null);
    }
  }, [monthlyData]);

  const rupeesToLakhs = (rupees: number): number => rupees / 100000;

  const startEditing = (month: string, savings: number, deposits: number) => {
    setEditingMonth(month);
    setEditedSavings(rupeesToLakhs(savings).toFixed(2));
    setEditedDeposits(rupeesToLakhs(deposits).toFixed(2));
  };

  const cancelEditing = () => {
    setEditingMonth(null);
    setEditedSavings("");
    setEditedDeposits("");
  };

  const saveEdits = async (month: string) => {
    try {
      setIsSaving(true);
      const savingsLakhs = parseFloat(editedSavings);
      const depositsLakhs = parseFloat(editedDeposits);

      if (isNaN(savingsLakhs) || isNaN(depositsLakhs)) {
        alert("Please enter valid numbers");
        setIsSaving(false);
        return;
      }

      const newSavingsRupees = savingsLakhs * 100000;
      const newDepositsRupees = depositsLakhs * 100000;

      const historyDetailRef = collection(firestore, "history_detail");
      const q = query(historyDetailRef);
      const querySnapshot = await getDocs(q);

      const recordsToUpdate: Array<{
        id: string;
        currentSavings: number;
        currentDeposits: number;
      }> = [];
      let currentTotalSavings = 0;
      let currentTotalDeposits = 0;

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        if (data.month === month) {
          const savings = data.savings || 0;
          const deposits = data.deposits || 0;
          recordsToUpdate.push({
            id: doc.id,
            currentSavings: savings,
            currentDeposits: deposits,
          });
          currentTotalSavings += savings;
          currentTotalDeposits += deposits;
        }
      }

      if (recordsToUpdate.length === 0) {
        alert("No records found for this month");
        setIsSaving(false);
        return;
      }

      const savingsDiff = newSavingsRupees - currentTotalSavings;
      const depositsDiff = newDepositsRupees - currentTotalDeposits;

      const updatePromises = recordsToUpdate.map(async (record, index) => {
        const recordRef = doc(firestore, "history_detail", record.id);
        let updatedSavings = record.currentSavings;
        let updatedDeposits = record.currentDeposits;

        if (index === 0) {
          updatedSavings = record.currentSavings + savingsDiff;
          updatedDeposits = record.currentDeposits + depositsDiff;
          updatedSavings = Math.max(0, updatedSavings);
          updatedDeposits = Math.max(0, updatedDeposits);
        }

        return updateDoc(recordRef, {
          savings: updatedSavings,
          deposits: updatedDeposits,
          updatedAt: new Date(),
        });
      });

      await Promise.all(updatePromises);

      // Refresh the data
      const refreshSnapshot = await getDocs(q);
      const aggregatedData = new Map<
        string,
        { savings: number; deposits: number; hasStoredLiabilities: boolean }
      >();

      for (const doc of refreshSnapshot.docs) {
        const data = doc.data();
        const monthKey = data.month;
        if (!monthKey || monthKey.trim() === "") continue;

        const savings = data.savings || 0;
        const deposits = data.deposits || 0;

        const hasLiabilities = await hasLiabilityRecords(monthKey);

        if (aggregatedData.has(monthKey)) {
          const existing = aggregatedData.get(monthKey)!;
          aggregatedData.set(monthKey, {
            savings: existing.savings + savings,
            deposits: existing.deposits + deposits,
            hasStoredLiabilities: existing.hasStoredLiabilities && hasLiabilities,
          });
        } else {
          aggregatedData.set(monthKey, {
            savings: savings,
            deposits: deposits,
            hasStoredLiabilities: hasLiabilities,
          });
        }
      }

      // Get liabilities for each month
      const updatedMonthlyData: MonthlySummary[] = [];
      let hasMissingLiabilities = false;
      
      for (const [monthKey, value] of aggregatedData) {
        const liabilities = await getLiabilitiesForMonth(monthKey);
        if (!value.hasStoredLiabilities) {
          hasMissingLiabilities = true;
        }
        
        const totalSavingsDeposits = value.savings + value.deposits;
        const totalAssets = totalSavingsDeposits - liabilities;
        
        updatedMonthlyData.push({
          month: monthKey,
          savings: value.savings,
          deposits: value.deposits,
          liabilities: liabilities,
          totalAssets: totalAssets,
          hasStoredLiabilities: value.hasStoredLiabilities,
        });
      }

      setMonthlyData(updatedMonthlyData);
      setShowWarning(hasMissingLiabilities);
      cancelEditing();
      alert("✓ History updated successfully!");
    } catch (error: any) {
      console.error("Error updating history:", error);
      alert(`Failed to update: ${error.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirmMonth) return;

    setIsDeleting(true);
    try {
      const historyDetailRef = collection(firestore, "history_detail");
      const q = query(historyDetailRef);
      const querySnapshot = await getDocs(q);

      const deletePromises: Promise<void>[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        if (data.month === deleteConfirmMonth) {
          deletePromises.push(deleteDoc(doc.ref));
        }
      }

      await Promise.all(deletePromises);

      // Refresh the data
      const refreshSnapshot = await getDocs(q);
      const aggregatedData = new Map<
        string,
        { savings: number; deposits: number; hasStoredLiabilities: boolean }
      >();

      for (const doc of refreshSnapshot.docs) {
        const data = doc.data();
        const monthKey = data.month;
        if (!monthKey || monthKey.trim() === "") continue;

        const savings = data.savings || 0;
        const deposits = data.deposits || 0;

        const hasLiabilities = await hasLiabilityRecords(monthKey);

        if (aggregatedData.has(monthKey)) {
          const existing = aggregatedData.get(monthKey)!;
          aggregatedData.set(monthKey, {
            savings: existing.savings + savings,
            deposits: existing.deposits + deposits,
            hasStoredLiabilities: existing.hasStoredLiabilities && hasLiabilities,
          });
        } else {
          aggregatedData.set(monthKey, {
            savings: savings,
            deposits: deposits,
            hasStoredLiabilities: hasLiabilities,
          });
        }
      }

      const updatedMonthlyData: MonthlySummary[] = [];
      let hasMissingLiabilities = false;
      
      for (const [monthKey, value] of aggregatedData) {
        const liabilities = await getLiabilitiesForMonth(monthKey);
        if (!value.hasStoredLiabilities) {
          hasMissingLiabilities = true;
        }
        
        const totalSavingsDeposits = value.savings + value.deposits;
        const totalAssets = totalSavingsDeposits - liabilities;
        
        updatedMonthlyData.push({
          month: monthKey,
          savings: value.savings,
          deposits: value.deposits,
          liabilities: liabilities,
          totalAssets: totalAssets,
          hasStoredLiabilities: value.hasStoredLiabilities,
        });
      }

      setMonthlyData(updatedMonthlyData);
      setShowWarning(hasMissingLiabilities);
      setDeleteConfirmMonth(null);
      alert("✓ History records deleted!");
    } catch (error: any) {
      console.error("Error deleting history:", error);
      alert(`Failed to delete: ${error.message || "Unknown error"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredHistory = [...monthlyData]
    .filter((record) => record.month && record.month.trim() !== "")
    .sort((a, b) => b.month.localeCompare(a.month));

  if (loading || bankingDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-5">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading history...</p>
      </div>
    );
  }

  const targetAge = getTargetAgeFromSettings();

  return (
    <div className="px-2 py-2">
      {/* Warning for missing historical liabilities */}
      {showWarning && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-sm">⚠️</div>
            <div className="flex-1">
              <div className="text-xs font-medium text-yellow-800">
                Note: Some months have no liability records
              </div>
              <div className="text-[10px] text-yellow-700 mt-0.5">
                Use the Liability History tab to add liability records for each month.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Age Prediction Card */}
      {monthlyData.length >= 2 && targetAge !== null && (
        <div className="mb-3">
          {zeroBalanceAge !== null && monthlyConsumption !== null ? (
            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 shadow-sm">
              <div className="flex items-start gap-2">
                <div className="text-xl">🔮</div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">
                    Balance Zero Forecast
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-lg font-bold text-gray-800">
                      Age {zeroBalanceAge}
                    </span>
                    <span className="text-xs text-gray-500">
                      (Target: age {targetAge})
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Consumption: <span className="font-semibold text-amber-700">
                      {monthlyConsumption.toFixed(2)}L
                    </span>
                    {zeroBalanceAge < targetAge && (
                      <span className="block text-green-600 mt-0.5 text-xs">
                        ✓ Will reach zero before target age
                      </span>
                    )}
                    {zeroBalanceAge > targetAge && (
                      <span className="block text-orange-600 mt-0.5 text-xs">
                        ⚠ Will reach zero after target age
                      </span>
                    )}
                    {zeroBalanceAge === targetAge && (
                      <span className="block text-blue-600 mt-0.5 text-xs">
                        ✓ Will reach zero exactly at target age
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-2">
                <div className="text-xl">📈</div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                    Balance Trend
                  </div>
                  <div className="text-xs text-gray-700">
                    {monthlyConsumption !== null && monthlyConsumption <= 0
                      ? "Your balance is increasing or stable. No zero balance predicted."
                      : "Your balance is not decreasing. No zero balance predicted."}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="bg-white mb-3 border border-gray-200 rounded-lg p-2">
        <HistoryChart
          history={monthlyData
            .filter((item) => item.month && item.month.trim() !== "")
            .map((item) => ({
              month: item.month,
              savings: item.savings,
              totalDeposits: item.deposits,
              totalAssets: item.totalAssets,
            }))}
          compact={true}
        />
      </div>

      {/* Table section - Mobile Optimized with larger fonts */}
      <div>
        <div className="flex justify-between items-center py-2 bg-white rounded-t-lg px-2 mb-1">
          <div className="flex items-center gap-1">
            <span>📊</span>
            <span className="text-xs font-semibold text-gray-800">History</span>
          </div>
          <div className="text-[10px] text-gray-600">
            {filteredHistory.length} month(s)
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 px-5 text-gray-500">
            <div className="text-4xl mb-4 opacity-50">📄</div>
            <div className="text-sm font-medium text-gray-600 mb-2">
              No history records
            </div>
            <div className="text-xs text-gray-400">
              Add history records to see them here
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header - Mobile optimized with grid */}
            <div className="grid grid-cols-5 gap-1 py-2 bg-gray-50 border-b border-gray-200 font-semibold text-[11px] text-gray-700 px-2">
              <div className="col-span-1 text-left">Month</div>
              <div className="col-span-1 text-right">Wtr</div>
              <div className="col-span-1 text-right">Stm</div>
              <div className="col-span-1 text-right">Lbl</div>
              <div className="col-span-1 text-right">Liq</div>
              {settings?.showDelete && <div className="col-span-1 text-center w-12">Act</div>}
            </div>

            {/* Table Rows - Mobile optimized with grid */}
            {filteredHistory.map((record) => {
              const isEditing = editingMonth === record.month;

              return (
                <div
                  key={record.month}
                  className={`grid grid-cols-5 gap-1 py-2 border-b border-gray-100 px-2 hover:bg-gray-50 last:border-b-0 ${
                    isEditing ? "bg-yellow-50" : ""
                  } ${!record.hasStoredLiabilities && !isEditing ? "bg-purple-50/30" : ""}`}
                >
                  {/* Month */}
                  <div className="col-span-1 text-[11px] text-gray-800 truncate font-medium">
                    {record.month}
                    {!record.hasStoredLiabilities && !isEditing && (
                      <span className="ml-0.5 text-[9px] text-purple-500" title="No liability records">*</span>
                    )}
                  </div>

                  {/* Savings - Water */}
                  <div className="col-span-1">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedSavings}
                        onChange={(e) => setEditedSavings(e.target.value)}
                        className="w-full p-1 text-[11px] border border-gray-300 rounded text-right"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        disabled={isSaving}
                      />
                    ) : (
                      <div className="text-[11px] font-semibold text-green-600 text-right">
                        {formatLakhs(record.savings)}
                      </div>
                    )}
                  </div>

                  {/* Deposits - Steam */}
                  <div className="col-span-1">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedDeposits}
                        onChange={(e) => setEditedDeposits(e.target.value)}
                        className="w-full p-1 text-[11px] border border-gray-300 rounded text-right"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        disabled={isSaving}
                      />
                    ) : (
                      <div className="text-[11px] font-semibold text-orange-500 text-right">
                        {formatLakhs(record.deposits)}
                      </div>
                    )}
                  </div>

                  {/* Liabilities */}
                  <div className="col-span-1">
                    <div className="text-[11px] font-semibold text-purple-600 text-right">
                      {formatLakhs(record.liabilities)}
                    </div>
                  </div>

                  {/* Total Assets - Liquid */}
                  <div className="col-span-1">
                    <div className="text-[11px] font-semibold text-blue-600 text-right">
                      {formatLakhs(record.totalAssets)}
                    </div>
                  </div>

                  {/* Actions */}
                  {settings?.showDelete && (
                    <div className="col-span-1 flex gap-1 justify-end">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdits(record.month)}
                            className="w-6 h-6 p-0 bg-green-500 text-white text-[10px] rounded flex items-center justify-center hover:bg-green-600 disabled:opacity-50 transition-colors"
                            disabled={isSaving}
                            title="Save"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="w-6 h-6 p-0 bg-gray-400 text-white text-[10px] rounded flex items-center justify-center hover:bg-gray-500 transition-colors"
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              startEditing(
                                record.month,
                                record.savings,
                                record.deposits,
                              )
                            }
                            className="w-6 h-6 p-0 bg-blue-500 text-white text-[10px] rounded flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 transition-colors"
                            disabled={editingMonth !== null}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteConfirmMonth(record.month)}
                            className="w-6 h-6 p-0 bg-red-500 text-white text-[10px] rounded flex items-center justify-center hover:bg-red-600 disabled:opacity-50 transition-colors"
                            disabled={editingMonth !== null || isDeleting}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog - Using reusable component */}
      <DeleteConfirmationDialog
        isOpen={deleteConfirmMonth !== null}
        onClose={() => {
          setDeleteConfirmMonth(null);
          setIsDeleting(false);
        }}
        onConfirm={executeDelete}
        title="Delete History Records"
        message={`Are you sure you want to delete ALL records for "${deleteConfirmMonth}"? This action cannot be undone.`}
        itemName={`${deleteConfirmMonth} history records`}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default HistoryTab;