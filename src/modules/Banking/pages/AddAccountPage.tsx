// src/modules/banking/AddAccountPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";

const AddAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [formData, setFormData] = useState({
    acctCode: "",
    acctDetails: "",
    mpin: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textareaHeight, setTextareaHeight] = useState<number>(150);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.max(150, textareaRef.current.scrollHeight);
      setTextareaHeight(newHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [formData.acctDetails]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  // Validate form data
  const validateForm = (): boolean => {
    if (!formData.acctCode.trim()) {
      setError("Account code is required");
      return false;
    }

    if (!formData.acctDetails.trim()) {
      setError("Account details are required");
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
        acctDetails: formData.acctDetails.trim(),
        mpin: formData.mpin.trim(),
        updatedAt: serverTimestamp(),
      };

      // Add to Firestore
      const accountsRef = collection(firestore, "accounts");
      await addDoc(accountsRef, accountData);

      // Success - navigate back to banking with accounts tab active
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
    <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-4 px-2 box-border overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 mb-3">
        <button
          onClick={handleCancel}
          className="w-9 h-9 bg-white border border-gray-300 rounded-lg text-lg cursor-pointer flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Go Back"
          disabled={isSubmitting}
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-gray-900">Add New Account</h1>
        <div className="w-9"></div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-3 mx-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <div className="text-red-500 text-lg flex-shrink-0">⚠️</div>
          <div className="flex-1 text-red-700 text-sm">{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-base cursor-pointer flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-2 pb-3">
        <div className="space-y-4">
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
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="e.g., HDFC, SBI, ICICI"
              disabled={isSubmitting}
              required
            />
            <div className="mt-0.5 text-xs text-gray-500">
              Short code to identify the account
            </div>
          </div>

          {/* Account Details Textarea */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="acctDetails"
            >
              Account Details *
            </label>
            <textarea
              ref={textareaRef}
              id="acctDetails"
              name="acctDetails"
              value={formData.acctDetails}
              onChange={handleChange}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed resize-y"
              style={{ height: `${textareaHeight}px` }}
              placeholder="Bank name, branch, account type, IFSC code, account holder name, contact info, etc."
              disabled={isSubmitting}
              required
              maxLength={1000}
            />
            <div className="mt-0.5 text-xs text-gray-500">
              Characters: {formData.acctDetails.length}/1000
            </div>
          </div>

          {/* MPIN */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="mpin"
            >
              MPIN
            </label>
            <input
              id="mpin"
              name="mpin"
              value={formData.mpin}
              onChange={handleChange}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="••••"
              disabled={isSubmitting}
              required
            />
            <div className="mt-0.5 text-xs text-gray-500">
              PIN for account access
            </div>
          </div>

          {/* Form Buttons */}
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-3 py-2.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-3 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-lg cursor-pointer text-sm font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </>
              ) : (
                "Add Account"
              )}
            </button>
          </div>

          {/* Settings Info */}
          {!settings?.showDelete && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <div className="text-blue-500 text-base flex-shrink-0">ℹ️</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-800 mb-0.5">
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
