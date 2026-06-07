import React, { useState, useEffect } from "react";
import { firestore } from "../../../lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { useSettings } from "../../../contexts/SettingsContext";

interface Liability {
  id: string;
  description: string;
  amount: number;
}

interface EditingLiability {
  id: string;
  description: string;
  amount: number;
  originalDescription: string;
  originalAmount: number;
}

const LiabilityTab: React.FC = () => {
  const { settings } = useSettings();
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingLiability | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLiability, setNewLiability] = useState({
    description: "",
    amount: "",
  });

  // Load liabilities
  useEffect(() => {
    loadLiabilities();
  }, []);

  const loadLiabilities = async () => {
    try {
      setLoading(true);
      setStatusMessage(null);

      const liabilitiesRef = collection(firestore, "liabilities");
      const liabilitiesSnapshot = await getDocs(liabilitiesRef);
      const liabilitiesList = liabilitiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Liability[];

      // Sort by description
      const sortedLiabilities = [...liabilitiesList].sort((a, b) =>
        a.description.localeCompare(b.description)
      );
      setLiabilities(sortedLiabilities);
    } catch (error: any) {
      console.error("Error loading liabilities:", error);
      showStatus("error", `Failed to load liabilities: ${error.message}`);
    } finally {
      setLoading(false);
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
    // Remove any non-digit characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleStartEdit = (liability: Liability) => {
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

      const liabilityRef = doc(firestore, "liabilities", editingData.id);
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

  const handleDelete = async (id: string) => {
    try {
      setSaving(true);

      const liabilityRef = doc(firestore, "liabilities", id);
      await deleteDoc(liabilityRef);

      // Update local state
      setLiabilities((prev) => prev.filter((liability) => liability.id !== id));

      showStatus("success", "Liability deleted successfully!");
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error("Error deleting liability:", error);
      showStatus("error", `Failed to delete: ${error.message}`);
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

      const liabilitiesRef = collection(firestore, "liabilities");
      const docRef = await addDoc(liabilitiesRef, {
        description: newLiability.description.trim(),
        amount: amount,
      });

      const newLiabilityObj: Liability = {
        id: docRef.id,
        description: newLiability.description.trim(),
        amount: amount,
      };

      // Update local state
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

  const handleAmountChange = (
    value: string,
    isEditing: boolean,
    setter?: (value: string) => void
  ) => {
    // Allow empty, numbers, and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      if (isEditing && editingData) {
        setEditingData({
          ...editingData,
          amount: value === "" || value === "." ? 0 : parseFloat(value),
        });
      } else if (setter) {
        setter(value);
      }
    }
  };

  const getTotalLiabilities = (): number => {
    return liabilities.reduce((sum, liability) => sum + liability.amount, 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-5">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading liabilities...</p>
      </div>
    );
  }

  const totalLiabilities = getTotalLiabilities();

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

      {/* Header with Add Button */}
      <div className="bg-white mb-3 border border-gray-200 rounded-lg p-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">📋</span>
            <span className="text-xs font-semibold text-gray-800">
              Liabilities
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadLiabilities}
              className="text-[10px] px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              disabled={saving}
            >
              Refresh
            </button>
            {/* FIX: Always show Add Liability button, regardless of showDelete setting */}
            <button
              onClick={() => setShowAddForm(true)}
              className="text-[10px] px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              disabled={saving}
            >
              + Add Liability
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <div className="text-[10px] text-gray-500">
              Total liabilities: {liabilities.length} item(s)
            </div>
            <div className="text-xs font-semibold text-red-600">
              Total: ₹{formatAmount(totalLiabilities)}
            </div>
          </div>
        </div>
      </div>

      {/* Add New Liability Form */}
      {showAddForm && (
        <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-blue-900">
              Add New Liability
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
              onChange={(e) =>
                handleAmountChange(e.target.value, false, (value) =>
                  setNewLiability({ ...newLiability, amount: value })
                )
              }
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

      {/* Liabilities Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex justify-between items-center py-2 bg-white rounded-t-lg px-1 mb-1">
          <div className="flex items-center gap-1">
            <span>💰</span>
            <span className="text-xs font-semibold text-gray-800">
              Liability Records
            </span>
          </div>
          <div className="text-[10px] text-gray-600">
            {liabilities.length} records
          </div>
        </div>

        {liabilities.length === 0 ? (
          <div className="text-center py-12 px-5 text-gray-500">
            <div className="text-4xl mb-4 opacity-50">💰</div>
            <div className="text-base font-medium text-gray-600 mb-2">
              No liabilities found
            </div>
            <div className="text-sm text-gray-400">
              Click "Add Liability" to create your first record
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="flex items-center py-2 bg-gray-50 border-b border-gray-200 font-semibold text-[10px] text-gray-700 px-2">
              <div className="w-1/2 px-1">Description</div>
              <div className="w-1/4 px-1 text-right">Amount (₹)</div>
              {settings?.showDelete && <div className="w-28 px-1 text-center">Actions</div>}
            </div>

            {/* Table Rows */}
            {liabilities.map((liability) => {
              const isEditing = editingId === liability.id;
              const hasUnsavedChanges = isEditing && editingData && (
                editingData.description !== editingData.originalDescription ||
                editingData.amount !== editingData.originalAmount
              );

              return (
                <div
                  key={liability.id}
                  className={`flex items-center py-2 border-b border-gray-100 min-h-12 px-2 hover:bg-gray-50 last:border-b-0 ${
                    hasUnsavedChanges ? "bg-yellow-50/50" : ""
                  }`}
                >
                  {/* Description */}
                  <div className="w-1/2 px-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingData?.description || ""}
                        onChange={(e) =>
                          setEditingData((prev) =>
                            prev
                              ? { ...prev, description: e.target.value }
                              : null
                          )
                        }
                        className="w-full p-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={saving}
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-gray-800">
                        {liability.description}
                      </span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="w-1/4 px-1">
                    {isEditing ? (
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editingData?.amount.toString() || "0"}
                        onChange={(e) =>
                          handleAmountChange(e.target.value, true)
                        }
                        className="w-full p-1.5 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-sm font-semibold text-gray-900 text-right">
                        ₹{formatAmount(liability.amount)}
                      </div>
                    )}
                  </div>

                  {/* Actions - Only show if showDelete is true */}
                  {settings?.showDelete && (
                    <div className="w-28 px-1 flex justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="px-2 py-1 bg-emerald-500 text-white text-xs rounded hover:bg-emerald-600 transition-colors disabled:opacity-50"
                            disabled={saving || !editingData?.description.trim()}
                            title="Save"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                            disabled={saving}
                            title="Cancel"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(liability)}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                            disabled={saving}
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(liability.id)}
                            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                            disabled={saving}
                            title="Delete"
                          >
                            Delete
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
              <div className="flex items-center py-3 bg-gray-100 border-t-2 border-gray-300 font-semibold px-2">
                <div className="w-1/2 px-1">
                  <span className="text-xs font-bold text-gray-800">TOTAL</span>
                </div>
                <div className="w-1/4 px-1 text-right">
                  <span className="text-sm font-bold text-red-700">
                    ₹{formatAmount(totalLiabilities)}
                  </span>
                </div>
                {settings?.showDelete && <div className="w-28 px-1"></div>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-3 flex justify-between items-center text-[10px] text-gray-500">
        <div>
          Showing {liabilities.length} liability record(s)
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-white border border-gray-200 rounded"></div>
            <span>Saved record</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-50 border border-yellow-200 rounded"></div>
            <span>Unsaved changes</span>
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
              Are you sure you want to delete this liability record?
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                This action cannot be undone.
              </span>
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium cursor-pointer hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
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

export default LiabilityTab;