// src/modules/Banking/pages/EditAccountPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Removed useLocation
import { useSettings } from "../../../contexts/SettingsContext";
import { useBankingData } from "../hooks/useBankingData";
import { useBankingOperations } from "../hooks/useBankingOperations";
import { bankingStyles } from "../styles/BankingStyles";
import type { BankAccount } from "../../../types/banking.types";

const EditAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Removed useLocation
  const { settings } = useSettings();
  const { accounts, loading: dataLoading } = useBankingData();
  const { handleSaveAccount, handleDeleteAccount } = useBankingOperations();

  // Determine if we're in view mode
  // If showDelete is false, we're in view mode (read-only)
  // If showDelete is true, we're in edit mode
  const isViewMode = !settings?.showDelete;
  //const isEditMode = settings?.showDelete;

  const [submitting, setSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    acctCode: "",
    acctDetails: "",
    savingsAmount: "",
    mpin: "",
  });

  // Find the account when accounts data loads or id changes
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
        savingsAmount: foundAccount.savingsAmount?.toString() || "0",
        mpin: foundAccount.mpin || "",
      });
      setError(null);
    }
  }, [id, accounts, dataLoading]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    if (isViewMode) return; // Prevent changes in view mode
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
    const amount = parseFloat(formData.savingsAmount);
    if (isNaN(amount) || amount < 0) {
      setError("Please enter a valid savings amount");
      return false;
    }
    // Removed the 4-digit restriction for MPIN
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
      // In view mode, form submission is disabled
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
        savingsAmount: parseFloat(formData.savingsAmount) || 0,
        mpin: formData.mpin,
      };

      console.log("Updating account with data:", accountData);
      await handleSaveAccount(accountData);

      // Success - ALWAYS navigate back to banking with accounts tab active
      navigate("/banking", {
        state: { activeTab: "accounts" }, // Force accounts tab
        replace: true,
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
      // After delete, ALWAYS navigate back to banking with accounts tab active
      navigate("/banking", {
        state: { activeTab: "accounts" }, // Force accounts tab
        replace: true,
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
      // In view mode, just go back
      navigate("/banking", {
        state: { activeTab: "accounts" },
        replace: true,
      });
      return;
    }

    const hasChanges =
      account &&
      (formData.acctCode !== account.acctCode ||
        formData.acctDetails !== account.acctDetails ||
        formData.savingsAmount !== (account.savingsAmount?.toString() || "0") ||
        formData.mpin !== account.mpin);

    if (hasChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?",
      );
      if (!confirmLeave) return;
    }

    // ALWAYS navigate back to banking with accounts tab active
    navigate("/banking", {
      state: { activeTab: "accounts" }, // Force accounts tab
      replace: true,
    });
  };

  const getPageTitle = () => {
    if (!id) return "Add Account";
    return isViewMode ? "View Account" : "Edit Account";
  };

  // const getPageSubtitle = () => {
  //   if (!id) return "Create a new bank account";
  //   return isViewMode ? "Account details" : "Update account information";
  // };

  if (dataLoading) {
    return (
      <div style={bankingStyles.loadingContainer}>
        <div style={bankingStyles.spinner}></div>
        <p>Loading account details...</p>
      </div>
    );
  }

  if (!account && !dataLoading) {
    return (
      <div style={bankingStyles.container}>
        <div style={bankingStyles.header}>
          <h1 style={bankingStyles.headerTitle}>Account Not Found</h1>
        </div>
        <div style={{ padding: "15px 4px", position: "relative" }}>
          <p>The account you're looking for doesn't exist.</p>
          <button
            onClick={() =>
              navigate("/banking", { state: { activeTab: "accounts" } })
            }
            style={bankingStyles.primaryButton}
          >
            Back to Accounts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={bankingStyles.container}>
      {/* Top Navigation */}
      <div style={bankingStyles.topNav}>
        <button
          onClick={handleCancel}
          style={bankingStyles.navButton}
          title="Back to Accounts"
          disabled={submitting}
        >
          ←
        </button>
        <div style={bankingStyles.navTitle}>Banking / {getPageTitle()}</div>
        {/* Remove Edit button from top when in view mode */}
        <div style={{ width: "40px" }}></div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            margin: "15px",
            padding: "12px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#dc2626",
            fontSize: "14px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Form - Use div instead of form in view mode to prevent submission */}
      <div style={{ padding: "15px 0" }}>
        {isViewMode ? (
          // View mode - just display data
          <div>
            {/* Account Code */}
            <div style={{ marginBottom: "20px" }}>
              <label style={bankingStyles.label}>Account Code *</label>
              <div
                style={{
                  ...bankingStyles.input,
                  backgroundColor: "#f9fafb",
                  cursor: "default",
                  color: "#111827",
                  padding: "10px 12px",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {formData.acctCode || "Not specified"}
              </div>
            </div>

            {/* Account Details */}
            <div style={{ marginBottom: "20px" }}>
              <label style={bankingStyles.label}>Account Details *</label>
              <div
                style={{
                  ...bankingStyles.input,
                  backgroundColor: "#f9fafb",
                  cursor: "default",
                  color: "#111827",
                  padding: "12px",
                  minHeight: "100px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {formData.acctDetails || "No details provided"}
              </div>
            </div>

            {/* Savings Amount */}
            <div style={{ marginBottom: "20px" }}>
              <label style={bankingStyles.label}>Savings Amount *</label>
              <div
                style={{
                  ...bankingStyles.input,
                  backgroundColor: "#f9fafb",
                  cursor: "default",
                  color: "#111827",
                  padding: "10px 12px",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                ₹{" "}
                {parseFloat(formData.savingsAmount || "0").toLocaleString(
                  "en-IN",
                )}
              </div>
            </div>

            {/* MPIN - Show as plain text in view mode */}
            <div style={{ marginBottom: "30px" }}>
              <label style={bankingStyles.label}>MPIN</label>
              <div
                style={{
                  ...bankingStyles.input,
                  backgroundColor: "#f9fafb",
                  cursor: "default",
                  color: "#111827",
                  padding: "10px 12px",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  fontFamily: "monospace",
                  fontSize: "16px",
                }}
              >
                {formData.mpin || "Not set"}
              </div>
            </div>

            {/* Back Button only in view mode */}
            <div
              style={{
                paddingTop: "10px",
                borderTop: "1px solid #e9ecef",
              }}
            >
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  color: "#495057",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                Back to Accounts
              </button>
            </div>
          </div>
        ) : (
          // Edit mode - form for editing
          <form onSubmit={handleSubmit}>
            {/* Account Code */}
            <div style={{ marginBottom: "20px" }}>
              <label style={bankingStyles.label}>Account Code *</label>
              <input
                type="text"
                placeholder="e.g., SBI1234"
                value={formData.acctCode}
                onChange={(e) => handleChange("acctCode", e.target.value)}
                style={bankingStyles.input}
                required
                disabled={submitting}
                maxLength={50}
              />
            </div>

            {/* Account Details */}
            <div style={{ marginBottom: "20px" }}>
              <label style={bankingStyles.label}>Account Details *</label>
              <textarea
                placeholder="Bank name, branch, account type, etc."
                value={formData.acctDetails}
                onChange={(e) => handleChange("acctDetails", e.target.value)}
                style={{
                  ...bankingStyles.input,
                  minHeight: "100px",
                  resize: "vertical",
                  lineHeight: "1.5",
                }}
                rows={4}
                required
                disabled={submitting}
                maxLength={500}
              />
            </div>

            {/* Savings Amount */}
            <div style={{ marginBottom: "20px" }}>
              <label style={bankingStyles.label}>Savings Amount *</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#666",
                    fontWeight: "500",
                    fontSize: "16px",
                    zIndex: 1,
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.savingsAmount}
                  onChange={(e) =>
                    handleChange("savingsAmount", e.target.value)
                  }
                  style={{
                    ...bankingStyles.input,
                    paddingLeft: "35px",
                  }}
                  required
                  min="0"
                  step="0.01"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* MPIN - Show as plain text input in edit mode */}
            <div style={{ marginBottom: "30px" }}>
              <label style={bankingStyles.label}>MPIN</label>
              <input
                type="text" // Changed from "password" to "text"
                placeholder="Enter MPIN or any access code"
                value={formData.mpin}
                onChange={(e) => handleChange("mpin", e.target.value)}
                style={{
                  ...bankingStyles.input,
                  fontFamily: "monospace",
                  fontSize: "16px",
                }}
                disabled={submitting}
              />
              {/* Removed the 4-digit restriction message */}
            </div>

            {/* Buttons - Edit mode only */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                paddingTop: "10px",
                borderTop: "1px solid #e9ecef",
              }}
            >
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  color: "#495057",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontSize: "16px",
                  opacity: submitting ? 0.6 : 1,
                }}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  color: "#dc2626",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontSize: "16px",
                  opacity: submitting ? 0.6 : 1,
                }}
                disabled={submitting}
              >
                Delete Account
              </button>

              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: submitting ? "#94a3b8" : "#2563eb",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: "600",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  opacity: submitting ? 0.7 : 1,
                }}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
              Delete Account?
            </h3>
            <p style={{ margin: "0 0 24px 0", color: "#6b7280" }}>
              Are you sure you want to delete account "{account?.acctCode}"?
              This action cannot be undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowDeleteDialog(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  color: "#374151",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#dc2626",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {submitting && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "30px",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                border: "3px solid #e5e7eb",
                borderTop: "3px solid #2563eb",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 15px",
              }}
            ></div>
            <p style={{ margin: 0, color: "#374151", fontWeight: "500" }}>
              Saving changes...
            </p>
          </div>
        </div>
      )}

      <style>
        {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
      </style>
    </div>
  );
};

export default EditAccountPage;
