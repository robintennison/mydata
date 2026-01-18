import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HistoryListPageStyles from "../styles/HistoryListPage.styles";
import HistoryChart from "./HistoryChart";
import { useBankingData } from "../hooks/useBankingData";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import BankingNavigation from "./BankingNavigation";
import { useSettings } from "../../../contexts/SettingsContext";

const HistoryListPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { loading, history } = useBankingData();
  const styles = HistoryListPageStyles;

  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editedSavings, setEditedSavings] = useState("");
  const [editedDeposits, setEditedDeposits] = useState("");
  const [deleteConfirmMonth, setDeleteConfirmMonth] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  // Convert rupees to lakhs for display
  const rupeesToLakhs = (rupees: number): number => rupees / 100000;
  const formatLakhs = (lakhs: number): string => {
    return lakhs.toFixed(2);
  };

  // Format month for display (just show YYYY-MM from database)
  const formatMonthDisplay = (month: string): string => {
    return month; // Just return the database format: "2026-01"
  };

  // Start editing a row
  const startEditing = (month: string, savings: number, deposits: number) => {
    setEditingMonth(month);
    const savingsLakhs = rupeesToLakhs(savings);
    const depositsLakhs = rupeesToLakhs(deposits);
    setEditedSavings(savingsLakhs.toFixed(2));
    setEditedDeposits(depositsLakhs.toFixed(2));
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingMonth(null);
    setEditedSavings("");
    setEditedDeposits("");
  };

  // Simple refresh function
  const refreshData = () => {
    window.location.reload();
  };

  // Update history record
  const saveEdits = async (month: string) => {
    try {
      setIsSaving(true);

      const savingsLakhs = parseFloat(editedSavings);
      const depositsLakhs = parseFloat(editedDeposits);

      if (isNaN(savingsLakhs) || isNaN(depositsLakhs)) {
        alert("Please enter valid numbers");
        setIsSaving(false);
        return;
      }

      const savingsRupees = savingsLakhs * 100000;
      const depositsRupees = depositsLakhs * 100000;

      const historyRef = doc(firestore, "history", month);
      await updateDoc(historyRef, {
        savings: savingsRupees,
        totalDeposits: depositsRupees,
        updatedAt: new Date(),
      });

      // Refresh data
      refreshData();
      cancelEditing();
      alert("✓ History updated successfully!");
    } catch (error: any) {
      console.error("Error updating history:", error);
      alert(`Failed to update: ${error.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete history record
  const confirmDelete = async (month: string) => {
    setDeleteConfirmMonth(month);
  };

  const executeDelete = async () => {
    if (!deleteConfirmMonth) return;

    try {
      const historyRef = doc(firestore, "history", deleteConfirmMonth);
      await deleteDoc(historyRef);

      // Refresh data
      refreshData();
      setDeleteConfirmMonth(null);
      alert("✓ History record deleted!");
    } catch (error: any) {
      console.error("Error deleting history:", error);
      alert(`Failed to delete: ${error.message || "Unknown error"}`);
    }
  };

  // Show ALL history records
  const filteredHistory = history.sort((a, b) =>
    b.month.localeCompare(a.month),
  );

  // Count total records
  const totalRecords = history.length;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", padding: "50px 20px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #4285f4",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 15px auto",
            }}
          ></div>
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header - MATCHING SUMMARY PAGE STYLE */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "12px 16px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
            Banking / History
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
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      <div
        style={{
          padding: "0",
          backgroundColor: "#ffffff",
          minHeight: "calc(100vh - 120px)",
        }}
      >
        {/* History Chart */}
        <HistoryChart history={history} />

        {/* History Records Table */}
        <div style={styles.section}>
          <div
            style={{
              ...styles.sectionHeader,
              padding: "16px 16px 12px 16px",
              marginBottom: "0",
            }}
          >
            <div style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>📊</span>
              History Records
            </div>
            <div style={styles.sectionSubtitle}>{totalRecords} records</div>
          </div>

          {filteredHistory.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📄</div>
              <div style={styles.emptyText}>No history records</div>
              <div style={styles.emptySubtext}>
                Update current month summary to create history
              </div>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              {/* TABLE HEADER - 4 COLUMNS: Month, Savings, Deposits, Total */}
              <div style={styles.tableHeader}>
                <div style={styles.headerCellMonth}>Month</div>
                <div style={styles.headerCellSavings}>Savings</div>
                <div style={styles.headerCellDeposits}>Deposits</div>
                <div style={styles.headerCellTotal}>Total</div>
                {settings?.showDelete && (
                  <div style={styles.headerCellActions}>Actions</div>
                )}
              </div>

              {/* Table Body */}
              <div style={styles.tableBody}>
                {filteredHistory.map((record, index) => {
                  const monthDisplay = formatMonthDisplay(record.month);
                  const isEditing = editingMonth === record.month;
                  const showActions = settings?.showDelete;

                  // Calculate values for display
                  const savingsValue = rupeesToLakhs(record.savings);
                  const depositsValue = rupeesToLakhs(record.totalDeposits);
                  const totalValue = savingsValue + depositsValue;

                  return (
                    <div
                      key={record.month}
                      style={{
                        ...styles.tableRow,
                        backgroundColor:
                          index % 2 === 0 ? "#ffffff" : "#f9fafb",
                        borderBottom:
                          index < filteredHistory.length - 1
                            ? "1px solid #f3f4f6"
                            : "none",
                      }}
                    >
                      {/* Month Column - SHOW YYYY-MM from database */}
                      <div style={styles.cellMonth}>
                        {isEditing ? (
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 500,
                              color: "#1e293b",
                            }}
                          >
                            {monthDisplay}
                          </div>
                        ) : (
                          <div style={styles.monthDisplay}>
                            <div style={styles.monthName}>{monthDisplay}</div>
                          </div>
                        )}
                      </div>

                      {/* Savings Column */}
                      <div style={styles.cellSavings}>
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
                          <div>
                            <div style={styles.amountDisplay}>
                              {formatLakhs(savingsValue)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Deposits Column */}
                      <div style={styles.cellDeposits}>
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
                          </div>
                        ) : (
                          <div>
                            <div style={styles.amountDisplay}>
                              {formatLakhs(depositsValue)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Total Column */}
                      <div style={styles.cellTotal}>
                        <div style={styles.amountDisplay}>
                          {formatLakhs(totalValue)}
                        </div>
                      </div>

                      {/* Actions Column */}
                      {showActions && (
                        <div style={styles.cellActions}>
                          {isEditing ? (
                            <div style={styles.actionButtons}>
                              <button
                                onClick={() => saveEdits(record.month)}
                                style={{
                                  ...styles.saveButton,
                                  cursor: isSaving ? "not-allowed" : "pointer",
                                  opacity: isSaving ? 0.6 : 1,
                                }}
                                title="Save"
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <div
                                    style={{
                                      width: "16px",
                                      height: "16px",
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
                                  ...styles.cancelButton,
                                  cursor: "pointer",
                                }}
                                title="Cancel"
                                disabled={isSaving}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div style={styles.actionButtons}>
                              <button
                                onClick={() =>
                                  startEditing(
                                    record.month,
                                    record.savings,
                                    record.totalDeposits,
                                  )
                                }
                                style={{
                                  ...styles.editButton,
                                  cursor:
                                    editingMonth !== null
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity: editingMonth !== null ? 0.5 : 1,
                                }}
                                title="Edit"
                                disabled={editingMonth !== null}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => confirmDelete(record.month)}
                                style={{
                                  ...styles.deleteButton,
                                  cursor:
                                    editingMonth !== null
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity: editingMonth !== null ? 0.5 : 1,
                                }}
                                title="Delete"
                                disabled={editingMonth !== null}
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmMonth && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialog}>
            <div style={styles.dialogTitle}>Confirm Delete</div>
            <div style={styles.dialogMessage}>
              Are you sure you want to delete the history record for{" "}
              <strong>{formatMonthDisplay(deleteConfirmMonth)}</strong>? This
              action cannot be undone.
            </div>
            <div style={styles.dialogButtons}>
              <button
                onClick={() => setDeleteConfirmMonth(null)}
                style={styles.dialogCancel}
              >
                Cancel
              </button>
              <button onClick={executeDelete} style={styles.dialogConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <BankingNavigation />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default HistoryListPage;
