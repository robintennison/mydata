import React, { useState, useEffect } from "react";
import { firestore } from "../../../lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
  doc,
  writeBatch,
} from "firebase/firestore";
import { useSettings } from "../../../contexts/SettingsContext";

interface Account {
  id: string;
  acctCode: string;
  acctDetails: string;
  mpin: string;
  savingsAmount: number;
  updatedAt: Date;
}

interface HistoryDetail {
  acctCode: string;
  month: string;
  savings: number;
  deposits: number;
}

interface EditedValues {
  [acctCode: string]: {
    savings: number;
    deposits: number;
  };
}

const HistoryDetailTab: React.FC = () => {
  const { settings } = useSettings();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [historyData, setHistoryData] = useState<Map<string, HistoryDetail>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [editedValues, setEditedValues] = useState<EditedValues>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasLoadedPreviousData, setHasLoadedPreviousData] = useState(false);
  const [previousMonthAvailable, setPreviousMonthAvailable] = useState<
    string | null
  >(null);

  // Available months for dropdown (last 12 months + next 6 months)
  const availableMonths = React.useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = -12; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months.push(monthStr);
    }
    return months;
  }, []);

  // Load accounts and history data
  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  // Reset loaded flag when month changes
  useEffect(() => {
    setHasLoadedPreviousData(false);
    checkPreviousMonthData();
  }, [selectedMonth]);

  const checkPreviousMonthData = async () => {
    try {
      const [year, month] = selectedMonth.split("-");
      const previousMonth = new Date(parseInt(year), parseInt(month) - 2, 1);
      const previousMonthStr = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, "0")}`;

      const historyRef = collection(firestore, "history_detail");
      const q = query(historyRef, where("month", "==", previousMonthStr));
      const historySnapshot = await getDocs(q);

      if (!historySnapshot.empty) {
        setPreviousMonthAvailable(previousMonthStr);
      } else {
        setPreviousMonthAvailable(null);
      }
    } catch (error) {
      console.error("Error checking previous month data:", error);
      setPreviousMonthAvailable(null);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setStatusMessage(null);
      setEditedValues({});
      setHasChanges(false);

      // Load all accounts
      const accountsRef = collection(firestore, "accounts");
      const accountsSnapshot = await getDocs(accountsRef);
      const accountsList = accountsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Account[];

      // Sort accounts by acctCode
      const sortedAccounts = [...accountsList].sort((a, b) =>
        a.acctCode.localeCompare(b.acctCode),
      );
      setAccounts(sortedAccounts);

      // Load history for selected month
      const historyRef = collection(firestore, "history_detail");
      const q = query(historyRef, where("month", "==", selectedMonth));
      const historySnapshot = await getDocs(q);

      const historyMap = new Map<string, HistoryDetail>();
      historySnapshot.docs.forEach((doc) => {
        const data = doc.data() as HistoryDetail;
        historyMap.set(data.acctCode, data);
      });
      setHistoryData(historyMap);

      // Initialize edited values with existing data if any
      const initialEdits: EditedValues = {};
      sortedAccounts.forEach((account) => {
        const record = historyMap.get(account.acctCode);
        initialEdits[account.acctCode] = {
          savings: record?.savings || 0,
          deposits: record?.deposits || 0,
        };
      });
      setEditedValues(initialEdits);

      // Check if there's any data for this month
      if (historyMap.size > 0) {
        setHasLoadedPreviousData(true);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      showStatus("error", `Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load previous month's data
  const loadPreviousMonthData = async () => {
    if (!accounts.length || hasLoadedPreviousData) return;

    try {
      setSaving(true);

      const [year, month] = selectedMonth.split("-");
      const previousMonth = new Date(parseInt(year), parseInt(month) - 2, 1);
      const previousMonthStr = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, "0")}`;

      const historyRef = collection(firestore, "history_detail");
      const q = query(historyRef, where("month", "==", previousMonthStr));
      const historySnapshot = await getDocs(q);

      const previousDataMap = new Map<string, HistoryDetail>();
      historySnapshot.docs.forEach((doc) => {
        const data = doc.data() as HistoryDetail;
        previousDataMap.set(data.acctCode, data);
      });

      // Initialize edited values with previous month's data
      const newEdits: EditedValues = { ...editedValues };
      accounts.forEach((account) => {
        const previousRecord = previousDataMap.get(account.acctCode);
        if (previousRecord) {
          newEdits[account.acctCode] = {
            savings: previousRecord.savings,
            deposits: previousRecord.deposits,
          };
        }
      });

      setEditedValues(newEdits);
      setHasChanges(true);
      setHasLoadedPreviousData(true);
      showStatus("success", `Loaded data from ${previousMonthStr}`);
    } catch (error: any) {
      console.error("Error loading previous month data:", error);
      showStatus(
        "error",
        `Failed to load previous month data: ${error.message}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Improved value change handler that doesn't reformat during editing
  const handleValueChange = (
    acctCode: string,
    field: "savings" | "deposits",
    rawValue: string,
  ) => {
    // If empty string, treat as 0
    if (rawValue === "") {
      setEditedValues((prev) => ({
        ...prev,
        [acctCode]: {
          ...prev[acctCode],
          [field]: 0,
        },
      }));
      setHasChanges(true);
      return;
    }

    // Parse as float for lakhs value
    const lakhValue = parseFloat(rawValue);
    if (isNaN(lakhValue)) return;

    // Convert to rupees (multiply by 100,000)
    const rupeesValue = Math.round(lakhValue * 100000);

    setEditedValues((prev) => ({
      ...prev,
      [acctCode]: {
        ...prev[acctCode],
        [field]: rupeesValue,
      },
    }));
    setHasChanges(true);
  };

  // Get raw display value for input (in lakhs)
  const getInputDisplayValue = (
    acctCode: string,
    field: "savings" | "deposits",
  ): string => {
    // If there are unsaved changes, show edited value
    if (editedValues[acctCode] && editedValues[acctCode][field] !== undefined) {
      const rupeesValue = editedValues[acctCode][field];
      // Convert to lakhs and format without forcing decimal places
      const lakhs = rupeesValue / 100000;
      // Return as string without forced decimal places to allow editing
      return lakhs.toString();
    }
    // Otherwise show saved value
    const record = historyData.get(acctCode);
    const rupeesValue = record ? record[field] : 0;
    const lakhs = rupeesValue / 100000;
    return lakhs.toString();
  };

  // Format for display (non-input contexts)
  const formatLakhs = (rupees: number): string => {
    return (rupees / 100000).toFixed(2);
  };

  const saveAllChanges = async () => {
    try {
      setSaving(true);

      // Use batch write for better performance
      const batch = writeBatch(firestore);
      const historyCollectionRef = collection(firestore, "history_detail");

      for (const [acctCode, values] of Object.entries(editedValues)) {
        const docId = `${acctCode}_${selectedMonth}`;
        const docRef = doc(historyCollectionRef, docId);

        const record: HistoryDetail = {
          acctCode,
          month: selectedMonth,
          savings: values.savings,
          deposits: values.deposits,
        };

        batch.set(docRef, record);
      }

      await batch.commit();

      // Update local state
      const newHistoryMap = new Map<string, HistoryDetail>();
      for (const [acctCode, values] of Object.entries(editedValues)) {
        newHistoryMap.set(acctCode, {
          acctCode,
          month: selectedMonth,
          savings: values.savings,
          deposits: values.deposits,
        });
      }
      setHistoryData(newHistoryMap);

      showStatus("success", "All records saved successfully!");
      setHasChanges(false);
    } catch (error: any) {
      console.error("Error saving records:", error);
      showStatus("error", `Failed to save records: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const cancelAllChanges = () => {
    // Reset to original saved data
    const originalData: EditedValues = {};
    accounts.forEach((account) => {
      const record = historyData.get(account.acctCode);
      originalData[account.acctCode] = {
        savings: record?.savings || 0,
        deposits: record?.deposits || 0,
      };
    });
    setEditedValues(originalData);
    setHasChanges(false);
    showStatus("success", "Changes cancelled");
  };

  const deleteRecord = async (acctCode: string) => {
    try {
      setSaving(true);
      const docId = `${acctCode}_${selectedMonth}`;
      const historyRef = doc(firestore, "history_detail", docId);
      await deleteDoc(historyRef);

      // Update local state
      setHistoryData((prev) => {
        const newMap = new Map(prev);
        newMap.delete(acctCode);
        return newMap;
      });

      // Also clear from edited values
      setEditedValues((prev) => {
        const newEdits = { ...prev };
        newEdits[acctCode] = {
          savings: 0,
          deposits: 0,
        };
        return newEdits;
      });

      showStatus("success", "Record deleted successfully!");
      setDeleteConfirm(null);
      setHasChanges(true);
    } catch (error: any) {
      console.error("Error deleting:", error);
      showStatus("error", `Failed to delete: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getDisplayValue = (
    acctCode: string,
    field: "savings" | "deposits",
  ): number => {
    if (editedValues[acctCode] && editedValues[acctCode][field] !== undefined) {
      return editedValues[acctCode][field];
    }
    const record = historyData.get(acctCode);
    return record ? record[field] : 0;
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalSavings = 0;
    let totalDeposits = 0;

    accounts.forEach((account) => {
      totalSavings += getDisplayValue(account.acctCode, "savings");
      totalDeposits += getDisplayValue(account.acctCode, "deposits");
    });

    return { totalSavings, totalDeposits };
  };

  const { totalSavings, totalDeposits } = calculateTotals();

  // Get the month name for the previous month button
  const getPreviousMonthName = () => {
    if (!previousMonthAvailable) return "";
    const [year, month] = previousMonthAvailable.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-5">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading account data...</p>
      </div>
    );
  }

  // Get counts for display
  const accountsWithData = Array.from(historyData.keys()).length;
  const totalAccounts = accounts.length;

  // Determine if we should show the load button
  const showLoadButton =
    previousMonthAvailable && !hasLoadedPreviousData && historyData.size === 0;

  return (
    <div className="flex flex-col h-full px-2 py-2">
      {/* Status Message */}
      {statusMessage && (
        <div
          className={`mb-3 p-2 rounded-lg text-xs ${
            statusMessage.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Month Selector Header */}
      <div className="bg-white mb-3 border border-gray-200 rounded-lg p-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">📅</span>
            <span className="text-xs font-semibold text-gray-800">
              Select Month
            </span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
          <div className="text-[10px] text-gray-500">
            {accountsWithData} of {totalAccounts} accounts have data
          </div>
          <div className="flex gap-2">
            {showLoadButton && (
              <button
                onClick={loadPreviousMonthData}
                className="text-[10px] px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                disabled={saving}
              >
                📋 Load {getPreviousMonthName()} Data
              </button>
            )}
            <button
              onClick={loadData}
              className="text-[10px] px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              disabled={saving}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Save/Cancel Buttons */}
      {hasChanges && (
        <div className="mb-3 flex gap-2 justify-end">
          <button
            onClick={cancelAllChanges}
            className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            disabled={saving}
          >
            Cancel All
          </button>
          <button
            onClick={saveAllChanges}
            className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      )}

      {/* Accounts Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex justify-between items-center py-2 bg-white rounded-t-lg px-1 mb-1">
          <div className="flex items-center gap-1">
            <span>📊</span>
            <span className="text-xs font-semibold text-gray-800">
              Account History
            </span>
          </div>
          <div className="text-[10px] text-gray-600">
            {totalAccounts} accounts
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-12 px-5 text-gray-500">
            <div className="text-4xl mb-4 opacity-50">👥</div>
            <div className="text-base font-medium text-gray-600 mb-2">
              No accounts found
            </div>
            <div className="text-sm text-gray-400">
              Add accounts to manage history
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="flex items-center py-2 bg-gray-50 border-b border-gray-200 font-semibold text-[10px] text-gray-700 px-2">
              <div className="w-1/4 px-1">Account</div>
              <div className="w-1/4 px-1">MPIN</div>
              <div className="w-1/4 px-1 text-right">Water (Lakhs)</div>
              <div className="w-1/4 px-1 text-right">Steam (Lakhs)</div>
              {settings?.showDelete && <div className="w-14 px-1"></div>}
            </div>

            {/* Table Rows */}
            {accounts.map((account) => {
              const hasRecord = historyData.has(account.acctCode);
              const hasUnsavedChanges =
                editedValues[account.acctCode] &&
                (editedValues[account.acctCode].savings !==
                  (historyData.get(account.acctCode)?.savings || 0) ||
                  editedValues[account.acctCode].deposits !==
                    (historyData.get(account.acctCode)?.deposits || 0));

              // Get current input values as strings to maintain editing state
              const savingsInputValue = getInputDisplayValue(
                account.acctCode,
                "savings",
              );
              const depositsInputValue = getInputDisplayValue(
                account.acctCode,
                "deposits",
              );

              return (
                <div
                  key={account.id}
                  className={`flex items-center py-2 border-b border-gray-100 min-h-12 px-2 hover:bg-gray-50 last:border-b-0 ${
                    hasRecord ? "bg-green-50/30" : ""
                  } ${hasUnsavedChanges ? "bg-yellow-50/50" : ""}`}
                >
                  {/* Account Code */}
                  <div className="w-1/4 px-1 text-xs text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap">
                    {account.acctCode}
                  </div>

                  {/* MPIN */}
                  <div className="w-1/4 px-1 text-xs text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
                    {account.mpin}
                  </div>

                  {/* Savings Input */}
                  <div className="w-1/4 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={savingsInputValue}
                      onChange={(e) =>
                        handleValueChange(
                          account.acctCode,
                          "savings",
                          e.target.value,
                        )
                      }
                      className={`w-full p-1.5 border rounded text-sm text-right focus:outline-none focus:ring-1 ${
                        hasUnsavedChanges
                          ? "border-yellow-400 focus:ring-yellow-400"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      disabled={saving}
                      placeholder="0"
                    />
                  </div>

                  {/* Deposits Input */}
                  <div className="w-1/4 px-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={depositsInputValue}
                      onChange={(e) =>
                        handleValueChange(
                          account.acctCode,
                          "deposits",
                          e.target.value,
                        )
                      }
                      className={`w-full p-1.5 border rounded text-sm text-right focus:outline-none focus:ring-1 ${
                        hasUnsavedChanges
                          ? "border-yellow-400 focus:ring-yellow-400"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      disabled={saving}
                      placeholder="0"
                    />
                  </div>

                  {/* Delete button */}
                  {settings?.showDelete && (
                    <div className="w-14 flex justify-end px-1">
                      {hasRecord && (
                        <button
                          onClick={() => setDeleteConfirm(account.acctCode)}
                          className="text-red-500 hover:text-red-700 transition-colors text-base p-1 min-w-[28px] touch-manipulation"
                          disabled={saving}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Totals Row */}
            {(totalSavings > 0 || totalDeposits > 0) && (
              <div className="flex items-center py-3 bg-gray-100 border-t-2 border-gray-300 font-semibold px-2">
                <div className="w-1/4 px-1">
                  <span className="text-xs font-bold text-gray-800">TOTAL</span>
                </div>
                <div className="w-1/4 px-1"></div>
                <div className="w-1/4 px-1 text-right">
                  <span className="text-sm font-bold text-green-700">
                    {formatLakhs(totalSavings)}
                  </span>
                </div>
                <div className="w-1/4 px-1 text-right">
                  <span className="text-sm font-bold text-orange-700">
                    {formatLakhs(totalDeposits)}
                  </span>
                </div>
                {settings?.showDelete && <div className="w-14 px-1"></div>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-3 flex justify-between items-center text-[10px] text-gray-500">
        <div>
          Showing {totalAccounts} accounts for {selectedMonth}
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-50 border border-green-200 rounded"></div>
            <span>Has saved data</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-50 border border-yellow-200 rounded"></div>
            <span>Unsaved changes</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-white border border-gray-200 rounded"></div>
            <span>No data</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-2xl mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-5 leading-relaxed">
              Are you sure you want to delete the history record for{" "}
              <strong>{deleteConfirm}</strong> for month{" "}
              <strong>{selectedMonth}</strong>?
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium cursor-pointer hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteRecord(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-500 border-none rounded-lg text-white font-medium cursor-pointer hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryDetailTab;
