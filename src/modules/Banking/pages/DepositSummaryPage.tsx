import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { bankingStyles } from "../styles";
import { useBankingData } from "../hooks/useBankingData";

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
  const { loading, accounts, deposits, adjustments, settings } =
    useBankingData();
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editedSavings, setEditedSavings] = useState("");
  const [editedDeposits, setEditedDeposits] = useState("");
  const [summaries, setSummaries] = useState<AccountSummary[]>([]);
  const [showInactive, setShowInactive] = useState(false);

  // Convert rupees to lakhs
  const rupeesToLakhs = (rupees: number): number => rupees / 100000;
  const lakhsToRupees = (lakhs: number): number => lakhs * 100000;

  // Format lakhs for display
  const formatLakhs = (lakhs: number): string => {
    return `${lakhs.toFixed(2)} L`;
  };

  // Prepare summary data
  useEffect(() => {
    if (!accounts.length || !deposits.length) return;

    const filteredDeposits = settings?.showInactive
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
    newSummaries.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    setSummaries(newSummaries);
  }, [accounts, deposits, adjustments, settings?.showInactive]);

  // Start editing a row
  const startEditing = (
    accountId: string,
    savings: number,
    deposits: number
  ) => {
    setEditingAccountId(accountId);
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
  };

  // Save edits
  const saveEdits = (accountId: string) => {
    try {
      const savingsLakhs = parseFloat(editedSavings);
      const depositsLakhs = parseFloat(editedDeposits);

      if (isNaN(savingsLakhs) || isNaN(depositsLakhs)) {
        alert("Please enter valid numbers");
        return;
      }

      // Update savings (this would typically be an API call)
      const savingsRupees = lakhsToRupees(savingsLakhs);
      console.log(
        `Update savings for account ${accountId}: ${savingsRupees} rupees`
      );

      // Calculate current deposits for this account
      const account = accounts.find((a) => a.id === accountId);
      if (!account) return;

      const filteredDepositsList = settings?.showInactive
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

      // Only create adjustment if there's a meaningful difference
      if (Math.abs(adjustmentNeeded) > 0.01) {
        const adjustment = {
          accountId,
          adjustmentAmount: adjustmentNeeded,
          note: "Summary screen adjustment",
          id: Date.now().toString(), // Temporary ID
        };
        console.log("Create adjustment:", adjustment);
        // TODO: Call API to save adjustment
      }

      alert("Changes saved successfully!");

      // Reset editing state
      cancelEditing();

      // Refresh data (in a real app, this would reload from API)
      setTimeout(() => {
        window.location.reload(); // Simple refresh for demo
      }, 500);
    } catch (error) {
      console.error("Error saving edits:", error);
      alert("Error saving changes. Please try again.");
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
                <div style={{ ...styles.headerCell, flex: 0.5 }}></div>
              </div>

              {/* Table Rows */}
              <div style={styles.tableBody}>
                {summaries.map((summary, _index) => {
                  const isEditing = editingAccountId === summary.accountId;

                  return (
                    <div key={summary.accountId} style={styles.tableRow}>
                      {/* Account Code */}
                      <div style={{ ...styles.cell, flex: 1.5 }}>
                        <div style={styles.accountCode}>
                          {summary.accountCode}
                        </div>
                      </div>

                      {/* Savings Amount */}
                      <div style={{ ...styles.cell, flex: 1 }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editedSavings}
                            onChange={(e) => setEditedSavings(e.target.value)}
                            style={styles.editInput}
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                          />
                        ) : (
                          <div style={styles.amountDisplay}>
                            {summary.savingsInLakhs}
                          </div>
                        )}
                      </div>

                      {/* Deposits Amount */}
                      <div style={{ ...styles.cell, flex: 1 }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editedDeposits}
                            onChange={(e) => setEditedDeposits(e.target.value)}
                            style={styles.editInput}
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                          />
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
                          flex: 0.5,
                          justifyContent: "center",
                        }}
                      >
                        {isEditing ? (
                          <div style={styles.editButtons}>
                            <button
                              onClick={() => saveEdits(summary.accountId)}
                              style={styles.saveButton}
                              title="Save"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditing}
                              style={styles.cancelButton}
                              title="Cancel"
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
                <div style={{ ...styles.totalsCell, flex: 0.5 }}></div>
              </div>
            </div>

            {/* Instructions */}
            <div style={styles.instructions}>
              <div style={styles.instructionItem}>
                <span style={styles.instructionIcon}>✏️</span>
                <span>Tap edit icon to modify values</span>
              </div>
              <div style={styles.instructionItem}>
                <span style={styles.instructionIcon}>💾</span>
                <span>
                  Deposit changes create adjustments in adjustment table
                </span>
              </div>
              <div style={styles.instructionItem}>
                <span style={styles.instructionIcon}>⚠️</span>
                <span>Savings changes update account directly</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom spacing */}
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: "100%",
    maxWidth: "500px",
    margin: "0 auto",
    backgroundColor: "#f5f7fa",
    minHeight: "100vh",
  },
  backButton: {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    color: "white",
    cursor: "pointer",
    marginRight: "10px",
    padding: "5px",
  },
  content: {
    padding: "15px",
  },
  toggleContainer: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "12px 15px",
    marginBottom: "15px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e9ecef",
  },
  toggleLabel: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  toggleInput: {
    marginRight: "10px",
    width: "18px",
    height: "18px",
  },
  toggleText: {
    fontSize: "0.9rem",
    color: "#666",
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "15px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
  },
  tableHeader: {
    display: "flex",
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderBottom: "2px solid #e9ecef",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#495057",
  },
  headerCell: {
    padding: "0 8px",
  },
  tableBody: {
    maxHeight: "400px",
    overflowY: "auto",
  },
  tableRow: {
    display: "flex",
    alignItems: "center",
    padding: "12px 15px",
    borderBottom: "1px solid #f0f0f0",
    minHeight: "60px",
  },
  cell: {
    padding: "0 8px",
    display: "flex",
    alignItems: "center",
  },
  accountCode: {
    fontSize: "0.95rem",
    fontWeight: 500,
    color: "#333",
  },
  amountDisplay: {
    fontSize: "0.95rem",
    color: "#333",
    fontWeight: 500,
  },
  editInput: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "0.9rem",
    textAlign: "right",
  },
  editButtons: {
    display: "flex",
    gap: "6px",
  },
  saveButton: {
    background: "none",
    border: "none",
    fontSize: "1.1rem",
    color: "#34a853",
    cursor: "pointer",
    padding: "5px",
    borderRadius: "4px",
  },
  cancelButton: {
    background: "none",
    border: "none",
    fontSize: "1.1rem",
    color: "#ea4335",
    cursor: "pointer",
    padding: "5px",
    borderRadius: "4px",
  },
  editButton: {
    background: "none",
    border: "none",
    fontSize: "1rem",
    color: "#666",
    cursor: "pointer",
    padding: "5px",
    borderRadius: "4px",
    opacity: 0.7,
  },
  totalsRow: {
    display: "flex",
    alignItems: "center",
    padding: "15px",
    backgroundColor: "#f8f9fa",
    borderTop: "2px solid #e9ecef",
    fontSize: "0.95rem",
  },
  totalsCell: {
    padding: "0 8px",
  },
  instructions: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "15px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  instructionItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "0.85rem",
    color: "#666",
  },
  instructionIcon: {
    fontSize: "1rem",
    width: "24px",
    textAlign: "center" as const,
  },
  emptyState: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "40px 20px",
    textAlign: "center" as const,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
    marginTop: "20px",
  },
  emptyIcon: {
    fontSize: "3rem",
    marginBottom: "15px",
    opacity: 0.5,
  },
  emptyText: {
    fontSize: "1.1rem",
    fontWeight: 500,
    marginBottom: "5px",
    color: "#333",
  },
  emptySubtext: {
    fontSize: "0.9rem",
    color: "#666",
    marginBottom: "20px",
  },
  addButton: {
    padding: "12px 24px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#4285f4",
    color: "white",
    fontSize: "0.95rem",
    fontWeight: 500,
    cursor: "pointer",
  },
};

// Add hover effects
const hoverStyles = `
  .table-row:hover {
    background-color: #f8f9fa;
  }
  
  .edit-button:hover {
    opacity: 1;
    background-color: #f0f0f0;
  }
  
  .save-button:hover {
    background-color: rgba(52, 168, 83, 0.1);
  }
  
  .cancel-button:hover {
    background-color: rgba(234, 67, 53, 0.1);
  }
  
  .add-button:hover {
    background-color: #3367d6;
  }
`;

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = hoverStyles;
  document.head.appendChild(styleSheet);
}

export default DepositSummaryPage;
