// src/modules/banking/SummaryTab.tsx
import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { useBankingData } from "../hooks/useBankingData";
import { useSettings } from "../../../contexts/SettingsContext";

interface AccountSummary {
  accountId: string;
  accountCode: string;
  savings: number;
  deposits: number;
  savingsInLakhs: string;
  depositsInLakhs: string;
}

// Add the same formatter function as in DepositsTab
const formatInLakhs = (amount: number): string => {
  return (amount / 100000).toFixed(2); // Just the number with 2 decimals
};

const SummaryTab: React.FC = () => {
  const { loading, accounts, deposits, adjustments } = useBankingData();
  const { settings } = useSettings();

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editedSavings, setEditedSavings] = useState("");
  const [editedDeposits, setEditedDeposits] = useState("");
  const [summaries, setSummaries] = useState<AccountSummary[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isUpdatingHistory, setIsUpdatingHistory] = useState(false);
  const [historyButtonText, setHistoryButtonText] = useState("");
  const [currentMonth, setCurrentMonth] = useState("");

  // Convert rupees to lakhs
  const rupeesToLakhs = (rupees: number): number => rupees / 100000;
  const lakhsToRupees = (lakhs: number): number => lakhs * 100000;

  // Get current month in "YYYY-MM" format
  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    setCurrentMonth(`${year}-${monthStr}`);
  }, []);

  // Check if current month exists in history
  const checkCurrentMonthHistory = async () => {
    if (!currentMonth) return;

    try {
      const historyRef = doc(firestore, "history", currentMonth);
      const historyDoc = await getDoc(historyRef);

      if (historyDoc.exists()) {
        setHistoryButtonText("Update History for Current Month");
      } else {
        setHistoryButtonText("Insert History for Current Month");
      }
    } catch (error) {
      console.error("Error checking history:", error);
      setHistoryButtonText("Insert History for Current Month");
    }
  };

  useEffect(() => {
    if (currentMonth) {
      checkCurrentMonthHistory();
    }
  }, [currentMonth]);

  // Prepare summary data - ONLY ACTIVE ITEMS
  const prepareSummaries = () => {
    if (!accounts.length || !deposits.length) return [];

    // Filter out inactive deposits
    const filteredDeposits = deposits.filter(
      (deposit) => deposit.active !== false,
    );

    const newSummaries = accounts.map((account) => {
      // Calculate base deposits for this account
      const baseDeposits = filteredDeposits
        .filter((deposit) => deposit.accountId === account.id)
        .reduce((sum, deposit) => sum + deposit.amount, 0);

      // Calculate adjustments for this account
      const adjustmentsTotal = adjustments
        .filter((adj) => adj.accountId === account.id)
        .reduce((sum, adj) => sum + (adj.adjustmentAmount || 0), 0);

      // Total deposits = base deposits + adjustments
      const totalDeposits = baseDeposits + adjustmentsTotal;

      // Use the same formatter as DepositsTab
      const savingsFormatted = formatInLakhs(account.savingsAmount);
      const depositsFormatted = formatInLakhs(totalDeposits);

      return {
        accountId: account.id,
        accountCode: (account as any).acctCode || account.id,
        savings: account.savingsAmount,
        deposits: totalDeposits,
        savingsInLakhs: savingsFormatted,
        depositsInLakhs: depositsFormatted,
      };
    });

    // Sort by account code
    return newSummaries.sort((a, b) =>
      a.accountCode.localeCompare(b.accountCode),
    );
  };

  // Update summaries when data changes
  useEffect(() => {
    const newSummaries = prepareSummaries();
    setSummaries(newSummaries);
  }, [accounts, deposits, adjustments]);

  // Start editing a row
  const startEditing = (
    accountId: string,
    savings: number,
    deposits: number,
  ) => {
    setEditingAccountId(accountId);
    setSaveError(null);
    const savingsLakhs = rupeesToLakhs(savings);
    const depositsLakhs = rupeesToLakhs(deposits);
    setEditedSavings(savingsLakhs.toFixed(2));
    setEditedDeposits(depositsLakhs.toFixed(2));
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingAccountId(null);
    setEditedSavings("");
    setEditedDeposits("");
    setSaveError(null);
  };

  // Update account savings in 'accounts' collection
  const updateAccountSavings = async (
    accountId: string,
    savingsRupees: number,
  ) => {
    try {
      const accountRef = doc(firestore, "accounts", accountId);
      await updateDoc(accountRef, {
        savingsAmount: savingsRupees,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error: any) {
      console.error("Firestore update error:", error);
      throw new Error(
        `Failed to update savings: ${error.message || "Unknown error"}`,
      );
    }
  };

  // Add adjustment to 'deposit_adjustments' collection
  const addDepositAdjustment = async (adjustment: {
    accountId: string;
    adjustmentAmount: number;
    note: string;
  }) => {
    try {
      const adjustmentsRef = collection(firestore, "deposit_adjustments");
      await addDoc(adjustmentsRef, {
        ...adjustment,
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (error: any) {
      console.error("Firestore add adjustment error:", error);
      throw new Error(
        `Failed to add adjustment: ${error.message || "Unknown error"}`,
      );
    }
  };

  // Simple refresh function
  const refreshData = () => {
    window.location.reload();
  };

  // Save edits
  const saveEdits = async (accountId: string) => {
    try {
      setIsSaving(true);
      setSaveError(null);

      const savingsLakhs = parseFloat(editedSavings);
      const depositsLakhs = parseFloat(editedDeposits);

      if (isNaN(savingsLakhs) || isNaN(depositsLakhs)) {
        setSaveError("Please enter valid numbers");
        setIsSaving(false);
        return;
      }

      // Update savings in accounts collection
      const savingsRupees = lakhsToRupees(savingsLakhs);
      await updateAccountSavings(accountId, savingsRupees);

      // Calculate current deposits for this account
      const filteredDepositsList = deposits.filter((d) => d.active !== false);
      const currentBaseDeposits = filteredDepositsList
        .filter((d) => d.accountId === accountId)
        .reduce((sum, d) => sum + d.amount, 0);

      const currentAdjustments = adjustments
        .filter((a) => a.accountId === accountId)
        .reduce((sum, a) => sum + (a.adjustmentAmount || 0), 0);

      const currentTotalWithAdjustments =
        currentBaseDeposits + currentAdjustments;
      const targetRupees = lakhsToRupees(depositsLakhs);
      const adjustmentNeeded = targetRupees - currentTotalWithAdjustments;

      // Create adjustment if needed
      if (Math.abs(adjustmentNeeded) > 0.01) {
        await addDepositAdjustment({
          accountId,
          adjustmentAmount: adjustmentNeeded,
          note: "Web summary screen adjustment",
        });
      }

      // Refresh data
      refreshData();
      cancelEditing();
      alert("✓ Changes saved successfully! Totals updated.");
    } catch (error: any) {
      console.error("Error saving edits:", error);
      setSaveError(
        error.message || "Failed to save changes. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Update or insert history for current month
  const handleHistoryUpdate = async () => {
    try {
      setIsUpdatingHistory(true);

      if (!currentMonth) {
        alert("Unable to determine current month");
        return;
      }

      // Use the totals calculated from summaries
      const historyData = {
        month: currentMonth,
        savings: totalSavings,
        totalDeposits: totalDeposits,
      };

      const historyRef = doc(firestore, "history", currentMonth);
      const historyDoc = await getDoc(historyRef);

      if (historyDoc.exists()) {
        await updateDoc(historyRef, historyData);
        alert(
          `✓ History updated for ${currentMonth}!\nSavings: ${formatInLakhs(
            totalSavings,
          )}\nDeposits: ${formatInLakhs(totalDeposits)}`,
        );
      } else {
        await setDoc(historyRef, historyData);
        alert(
          `✓ History created for ${currentMonth}!\nSavings: ${formatInLakhs(
            totalSavings,
          )}\nDeposits: ${formatInLakhs(totalDeposits)}`,
        );
      }

      await checkCurrentMonthHistory();
    } catch (error: any) {
      console.error("Error updating history:", error);
      alert(`❌ Failed to update history: ${error.message || "Unknown error"}`);
    } finally {
      setIsUpdatingHistory(false);
    }
  };

  // Calculate totals
  const totalSavings = summaries.reduce(
    (sum, summary) => sum + summary.savings,
    0,
  );
  const totalDeposits = summaries.reduce(
    (sum, summary) => sum + summary.deposits,
    0,
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-5">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading summary...</p>
      </div>
    );
  }

  return (
    <div className="px-1 w-full">
      {/* Error Message */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-sm text-red-700">{saveError}</span>
          </div>
          <button
            onClick={() => setSaveError(null)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            ✕
          </button>
        </div>
      )}
      {accounts.length === 0 ? (
        <div className="text-center py-12 px-5 text-gray-500">
          <div className="text-4xl mb-4 opacity-50">📊</div>
          <div className="text-base font-medium text-gray-600 mb-2">
            No accounts available
          </div>
          <div className="text-sm text-gray-400">
            Add accounts first from the Accounts page
          </div>
        </div>
      ) : (
        <>
          {/* Summary Table - Optimized for mobile with flex layout */}
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            {/* Table Header */}
            <div className="flex items-center py-2 bg-gray-50 border-b border-gray-300 text-xs font-semibold text-gray-700">
              <div className="flex-1 pl-2 pr-1">Account</div>
              <div className="w-[70px] px-0.5 text-right">Savings</div>
              <div className="w-[70px] px-0.5 text-right">Deposits</div>
              <div className="w-[60px] pr-2 text-right">Edit</div>
            </div>

            {/* Table Rows */}
            <div>
              {summaries.map((summary, index) => {
                const isEditing = editingAccountId === summary.accountId;
                const showEditAction = settings?.showDelete;

                return (
                  <div
                    key={summary.accountId}
                    className={`flex items-center py-2.5 border-b border-gray-100 text-sm ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } ${!isEditing ? "hover:bg-gray-100 cursor-pointer" : ""}`}
                  >
                    {/* Account Code - Takes remaining space */}
                    <div className="flex-1 pl-2 pr-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap">
                        {summary.accountCode}
                      </div>
                    </div>

                    {/* Savings Amount - Fixed width */}
                    <div className="w-[70px] px-0.5 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedSavings}
                          onChange={(e) => setEditedSavings(e.target.value)}
                          className="w-full max-w-[60px] p-1 border border-gray-300 rounded text-xs text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          disabled={isSaving}
                        />
                      ) : (
                        <div className="text-sm font-semibold text-blue-600">
                          {summary.savingsInLakhs}
                        </div>
                      )}
                    </div>

                    {/* Deposits Amount - Fixed width */}
                    <div className="w-[70px] px-0.5 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedDeposits}
                          onChange={(e) => setEditedDeposits(e.target.value)}
                          className="w-full max-w-[60px] p-1 border border-gray-300 rounded text-xs text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          disabled={isSaving}
                        />
                      ) : (
                        <div className="text-sm font-semibold text-blue-600">
                          {summary.depositsInLakhs}
                        </div>
                      )}
                    </div>

                    {/* Action Column - Fixed width with right alignment */}
                    <div className="w-[60px] pr-2 flex justify-end">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveEdits(summary.accountId)}
                            className="w-6 h-6 bg-green-500 text-white rounded flex items-center justify-center hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex-shrink-0"
                            title="Save"
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              "✓"
                            )}
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center hover:bg-red-600 text-xs flex-shrink-0"
                            title="Cancel"
                            disabled={isSaving}
                          >
                            ✕
                          </button>
                        </div>
                      ) : showEditAction ? (
                        <button
                          onClick={() =>
                            startEditing(
                              summary.accountId,
                              summary.savings,
                              summary.deposits,
                            )
                          }
                          className="w-6 h-6 bg-blue-500 text-white rounded flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex-shrink-0"
                          title="Edit"
                          disabled={editingAccountId !== null}
                        >
                          ✏️
                        </button>
                      ) : (
                        <div className="w-6 h-6"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals Row */}
            <div className="flex items-center py-2.5 bg-gray-50 border-t border-gray-300 font-semibold text-sm">
              <div className="flex-1 pl-2 pr-1">TOTAL</div>
              <div className="w-[70px] px-0.5 text-right text-blue-600">
                {formatInLakhs(totalSavings)}
              </div>
              <div className="w-[70px] px-0.5 text-right text-blue-600">
                {formatInLakhs(totalDeposits)}
              </div>
              <div className="w-[60px] pr-2"></div>
            </div>
          </div>

          {/* Summary Count Info */}
          <div className="text-xs text-gray-500 text-center mt-2 px-2">
            Showing {summaries.length} account
            {summaries.length !== 1 ? "s" : ""}
          </div>

          {/* History Update Section */}
          <div className="mt-4 flex flex-col items-center">
            <button
              onClick={handleHistoryUpdate}
              className={`px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[220px] flex items-center justify-center text-sm`}
              disabled={isUpdatingHistory || !currentMonth}
            >
              {isUpdatingHistory ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                historyButtonText || "Loading..."
              )}
            </button>
            <div className="text-xs text-gray-500 mt-2 text-center">
              {historyButtonText?.includes("Update") ? "Updates" : "Creates"}{" "}
              record in history table for {currentMonth}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SummaryTab;
