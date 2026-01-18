// src/modules/Banking/pages/EditAccountPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
//import { useSettings } from "../../../contexts/SettingsContext";
import { useBankingData } from "../hooks/useBankingData";
import { useBankingOperations } from "../hooks/useBankingOperations";
import { bankingStyles } from "../styles/BankingStyles";
import type { BankAccount } from "../../../types/banking.types";

const EditAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  //const { settings } = useSettings();
  const { accounts, loading: dataLoading } = useBankingData();
  const { handleSaveAccount, handleDeleteAccount } = useBankingOperations();

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
    if (formData.mpin.length !== 4) {
      setError("MPIN must be exactly 4 digits");
      return false;
    }
    if (!/^\d{4}$/.test(formData.mpin)) {
      setError("MPIN must be 4 numbers only");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete account. Please try again.");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleCancel = () => {
    const hasChanges =
      account &&
      (formData.acctCode !== account.acctCode ||
        formData.acctDetails !== account.acctDetails ||
        formData.savingsAmount !== (account.savingsAmount?.toString() || "0") ||
        formData.mpin !== account.mpin);

    if (hasChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmLeave) return;
    }

    navigate("/banking/accounts");
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
            onClick={() => navigate("/banking/accounts")}
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
        <div style={bankingStyles.navTitle}>Banking / Edit Account</div>
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

      {/* Form */}
      <div style={{ padding: "15px 4px" }}>
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
                onChange={(e) => handleChange("savingsAmount", e.target.value)}
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

          {/* MPIN */}
          <div style={{ marginBottom: "30px" }}>
            <label style={bankingStyles.label}>MPIN (4 digits) *</label>
            <input
              type="password"
              placeholder="••••"
              value={formData.mpin}
              onChange={(e) => handleChange("mpin", e.target.value)}
              style={{
                ...bankingStyles.input,
                letterSpacing: "8px",
                textAlign: "center",
                fontFamily: "monospace",
                fontSize: "18px",
              }}
              maxLength={4}
              pattern="\d{4}"
              required
              disabled={submitting}
            />
            <div
              style={{
                fontSize: "0.85rem",
                color: "#6c757d",
                marginTop: "6px",
                fontStyle: "italic",
              }}
            >
              Must be exactly 4 digits
            </div>
          </div>

          {/* Buttons */}
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
