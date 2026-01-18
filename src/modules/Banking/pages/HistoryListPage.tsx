import React, { useState, useEffect } from "react";
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
  const [currentMonth, setCurrentMonth] = useState("");

  // Get current month in "YYYY-MM" format
  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    setCurrentMonth(`${year}-${monthStr}`);
  }, []);

  // Find current month data
  const currentMonthData = history.find(
    (record) => record.month === currentMonth,
  );

  // Convert rupees to lakhs for display
  const rupeesToLakhs = (rupees: number): number => rupees / 100000;
  const formatLakhs = (lakhs: number): string => {
    return lakhs.toFixed(2);
  };

  // Format month for display
  const formatMonthDisplay = (
    month: string,
  ): { name: string; year: string } => {
    try {
      const [year, monthNum] = month.split("-");
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const monthName = monthNames[parseInt(monthNum) - 1] || monthNum;
      return { name: monthName, year: year };
    } catch {
      return { name: month, year: "" };
    }
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
  ); // Sort by date descending

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
      {/* Header */}
      <div
        style={{
          backgroundColor: "#4285f4",
          color: "white",
          padding: "20px 15px",
          marginBottom: "15px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flex: 1,
            }}
          >
            <button
              onClick={() => navigate(-1)}
              style={styles.backButton}
              title="Go Back"
            >
              ←
            </button>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.4rem",
                  fontWeight: 600,
                }}
              >
                History
              </h1>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "0.85rem",
                  opacity: 0.9,
                }}
              >
                Track your savings and deposits over time
              </p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button
              onClick={() => navigate("/banking/deposit-summary")}
              style={styles.iconButton}
              title="Go to Deposit Summary"
            >
              📊
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

      <div style={{ padding: "0 15px 80px 15px" }}>
        {/* Current Month Summary Card */}
        {currentMonthData && (
          <div style={styles.currentMonthCard}>
            <div style={styles.currentMonthHeader}>
              <div style={styles.currentMonthIcon}>📅</div>
              <div>
                <div style={styles.currentMonthTitle}>Current Month</div>
                <div style={styles.currentMonthDate}>
                  {formatMonthDisplay(currentMonth).name}{" "}
                  {formatMonthDisplay(currentMonth).year}
                </div>
              </div>
            </div>
            <div style={styles.currentMonthValues}>
              <div style={styles.currentMonthRow}>
                <span>Savings</span>
                <span style={styles.currentMonthAmount}>
                  {formatLakhs(rupeesToLakhs(currentMonthData.savings))}
                </span>
              </div>
              <div style={styles.currentMonthRow}>
                <span>Deposits</span>
                <span style={styles.currentMonthAmount}>
                  {formatLakhs(rupeesToLakhs(currentMonthData.totalDeposits))}
                </span>
              </div>
              <div
                style={{
                  ...styles.currentMonthRow,
                  ...styles.currentMonthTotal,
                }}
              >
                <span style={{ fontWeight: 600 }}>Total Assets</span>
                <span style={styles.currentMonthTotalAmount}>
                  {formatLakhs(
                    rupeesToLakhs(
                      currentMonthData.savings + currentMonthData.totalDeposits,
                    ),
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* History Chart */}
        <HistoryChart history={history} />

        {/* History Records Table */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>📜</span>
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
              {/* PERFECTLY ALIGNED TABLE HEADER */}
              <div
                style={{
                  display: "flex",
                  padding: "12px 12px",
                  backgroundColor: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "#374151",
                  minHeight: "44px",
                  alignItems: "center",
                }}
              >
                {/* Month Column - EXACT WIDTH */}
                <div
                  style={{
                    flex: "1.5",
                    minWidth: "0",
                    paddingLeft: "8px",
                    boxSizing: "border-box",
                  }}
                >
                  Month
                </div>

                {/* Savings Column - EXACT WIDTH */}
                <div
                  style={{
                    flex: "1",
                    minWidth: "0",
                    textAlign: "right",
                    paddingRight: "12px",
                    boxSizing: "border-box",
                  }}
                >
                  Savings
                </div>

                {/* Deposits Column - EXACT WIDTH */}
                <div
                  style={{
                    flex: "1",
                    minWidth: "0",
                    textAlign: "right",
                    paddingRight: "12px",
                    boxSizing: "border-box",
                  }}
                >
                  Deposits
                </div>

                {/* Actions Column - EXACT WIDTH */}
                {settings?.showDelete && (
                  <div
                    style={{
                      flex: "0.5",
                      minWidth: "60px",
                      textAlign: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    Actions
                  </div>
                )}
              </div>

              {/* Table Body */}
              <div style={styles.tableBody}>
                {filteredHistory.map((record, index) => {
                  const monthDisplay = formatMonthDisplay(record.month);
                  const isEditing = editingMonth === record.month;
                  const showActions = settings?.showDelete;
                  const isCurrentMonth = record.month === currentMonth;

                  return (
                    <div
                      key={record.month}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px 12px",
                        minHeight: "48px",
                        borderBottom:
                          index < filteredHistory.length - 1
                            ? "1px solid #f3f4f6"
                            : "none",
                        backgroundColor:
                          index % 2 === 0 ? "#ffffff" : "#f9fafb",
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Month Column - EXACT SAME WIDTH AS HEADER */}
                      <div
                        style={{
                          flex: "1.5",
                          minWidth: "0",
                          paddingLeft: "8px",
                          overflow: "hidden",
                          boxSizing: "border-box",
                        }}
                      >
                        {isEditing ? (
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 500,
                              color: "#1e293b",
                            }}
                          >
                            {monthDisplay.name} {monthDisplay.year}
                          </div>
                        ) : (
                          <div style={{ minWidth: "0" }}>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#1e293b",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {monthDisplay.name} {monthDisplay.year}
                              {isCurrentMonth && (
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#4285f4",
                                    marginLeft: "6px",
                                  }}
                                >
                                  (Current)
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: "#888",
                                marginTop: "1px",
                              }}
                            >
                              {record.month}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Savings Column - EXACT SAME WIDTH AS HEADER */}
                      <div
                        style={{
                          flex: "1",
                          minWidth: "0",
                          textAlign: "right",
                          paddingRight: "12px",
                          boxSizing: "border-box",
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
                                boxSizing: "border-box",
                              }}
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              disabled={isSaving}
                            />
                          </div>
                        ) : (
                          <div>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#333",
                              }}
                            >
                              {formatLakhs(rupeesToLakhs(record.savings))}
                            </div>
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: "#666",
                                marginTop: "1px",
                                fontStyle: "italic",
                              }}
                            >
                              savings
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Deposits Column - EXACT SAME WIDTH AS HEADER */}
                      <div
                        style={{
                          flex: "1",
                          minWidth: "0",
                          textAlign: "right",
                          paddingRight: "12px",
                          boxSizing: "border-box",
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
                                boxSizing: "border-box",
                              }}
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              disabled={isSaving}
                            />
                          </div>
                        ) : (
                          <div>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#333",
                              }}
                            >
                              {formatLakhs(rupeesToLakhs(record.totalDeposits))}
                            </div>
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: "#666",
                                marginTop: "1px",
                                fontStyle: "italic",
                              }}
                            >
                              deposits
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions Column - EXACT SAME WIDTH AS HEADER */}
                      {showActions && (
                        <div
                          style={{
                            flex: "0.5",
                            minWidth: "60px",
                            display: "flex",
                            justifyContent: "center",
                            boxSizing: "border-box",
                          }}
                        >
                          {isEditing ? (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                onClick={() => saveEdits(record.month)}
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
                          ) : (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                onClick={() =>
                                  startEditing(
                                    record.month,
                                    record.savings,
                                    record.totalDeposits,
                                  )
                                }
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  backgroundColor: "transparent",
                                  border: "none",
                                  fontSize: "16px",
                                  cursor:
                                    editingMonth !== null
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity: editingMonth !== null ? 0.5 : 1,
                                  color: "#6b7280",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                title="Edit"
                                disabled={editingMonth !== null}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => confirmDelete(record.month)}
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  backgroundColor: "transparent",
                                  border: "none",
                                  fontSize: "16px",
                                  cursor:
                                    editingMonth !== null
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity: editingMonth !== null ? 0.5 : 1,
                                  color: "#6b7280",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
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
              <strong>
                {formatMonthDisplay(deleteConfirmMonth).name}{" "}
                {formatMonthDisplay(deleteConfirmMonth).year}
              </strong>
              ? This action cannot be undone.
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
