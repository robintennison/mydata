// AddEditDepositPage.tsx (updated)
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBankingData } from "../hooks/useBankingData";
import { useBankingOperations } from "../hooks/useBankingOperations";
import { Deposit, DepositFormData } from "../../../types/banking.types";
import { formatDate } from "../../../utils/formatters";
import CustomCalendar from "../../../components/UI/CustomCalendar";
import AccountSelector from "./AccountSelector"; // Import the new component

interface AddEditDepositPageProps {
  isEdit?: boolean;
}

const AddEditDepositPage: React.FC<AddEditDepositPageProps> = ({
  isEdit = false,
}) => {
  const { depositId } = useParams();
  const navigate = useNavigate();
  const { accounts, deposits, loading: dataLoading } = useBankingData();
  const { handleSaveDeposit, handleDeleteDeposit } = useBankingOperations();

  const [formData, setFormData] = useState<DepositFormData>({
    id: "",
    accountId: "",
    amount: 500000,
    startDate: Date.now(),
    endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    comments: "",
    active: true,
  });
  const [selectedAccountCode, setSelectedAccountCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>("");
  const [showCalendar, setShowCalendar] = useState<"start" | "end" | null>(
    null,
  );

  // Load deposit data if editing
  useEffect(() => {
    if (isEdit && depositId && deposits.length > 0) {
      const deposit = deposits.find((d) => d.id === depositId);
      if (deposit) {
        const account = accounts.find((acc) => acc.id === deposit.accountId);
        setFormData({
          id: deposit.id,
          accountId: deposit.accountId,
          amount: deposit.amount,
          startDate: deposit.startDate,
          endDate: deposit.endDate,
          comments: deposit.comments,
          active: deposit.active,
        });
        setSelectedAccountCode(account?.acctCode || "");
      }
    }
  }, [isEdit, depositId, deposits, accounts]);

  const handleInputChange = (field: keyof DepositFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleAccountSelect = (accountId: string, accountCode: string) => {
    setFormData((prev) => ({
      ...prev,
      accountId,
    }));
    setSelectedAccountCode(accountCode);
    // Clear error when account is selected
    if (error) setError("");
  };

  const selectDate = (timestamp: number) => {
    if (showCalendar === "start") {
      handleInputChange("startDate", timestamp);
    } else if (showCalendar === "end") {
      handleInputChange("endDate", timestamp);
    }
    setShowCalendar(null);
  };

  const handleSave = async () => {
    // Clear previous errors
    setError("");

    // Validation
    if (!formData.accountId) {
      setError("Please select an account");
      return;
    }

    if (formData.amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (formData.startDate > formData.endDate) {
      setError("Start date cannot be after end date");
      return;
    }

    setSaving(true);

    try {
      // For editing: use existing ID
      // For new deposits: use empty string - let Firebase generate the ID
      const depositToSave: Deposit = {
        ...formData,
        // Keep the ID if editing, otherwise empty string for new deposits
        id: isEdit && depositId ? depositId : "",
      };

      console.log("DEBUG: Saving deposit:", depositToSave);

      // Call the save function
      const success = await handleSaveDeposit(depositToSave);

      if (success) {
        console.log("DEBUG: Save completed successfully, navigating...");
        navigate("/banking?tab=deposits", { replace: true });
      } else {
        console.log("DEBUG: Save operation was cancelled");
        setSaving(false);
      }
    } catch (error: any) {
      console.error("DEBUG: Error saving deposit:", error);
      // Provide more specific error messages
      let errorMessage = "Failed to save deposit. Please try again.";

      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to save deposits.";
      } else if (error.code === "unavailable") {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message) {
        errorMessage = `Failed to save deposit: ${error.message}`;
      }

      setError(errorMessage);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!depositId) return;

    setDeleting(true);
    try {
      // Call delete function and wait for it to complete
      const success = await handleDeleteDeposit(depositId);

      if (success) {
        console.log("DEBUG: Delete completed successfully, navigating...");
        navigate("/banking?tab=deposits", { replace: true });
      } else {
        // If handleDeleteDeposit returns false (e.g., user cancelled confirmation)
        console.log("DEBUG: Delete operation was cancelled");
        setDeleting(false);
        setShowDeleteConfirm(false);
      }
    } catch (error: any) {
      console.error("DEBUG: Error deleting deposit:", error);
      let errorMessage = "Failed to delete deposit. Please try again.";

      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to delete deposits.";
      } else if (error.message) {
        errorMessage = `Failed to delete deposit: ${error.message}`;
      }

      setError(errorMessage);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to banking with deposits tab active
    navigate("/banking?tab=deposits", { replace: true });
  };

  if (dataLoading && isEdit) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading deposit details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation - Simplified with only back button */}
      <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
        <button
          onClick={handleCancel}
          className="bg-transparent border-none text-xl cursor-pointer p-2 text-blue-500 flex items-center justify-center w-10 h-10 hover:bg-blue-50 transition-colors rounded-lg"
          title="Back"
          disabled={saving || deleting}
        >
          ←
        </button>
        <div className="text-base font-semibold text-gray-800 flex-1 text-center">
          Banking / {isEdit ? "Edit Deposit" : "Add Deposit"}
        </div>
        <div className="w-11"></div> {/* Spacer for alignment */}
      </div>

      {/* Form */}
      <div className="p-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-start gap-2">
            <div className="text-lg">⚠️</div>
            <div className="flex-1 text-sm">{error}</div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Account Selector Component */}
          <AccountSelector
            accounts={accounts}
            selectedAccountId={formData.accountId}
            selectedAccountCode={selectedAccountCode}
            onAccountSelect={handleAccountSelect}
            error={!!(error && !formData.accountId)} 
            disabled={saving || deleting}
            loading={dataLoading}
            placeholder="Select account"
          />

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                handleInputChange("amount", parseFloat(e.target.value) || 0)
              }
              placeholder="Enter amount"
              className={`w-full p-3 border rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed ${
                error && formData.amount <= 0 ? "border-red-300" : "border-gray-300"
              }`}
              min="0"
              step="1000"
              disabled={saving || deleting}
            />
          </div>

          {/* Start Date with Calendar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="relative">
              <input
                type="text"
                value={formatDate(formData.startDate, "en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                readOnly
                onClick={() => setShowCalendar("start")}
                className="date-input w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition cursor-pointer pr-10"
                disabled={saving || deleting}
              />
              <button
                onClick={() => setShowCalendar("start")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 p-1"
                title="Pick start date"
                type="button"
                disabled={saving || deleting}
              >
                📅
              </button>
            </div>
          </div>

          {/* End Date with Calendar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <div className="relative">
              <input
                type="text"
                value={formatDate(formData.endDate, "en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                readOnly
                onClick={() => setShowCalendar("end")}
                className="date-input w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition cursor-pointer pr-10"
                disabled={saving || deleting}
              />
              <button
                onClick={() => setShowCalendar("end")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 p-1"
                title="Pick end date"
                type="button"
                disabled={saving || deleting}
              >
                📅
              </button>
            </div>
          </div>

          {/* Calendar Popup */}
          {showCalendar && (
            <CustomCalendar
              selectedDate={showCalendar === "start" ? formData.startDate : formData.endDate}
              onSelectDate={selectDate}
              onClose={() => setShowCalendar(null)}
            />
          )}

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comments
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => handleInputChange("comments", e.target.value)}
              placeholder="Enter comments (optional)"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white resize-y min-h-20 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              maxLength={500}
              disabled={saving || deleting}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {formData.comments.length}/500
            </div>
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => handleInputChange("active", e.target.checked)}
              id="active-checkbox"
              className="w-5 h-5 cursor-pointer"
              disabled={saving || deleting}
            />
            <label
              htmlFor="active-checkbox"
              className="text-sm text-gray-700 cursor-pointer font-medium"
            >
              Active
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3">
          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            disabled={saving || deleting}
            className={`flex-1 py-3.5 border border-gray-300 rounded-lg text-gray-600 font-semibold text-sm transition-colors ${
              saving || deleting
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-gray-50"
            }`}
          >
            Cancel
          </button>

          {/* Delete Button - Only show in edit mode */}
          {isEdit && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
              className={`flex-1 py-3.5 text-white font-semibold text-sm rounded-lg transition-colors ${
                saving || deleting
                  ? "opacity-70 cursor-not-allowed bg-gray-400"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={
              saving || deleting || !formData.accountId || formData.amount <= 0
            }
            className={`flex-1 py-3.5 text-white font-semibold text-sm rounded-lg transition-colors ${
              saving || deleting
                ? "bg-gray-400 cursor-not-allowed opacity-70"
                : !formData.accountId || formData.amount <= 0
                  ? "bg-gray-400 cursor-not-allowed opacity-70"
                  : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Required Fields Note */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          * Required fields
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-[10000]">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Delete Deposit
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed text-sm">
              Are you sure you want to delete this deposit? This action cannot
              be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 text-gray-600 font-medium text-sm rounded-lg hover:bg-gray-50 disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`px-4 py-2 text-white font-medium text-sm rounded-lg ${
                  deleting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEditDepositPage;