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
} from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { useSettings } from "../../../contexts/SettingsContext";

// Date of birth: 17th October 1959
const DOB = new Date(1959, 9, 17); // Month is 0-indexed, so 9 = October

// Define the aggregated monthly data
interface MonthlySummary {
  month: string;
  savings: number;
  deposits: number;
}

const HistoryTab: React.FC = () => {
  const { settings } = useSettings();
  const { loading: bankingDataLoading } = useBankingData();

  // State for aggregated monthly data
  const [monthlyData, setMonthlyData] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editedSavings, setEditedSavings] = useState("");
  const [editedDeposits, setEditedDeposits] = useState("");
  const [deleteConfirmMonth, setDeleteConfirmMonth] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  // State for age prediction
  const [zeroBalanceAge, setZeroBalanceAge] = useState<number | null>(null);
  const [monthlyConsumption, setMonthlyConsumption] = useState<number | null>(
    null,
  );

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
          { savings: number; deposits: number }
        >();

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const month = data.month;

          // Skip records with null, undefined, or empty month
          if (!month || month.trim() === "") {
            console.log("Skipping record with empty month:", doc.id);
            return;
          }

          const savings = data.savings || 0;
          const deposits = data.deposits || 0;

          if (aggregatedData.has(month)) {
            const existing = aggregatedData.get(month)!;
            aggregatedData.set(month, {
              savings: existing.savings + savings,
              deposits: existing.deposits + deposits,
            });
          } else {
            aggregatedData.set(month, {
              savings: savings,
              deposits: deposits,
            });
          }
        });

        // Convert map to array of MonthlySummary
        const monthlySummaries: MonthlySummary[] = [];
        aggregatedData.forEach((value, month) => {
          monthlySummaries.push({
            month: month,
            savings: value.savings,
            deposits: value.deposits,
          });
        });

        setMonthlyData(monthlySummaries);
      } catch (error) {
        console.error("Error fetching history_detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndAggregateHistoryDetail();
  }, []);

  // Calculate target age from EMW_Date in settings - EXACT SAME LOGIC as SettingsPage
  const getTargetAgeFromSettings = (): number | null => {
    if (!settings?.EMW_Date) return null;

    try {
      const [year, month] = settings.EMW_Date.split("-").map(Number);
      // Use the first day of the month (matching SettingsPage logic)
      const targetDate = new Date(year, month - 1, 1);

      let age = targetDate.getFullYear() - DOB.getFullYear();
      const monthDiff = targetDate.getMonth() - DOB.getMonth();

      // Adjust age if birthday hasn't occurred yet in the target month
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

    // Get last 6 months, sorted chronologically
    const sortedHistory = [...monthlyData]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    if (sortedHistory.length < 2) return;

    // Calculate total balance for each month (savings + deposits)
    const balances = sortedHistory.map(
      (record) => record.savings + record.deposits,
    );

    // Get first and last month balances
    const firstBalance = balances[0];
    const lastBalance = balances[balances.length - 1];

    // Calculate monthly consumption rate
    const monthsDiff = sortedHistory.length - 1;
    const totalReduction = firstBalance - lastBalance;
    const monthlyRate = totalReduction / monthsDiff;

    // Store monthly consumption for display
    setMonthlyConsumption(monthlyRate / 100000);

    if (monthlyRate > 0) {
      // Calculate months until zero
      const monthsUntilZero = lastBalance / monthlyRate;

      // Calculate date when balance becomes zero
      const lastMonthStr = sortedHistory[sortedHistory.length - 1].month;
      const [year, month] = lastMonthStr.split("-").map(Number);

      // Create date object for last record (first day of that month)
      const lastRecordDate = new Date(year, month - 1, 1);

      // Add months until zero
      const zeroDate = new Date(lastRecordDate);
      zeroDate.setMonth(zeroDate.getMonth() + Math.ceil(monthsUntilZero));

      // Calculate age at that date (rounded)
      let age = zeroDate.getFullYear() - DOB.getFullYear();
      const m = zeroDate.getMonth() - DOB.getMonth();
      if (m < 0 || (m === 0 && zeroDate.getDate() < DOB.getDate())) {
        age--;
      }

      setZeroBalanceAge(age);
    } else {
      // If balance is increasing or not decreasing
      setZeroBalanceAge(null);
    }
  }, [monthlyData]);

  const rupeesToLakhs = (rupees: number): number => rupees / 100000;
  const formatLakhs = (lakhs: number): string => lakhs.toFixed(2);

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

      // Get all records for this month from history_detail
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

      querySnapshot.forEach((doc) => {
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
      });

      if (recordsToUpdate.length === 0) {
        alert("No records found for this month");
        setIsSaving(false);
        return;
      }

      // Calculate the difference to distribute
      const savingsDiff = newSavingsRupees - currentTotalSavings;
      const depositsDiff = newDepositsRupees - currentTotalDeposits;

      // Distribute the difference proportionally across records
      // For simplicity, we'll update the first record with the total difference
      // Alternatively, you could distribute proportionally based on current values

      const updatePromises = recordsToUpdate.map(async (record, index) => {
        const recordRef = doc(firestore, "history_detail", record.id);
        let updatedSavings = record.currentSavings;
        let updatedDeposits = record.currentDeposits;

        if (index === 0) {
          // Apply all differences to the first record
          updatedSavings = record.currentSavings + savingsDiff;
          updatedDeposits = record.currentDeposits + depositsDiff;

          // Ensure no negative values
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

      // Refresh the aggregated data
      const refreshSnapshot = await getDocs(q);
      const aggregatedData = new Map<
        string,
        { savings: number; deposits: number }
      >();

      refreshSnapshot.forEach((doc) => {
        const data = doc.data();
        const monthKey = data.month;

        // Skip records with null, undefined, or empty month
        if (!monthKey || monthKey.trim() === "") {
          return;
        }

        const savings = data.savings || 0;
        const deposits = data.deposits || 0;

        if (aggregatedData.has(monthKey)) {
          const existing = aggregatedData.get(monthKey)!;
          aggregatedData.set(monthKey, {
            savings: existing.savings + savings,
            deposits: existing.deposits + deposits,
          });
        } else {
          aggregatedData.set(monthKey, {
            savings: savings,
            deposits: deposits,
          });
        }
      });

      const updatedMonthlyData: MonthlySummary[] = [];
      aggregatedData.forEach((value, monthKey) => {
        updatedMonthlyData.push({
          month: monthKey,
          savings: value.savings,
          deposits: value.deposits,
        });
      });

      setMonthlyData(updatedMonthlyData);
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

    if (
      !confirm(
        `Are you sure you want to delete ALL records for ${deleteConfirmMonth}?`,
      )
    ) {
      setDeleteConfirmMonth(null);
      return;
    }

    try {
      // Get all records for this month from history_detail
      const historyDetailRef = collection(firestore, "history_detail");
      const q = query(historyDetailRef);
      const querySnapshot = await getDocs(q);

      const deletePromises: Promise<void>[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.month === deleteConfirmMonth) {
          const recordRef = doc.ref;
          deletePromises.push(deleteDoc(recordRef));
        }
      });

      await Promise.all(deletePromises);

      // Refresh the aggregated data
      const refreshSnapshot = await getDocs(q);
      const aggregatedData = new Map<
        string,
        { savings: number; deposits: number }
      >();

      refreshSnapshot.forEach((doc) => {
        const data = doc.data();
        const monthKey = data.month;

        // Skip records with null, undefined, or empty month
        if (!monthKey || monthKey.trim() === "") {
          return;
        }

        const savings = data.savings || 0;
        const deposits = data.deposits || 0;

        if (aggregatedData.has(monthKey)) {
          const existing = aggregatedData.get(monthKey)!;
          aggregatedData.set(monthKey, {
            savings: existing.savings + savings,
            deposits: existing.deposits + deposits,
          });
        } else {
          aggregatedData.set(monthKey, {
            savings: savings,
            deposits: deposits,
          });
        }
      });

      const updatedMonthlyData: MonthlySummary[] = [];
      aggregatedData.forEach((value, monthKey) => {
        updatedMonthlyData.push({
          month: monthKey,
          savings: value.savings,
          deposits: value.deposits,
        });
      });

      setMonthlyData(updatedMonthlyData);
      setDeleteConfirmMonth(null);
      alert("✓ History records deleted!");
    } catch (error: any) {
      console.error("Error deleting history:", error);
      alert(`Failed to delete: ${error.message || "Unknown error"}`);
    }
  };

  // Filter out any entries with empty month before sorting and displaying
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
    <div className="flex flex-col h-full px-2 py-2">
      {/* Age Prediction Card - Positioned at the top */}
      {monthlyData.length >= 2 && targetAge !== null && (
        <div className="mb-3">
          {zeroBalanceAge !== null && monthlyConsumption !== null ? (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔮</div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">
                    Balance Zero Forecast
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xl font-bold text-gray-800">
                      Age {zeroBalanceAge}
                    </span>
                    <span className="text-xs text-gray-500">
                      (Target: age {targetAge})
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1.5">
                    Consumption Rate - 6 months:{" "}
                    <span className="font-semibold text-amber-700">
                      {monthlyConsumption.toFixed(2)}
                    </span>
                    {zeroBalanceAge < targetAge && (
                      <span className="block text-green-600 mt-0.5">
                        ✓ Will reach zero before target age
                      </span>
                    )}
                    {zeroBalanceAge > targetAge && (
                      <span className="block text-orange-600 mt-0.5">
                        ⚠ Will reach zero after target age
                      </span>
                    )}
                    {zeroBalanceAge === targetAge && (
                      <span className="block text-blue-600 mt-0.5">
                        ✓ Will reach zero exactly at target age
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="text-2xl">📈</div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                    Balance Trend
                  </div>
                  <div className="text-sm text-gray-700">
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

      {/* Chart with margin - Use aggregated data */}
      <div className="bg-white mb-3 border border-gray-200 rounded-lg p-2">
        <HistoryChart
          history={monthlyData
            .filter((item) => item.month && item.month.trim() !== "")
            .map((item) => ({
              month: item.month,
              savings: item.savings,
              totalDeposits: item.deposits,
            }))}
          compact={true}
        />
      </div>

      {/* Table with proper margins */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center py-2 bg-white rounded-t-lg px-2 mb-1">
          <div className="flex items-center gap-1">
            <span>📊</span>
            <span className="text-xs font-semibold text-gray-800">History</span>
          </div>
          <div className="text-[10px] text-gray-600">
            {filteredHistory.length} month
            {filteredHistory.length !== 1 ? "s" : ""}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 px-5 text-gray-500">
            <div className="text-4xl mb-4 opacity-50">📄</div>
            <div className="text-base font-medium text-gray-600 mb-2">
              No history records
            </div>
            <div className="text-sm text-gray-400">
              Add history records to see them here
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="flex items-center py-2 bg-gray-50 border-b border-gray-200 font-semibold text-[10px] text-gray-700 px-2">
              <div className="w-1/4 px-1">Month</div>
              <div className="w-1/4 px-1 text-right">Water</div>
              <div className="w-1/4 px-1 text-right">Steam</div>
              <div className="w-1/4 px-1 text-right">Liquid</div>
              {settings?.showDelete && <div className="w-14 px-1"></div>}
            </div>

            {/* Table Rows - Showing aggregated data */}
            {filteredHistory.map((record) => {
              const isEditing = editingMonth === record.month;
              const savingsValue = rupeesToLakhs(record.savings);
              const depositsValue = rupeesToLakhs(record.deposits);
              const totalValue = savingsValue + depositsValue;

              return (
                <div
                  key={record.month}
                  className="flex items-center py-2 border-b border-gray-100 min-h-8 px-2 hover:bg-gray-50 last:border-b-0"
                >
                  {/* Month */}
                  <div className="w-1/4 px-1 text-xs text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap">
                    {record.month}
                  </div>

                  {/* Savings */}
                  <div className="w-1/4 px-1">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedSavings}
                        onChange={(e) => setEditedSavings(e.target.value)}
                        className="w-full max-w-20 p-1 border border-gray-300 rounded text-xs"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        disabled={isSaving}
                      />
                    ) : (
                      <div className="text-xs font-semibold text-green-600 text-right">
                        {formatLakhs(savingsValue)}
                      </div>
                    )}
                  </div>

                  {/* Deposits */}
                  <div className="w-1/4 px-1">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedDeposits}
                        onChange={(e) => setEditedDeposits(e.target.value)}
                        className="w-full max-w-20 p-1 border border-gray-300 rounded text-xs"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        disabled={isSaving}
                      />
                    ) : (
                      <div className="text-xs font-semibold text-orange-500 text-right">
                        {formatLakhs(depositsValue)}
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="w-1/4 px-1">
                    <div className="text-xs font-semibold text-blue-600 text-right">
                      {formatLakhs(totalValue)}
                    </div>
                  </div>

                  {/* Actions */}
                  {settings?.showDelete && (
                    <div className="w-14 flex gap-1 px-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdits(record.month)}
                            className="w-7 h-7 p-0 bg-green-500 text-white text-xs rounded flex items-center justify-center hover:bg-green-600 disabled:opacity-50 transition-colors"
                            disabled={isSaving}
                            title="Save"
                          >
                            {isSaving ? "⏳" : "✓"}
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="w-7 h-7 p-0 bg-gray-400 text-white text-xs rounded flex items-center justify-center hover:bg-gray-500 transition-colors"
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
                            className="w-7 h-7 p-0 bg-blue-500 text-white text-xs rounded flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 transition-colors"
                            disabled={editingMonth !== null}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteConfirmMonth(record.month)}
                            className="w-7 h-7 p-0 bg-red-500 text-white text-xs rounded flex items-center justify-center hover:bg-red-600 disabled:opacity-50 transition-colors"
                            disabled={editingMonth !== null}
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

      {/* Delete Confirmation */}
      {deleteConfirmMonth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-2xl mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-5 leading-relaxed">
              Are you sure you want to delete ALL history records for{" "}
              <strong>{deleteConfirmMonth}</strong>?
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeleteConfirmMonth(null)}
                className="flex-1 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium cursor-pointer hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 py-2.5 bg-red-500 border-none rounded-lg text-white font-medium cursor-pointer hover:bg-red-600 transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
