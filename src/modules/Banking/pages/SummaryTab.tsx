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
import { summaryTabStyles as styles } from "../styles/SummaryTab.styles";

interface AccountSummary {
  accountId: string;
  accountCode: string;
  savings: number;
  deposits: number;
  savingsInLakhs: string;
  depositsInLakhs: string;
}

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

  // Format lakhs for display
  const formatLakhs = (lakhs: number): string => {
    return lakhs.toFixed(2);
  };

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

      // Convert to lakhs for display
      const savingsLakhs = rupeesToLakhs(account.savingsAmount);
      const depositsLakhs = rupeesToLakhs(totalDeposits);

      return {
        accountId: account.id,
        accountCode: (account as any).acctCode || account.id,
        savings: account.savingsAmount,
        deposits: totalDeposits,
        savingsInLakhs: formatLakhs(savingsLakhs),
        depositsInLakhs: formatLakhs(depositsLakhs),
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
          `✓ History updated for ${currentMonth}!\nSavings: ${formatLakhs(
            rupeesToLakhs(totalSavings),
          )}\nDeposits: ${formatLakhs(rupeesToLakhs(totalDeposits))}`,
        );
      } else {
        await setDoc(historyRef, historyData);
        alert(
          `✓ History created for ${currentMonth}!\nSavings: ${formatLakhs(
            rupeesToLakhs(totalSavings),
          )}\nDeposits: ${formatLakhs(rupeesToLakhs(totalDeposits))}`,
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
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading summary...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Error Message */}
      {saveError && (
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>⚠️</div>
          <div style={styles.errorText}>{saveError}</div>
          <button onClick={() => setSaveError(null)} style={styles.errorClose}>
            ✕
          </button>
        </div>
      )}

      {accounts.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📊</div>
          <div style={styles.emptyText}>No accounts available</div>
          <div style={styles.emptySubtext}>
            Add accounts first from the Accounts page
          </div>
        </div>
      ) : (
        <>
          {/* Summary Table */}
          <div style={styles.tableContainer}>
            {/* Table Header */}
            <div style={styles.tableHeader}>
              <div
                style={{
                  ...styles.headerCell,
                  flex: 1.5,
                  paddingLeft: "8px",
                }}
              >
                Account
              </div>
              <div
                style={{
                  ...styles.headerCell,
                  flex: 1,
                  textAlign: "right",
                  paddingRight: "12px",
                }}
              >
                Savings
              </div>
              <div
                style={{
                  ...styles.headerCell,
                  flex: 1,
                  textAlign: "right",
                  paddingRight: "12px",
                }}
              >
                Deposits
              </div>
              <div
                style={{
                  ...styles.headerCell,
                  flex: 0.5,
                  textAlign: "center",
                }}
              >
                {/* Empty for action column header */}
              </div>
            </div>

            {/* Table Rows */}
            <div>
              {summaries.map((summary, index) => {
                const isEditing = editingAccountId === summary.accountId;
                const showEditAction = settings?.showDelete;

                return (
                  <div
                    key={summary.accountId}
                    style={{
                      ...styles.tableRow,
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                      borderBottom:
                        index < summaries.length - 1
                          ? "1px solid #f3f4f6"
                          : "none",
                    }}
                  >
                    {/* Account Code */}
                    <div
                      style={{
                        ...styles.tableCell,
                        flex: 1.5,
                        paddingLeft: "8px",
                        overflow: "hidden",
                      }}
                    >
                      <div style={styles.accountCode}>
                        {summary.accountCode}
                      </div>
                    </div>

                    {/* Savings Amount */}
                    <div
                      style={{
                        ...styles.tableCell,
                        flex: 1,
                        textAlign: "right",
                        paddingRight: "12px",
                      }}
                    >
                      {isEditing ? (
                        <div style={styles.editInputContainer}>
                          <input
                            type="number"
                            value={editedSavings}
                            onChange={(e) => setEditedSavings(e.target.value)}
                            style={styles.editInput}
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            disabled={isSaving}
                          />
                        </div>
                      ) : (
                        <div style={styles.amountDisplay}>
                          {summary.savingsInLakhs}
                        </div>
                      )}
                    </div>

                    {/* Deposits Amount */}
                    <div
                      style={{
                        ...styles.tableCell,
                        flex: 1,
                        textAlign: "right",
                        paddingRight: "12px",
                      }}
                    >
                      {isEditing ? (
                        <div style={styles.editInputContainer}>
                          <input
                            type="number"
                            value={editedDeposits}
                            onChange={(e) => setEditedDeposits(e.target.value)}
                            style={styles.editInput}
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            disabled={isSaving}
                          />
                        </div>
                      ) : (
                        <div style={styles.amountDisplay}>
                          {summary.depositsInLakhs}
                        </div>
                      )}
                    </div>

                    {/* Action Column */}
                    <div
                      style={{
                        ...styles.tableCell,
                        flex: 0.5,
                        display: "flex",
                        justifyContent: "center",
                        minWidth: "60px",
                      }}
                    >
                      {isEditing ? (
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => saveEdits(summary.accountId)}
                            style={{
                              ...styles.saveButton,
                              cursor: isSaving ? "not-allowed" : "pointer",
                              opacity: isSaving ? 0.6 : 1,
                            }}
                            title="Save"
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <div style={styles.spinnerSmall}></div>
                            ) : (
                              "✓"
                            )}
                          </button>
                          <button
                            onClick={cancelEditing}
                            style={styles.cancelButton}
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
                          style={{
                            ...styles.editButton,
                            cursor:
                              editingAccountId !== null
                                ? "not-allowed"
                                : "pointer",
                            opacity: editingAccountId !== null ? 0.5 : 1,
                          }}
                          title="Edit"
                          disabled={editingAccountId !== null}
                        >
                          ✏️
                        </button>
                      ) : (
                        <div style={{ width: "32px", height: "32px" }}></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals Row */}
            <div style={styles.totalsRow}>
              <div
                style={{
                  ...styles.totalsCell,
                  flex: 1.5,
                  paddingLeft: "8px",
                }}
              >
                TOTAL
              </div>
              <div
                style={{
                  ...styles.totalsCell,
                  flex: 1,
                  textAlign: "right",
                  paddingRight: "12px",
                }}
              >
                {formatLakhs(rupeesToLakhs(totalSavings))}
              </div>
              <div
                style={{
                  ...styles.totalsCell,
                  flex: 1,
                  textAlign: "right",
                  paddingRight: "12px",
                }}
              >
                {formatLakhs(rupeesToLakhs(totalDeposits))}
              </div>
              <div
                style={{
                  ...styles.totalsCell,
                  flex: 0.5,
                  textAlign: "center",
                  minWidth: "60px",
                }}
              >
                {/* Empty for consistency */}
              </div>
            </div>
          </div>

          {/* History Update Section */}
          <div style={styles.historySection}>
            <button
              onClick={handleHistoryUpdate}
              style={{
                ...styles.historyButton,
                cursor:
                  isUpdatingHistory || !currentMonth
                    ? "not-allowed"
                    : "pointer",
                opacity: isUpdatingHistory || !currentMonth ? 0.6 : 1,
              }}
              disabled={isUpdatingHistory || !currentMonth}
            >
              {isUpdatingHistory ? (
                <>
                  <div style={styles.spinnerSmall}></div>
                  <span style={{ marginLeft: "8px" }}>Processing...</span>
                </>
              ) : (
                historyButtonText || "Loading..."
              )}
            </button>
            <div style={styles.historyNote}>
              {historyButtonText?.includes("Update") ? "Updates" : "Creates"}{" "}
              record in history table for {currentMonth}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SummaryTab;
