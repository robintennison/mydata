import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { bankingStyles } from "../styles";
import { useBankingData } from "../hooks/useBankingData";
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
import styles from "../styles/DepositSummaryPage.styles";
import BankingNavigation from "./BankingNavigation";

interface AccountSummary {
  accountId: string;
  accountCode: string;
  savings: number;
  deposits: number;
  savingsInLakhs: string;
  depositsInLakhs: string;
}

const DepositSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { loading, accounts, deposits, adjustments } = useBankingData();
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editedSavings, setEditedSavings] = useState("");
  const [editedDeposits, setEditedDeposits] = useState("");
  const [summaries, setSummaries] = useState<AccountSummary[]>([]);
  const [showInactive, setShowInactive] = useState(false);
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
    return `${lakhs.toFixed(2)} L`;
  };

  // Get current month in "YYYY-MM" format
  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1; // Months are 0-indexed
    const year = now.getFullYear();
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    setCurrentMonth(`${year}-${monthStr}`); // e.g., "2026-01"
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
      // Default to Insert if there's an error
      setHistoryButtonText("Insert History for Current Month");
    }
  };

  useEffect(() => {
    if (currentMonth) {
      checkCurrentMonthHistory();
    }
  }, [currentMonth]);

  // Prepare summary data
  const prepareSummaries = () => {
    if (!accounts.length || !deposits.length) return [];

    const filteredDeposits = showInactive
      ? deposits
      : deposits.filter((deposit) => deposit.active !== false);

    const newSummaries = accounts.map((account) => {
      // Calculate base deposits for this account
      const baseDeposits = filteredDeposits
        .filter((deposit) => deposit.accountId === account.id)
        .reduce((sum, deposit) => sum + deposit.amount, 0);

      // Calculate adjustments for this account
      const adjustmentsTotal = adjustments
        .filter((adj) => adj.accountId === account.id)
        .reduce((sum, adj) => sum + (adj.adjustmentAmount || 0), 0);

      // Total deposits = base deposits + adjustments (SAME AS KOTLIN)
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
      a.accountCode.localeCompare(b.accountCode)
    );
  };

  // Update summaries when data changes
  useEffect(() => {
    const newSummaries = prepareSummaries();
    setSummaries(newSummaries);
  }, [accounts, deposits, adjustments, showInactive]);

  // Start editing a row
  const startEditing = (
    accountId: string,
    savings: number,
    deposits: number
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

  // FIREBASE: Update account savings in 'accounts' collection
  const updateAccountSavings = async (
    accountId: string,
    savingsRupees: number
  ) => {
    try {
      console.log("Updating account savings:", accountId, savingsRupees);
      const accountRef = doc(firestore, "accounts", accountId);
      await updateDoc(accountRef, {
        savingsAmount: savingsRupees,
        updatedAt: serverTimestamp(),
      });
      console.log("Account savings updated successfully");
      return true;
    } catch (error: any) {
      console.error("Firestore update error:", error);
      throw new Error(
        `Failed to update savings: ${error.message || "Unknown error"}`
      );
    }
  };

  // FIREBASE: Add adjustment to 'deposit_adjustments' collection
  const addDepositAdjustment = async (adjustment: {
    accountId: string;
    adjustmentAmount: number;
    note: string;
  }) => {
    try {
      console.log("Adding deposit adjustment:", adjustment);
      const adjustmentsRef = collection(firestore, "deposit_adjustments");
      await addDoc(adjustmentsRef, {
        ...adjustment,
        createdAt: serverTimestamp(),
      });
      console.log("Deposit adjustment added successfully");
      return true;
    } catch (error: any) {
      console.error("Firestore add adjustment error:", error);
      throw new Error(
        `Failed to add adjustment: ${error.message || "Unknown error"}`
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

      console.log("Saving edits for account:", accountId, {
        savingsLakhs,
        depositsLakhs,
      });

      // 1. Update savings in accounts collection (SAME AS KOTLIN)
      const savingsRupees = lakhsToRupees(savingsLakhs);
      await updateAccountSavings(accountId, savingsRupees);

      // 2. Calculate current deposits for this account (SAME LOGIC AS KOTLIN)
      const filteredDepositsList = showInactive
        ? deposits
        : deposits.filter((d) => d.active !== false);

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

      console.log("Deposit calculation:", {
        currentBaseDeposits,
        currentAdjustments,
        currentTotalWithAdjustments,
        targetRupees,
        adjustmentNeeded,
      });

      // 3. Create adjustment if needed (EXACTLY LIKE KOTLIN)
      if (Math.abs(adjustmentNeeded) > 0.01) {
        await addDepositAdjustment({
          accountId,
          adjustmentAmount: adjustmentNeeded,
          note: "Web summary screen adjustment",
        });
      }

      // 4. Refresh data
      refreshData();

      // 5. Cancel editing mode
      cancelEditing();

      // Show success message
      alert("✓ Changes saved successfully! Totals updated.");
    } catch (error: any) {
      console.error("Error saving edits:", error);
      setSaveError(
        error.message || "Failed to save changes. Please try again."
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
        savings: totalSavings, // From your totals calculation
        totalDeposits: totalDeposits, // From your totals calculation
      };

      console.log("Saving history for month:", currentMonth, historyData);

      const historyRef = doc(firestore, "history", currentMonth);

      // Check if document exists
      const historyDoc = await getDoc(historyRef);

      if (historyDoc.exists()) {
        // Update existing
        await updateDoc(historyRef, historyData);
        alert(
          `✓ History updated for ${currentMonth}!\nSavings: ${formatLakhs(
            rupeesToLakhs(totalSavings)
          )}\nDeposits: ${formatLakhs(rupeesToLakhs(totalDeposits))}`
        );
      } else {
        // Insert new
        await setDoc(historyRef, historyData);
        alert(
          `✓ History created for ${currentMonth}!\nSavings: ${formatLakhs(
            rupeesToLakhs(totalSavings)
          )}\nDeposits: ${formatLakhs(rupeesToLakhs(totalDeposits))}`
        );
      }

      // Update button text
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
    0
  );
  const totalDeposits = summaries.reduce(
    (sum, summary) => sum + summary.deposits,
    0
  );

  if (loading) {
    return (
      <div style={bankingStyles.container}>
        <div style={bankingStyles.loading}>
          <div style={bankingStyles.spinner}></div>
          <p>Loading summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={bankingStyles.header}>
        <div style={bankingStyles.headerTopRow}>
          <div style={bankingStyles.headerLeft}>
            <button
              onClick={() => navigate(-1)}
              style={styles.backButton}
              title="Go Back"
            >
              ←
            </button>
            <h1 style={bankingStyles.headerTitle}>Deposit Summary</h1>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {/* Show/Hide Inactive Toggle */}
        <div style={styles.toggleContainer}>
          <label style={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              style={styles.toggleInput}
            />
            <span style={styles.toggleText}>Show Inactive Deposits</span>
          </label>
        </div>

        {/* Error Message */}
        {saveError && (
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>⚠️</div>
            <div style={styles.errorText}>{saveError}</div>
            <button
              onClick={() => setSaveError(null)}
              style={styles.errorClose}
            >
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
            <button
              onClick={() => navigate("/banking/accounts")}
              style={styles.addButton}
            >
              Go to Accounts
            </button>
          </div>
        ) : (
          <>
            {/* Summary Table */}
            <div style={styles.tableContainer}>
              {/* Table Header */}
              <div style={styles.tableHeader}>
                <div style={{ ...styles.headerCell, flex: 1.5 }}>Account</div>
                <div style={{ ...styles.headerCell, flex: 1 }}>Savings</div>
                <div style={{ ...styles.headerCell, flex: 1 }}>Deposits</div>
                <div style={{ ...styles.headerCell, flex: 0.8 }}>Actions</div>
              </div>

              {/* Table Rows */}
              <div style={styles.tableBody}>
                {summaries.map((summary, index) => {
                  const isEditing = editingAccountId === summary.accountId;

                  return (
                    <div
                      key={summary.accountId}
                      style={{
                        ...styles.tableRow,
                        backgroundColor:
                          index % 2 === 0 ? "#fafafa" : "#ffffff",
                      }}
                    >
                      {/* Account Code */}
                      <div style={{ ...styles.cell, flex: 1.5 }}>
                        <div style={styles.accountCode}>
                          {summary.accountCode}
                        </div>
                      </div>

                      {/* Savings Amount */}
                      <div style={{ ...styles.cell, flex: 1 }}>
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
                            <span style={styles.lakhSuffix}>L</span>
                          </div>
                        ) : (
                          <div style={styles.amountDisplay}>
                            {summary.savingsInLakhs}
                          </div>
                        )}
                      </div>

                      {/* Deposits Amount */}
                      <div style={{ ...styles.cell, flex: 1 }}>
                        {isEditing ? (
                          <div style={styles.editInputContainer}>
                            <input
                              type="number"
                              value={editedDeposits}
                              onChange={(e) =>
                                setEditedDeposits(e.target.value)
                              }
                              style={styles.editInput}
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              disabled={isSaving}
                            />
                            <span style={styles.lakhSuffix}>L</span>
                          </div>
                        ) : (
                          <div style={styles.amountDisplay}>
                            {summary.depositsInLakhs}
                          </div>
                        )}
                      </div>

                      {/* Edit/Save/Cancel Buttons */}
                      <div
                        style={{
                          ...styles.cell,
                          flex: 0.8,
                          justifyContent: "center",
                        }}
                      >
                        {isEditing ? (
                          <div style={styles.actionButtons}>
                            <button
                              onClick={() => saveEdits(summary.accountId)}
                              style={styles.saveButton}
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
                        ) : (
                          <button
                            onClick={() =>
                              startEditing(
                                summary.accountId,
                                summary.savings,
                                summary.deposits
                              )
                            }
                            style={styles.editButton}
                            title="Edit"
                            disabled={editingAccountId !== null}
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals Row */}
              <div style={styles.totalsRow}>
                <div style={{ ...styles.totalsCell, flex: 1.5 }}>
                  <strong>TOTAL</strong>
                </div>
                <div style={{ ...styles.totalsCell, flex: 1 }}>
                  <strong>{formatLakhs(rupeesToLakhs(totalSavings))}</strong>
                </div>
                <div style={{ ...styles.totalsCell, flex: 1 }}>
                  <strong>{formatLakhs(rupeesToLakhs(totalDeposits))}</strong>
                </div>
                <div style={{ ...styles.totalsCell, flex: 0.8 }}>
                  <span style={styles.totalChangeIndicator}>
                    {adjustments.length > 0 ? `${adjustments.length} adj` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* History Update Button - Separate section below table */}
            <div style={styles.historySection}>
              <div style={styles.historyHeader}>
                <span style={styles.historyIcon}>📅</span>
                <span style={styles.historyTitle}>Monthly History</span>
              </div>
              <div style={styles.historyInfo}>
                <div style={styles.historyRow}>
                  <span style={styles.historyLabel}>Current Month:</span>
                  <span style={styles.historyValue}>{currentMonth}</span>
                </div>
                <div style={styles.historyRow}>
                  <span style={styles.historyLabel}>Total Savings:</span>
                  <span style={styles.historyValue}>
                    {formatLakhs(rupeesToLakhs(totalSavings))}
                  </span>
                </div>
                <div style={styles.historyRow}>
                  <span style={styles.historyLabel}>Total Deposits:</span>
                  <span style={styles.historyValue}>
                    {formatLakhs(rupeesToLakhs(totalDeposits))}
                  </span>
                </div>
              </div>
              <button
                onClick={handleHistoryUpdate}
                style={styles.historyButton}
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
                This will{" "}
                {historyButtonText?.includes("Update") ? "update" : "create"} a
                record in the history table for {currentMonth}
              </div>
            </div>

            {/* Instructions */}
            <div style={styles.instructions}>
              <div style={styles.instructionItem}>
                <span style={styles.instructionIcon}>✏️</span>
                <span>Click edit icon to modify values</span>
              </div>
              <div style={styles.instructionItem}>
                <span style={styles.instructionIcon}>📊</span>
                <span>Total = Base Deposits + Adjustments</span>
              </div>
              <div style={styles.instructionItem}>
                <span style={styles.instructionIcon}>💾</span>
                <span>
                  Savings update "accounts", deposits create
                  "deposit_adjustments"
                </span>
              </div>
            </div>
          </>
        )}
      </div>
      <BankingNavigation />
      {/* Bottom spacing */}
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default DepositSummaryPage;
