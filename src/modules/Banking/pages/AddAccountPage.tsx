// src/modules/banking/AddAccountPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
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
        mpin: formData.mpin || "",
        isActive: formData.isActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add to Firestore
      const accountsRef = collection(firestore, "accounts");
      await addDoc(accountsRef, accountData);

      // Success - ALWAYS navigate back to banking with accounts tab active
      navigate("/banking", {
        state: { activeTab: "accounts" },
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
    navigate("/banking", {
      state: { activeTab: "accounts" },
      replace: true,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 mb-4">
        <button
          onClick={handleCancel}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg text-xl cursor-pointer flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Go Back"
          disabled={isSubmitting}
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-900">Add New Account</h1>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 mx-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <div className="text-red-500 text-xl flex-shrink-0">⚠️</div>
          <div className="flex-1 text-red-700 text-sm">{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-lg cursor-pointer flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 pb-4">
        <div className="space-y-6">
          {/* Account Code */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="acctCode"
            >
              Account Code *
            </label>
            <input
              type="text"
              id="acctCode"
              name="acctCode"
              value={formData.acctCode}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="e.g., HDFC, SBI, ICICI"
              disabled={isSubmitting}
              required
            />
            <div className="mt-1 text-xs text-gray-500">
              Short code to identify the account
            </div>
          </div>

          {/* Bank Name */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="bankName"
            >
              Bank Name *
            </label>
            <input
              type="text"
              id="bankName"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="e.g., HDFC Bank, State Bank of India"
              disabled={isSubmitting}
              required
            />
            <div className="mt-1 text-xs text-gray-500">
              Full name of the bank
            </div>
          </div>

          {/* Account Number */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="accountNumber"
            >
              Account Number *
            </label>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="e.g., 1234567890"
              disabled={isSubmitting}
              required
            />
            <div className="mt-1 text-xs text-gray-500">
              Bank account number
            </div>
          </div>

          {/* Savings Amount */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="savingsAmount"
            >
              Initial Savings Amount *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₹
              </div>
              <input
                type="number"
                id="savingsAmount"
                name="savingsAmount"
                value={formData.savingsAmount}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="0"
                step="0.01"
                min="0"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Enter amount in rupees. Use 0 for new account.
            </div>
          </div>

          {/* MPIN (Optional) */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="mpin"
            >
              MPIN (Optional)
            </label>
            <input
              type="password"
              id="mpin"
              name="mpin"
              value={formData.mpin}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="••••"
              maxLength={6}
              disabled={isSubmitting}
            />
            <div className="mt-1 text-xs text-gray-500">
              4-6 digit PIN for account access (optional)
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center cursor-pointer mb-1">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={handleIsActiveChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                disabled={isSubmitting}
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Account is active
              </span>
            </label>
            <div className="ml-6 text-xs text-gray-500">
              Uncheck to create an inactive account
            </div>
          </div>

          {/* Form Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-lg cursor-pointer text-sm font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </>
              ) : (
                "Add Account"
              )}
            </button>
          </div>

          {/* Settings Info */}
          {!settings?.showDelete && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <div className="text-blue-500 text-lg flex-shrink-0">ℹ️</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-800 mb-1">
                  Edit/Delete Disabled
                </div>
                <div className="text-xs text-blue-700">
                  You won't be able to edit or delete this account until you
                  enable it in{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/settings")}
                    className="text-blue-600 font-medium underline hover:text-blue-800 cursor-pointer bg-transparent border-none p-0"
                  >
                    Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddAccountPage;
