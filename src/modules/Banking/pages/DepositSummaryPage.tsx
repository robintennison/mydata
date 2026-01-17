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
import { useSettings } from "../../../contexts/SettingsContext";

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
  const { settings } = useSettings(); // Get settings for edit permissions

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

  // Format lakhs for display (removed "L" suffix as requested)
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

  // Prepare summary data - ONLY ACTIVE ITEMS (removed showInactive)
  const prepareSummaries = () => {
    if (!accounts.length || !deposits.length) return [];

    // Filter out inactive deposits - ALWAYS hide inactive
    const filteredDeposits = deposits.filter(
      (deposit) => deposit.active !== false
    );

    const newSummaries = accounts.map((account) => {
      // Calculate base deposits for this account (only active)
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
      a.accountCode.localeCompare(b.accountCode)
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

  // Update account savings in 'accounts' collection
  const updateAccountSavings = async (
    accountId: string,
    savingsRupees: number
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
        `Failed to update savings: ${error.message || "Unknown error"}`
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

      // Update savings in accounts collection
      const savingsRupees = lakhsToRupees(savingsLakhs);
      await updateAccountSavings(accountId, savingsRupees);

      // Calculate current deposits for this account (only active)
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
        savings: totalSavings,
        totalDeposits: totalDeposits,
      };

      const historyRef = doc(firestore, "history", currentMonth);
      const historyDoc = await getDoc(historyRef);

      if (historyDoc.exists()) {
        await updateDoc(historyRef, historyData);
        alert(
          `✓ History updated for ${currentMonth}!\nSavings: ${formatLakhs(
            rupeesToLakhs(totalSavings)
          )}\nDeposits: ${formatLakhs(rupeesToLakhs(totalDeposits))}`
        );
      } else {
        await setDoc(historyRef, historyData);
        alert(
          `✓ History created for ${currentMonth}!\nSavings: ${formatLakhs(
            rupeesToLakhs(totalSavings)
          )}\nDeposits: ${formatLakhs(rupeesToLakhs(totalDeposits))}`
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
      {/* Header - Single row with back arrow, title, and settings icon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              color: "#1e293b",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f1f5f9")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#ffffff")
            }
            title="Go Back"
          >
            ←
          </button>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#1e293b",
              margin: 0,
            }}
          >
            Deposit Summary
          </h1>
        </div>

        <button
          onClick={() => navigate("/settings")}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            color: "#1e293b",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#f1f5f9")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#ffffff")
          }
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      <div
        style={{
          ...styles.content,
          padding: "12px",
        }}
      >
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
            {/* Summary Table - Fixed alignment */}
            <div
              style={{
                marginBottom: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {/* Table Header - Fixed alignment */}
              <div
                style={{
                  display: "flex",
                  padding: "10px 12px",
                  backgroundColor: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                  fontWeight: "600",
                  fontSize: "13px",
                  color: "#374151",
                }}
              >
                <div
                  style={{
                    flex: "1.5",
                    paddingLeft: "8px",
                    minWidth: "0",
                  }}
                >
                  Account
                </div>
                <div
                  style={{
                    flex: "1",
                    textAlign: "right",
                    paddingRight: "12px",
                    minWidth: "0",
                  }}
                >
                  Savings
                </div>
                <div
                  style={{
                    flex: "1",
                    textAlign: "right",
                    paddingRight: "12px",
                    minWidth: "0",
                  }}
                >
                  Deposits
                </div>
                <div
                  style={{
                    flex: "0.5",
                    textAlign: "center",
                    minWidth: "0",
                  }}
                >
                  {/* Empty for action column header */}
                </div>
              </div>

              {/* Table Rows - Fixed alignment */}
              <div>
                {summaries.map((summary, index) => {
                  const isEditing = editingAccountId === summary.accountId;
                  const showEditAction = settings?.showDelete;

                  return (
                    <div
                      key={summary.accountId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "10px 12px",
                        backgroundColor:
                          index % 2 === 0 ? "#ffffff" : "#f9fafb",
                        borderBottom:
                          index < summaries.length - 1
                            ? "1px solid #f3f4f6"
                            : "none",
                        minHeight: "48px",
                      }}
                    >
                      {/* Account Code */}
                      <div
                        style={{
                          flex: "1.5",
                          paddingLeft: "8px",
                          minWidth: "0",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#1e293b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {summary.accountCode}
                        </div>
                      </div>

                      {/* Savings Amount - Aligned right */}
                      <div
                        style={{
                          flex: "1",
                          textAlign: "right",
                          paddingRight: "12px",
                          minWidth: "0",
                        }}
                      >
                        {isEditing ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                            }}
                          >
                            <input
                              type="number"
                              value={editedSavings}
                              onChange={(e) => setEditedSavings(e.target.value)}
                              style={{
                                width: "90px",
                                padding: "6px 8px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                fontSize: "13px",
                                textAlign: "right",
                              }}
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              disabled={isSaving}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#333",
                            }}
                          >
                            {summary.savingsInLakhs}
                          </div>
                        )}
                      </div>

                      {/* Deposits Amount - Aligned right */}
                      <div
                        style={{
                          flex: "1",
                          textAlign: "right",
                          paddingRight: "12px",
                          minWidth: "0",
                        }}
                      >
                        {isEditing ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                            }}
                          >
                            <input
                              type="number"
                              value={editedDeposits}
                              onChange={(e) =>
                                setEditedDeposits(e.target.value)
                              }
                              style={{
                                width: "90px",
                                padding: "6px 8px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                fontSize: "13px",
                                textAlign: "right",
                              }}
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              disabled={isSaving}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#333",
                            }}
                          >
                            {summary.depositsInLakhs}
                          </div>
                        )}
                      </div>

                      {/* Action Column - Fixed width */}
                      <div
                        style={{
                          flex: "0.5",
                          display: "flex",
                          justifyContent: "center",
                          minWidth: "60px",
                        }}
                      >
                        {isEditing ? (
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              onClick={() => saveEdits(summary.accountId)}
                              style={{
                                width: "32px",
                                height: "32px",
                                backgroundColor: "#10b981",
                                border: "none",
                                borderRadius: "4px",
                                color: "white",
                                fontSize: "14px",
                                cursor: isSaving ? "not-allowed" : "pointer",
                                opacity: isSaving ? 0.6 : 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="Save"
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <div
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    border: "2px solid #ffffff",
                                    borderTop: "2px solid transparent",
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite",
                                  }}
                                ></div>
                              ) : (
                                "✓"
                              )}
                            </button>
                            <button
                              onClick={cancelEditing}
                              style={{
                                width: "32px",
                                height: "32px",
                                backgroundColor: "#ef4444",
                                border: "none",
                                borderRadius: "4px",
                                color: "white",
                                fontSize: "14px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
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
                                summary.deposits
                              )
                            }
                            style={{
                              width: "32px",
                              height: "32px",
                              backgroundColor: "transparent",
                              border: "none",
                              fontSize: "16px",
                              cursor:
                                editingAccountId !== null
                                  ? "not-allowed"
                                  : "pointer",
                              color: "#6b7280",
                              opacity: editingAccountId !== null ? 0.5 : 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
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

              {/* Totals Row - Perfect alignment with headers, NO adjustments text */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 12px",
                  backgroundColor: "#f3f4f6",
                  borderTop: "2px solid #e5e7eb",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#1f2937",
                }}
              >
                <div
                  style={{
                    flex: "1.5",
                    paddingLeft: "8px",
                    minWidth: "0",
                  }}
                >
                  TOTAL
                </div>
                <div
                  style={{
                    flex: "1",
                    textAlign: "right",
                    paddingRight: "12px",
                    minWidth: "0",
                  }}
                >
                  {formatLakhs(rupeesToLakhs(totalSavings))}
                </div>
                <div
                  style={{
                    flex: "1",
                    textAlign: "right",
                    paddingRight: "12px",
                    minWidth: "0",
                  }}
                >
                  {formatLakhs(rupeesToLakhs(totalDeposits))}
                </div>
                <div
                  style={{
                    flex: "0.5",
                    textAlign: "center",
                    minWidth: "60px",
                  }}
                >
                  {/* REMOVED: No adjustments count text here */}
                </div>
              </div>
            </div>

            {/* Simplified History Update Section - Only button and text */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
                border: "1px solid #e2e8f0",
                textAlign: "center",
              }}
            >
              <button
                onClick={handleHistoryUpdate}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#3b82f6",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor:
                    isUpdatingHistory || !currentMonth
                      ? "not-allowed"
                      : "pointer",
                  opacity: isUpdatingHistory || !currentMonth ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "8px",
                }}
                disabled={isUpdatingHistory || !currentMonth}
              >
                {isUpdatingHistory ? (
                  <>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid #ffffff",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        marginRight: "8px",
                      }}
                    ></div>
                    Processing...
                  </>
                ) : (
                  historyButtonText || "Loading..."
                )}
              </button>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                }}
              >
                {historyButtonText?.includes("Update") ? "Updates" : "Creates"}{" "}
                record in history table for {currentMonth}
              </div>
            </div>
          </>
        )}
      </div>
      <BankingNavigation />
      {/* Bottom spacing */}
      <div style={{ height: "10px" }}></div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DepositSummaryPage;
