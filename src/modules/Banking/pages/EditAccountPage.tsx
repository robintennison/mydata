
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { useBankingData } from "../hooks/useBankingData";
import { firestore } from "../../../lib/firebase";
import { updateDoc, doc } from "firebase/firestore";
import { toFirestoreData } from "../../../utils/firestoreHelpers";
import type { BankAccount } from "../../../types/banking.types";
import HistoryChart from "./HistoryChart";

interface History {
  month: string;
  savings: number;
  totalDeposits: number;
}

const EditAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { settings } = useSettings();
  
  // Destructure 'refresh' along with data from the banking hook
  const { accounts, loading: dataLoading, historyDetail, refresh } = useBankingData();

  const isViewMode = !settings?.showDelete;

  const [submitting, setSubmitting] = useState(false);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [textareaHeight, setTextareaHeight] = useState<number>(150);
  const [accountHistory, setAccountHistory] = useState<History[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState({
    acctCode: "",
    acctDetails: "",
    mpin: "",
  });

  // Filter history data for the current account from historyDetail
  useEffect(() => {
    if (account && historyDetail) {
      const filtered = historyDetail
        .filter((h) => h.acctCode === account.acctCode)
        .map((h) => ({
          month: h.month,
          savings: h.savings,
          totalDeposits: h.deposits,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
      setAccountHistory(filtered);
    }
  }, [account, historyDetail]);

  // Load account data into the form
  useEffect(() => {
    if (!id) {
      setError("Account ID is missing");
      return;
    }
    const found = accounts.find((a) => a.id === id);
    if (found) {
      setAccount(found);
      setFormData({
        acctCode: found.acctCode,
        acctDetails: found.acctDetails,
        mpin: found.mpin,
      });
    }
  }, [id, accounts]);

  // Adjust textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.max(150, textareaRef.current.scrollHeight);
      setTextareaHeight(newHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [formData.acctDetails, isViewMode]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode || !validateForm() || !id) return;

    try {
      setSubmitting(true);
      const accountRef = doc(firestore, "accounts", id);
      
      // Update the document in Firestore
      await updateDoc(accountRef, toFirestoreData({
        ...formData,
        id: id
      }));

      // FIX: Trigger the global context refresh so the UI updates immediately
      if (refresh) {
        await refresh();
      }

      // Navigate back to the Banking Home Accounts tab
      navigate("/banking", { state: { activeTab: "accounts" } });
    } catch (err: any) {
      console.error("Error updating account:", err);
      setError("Failed to update account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/banking", { state: { activeTab: "accounts" } });
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
      <div className="p-10 text-center">
        <h1 className="text-xl font-bold mb-4">Account Not Found</h1>
        <button onClick={handleCancel} className="text-blue-500 underline">Back to Banking</button>
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

      <div className="p-4 space-y-6">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Account Code
            </label>
            <input
              type="text"
              value={formData.acctCode}
              onChange={(e) => handleChange("acctCode", e.target.value)}
              disabled={isViewMode || submitting}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Account Details
            </label>
            <textarea
              ref={textareaRef}
              value={formData.acctDetails}
              onChange={(e) => handleChange("acctDetails", e.target.value)}
              disabled={isViewMode || submitting}
              style={{ height: textareaHeight }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              MPIN
            </label>
            <input
              type="text"
              value={formData.mpin}
              onChange={(e) => handleChange("mpin", e.target.value)}
              disabled={isViewMode || submitting}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {!isViewMode && (
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          )}
        </form>

        {/* History Chart */}
        {accountHistory.length >= 2 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <HistoryChart history={accountHistory} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditAccountPage;