import React, { useState } from "react";
import HistoryChart from "./HistoryChart";
import { useBankingData } from "../hooks/useBankingData";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { useSettings } from "../../../contexts/SettingsContext";
import { tw } from "../../../utils/tailwindMapping";

const HistoryTab: React.FC = () => {
  const { settings } = useSettings();
  const { loading, history } = useBankingData();

  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editedSavings, setEditedSavings] = useState("");
  const [editedDeposits, setEditedDeposits] = useState("");
  const [deleteConfirmMonth, setDeleteConfirmMonth] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

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

      const savingsRupees = savingsLakhs * 100000;
      const depositsRupees = depositsLakhs * 100000;

      const historyRef = doc(firestore, "history", month);
      await updateDoc(historyRef, {
        savings: savingsRupees,
        totalDeposits: depositsRupees,
        updatedAt: new Date(),
      });

      window.location.reload();
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
    try {
      const historyRef = doc(firestore, "history", deleteConfirmMonth);
      await deleteDoc(historyRef);
      window.location.reload();
      setDeleteConfirmMonth(null);
      alert("✓ History record deleted!");
    } catch (error: any) {
      console.error("Error deleting history:", error);
      alert(`Failed to delete: ${error.message || "Unknown error"}`);
    }
  };

  const filteredHistory = history.sort((a, b) =>
    b.month.localeCompare(a.month),
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-5">
        <div className={tw.bankingSpinner}></div>
        <p className="mt-4 text-gray-600">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chart */}
      <div className="bg-white mb-4 border-b border-gray-300">
        <HistoryChart history={history} compact={true} />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center py-1 bg-gray-50 border-b border-gray-300 px-1">
          <div className="flex items-center gap-1">
            <span>📊</span>
            <span className="text-xs font-semibold text-gray-800">History</span>
          </div>
          <div className="text-2xs text-gray-600">
            {history.length} record{history.length !== 1 ? "s" : ""}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 px-5 text-gray-500">
            <div className="text-4xl mb-4 opacity-50">📄</div>
            <div className="text-base font-medium text-gray-600 mb-2">
              No history records
            </div>
            <div className="text-sm text-gray-400">
              Update current month summary to create history
            </div>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="flex items-center py-1 bg-gray-50 border-b border-gray-300 font-semibold text-2xs text-gray-700 px-1">
              <div className="w-1/4 px-0.5">Month</div>
              <div className="w-1/4 px-0.5 text-right">Savings</div>
              <div className="w-1/4 px-0.5 text-right">Deposits</div>
              <div className="w-1/4 px-0.5 text-right">Total</div>
              {settings?.showDelete && <div className="w-14 px-0.5"></div>}
            </div>

            {/* Table Rows */}
            {filteredHistory.map((record) => {
              const isEditing = editingMonth === record.month;
              const savingsValue = rupeesToLakhs(record.savings);
              const depositsValue = rupeesToLakhs(record.totalDeposits);
              const totalValue = savingsValue + depositsValue;

              return (
                <div
                  key={record.month}
                  className="flex items-center py-1 border-b border-gray-100 min-h-8 px-1"
                >
                  {/* Month */}
                  <div className="w-1/4 px-0.5 text-xs text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap">
                    {record.month}
                  </div>

                  {/* Savings */}
                  <div className="w-1/4 px-0.5">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedSavings}
                        onChange={(e) => setEditedSavings(e.target.value)}
                        className="w-16 p-1 border border-gray-300 rounded text-xs"
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
                  <div className="w-1/4 px-0.5">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedDeposits}
                        onChange={(e) => setEditedDeposits(e.target.value)}
                        className="w-16 p-1 border border-gray-300 rounded text-xs"
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
                  <div className="w-1/4 px-0.5">
                    <div className="text-xs font-semibold text-blue-600 text-right">
                      {formatLakhs(totalValue)}
                    </div>
                  </div>

                  {/* Actions */}
                  {settings?.showDelete && (
                    <div className="w-14 flex gap-0.5 px-0.5">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdits(record.month)}
                            className="w-6 h-6 p-0 bg-green-500 text-white text-xs rounded flex items-center justify-center hover:bg-green-600 disabled:opacity-50"
                            disabled={isSaving}
                            title="Save"
                          >
                            {isSaving ? "⏳" : "✓"}
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="w-6 h-6 p-0 bg-gray-400 text-white text-xs rounded flex items-center justify-center hover:bg-gray-500"
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
                                record.totalDeposits,
                              )
                            }
                            className="w-6 h-6 p-0 bg-blue-500 text-white text-xs rounded flex items-center justify-center hover:bg-blue-600 disabled:opacity-50"
                            disabled={editingMonth !== null}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteConfirmMonth(record.month)}
                            className="w-6 h-6 p-0 bg-red-500 text-white text-xs rounded flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
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
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-5 leading-relaxed">
              Are you sure you want to delete the history record for{" "}
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
