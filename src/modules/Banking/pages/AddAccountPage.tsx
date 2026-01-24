// src/modules/banking/AddAccountPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { addAccountPageStyles as styles } from "../styles/AddAccountPage.styles";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";

const AddAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [formData, setFormData] = useState({
    acctCode: "",
    bankName: "",
    accountNumber: "",
    savingsAmount: "",
    mpin: "",
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  // Handle checkbox change for isActive
  const handleIsActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      isActive: e.target.checked,
    }));
  };

  // Validate form data
  const validateForm = (): boolean => {
    if (!formData.acctCode.trim()) {
      setError("Account code is required");
      return false;
    }

    if (!formData.bankName.trim()) {
      setError("Bank name is required");
      return false;
    }

    if (!formData.accountNumber.trim()) {
      setError("Account number is required");
      return false;
    }

    const savingsAmount = parseFloat(formData.savingsAmount);
    if (isNaN(savingsAmount) || savingsAmount < 0) {
      setError("Please enter a valid savings amount (0 or more)");
      return false;
    }

    if (
      formData.mpin &&
      (formData.mpin.length < 4 || formData.mpin.length > 6)
    ) {
      setError("MPIN must be 4-6 digits if provided");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const accountData = {
        acctCode: formData.acctCode.trim(),
        bankName: formData.bankName.trim(),
        accountNumber: formData.accountNumber.trim(),
        savingsAmount: parseFloat(formData.savingsAmount) || 0,
        mpin: formData.mpin || "", // Optional field
        isActive: formData.isActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add to Firestore
      const accountsRef = collection(firestore, "accounts");
      await addDoc(accountsRef, accountData);

      // Success - ALWAYS navigate back to banking with accounts tab active
      navigate("/banking", {
        state: { activeTab: "accounts" }, // Force accounts tab
        replace: true,
      });
    } catch (err: any) {
      console.error("Error adding account:", err);
      setError(`Failed to add account: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel/back
  const handleCancel = () => {
    // On cancel, also go to accounts tab
    navigate("/banking", {
      state: { activeTab: "accounts" }, // Force accounts tab
      replace: true,
    });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button
          onClick={handleCancel}
          style={styles.backButton}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#f1f5f9")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#ffffff")
          }
          title="Go Back"
          disabled={isSubmitting}
        >
          ←
        </button>
        <h1 style={styles.headerTitle}>Add New Account</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>⚠️</div>
          <div style={styles.errorText}>{error}</div>
          <button onClick={() => setError(null)} style={styles.errorClose}>
            ✕
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formContent}>
          {/* Account Code */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="acctCode">
              Account Code *
            </label>
            <input
              type="text"
              id="acctCode"
              name="acctCode"
              value={formData.acctCode}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., HDFC, SBI, ICICI"
              disabled={isSubmitting}
              required
            />
            <div style={styles.helperText}>
              Short code to identify the account
            </div>
          </div>

          {/* Bank Name */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="bankName">
              Bank Name *
            </label>
            <input
              type="text"
              id="bankName"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., HDFC Bank, State Bank of India"
              disabled={isSubmitting}
              required
            />
            <div style={styles.helperText}>Full name of the bank</div>
          </div>

          {/* Account Number */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="accountNumber">
              Account Number *
            </label>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., 1234567890"
              disabled={isSubmitting}
              required
            />
            <div style={styles.helperText}>Bank account number</div>
          </div>

          {/* Savings Amount */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="savingsAmount">
              Initial Savings Amount *
            </label>
            <div style={styles.amountContainer}>
              <span style={styles.currencySymbol}>₹</span>
              <input
                type="number"
                id="savingsAmount"
                name="savingsAmount"
                value={formData.savingsAmount}
                onChange={handleChange}
                style={styles.amountInput}
                placeholder="0"
                step="0.01"
                min="0"
                disabled={isSubmitting}
                required
              />
            </div>
            <div style={styles.helperText}>
              Enter amount in rupees. Use 0 for new account.
            </div>
          </div>

          {/* MPIN (Optional) */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="mpin">
              MPIN (Optional)
            </label>
            <input
              type="password"
              id="mpin"
              name="mpin"
              value={formData.mpin}
              onChange={handleChange}
              style={styles.input}
              placeholder="••••"
              maxLength={6}
              disabled={isSubmitting}
            />
            <div style={styles.helperText}>
              4-6 digit PIN for account access (optional)
            </div>
          </div>

          {/* Active Status */}
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={handleIsActiveChange}
                style={styles.checkbox}
                disabled={isSubmitting}
              />
              <span style={styles.checkboxText}>Account is active</span>
            </label>
            <div style={styles.helperText}>
              Uncheck to create an inactive account
            </div>
          </div>

          {/* Form Buttons */}
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleCancel}
              style={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.submitButton,
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div style={styles.spinnerSmall}></div>
                  <span style={{ marginLeft: "8px" }}>Adding...</span>
                </>
              ) : (
                "Add Account"
              )}
            </button>
          </div>

          {/* Settings Info */}
          {!settings?.showDelete && (
            <div style={styles.infoBox}>
              <span style={styles.infoIcon}>ℹ️</span>
              <div style={styles.infoContent}>
                <div style={styles.infoTitle}>Edit/Delete Disabled</div>
                <div style={styles.infoText}>
                  You won't be able to edit or delete this account until you
                  enable it in{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/settings")}
                    style={styles.settingsLink}
                  >
                    Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AddAccountPage;
