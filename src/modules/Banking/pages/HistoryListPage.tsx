import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { bankingStyles } from "../styles";
import { useBankingData } from "../hooks/useBankingData";

const HistoryListPage: React.FC = () => {
  const navigate = useNavigate();
  const { loading, history, accounts, deposits, adjustments } =
    useBankingData();
  const [showForm, setShowForm] = useState(false);
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [monthToDelete, setMonthToDelete] = useState<string | null>(null);

  // Form state
  const [formMonth, setFormMonth] = useState("");
  const [formTotalDeposits, setFormTotalDeposits] = useState("");
  const [formSavings, setFormSavings] = useState("");

  // Sort history by month (descending)
  const sortedHistory = [...history].sort((a, b) =>
    b.month.localeCompare(a.month)
  );

  // Calculate totals for the total card
  const totalSavings = accounts.reduce(
    (sum, account) => sum + account.savingsAmount,
    0
  );

  // Calculate total deposits (same as BankingHomePage)
  const calculateTotalDeposits = () => {
    const filteredDeposits = deposits.filter((d) => d.active !== false);
    return accounts.reduce((total, account) => {
      const accountId = account.id;
      const baseDeposits = filteredDeposits
        .filter((deposit) => deposit.accountId === accountId)
        .reduce((sum, d) => sum + d.amount, 0);
      const adjustmentsTotal = adjustments
        .filter((adj) => adj.accountId === accountId)
        .reduce((sum, adj) => sum + (adj.adjustmentAmount || 0), 0);
      return total + baseDeposits + adjustmentsTotal;
    }, 0);
  };

  const totalDeposits = calculateTotalDeposits();

  // Format to lakhs
  const formatLakhs = (amount: number): string => {
    return (amount / 100000).toFixed(2) + " L";
  };

  // Handle form submission
  const handleSave = () => {
    if (formMonth && formTotalDeposits && formSavings) {
      const record = {
        month: formMonth,
        totalDeposits: parseFloat(formTotalDeposits) || 0,
        savings: parseFloat(formSavings) || 0,
      };

      // TODO: Save to Firebase
      console.log("Saving history record:", record);

      // Reset form
      setFormMonth("");
      setFormTotalDeposits("");
      setFormSavings("");
      setEditingMonth(null);
      setShowForm(false);
    }
  };

  // Handle edit
  const handleEdit = (record: any) => {
    setFormMonth(record.month);
    setFormTotalDeposits(record.totalDeposits.toString());
    setFormSavings(record.savings.toString());
    setEditingMonth(record.month);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = (month: string) => {
    setMonthToDelete(month);
    setShowDeleteDialog(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (monthToDelete) {
      // TODO: Delete from Firebase
      console.log("Deleting history record for month:", monthToDelete);
      setShowDeleteDialog(false);
      setMonthToDelete(null);
    }
  };

  // Calculate total (savings + deposits) for display
  const calculateTotal = (savings: number, deposits: number) =>
    savings + deposits;

  if (loading) {
    return (
      <div style={bankingStyles.container}>
        <div style={bankingStyles.loading}>
          <div style={bankingStyles.spinner}></div>
          <p>Loading history...</p>
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
            <h1 style={bankingStyles.headerTitle}>History</h1>
          </div>
          <div style={styles.headerActions}>
            <button
              onClick={() => navigate("/banking/history/chart")}
              style={styles.iconButton}
              title="View Chart"
            >
              📊
            </button>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) {
                  setFormMonth("");
                  setFormTotalDeposits("");
                  setFormSavings("");
                  setEditingMonth(null);
                }
              }}
              style={styles.iconButton}
              title={showForm ? "Cancel" : "Add History"}
            >
              {showForm ? "✕" : "+"}
            </button>
            <button
              onClick={() => navigate("/settings")}
              style={styles.iconButton}
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formTitle}>
            {editingMonth ? "Edit History" : "Add History"}
          </div>
          <div style={styles.formFields}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Month (e.g. 2025-09)</label>
              <input
                type="text"
                value={formMonth}
                onChange={(e) => setFormMonth(e.target.value)}
                style={styles.input}
                disabled={!!editingMonth}
                placeholder="YYYY-MM"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Total Deposits</label>
              <input
                type="number"
                value={formTotalDeposits}
                onChange={(e) => setFormTotalDeposits(e.target.value)}
                style={styles.input}
                placeholder="0"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Savings</label>
              <input
                type="number"
                value={formSavings}
                onChange={(e) => setFormSavings(e.target.value)}
                style={styles.input}
                placeholder="0"
              />
            </div>
            <div style={styles.formButtons}>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormMonth("");
                  setFormTotalDeposits("");
                  setFormSavings("");
                  setEditingMonth(null);
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formMonth || !formTotalDeposits || !formSavings}
                style={{
                  ...styles.saveButton,
                  opacity:
                    !formMonth || !formTotalDeposits || !formSavings ? 0.5 : 1,
                }}
              >
                {editingMonth ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Month Total Card */}
      <div style={styles.totalCard}>
        <div style={styles.totalCardHeader}>
          <div style={styles.totalCardIcon}>📊</div>
          <div>
            <div style={styles.totalCardTitle}>Current Month</div>
            <div style={styles.totalCardSubtitle}>Total Available</div>
          </div>
        </div>
        <div style={styles.totalCardValues}>
          <div style={styles.totalCardRow}>
            <span>Deposits:</span>
            <span style={styles.totalCardAmount}>
              {formatLakhs(totalDeposits)}
            </span>
          </div>
          <div style={styles.totalCardRow}>
            <span>Savings:</span>
            <span style={styles.totalCardAmount}>
              {formatLakhs(totalSavings)}
            </span>
          </div>
          <div style={{ ...styles.totalCardRow, ...styles.totalCardTotal }}>
            <span>Total:</span>
            <span style={styles.totalCardTotalAmount}>
              {formatLakhs(totalSavings + totalDeposits)}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            // Auto-fill form with current values
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
            setFormMonth(currentMonth);
            setFormTotalDeposits(totalDeposits.toString());
            setFormSavings(totalSavings.toString());
            setEditingMonth(null);
            setShowForm(true);
          }}
          style={styles.updateButton}
        >
          Update History
        </button>
      </div>

      {/* History List */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>📅</span>
            History Records
          </div>
          <div style={styles.sectionSubtitle}>
            {sortedHistory.length} record{sortedHistory.length !== 1 ? "s" : ""}
          </div>
        </div>

        {sortedHistory.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📅</div>
            <div style={styles.emptyText}>No history records</div>
            <div style={styles.emptySubtext}>
              Add your first history record above
            </div>
          </div>
        ) : (
          <div>
            {/* Header Row */}
            <div style={styles.listHeader}>
              <div style={{ ...styles.headerCell, flex: 1.5 }}>Month</div>
              <div
                style={{
                  ...styles.headerCell,
                  flex: 1,
                  textAlign: "right" as "right",
                }}
              >
                Deposits
              </div>
              <div
                style={{
                  ...styles.headerCell,
                  flex: 1,
                  textAlign: "right" as "right",
                }}
              >
                Total
              </div>
              <div style={{ ...styles.headerCell, flex: 0.5 }}></div>
            </div>

            {/* List Items */}
            <div style={styles.list}>
              {sortedHistory.map((record) => {
                const date = new Date(record.month + "-01");
                const monthName = date.toLocaleDateString("en-IN", {
                  month: "short",
                  year: "2-digit",
                });
                const total = calculateTotal(
                  record.savings,
                  record.totalDeposits
                );

                return (
                  <div key={record.month} style={styles.listItem}>
                    <div style={{ ...styles.listCell, flex: 1.5 }}>
                      <div style={styles.monthName}>{monthName}</div>
                      <div style={styles.monthId}>{record.month}</div>
                    </div>
                    <div
                      style={{
                        ...styles.listCell,
                        flex: 1,
                        textAlign: "right" as "right",
                      }}
                    >
                      <div style={styles.depositAmount}>
                        {formatLakhs(record.totalDeposits)}
                      </div>
                    </div>
                    <div
                      style={{
                        ...styles.listCell,
                        flex: 1,
                        textAlign: "right" as "right",
                      }}
                    >
                      <div style={styles.totalAmount}>{formatLakhs(total)}</div>
                      <div style={styles.savingsNote}>
                        Savings: {formatLakhs(record.savings)}
                      </div>
                    </div>
                    <div
                      style={{
                        ...styles.listCell,
                        flex: 0.5,
                        justifyContent: "center",
                      }}
                    >
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => handleEdit(record)}
                          style={styles.editButton}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(record.month)}
                          style={styles.deleteButton}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialog}>
            <div style={styles.dialogTitle}>Delete History</div>
            <div style={styles.dialogMessage}>
              Are you sure you want to delete history for{" "}
              <strong>{monthToDelete}</strong>?
            </div>
            <div style={styles.dialogButtons}>
              <button
                onClick={() => setShowDeleteDialog(false)}
                style={styles.dialogCancel}
              >
                Cancel
              </button>
              <button onClick={confirmDelete} style={styles.dialogConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
  headerActions: {
    display: "flex",
    gap: "10px",
  },
  iconButton: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.2rem",
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    margin: "15px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
  },
  formTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#333",
    marginBottom: "20px",
  },
  formFields: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "#666",
  },
  input: {
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "1rem",
    width: "100%",
    boxSizing: "border-box",
  },
  formButtons: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  cancelButton: {
    flex: 1,
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "white",
    color: "#666",
    fontSize: "0.95rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  saveButton: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#4285f4",
    color: "white",
    fontSize: "0.95rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  totalCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    margin: "15px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
  },
  totalCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
  },
  totalCardIcon: {
    fontSize: "2rem",
    backgroundColor: "#e8f0fe",
    color: "#4285f4",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  totalCardTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#333",
  },
  totalCardSubtitle: {
    fontSize: "0.85rem",
    color: "#666",
  },
  totalCardValues: {
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "15px",
  },
  totalCardRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    fontSize: "0.95rem",
  },
  totalCardAmount: {
    fontWeight: 600,
    color: "#333",
  },
  totalCardTotal: {
    borderTop: "1px solid #ddd",
    paddingTop: "12px",
    marginTop: "4px",
  },
  totalCardTotalAmount: {
    fontWeight: 700,
    fontSize: "1.1rem",
    color: "#4285f4",
  },
  updateButton: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#34a853",
    color: "white",
    fontSize: "0.95rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  section: {
    backgroundColor: "white",
    borderRadius: "12px",
    margin: "15px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e9ecef",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#333",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  sectionIcon: {
    fontSize: "1.3rem",
  },
  sectionSubtitle: {
    fontSize: "0.85rem",
    color: "#666",
  },
  listHeader: {
    display: "flex",
    padding: "12px 0",
    borderBottom: "2px solid #e9ecef",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#666",
  },
  headerCell: {
    padding: "0 5px",
  },
  list: {
    display: "flex",
    flexDirection: "column",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    padding: "15px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  listCell: {
    padding: "0 5px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  monthName: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#333",
  },
  monthId: {
    fontSize: "0.75rem",
    color: "#888",
    marginTop: "2px",
  },
  depositAmount: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#4285f4",
  },
  totalAmount: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#333",
  },
  savingsNote: {
    fontSize: "0.75rem",
    color: "#666",
    marginTop: "2px",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  editButton: {
    background: "none",
    border: "none",
    fontSize: "1rem",
    cursor: "pointer",
    opacity: 0.7,
    transition: "opacity 0.2s",
    padding: "5px",
  },
  deleteButton: {
    background: "none",
    border: "none",
    fontSize: "1rem",
    cursor: "pointer",
    opacity: 0.7,
    transition: "opacity 0.2s",
    padding: "5px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#6c757d",
  },
  emptyIcon: {
    fontSize: "3rem",
    marginBottom: "15px",
    opacity: 0.5,
  },
  emptyText: {
    fontSize: "1rem",
    fontWeight: 500,
    marginBottom: "5px",
  },
  emptySubtext: {
    fontSize: "0.85rem",
  },
  dialogOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "25px",
    width: "90%",
    maxWidth: "400px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  dialogTitle: {
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "#333",
    marginBottom: "15px",
  },
  dialogMessage: {
    fontSize: "0.95rem",
    color: "#666",
    marginBottom: "25px",
    lineHeight: 1.5,
  },
  dialogButtons: {
    display: "flex",
    gap: "10px",
  },
  dialogCancel: {
    flex: 1,
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "white",
    color: "#666",
    fontSize: "0.95rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  dialogConfirm: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#ea4335",
    color: "white",
    fontSize: "0.95rem",
    fontWeight: 500,
    cursor: "pointer",
  },
};

export default HistoryListPage;
