import React, { useState, useEffect } from "react";
import { firestore } from "../../../lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  setDoc,
  query,
  where,
  doc,
} from "firebase/firestore";

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

const HistoryDetailManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [historyData, setHistoryData] = useState<Map<string, HistoryDetail>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [editingCell, setEditingCell] = useState<{
    acctCode: string;
    field: "savings" | "deposits";
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  const loadData = async () => {
    try {
      setLoading(true);
      setStatusMessage(null);

      // Load all accounts
      const accountsRef = collection(firestore, "accounts");
      const accountsSnapshot = await getDocs(accountsRef);
      const accountsList = accountsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Account[];
      setAccounts(accountsList);

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
    } catch (error: any) {
      console.error("Error loading data:", error);
      showStatus("error", `Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const startEditing = (
    acctCode: string,
    field: "savings" | "deposits",
    currentValue: number,
  ) => {
    const lakhsValue = (currentValue / 100000).toFixed(2);
    setEditingCell({ acctCode, field });
    setEditValue(lakhsValue);
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const saveEdit = async (acctCode: string, field: "savings" | "deposits") => {
    try {
      setSaving(true);
      const valueInLakhs = parseFloat(editValue);

      if (isNaN(valueInLakhs)) {
        showStatus("error", "Please enter a valid number");
        return;
      }

      const valueInRupees = Math.round(valueInLakhs * 100000);

      // Get existing record or create new one
      const existingRecord = historyData.get(acctCode);
      const updatedRecord: HistoryDetail = {
        acctCode,
        month: selectedMonth,
        savings:
          field === "savings" ? valueInRupees : existingRecord?.savings || 0,
        deposits:
          field === "deposits" ? valueInRupees : existingRecord?.deposits || 0,
      };

      // Save to Firestore
      const docId = `${acctCode}_${selectedMonth}`;
      const historyRef = doc(firestore, "history_detail", docId);
      await setDoc(historyRef, updatedRecord, { merge: true });

      // Update local state
      setHistoryData((prev) => {
        const newMap = new Map(prev);
        newMap.set(acctCode, updatedRecord);
        return newMap;
      });

      showStatus(
        "success",
        `${field === "savings" ? "Savings" : "Deposits"} updated successfully!`,
      );
      cancelEditing();
    } catch (error: any) {
      console.error("Error saving:", error);
      showStatus("error", `Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
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

      showStatus("success", "Record deleted successfully!");
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error("Error deleting:", error);
      showStatus("error", `Failed to delete: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getCurrentValue = (
    acctCode: string,
    field: "savings" | "deposits",
  ): number => {
    const record = historyData.get(acctCode);
    if (!record) return 0;
    return field === "savings" ? record.savings : record.deposits;
  };

  const formatLakhs = (rupees: number): string => {
    return (rupees / 100000).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-5">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-4 py-4">
      {/* Status Message */}
      {statusMessage && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            statusMessage.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Header with Month Selector */}
      <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">
          Account History Management
        </h2>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            Select Month:
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Details
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Savings (₹ Lakhs)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deposits (₹ Lakhs)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total (₹ Lakhs)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => {
                const savings = getCurrentValue(account.acctCode, "savings");
                const deposits = getCurrentValue(account.acctCode, "deposits");
                const total = (savings + deposits) / 100000;
                const hasRecord = historyData.has(account.acctCode);

                return (
                  <tr
                    key={account.id}
                    className={`hover:bg-gray-50 ${hasRecord ? "bg-green-50/30" : ""}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.acctCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {account.acctDetails}
                    </td>

                    {/* Savings Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {editingCell?.acctCode === account.acctCode &&
                      editingCell?.field === "savings" ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-28 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                            step="0.01"
                            min="0"
                            autoFocus
                            disabled={saving}
                          />
                          <button
                            onClick={() =>
                              saveEdit(account.acctCode, "savings")
                            }
                            className="text-green-600 hover:text-green-700"
                            disabled={saving}
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-600 hover:text-gray-700"
                            disabled={saving}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 group">
                          <span
                            className={`font-semibold ${savings > 0 ? "text-green-600" : "text-gray-400"}`}
                          >
                            {formatLakhs(savings)}
                          </span>
                          <button
                            onClick={() =>
                              startEditing(account.acctCode, "savings", savings)
                            }
                            className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={editingCell !== null}
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Deposits Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {editingCell?.acctCode === account.acctCode &&
                      editingCell?.field === "deposits" ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-28 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                            step="0.01"
                            min="0"
                            autoFocus
                            disabled={saving}
                          />
                          <button
                            onClick={() =>
                              saveEdit(account.acctCode, "deposits")
                            }
                            className="text-green-600 hover:text-green-700"
                            disabled={saving}
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-600 hover:text-gray-700"
                            disabled={saving}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 group">
                          <span
                            className={`font-semibold ${deposits > 0 ? "text-orange-600" : "text-gray-400"}`}
                          >
                            {formatLakhs(deposits)}
                          </span>
                          <button
                            onClick={() =>
                              startEditing(
                                account.acctCode,
                                "deposits",
                                deposits,
                              )
                            }
                            className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={editingCell !== null}
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Total Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 text-right">
                      {total.toFixed(2)}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      {hasRecord && (
                        <button
                          onClick={() => setDeleteConfirm(account.acctCode)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          disabled={editingCell !== null || saving}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
        <div>
          Showing {accounts.length} accounts for {selectedMonth}
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
            <span>Has data for this month</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white border border-gray-200 rounded"></div>
            <span>No data (will be created on save)</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-5 leading-relaxed">
              Are you sure you want to delete the history record for{" "}
              <strong>{deleteConfirm}</strong> for month{" "}
              <strong>{selectedMonth}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteRecord(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
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

export default HistoryDetailManager;
