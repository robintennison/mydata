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

const HistoryDetailTab: React.FC = () => {
  const { settings } = useSettings();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [historyData, setHistoryData] = useState<Map<string, HistoryDetail>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [editingCell, setEditingCell] = useState<{ acctCode: string; field: "savings" | "deposits" } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      const accountsList = accountsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Account[];
      setAccounts(accountsList);

      // Load history for selected month
      const historyRef = collection(firestore, "history_detail");
      const q = query(historyRef, where("month", "==", selectedMonth));
      const historySnapshot = await getDocs(q);
      
      const historyMap = new Map<string, HistoryDetail>();
      historySnapshot.docs.forEach(doc => {
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

  const startEditing = (acctCode: string, field: "savings" | "deposits", currentValue: number) => {
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
        savings: field === "savings" ? valueInRupees : (existingRecord?.savings || 0),
        deposits: field === "deposits" ? valueInRupees : (existingRecord?.deposits || 0),
      };

      // Save to Firestore
      const docId = `${acctCode}_${selectedMonth}`;
      const historyRef = doc(firestore, "history_detail", docId);
      await setDoc(historyRef, updatedRecord, { merge: true });

      // Update local state
      setHistoryData(prev => {
        const newMap = new Map(prev);
        newMap.set(acctCode, updatedRecord);
        return newMap;
      });

      showStatus("success", `${field === "savings" ? "Savings" : "Deposits"} updated successfully!`);
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
      setHistoryData(prev => {
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

  const getCurrentValue = (acctCode: string, field: "savings" | "deposits"): number => {
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
        <p className="mt-4 text-gray-600">Loading account data...</p>
      </div>
    );
  }

  // Get counts for display
  const accountsWithData = Array.from(historyData.keys()).length;
  const totalAccounts = accounts.length;

  return (
    <div className="flex flex-col h-full px-2 py-2">
      {/* Status Message */}
      {statusMessage && (
        <div className={`mb-3 p-2 rounded-lg text-xs ${
          statusMessage.type === "success" 
            ? "bg-green-50 border border-green-200 text-green-700" 
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Month Selector Header */}
      <div className="bg-white mb-3 border border-gray-200 rounded-lg p-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">📅</span>
            <span className="text-xs font-semibold text-gray-800">Select Month</span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {availableMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
          <div className="text-[10px] text-gray-500">
            {accountsWithData} of {totalAccounts} accounts have data
          </div>
          <button
            onClick={loadData}
            className="text-[10px] px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex justify-between items-center py-2 bg-white rounded-t-lg px-1 mb-1">
          <div className="flex items-center gap-1">
            <span>📊</span>
            <span className="text-xs font-semibold text-gray-800">Account History</span>
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
              <div className="w-1/4 px-1">Account Code</div>
              <div className="w-1/4 px-1">Account Details</div>
              <div className="w-1/4 px-1 text-right">Savings (₹ L)</div>
              <div className="w-1/4 px-1 text-right">Deposits (₹ L)</div>
              {settings?.showDelete && <div className="w-14 px-1"></div>}
            </div>

            {/* Table Rows */}
            {accounts.map((account) => {
              const savings = getCurrentValue(account.acctCode, "savings");
              const deposits = getCurrentValue(account.acctCode, "deposits");
              const hasRecord = historyData.has(account.acctCode);
              const isEditingSavings = editingCell?.acctCode === account.acctCode && editingCell?.field === "savings";
              const isEditingDeposits = editingCell?.acctCode === account.acctCode && editingCell?.field === "deposits";

              return (
                <div
                  key={account.id}
                  className={`flex items-center py-2 border-b border-gray-100 min-h-8 px-2 hover:bg-gray-50 last:border-b-0 ${
                    hasRecord ? "bg-green-50/30" : ""
                  }`}
                >
                  {/* Account Code */}
                  <div className="w-1/4 px-1 text-xs text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap">
                    {account.acctCode}
                  </div>

                  {/* Account Details */}
                  <div className="w-1/4 px-1 text-xs text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
                    {account.acctDetails}
                  </div>

                  {/* Savings */}
                  <div className="w-1/4 px-1">
                    {isEditingSavings ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-16 p-1 border border-gray-300 rounded text-xs text-right"
                          step="0.01"
                          min="0"
                          autoFocus
                          disabled={saving}
                        />
                        <button
                          onClick={() => saveEdit(account.acctCode, "savings")}
                          className="w-5 h-5 bg-green-500 text-white text-xs rounded flex items-center justify-center hover:bg-green-600"
                          disabled={saving}
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="w-5 h-5 bg-gray-400 text-white text-xs rounded flex items-center justify-center hover:bg-gray-500"
                          disabled={saving}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 group">
                        <span className={`text-xs font-semibold ${savings > 0 ? "text-green-600" : "text-gray-400"} text-right`}>
                          {formatLakhs(savings)}
                        </span>
                        {settings?.showDelete && (
                          <button
                            onClick={() => startEditing(account.acctCode, "savings", savings)}
                            className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={editingCell !== null}
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Deposits */}
                  <div className="w-1/4 px-1">
                    {isEditingDeposits ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-16 p-1 border border-gray-300 rounded text-xs text-right"
                          step="0.01"
                          min="0"
                          autoFocus
                          disabled={saving}
                        />
                        <button
                          onClick={() => saveEdit(account.acctCode, "deposits")}
                          className="w-5 h-5 bg-green-500 text-white text-xs rounded flex items-center justify-center hover:bg-green-600"
                          disabled={saving}
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="w-5 h-5 bg-gray-400 text-white text-xs rounded flex items-center justify-center hover:bg-gray-500"
                          disabled={saving}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 group">
                        <span className={`text-xs font-semibold ${deposits > 0 ? "text-orange-500" : "text-gray-400"} text-right`}>
                          {formatLakhs(deposits)}
                        </span>
                        {settings?.showDelete && (
                          <button
                            onClick={() => startEditing(account.acctCode, "deposits", deposits)}
                            className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={editingCell !== null}
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {settings?.showDelete && (
                    <div className="w-14 flex justify-end px-1">
                      {hasRecord && (
                        <button
                          onClick={() => setDeleteConfirm(account.acctCode)}
                          className="text-red-500 hover:text-red-700 transition-colors text-xs"
                          disabled={editingCell !== null || saving}
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
            <span>Has data</span>
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
              <strong>{deleteConfirm}</strong> for month <strong>{selectedMonth}</strong>?
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