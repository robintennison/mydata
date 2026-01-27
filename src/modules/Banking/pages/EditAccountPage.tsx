import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { useBankingData } from "../hooks/useBankingData";
import { useBankingOperations } from "../hooks/useBankingOperations";
import { bankingStyles } from "../styles/BankingStyles";
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

  const [formData, setFormData] = useState({
    acctCode: "",
    acctDetails: "",
    savingsAmount: "",
    mpin: "",
  });

  // Function to escape special characters in textarea
  const escapeTextareaValue = (text: string): string => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\*/g, "&#42;"); // Specifically escape asterisks
  };

  // Function to unescape when saving
  const unescapeTextareaValue = (text: string): string => {
    return text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#42;/g, "*");
  };

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

      console.log("DEBUG - Account '01 AXIS' details:", {
        raw: foundAccount.acctDetails,
        length: foundAccount.acctDetails?.length,
        hasAsterisk: foundAccount.acctDetails?.includes("*"),
        asteriskPositions: foundAccount.acctDetails
          ?.split("")
          .map((char, i) => (char === "*" ? i : -1))
          .filter((i) => i !== -1),
      });

      setAccount(foundAccount);

      // Escape the text before displaying in textarea
      const escapedDetails = foundAccount.acctDetails
        ? escapeTextareaValue(foundAccount.acctDetails)
        : "";

      setFormData({
        acctCode: foundAccount.acctCode || "",
        acctDetails: escapedDetails,
        savingsAmount: foundAccount.savingsAmount?.toString() || "0",
        mpin: foundAccount.mpin || "",
      });
      setError(null);
    }
  }, [id, accounts, dataLoading]);

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
    const amount = parseFloat(formData.savingsAmount);
    if (isNaN(amount) || amount < 0) {
      setError("Please enter a valid savings amount");
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

      // Unescape the text before saving
      const unescapedDetails = unescapeTextareaValue(formData.acctDetails);

      const accountData: BankAccount = {
        id: id,
        acctCode: formData.acctCode.trim(),
        acctDetails: unescapedDetails.trim(),
        savingsAmount: parseFloat(formData.savingsAmount) || 0,
        mpin: formData.mpin,
      };

      console.log("Saving account data:", {
        escaped: formData.acctDetails,
        unescaped: unescapedDetails,
        hasAsterisk: unescapedDetails.includes("*"),
      });

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
        formData.acctDetails !==
          (account.acctDetails
            ? escapeTextareaValue(account.acctDetails)
            : "") ||
        formData.savingsAmount !== (account.savingsAmount?.toString() || "0") ||
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

  // Create a clean style for textarea
  const textareaStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: submitting ? "#f3f4f6" : "white",
    color: "#111827",
    fontSize: "14px",
    lineHeight: "1.5",
    fontFamily: "'Courier New', monospace", // Use monospace for better readability
    minHeight: "150px", // Increased height for multiline content
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
    outline: "none",
    cursor: submitting ? "not-allowed" : "text",
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: submitting ? "#f3f4f6" : "white",
    color: "#111827",
    fontSize: "14px",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
    outline: "none",
    cursor: submitting ? "not-allowed" : "text",
  };

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

      {/* Debug info */}
      <div
        style={{
          padding: "10px 15px",
          backgroundColor: "#f0f9ff",
          fontSize: "12px",
          color: "#0369a1",
          borderBottom: "1px solid #bae6fd",
        }}
      >
        Editing: {account?.acctCode} | Contains special characters:{" "}
        {formData.acctDetails.includes("*") ? "Yes (asterisks escaped)" : "No"}
      </div>

      {/* Form */}
      <div style={{ padding: "15px 0" }}>
        {isViewMode ? (
          // View mode - just display data
          <div>
            {/* Account Code */}
            <div style={{ marginBottom: "20px" }}>
              <label style={bankingStyles.label}>Account Code *</label>
              <div
                style={{
                  ...inputStyle,
                  backgroundColor: "#f9fafb",
                  cursor: "default",
                }}
              >
                {formData.acctCode || "Not specified"}
              </div>
            </div>

            {/* Account Details - Show unescaped in view mode */}
            <div style={{ marginBottom: "20px" }}>
              <label style={bankingStyles.label}>Account Details *</label>
              <div
                style={{
                  ...textareaStyle,
                  backgroundColor: "#f9fafb",
                  cursor: "default",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {unescapeTextareaValue(formData.acctDetails) ||
                  "No details provided"}
              </div>
            </div>

            {/* Savings Amount */}
            <div style={{ marginBottom: "20px" }}>
              <label style={bankingStyles.label}>Savings Amount *</label>
              <div
                style={{
                  ...inputStyle,
                  backgroundColor: "#f9fafb",
                  cursor: "default",
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
                  ...inputStyle,
                  backgroundColor: "#f9fafb",
                  cursor: "default",
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
                style={inputStyle}
                required
                disabled={submitting}
                maxLength={50}
              />
            </div>

            {/* Account Details - Using escaped value */}
            <div style={{ marginBottom: "20px" }}>
              <label style={bankingStyles.label}>Account Details *</label>
              <textarea
                placeholder="Bank name, branch, account type, etc."
                value={formData.acctDetails}
                onChange={(e) => {
                  console.log(
                    "Textarea change - escaped value:",
                    e.target.value,
                  );
                  console.log(
                    "Textarea change - unescaped preview:",
                    unescapeTextareaValue(e.target.value),
                  );
                  handleChange("acctDetails", e.target.value);
                }}
                style={textareaStyle}
                rows={6} // Increased rows for more content
                required
                disabled={submitting}
                maxLength={1000} // Increased max length
              />
              <div
                style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}
              >
                Characters: {formData.acctDetails.length}/1000 | Contains
                asterisks:{" "}
                {formData.acctDetails.includes("&#42;")
                  ? "Yes (escaped)"
                  : "No"}
              </div>
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
                    ...inputStyle,
                    paddingLeft: "35px",
                  }}
                  required
                  min="0"
                  step="0.01"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* MPIN */}
            <div style={{ marginBottom: "30px" }}>
              <label style={bankingStyles.label}>MPIN</label>
              <input
                type="text"
                placeholder="Enter MPIN or any access code"
                value={formData.mpin}
                onChange={(e) => handleChange("mpin", e.target.value)}
                style={{
                  ...inputStyle,
                  fontFamily: "monospace",
                  fontSize: "16px",
                }}
                disabled={submitting}
              />
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

      <style>
        {`
          /* Ensure textarea is fully editable */
          textarea {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
            pointer-events: auto !important;
          }
          
          @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
          }
        `}
      </style>
    </div>
  );
};

export default EditAccountPage;
