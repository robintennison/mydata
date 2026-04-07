import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { useBankingData } from "../hooks/useBankingData";
import { useBankingOperations } from "../hooks/useBankingOperations";
import type { BankAccount } from "../../../types/banking.types";

const EditAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { settings } = useSettings();
  const { accounts, loading: dataLoading } = useBankingData();
  const { handleSaveAccount, handleDeleteAccount } = useBankingOperations();

  const isViewMode = !settings?.showDelete;

  const [submitting, setSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [textareaHeight, setTextareaHeight] = useState<number>(150);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState({
    acctCode: "",
    acctDetails: "",
    mpin: "",
  });

  useEffect(() => {
    if (!id) {
      setError("Account ID is missing");
      return;
    }

    if (!dataLoading && accounts.length > 0) {
      const foundAccount = accounts.find((acc) => acc.id === id);

      if (!foundAccount) {
        setError("Account not found");
        return;
      }

      setAccount(foundAccount);

      setFormData({
        acctCode: foundAccount.acctCode || "",
        acctDetails: foundAccount.acctDetails || "",
        mpin: foundAccount.mpin || "",
      });
      setError(null);
    }
  }, [id, accounts, dataLoading]);

  // Calculate textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.max(150, textareaRef.current.scrollHeight);
      setTextareaHeight(newHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [formData.acctDetails, isViewMode]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.acctCode.trim()) {
      setError("Account Code is required");
      return false;
    }
    if (!formData.acctDetails.trim()) {
      setError("Account Details are required");
      return false;
    }
    if (formData.mpin.length === 0) {
      setError("MPIN is required");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isViewMode) {
      return;
    }

    if (!id || !account) return;

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const accountData: BankAccount = {
        id: id,
        acctCode: formData.acctCode.trim(),
        acctDetails: formData.acctDetails.trim(),
        mpin: formData.mpin,
      };

      await handleSaveAccount(accountData);

      navigate("/banking", {
        state: { activeTab: "accounts" },
      });
    } catch (err) {
      console.error("Update error:", err);
      setError("Failed to update account. Please try again.");
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await handleDeleteAccount(id);
      navigate("/banking", {
        state: { activeTab: "accounts" },
      });
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete account. Please try again.");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleCancel = () => {
    if (isViewMode) {
      navigate("/banking", {
        state: { activeTab: "accounts" },
      });
      return;
    }

    const hasChanges =
      account &&
      (formData.acctCode !== account.acctCode ||
        formData.acctDetails !== (account.acctDetails || "") ||
        formData.mpin !== account.mpin);

    if (hasChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?",
      );
      if (!confirmLeave) return;
    }

    navigate("/banking", {
      state: { activeTab: "accounts" },
    });
  };

  const getPageTitle = () => {
    if (!id) return "Add Account";
    return isViewMode ? "View Account" : "Edit Account";
  };

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500">Loading account details...</p>
      </div>
    );
  }

  if (!account && !dataLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 mb-4">
          <h1 className="text-xl font-bold text-gray-900">Account Not Found</h1>
        </div>
        <div className="p-4">
          <p className="mb-4 text-gray-700">
            The account you're looking for doesn't exist.
          </p>
          <button
            onClick={() =>
              navigate("/banking", { state: { activeTab: "accounts" } })
            }
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-lg cursor-pointer text-sm font-medium hover:shadow-lg transition-all"
          >
            Back to Accounts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 mb-4">
        <button
          onClick={handleCancel}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg text-xl cursor-pointer flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Back to Accounts"
          disabled={submitting}
        >
          ←
        </button>
        <div className="text-xl font-bold text-gray-900">
          Banking / {getPageTitle()}
        </div>
        <div className="w-10"></div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <div className="p-4">
        {isViewMode ? (
          // View mode - just display data
          <div>
            {/* Account Code */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Code *
              </label>
              <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                {formData.acctCode || "Not specified"}
              </div>
            </div>

            {/* Account Details */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Details *
              </label>
              <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 min-h-[150px] whitespace-pre-wrap">
                {formData.acctDetails || "No details provided"}
              </div>
            </div>

            {/* MPIN - Show as plain text in view mode */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MPIN
              </label>
              <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono">
                {formData.mpin || "Not set"}
              </div>
            </div>

            {/* Back Button only in view mode */}
            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-pointer font-medium hover:bg-gray-200 transition-colors"
              >
                Back to Accounts
              </button>
            </div>
          </div>
        ) : (
          // Edit mode - form for editing
          <form onSubmit={handleSubmit}>
            {/* Account Code */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Code *
              </label>
              <input
                type="text"
                placeholder="e.g., SBI1234"
                value={formData.acctCode}
                onChange={(e) => handleChange("acctCode", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:bg-gray-100"
                required
                disabled={submitting}
                maxLength={50}
              />
            </div>

            {/* Account Details */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Details *
              </label>
              <textarea
                ref={textareaRef}
                placeholder="Bank name, branch, account type, etc."
                value={formData.acctDetails}
                onChange={(e) => handleChange("acctDetails", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:bg-gray-100 resize-y"
                style={{ height: `${textareaHeight}px` }}
                required
                disabled={submitting}
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">
                Characters: {formData.acctDetails.length}/1000
              </div>
            </div>

            {/* MPIN */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MPIN
              </label>
              <input
                type="text"
                placeholder="Enter MPIN or any access code"
                value={formData.mpin}
                onChange={(e) => handleChange("mpin", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:bg-gray-100"
                disabled={submitting}
              />
            </div>

            {/* Buttons - Edit mode only */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                className="flex-1 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                Delete
              </button>

              <button
                type="submit"
                className={`flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-lg font-medium hover:shadow-lg transition-all ${
                  submitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Account?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete account "{account?.acctCode}"?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white border-none rounded-lg font-medium hover:bg-red-700 transition-colors"
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

export default EditAccountPage;
