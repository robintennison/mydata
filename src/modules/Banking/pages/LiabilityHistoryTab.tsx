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
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { useSettings } from "../../../contexts/SettingsContext";
import { getCurrentMonth, getPreviousMonthName } from "../../../utils/formatters";
import DeleteConfirmationDialog from "../../../components/DeleteConfirmationDialog";

interface LiabilityHistory {
  id: string;
  month: string;
  description: string;
  amount: number;
}

interface EditedLiability {
  id: string;
  description: string;
  amount: number;
  originalDescription: string;
  originalAmount: number;
}

const LiabilityHistoryTab: React.FC = () => {
  const { settings } = useSettings();
  const [liabilities, setLiabilities] = useState<LiabilityHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return getCurrentMonth();
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [hasLoadedPreviousData, setHasLoadedPreviousData] = useState(false);
  const [previousMonthAvailable, setPreviousMonthAvailable] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditedLiability | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLiability, setNewLiability] = useState({
    description: "",
    amount: "",
  });

  // Available months for dropdown
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

  // Load liabilities for selected month
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

      const liabilityHistoryRef = collection(firestore, "liability_history");
      const q = query(liabilityHistoryRef, where("month", "==", previousMonthStr));
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
      setEditingId(null);
      setEditingData(null);

      // Load liability history for selected month
      const liabilityHistoryRef = collection(firestore, "liability_history");
      const q = query(liabilityHistoryRef, where("month", "==", selectedMonth));
      const historySnapshot = await getDocs(q);

      const liabilitiesList = historySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LiabilityHistory[];

      // Sort by description
      const sortedLiabilities = [...liabilitiesList].sort((a, b) =>
        a.description.localeCompare(b.description)
      );
      setLiabilities(sortedLiabilities);

      // Check if there's any data for this month
      if (sortedLiabilities.length > 0) {
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
    if (hasLoadedPreviousData) return;

    try {
      setSaving(true);

      const [year, month] = selectedMonth.split("-");
      const previousMonth = new Date(parseInt(year), parseInt(month) - 2, 1);
      const previousMonthStr = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, "0")}`;

      const liabilityHistoryRef = collection(firestore, "liability_history");
      const q = query(liabilityHistoryRef, where("month", "==", previousMonthStr));
      const historySnapshot = await getDocs(q);

      const previousLiabilities = historySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LiabilityHistory[];

      if (previousLiabilities.length === 0) {
        showStatus("error", "No data found for previous month");
        setSaving(false);
        return;
      }

      // Create new records for current month based on previous month's data
      const batch = writeBatch(firestore);
      const liabilityHistoryCollectionRef = collection(firestore, "liability_history");

      for (const liability of previousLiabilities) {
        const newDocRef = doc(liabilityHistoryCollectionRef);
        batch.set(newDocRef, {
          month: selectedMonth,
          description: liability.description,
          amount: liability.amount,
          createdAt: new Date(),
        });
      }

      await batch.commit();

      // Reload data for current month
      await loadData();
      setHasLoadedPreviousData(true);
      showStatus("success", `Loaded data from ${previousMonthStr}`);
    } catch (error: any) {
      console.error("Error loading previous month data:", error);
      showStatus("error", `Failed to load previous month data: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseAmount = (value: string): number => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleStartEdit = (liability: LiabilityHistory) => {
    setEditingId(liability.id);
    setEditingData({
      id: liability.id,
      description: liability.description,
      amount: liability.amount,
      originalDescription: liability.description,
      originalAmount: liability.amount,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const handleSaveEdit = async () => {
    if (!editingData) return;

    if (!editingData.description.trim()) {
      showStatus("error", "Description is required");
      return;
    }

    if (editingData.amount < 0) {
      showStatus("error", "Amount cannot be negative");
      return;
    }

    try {
      setSaving(true);

      const liabilityRef = doc(firestore, "liability_history", editingData.id);
      await updateDoc(liabilityRef, {
        description: editingData.description.trim(),
        amount: editingData.amount,
      });

      // Update local state
      setLiabilities((prev) =>
        prev.map((liability) =>
          liability.id === editingData.id
            ? {
                ...liability,
                description: editingData.description.trim(),
                amount: editingData.amount,
              }
            : liability
        )
      );

      showStatus("success", "Liability updated successfully!");
      setEditingId(null);
      setEditingData(null);
    } catch (error: any) {
      console.error("Error updating liability:", error);
      showStatus("error", `Failed to update: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = async () => {
    if (!newLiability.description.trim()) {
      showStatus("error", "Description is required");
      return;
    }

    const amount = parseAmount(newLiability.amount);
    if (amount < 0) {
      showStatus("error", "Amount cannot be negative");
      return;
    }

    try {
      setSaving(true);

      const liabilityHistoryRef = collection(firestore, "liability_history");
      const docRef = await addDoc(liabilityHistoryRef, {
        month: selectedMonth,
        description: newLiability.description.trim(),
        amount: amount,
        createdAt: new Date(),
      });

      const newLiabilityObj: LiabilityHistory = {
        id: docRef.id,
        month: selectedMonth,
        description: newLiability.description.trim(),
        amount: amount,
      };

      setLiabilities((prev) => [...prev, newLiabilityObj].sort((a, b) =>
        a.description.localeCompare(b.description)
      ));

      showStatus("success", "Liability added successfully!");
      setShowAddForm(false);
      setNewLiability({ description: "", amount: "" });
    } catch (error: any) {
      console.error("Error adding liability:", error);
      showStatus("error", `Failed to add: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewLiability({ description: "", amount: "" });
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const liabilityRef = doc(firestore, "liability_history", id);
      await deleteDoc(liabilityRef);

      setLiabilities((prev) => prev.filter((liability) => liability.id !== id));

      showStatus("success", "Liability deleted successfully!");
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error("Error deleting liability:", error);
      showStatus("error", `Failed to delete: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setSaving(false);
    }
  };

  const handleAmountChange = (value: string, isEditing: boolean) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      if (isEditing && editingData) {
        setEditingData({
          ...editingData,
          amount: value === "" || value === "." ? 0 : parseFloat(value),
        });
      }
    }
  };

  const getTotalLiabilities = (): number => {
    return liabilities.reduce((sum, liability) => sum + liability.amount, 0);
  };

  // Get the selected liability description for the delete dialog
  const getSelectedLiabilityDescription = (): string => {
    const liability = liabilities.find(l => l.id === deleteConfirm);
    return liability?.description || "";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-5">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading liability history...</p>
      </div>
    );
  }

  const totalLiabilities = getTotalLiabilities();
  const totalAccounts = liabilities.length;
  const showLoadButton = previousMonthAvailable && !hasLoadedPreviousData && liabilities.length === 0;

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">📅</span>
            <span className="text-xs font-semibold text-gray-800">
              Liability History by Month
            </span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full sm:w-auto px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2 pt-2 border-t border-gray-100">
          <div className="text-[10px] text-gray-500">
            {totalAccounts} liability record(s) for {selectedMonth}
          </div>
          <div className="flex gap-2 flex-wrap">
            {showLoadButton && (
              <button
                onClick={loadPreviousMonthData}
                className="text-[10px] px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                disabled={saving}
              >
                📋 Load {getPreviousMonthName(previousMonthAvailable || "", "en-IN")} Data
              </button>
            )}
            {settings?.showDelete && (
              <button
                onClick={() => setShowAddForm(true)}
                className="text-[10px] px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                disabled={saving}
              >
                + Add Liability
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

      {/* Add New Liability Form */}
      {showAddForm && (
        <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-blue-900">
              Add New Liability for {selectedMonth}
            </span>
            <button
              onClick={handleCancelAdd}
              className="text-gray-500 hover:text-gray-700 text-lg"
              disabled={saving}
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              value={newLiability.description}
              onChange={(e) =>
                setNewLiability({ ...newLiability, description: e.target.value })
              }
              placeholder="Description (e.g., Car Loan, Credit Card)"
              className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={saving}
              autoFocus
            />
            <input
              type="text"
              inputMode="decimal"
              value={newLiability.amount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d*\.?\d*$/.test(value)) {
                  setNewLiability({ ...newLiability, amount: value });
                }
              }}
              placeholder="Amount (₹)"
              className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={saving}
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddNew}
                className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                disabled={saving || !newLiability.description.trim()}
              >
                {saving ? "Adding..." : "Add Liability"}
              </button>
              <button
                onClick={handleCancelAdd}
                className="flex-1 px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Total Card */}
      <div className="mb-3">
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-lg">💰</div>
              <div>
                <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                  Total Liabilities for {selectedMonth}
                </div>
                <div className="text-sm font-bold text-purple-900">
                  ₹{formatAmount(totalLiabilities)}
                </div>
              </div>
            </div>
            <div className="text-xs text-purple-600">
              {totalAccounts} record(s)
            </div>
          </div>
        </div>
      </div>

      {/* Liabilities Table - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex justify-between items-center py-2 bg-white rounded-t-lg px-2 mb-1">
          <div className="flex items-center gap-1">
            <span>📋</span>
            <span className="text-xs font-semibold text-gray-800">
              Liability Records for {selectedMonth}
            </span>
          </div>
          <div className="text-[10px] text-gray-600">
            {totalAccounts} records
          </div>
        </div>

        {liabilities.length === 0 ? (
          <div className="text-center py-12 px-5 text-gray-500">
            <div className="text-4xl mb-4 opacity-50">💰</div>
            <div className="text-sm font-medium text-gray-600 mb-2">
              No liabilities for {selectedMonth}
            </div>
            <div className="text-xs text-gray-400">
              Click "Add Liability" to create records for this month
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header - Grid layout for mobile */}
            <div className="grid grid-cols-12 gap-1 py-2 bg-gray-50 border-b border-gray-200 font-semibold text-[10px] text-gray-700 px-2">
              <div className="col-span-7 px-1">Description</div>
              <div className="col-span-3 px-1 text-right">Amount</div>
              {settings?.showDelete && <div className="col-span-2 px-1 text-center">Actions</div>}
            </div>

            {/* Table Rows - Grid layout for mobile */}
            {liabilities.map((liability) => {
              const isEditing = editingId === liability.id;

              return (
                <div
                  key={liability.id}
                  className={`grid grid-cols-12 gap-1 py-2 border-b border-gray-100 px-2 hover:bg-gray-50 last:border-b-0 ${
                    isEditing ? "bg-yellow-50" : ""
                  }`}
                >
                  {/* Description */}
                  <div className="col-span-7 px-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingData?.description || ""}
                        onChange={(e) =>
                          setEditingData((prev) =>
                            prev ? { ...prev, description: e.target.value } : null
                          )
                        }
                        className="w-full p-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={saving}
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs text-gray-800 break-words block">
                        {liability.description}
                      </span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="col-span-3 px-1">
                    {isEditing ? (
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editingData?.amount.toString() || "0"}
                        onChange={(e) => handleAmountChange(e.target.value, true)}
                        className="w-full p-1 text-xs border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-xs font-semibold text-gray-900 text-right">
                        ₹{formatAmount(liability.amount)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {settings?.showDelete && (
                    <div className="col-span-2 px-1 flex justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="w-6 h-6 bg-emerald-500 text-white text-[10px] rounded flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-50"
                            disabled={saving || !editingData?.description.trim()}
                            title="Save"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="w-6 h-6 bg-gray-400 text-white text-[10px] rounded flex items-center justify-center hover:bg-gray-500 transition-colors"
                            disabled={saving}
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(liability)}
                            className="w-6 h-6 bg-blue-500 text-white text-[10px] rounded flex items-center justify-center hover:bg-blue-600 transition-colors"
                            disabled={saving}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(liability.id)}
                            className="w-6 h-6 bg-red-500 text-white text-[10px] rounded flex items-center justify-center hover:bg-red-600 transition-colors"
                            disabled={saving || isDeleting}
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

            {/* Totals Row */}
            {totalLiabilities > 0 && (
              <div className="grid grid-cols-12 gap-1 py-3 bg-gray-100 border-t-2 border-gray-300 font-semibold px-2">
                <div className="col-span-7 px-1">
                  <span className="text-xs font-bold text-gray-800">TOTAL</span>
                </div>
                <div className="col-span-3 px-1 text-right">
                  <span className="text-sm font-bold text-red-700">
                    ₹{formatAmount(totalLiabilities)}
                  </span>
                </div>
                {settings?.showDelete && <div className="col-span-2 px-1"></div>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-3 flex justify-between items-center text-[10px] text-gray-500">
        <div>
          Showing {totalAccounts} liability record(s) for {selectedMonth}
        </div>
      </div>

      {/* Delete Confirmation Dialog - Using reusable component */}
      <DeleteConfirmationDialog
        isOpen={deleteConfirm !== null}
        onClose={() => {
          setDeleteConfirm(null);
          setIsDeleting(false);
        }}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Liability"
        message={`Are you sure you want to delete the liability record "${getSelectedLiabilityDescription()}" for ${selectedMonth}?`}
        itemName={`${getSelectedLiabilityDescription()} - ${selectedMonth}`}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default LiabilityHistoryTab;