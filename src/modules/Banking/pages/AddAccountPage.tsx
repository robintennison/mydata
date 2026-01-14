// src/modules/Banking/pages/AddAccountPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { bankingStyles } from "../styles/BankingStyles";
import { useBankingOperations } from "../hooks/useBankingOperations";

// Define BankAccount type matching your banking.types
interface BankAccount {
  id: string; // Required for TypeScript
  acctCode: string;
  acctDetails: string;
  savingsAmount: number;
  mpin: string;
}

const AddAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { handleSaveAccount } = useBankingOperations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    acctCode: "",
    acctDetails: "",
    savingsAmount: "",
    mpin: "",
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
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
      setError("Please enter a valid savings amount (must be positive)");
      return false;
    }
    if (formData.mpin.length !== 4) {
      setError("MPIN must be exactly 4 digits");
      return false;
    }
    if (!/^\d{4}$/.test(formData.mpin)) {
      setError("MPIN must contain only numbers");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For NEW accounts, pass an empty string as id
      // Your handleSaveAccount function checks: if (account.id) {...} else {...}
      // So empty string will trigger the "else" branch (addDoc)
      const accountData: BankAccount = {
        id: "", // Empty string for new accounts
        acctCode: formData.acctCode.trim(),
        acctDetails: formData.acctDetails.trim(),
        savingsAmount: parseFloat(formData.savingsAmount) || 0,
        mpin: formData.mpin,
      };

      console.log("Saving account data:", accountData);

      // Call the save account function
      await handleSaveAccount(accountData);

      // Note: handleSaveAccount calls window.location.reload() after saving
      // So we don't need to navigate manually
    } catch (error) {
      console.error("Error adding account:", error);
      setError("Failed to add account. Please try again.");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const hasChanges = Object.values(formData).some(
      (value) => value.trim() !== ""
    );

    if (hasChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmLeave) return;
    }

    navigate("/banking/accounts");
  };

  return (
    <div style={bankingStyles.container}>
      {/* Header */}
      <div style={bankingStyles.header}>
        <h1 style={bankingStyles.headerTitle}>➕ Add Account</h1>
        <div style={bankingStyles.headerSubtitle}>
          Create a new bank account
        </div>
      </div>

      {/* Top Navigation */}
      <div style={bankingStyles.topNav}>
        <button
          onClick={handleCancel}
          style={bankingStyles.navButton}
          title="Back to Accounts"
          disabled={loading}
          type="button"
        >
          ←
        </button>
        <div style={bankingStyles.navTitle}>New Account</div>
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
      <div style={{ padding: "15px" }}>
        <form onSubmit={handleSubmit}>
          {/* Account Code */}
          <div style={{ marginBottom: "20px" }}>
            <label style={bankingStyles.label}>Account Code *</label>
            <input
              type="text"
              placeholder="Enter account code (e.g., SBI1234)"
              value={formData.acctCode}
              onChange={(e) => handleChange("acctCode", e.target.value)}
              style={bankingStyles.input}
              required
              disabled={loading}
              maxLength={50}
            />
          </div>

          {/* Account Details */}
          <div style={{ marginBottom: "20px" }}>
            <label style={bankingStyles.label}>Account Details *</label>
            <textarea
              placeholder="Enter bank name, branch, and other details"
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
              disabled={loading}
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
                disabled={loading}
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
              disabled={loading}
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
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "16px",
                opacity: loading ? 0.6 : 1,
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "14px",
                backgroundColor: loading ? "#94a3b8" : "#2563eb",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "16px",
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Account"}
            </button>
          </div>
        </form>
      </div>

      {/* Loading overlay */}
      {loading && (
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
              Creating account...
            </p>
          </div>
        </div>
      )}

      <style>
        {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
      </style>

      <div style={{ height: "30px" }}></div>
    </div>
  );
};

export default AddAccountPage;
