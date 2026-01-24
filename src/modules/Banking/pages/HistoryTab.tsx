import React, { useState } from "react";
//import { useNavigate } from "react-router-dom";
//import HistoryListPageStyles from "../styles/HistoryListPage.styles";
import HistoryChart from "./HistoryChart";
import { useBankingData } from "../hooks/useBankingData";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { useSettings } from "../../../contexts/SettingsContext";

const HistoryTab: React.FC = () => {
  //const navigate = useNavigate();
  const { settings } = useSettings();
  const { loading, history } = useBankingData();
  //const styles = HistoryListPageStyles;

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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px",
        }}
      >
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
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* History Chart - Keep at top */}
      <div
        style={{
          backgroundColor: "white",
          padding: "16px",
          borderBottom: "1px solid #e9ecef",
        }}
      >
        <HistoryChart history={history} />
      </div>

      {/* History Records List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
        <div
          style={{
            padding: "16px 16px 12px 16px",
            backgroundColor: "white",
            borderBottom: "1px solid #e9ecef",
          }}
        >
          <div
            style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#333",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <span>📊</span>
            History Records
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              color: "#666",
            }}
          >
            {totalRecords} record{totalRecords !== 1 ? "s" : ""}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#6c757d",
            }}
          >
            <div
              style={{ fontSize: "48px", marginBottom: "16px", opacity: "0.5" }}
            >
              📄
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "500",
                color: "#6b7280",
                marginBottom: "8px",
              }}
            >
              No history records
            </div>
            <div style={{ fontSize: "14px", color: "#9ca3af" }}>
              Update current month summary to create history
            </div>
          </div>
        ) : (
          <div style={{ padding: "0 8px" }}>
            {filteredHistory.map((record) => {
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
                    backgroundColor: "white",
                    margin: "0 8px 8px 8px",
                    borderRadius: "8px",
                    border: "1px solid #e9ecef",
                  }}
                >
                  <div style={{ padding: "12px" }}>
                    {/* Month header */}
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: "500",
                        color: "#333",
                        marginBottom: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{monthDisplay}</span>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          color: "#1976d2",
                        }}
                      >
                        Total: {formatLakhs(totalValue)}
                      </span>
                    </div>

                    {/* Savings and Deposits */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#666",
                            marginBottom: "2px",
                          }}
                        >
                          Savings
                        </div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editedSavings}
                            onChange={(e) => setEditedSavings(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "1px solid #e9ecef",
                              borderRadius: "4px",
                              fontSize: "0.9rem",
                            }}
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            disabled={isSaving}
                          />
                        ) : (
                          <div
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: "600",
                              color: "#48bb78",
                            }}
                          >
                            {formatLakhs(savingsValue)}
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#666",
                            marginBottom: "2px",
                          }}
                        >
                          Deposits
                        </div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editedDeposits}
                            onChange={(e) => setEditedDeposits(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "1px solid #e9ecef",
                              borderRadius: "4px",
                              fontSize: "0.9rem",
                            }}
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            disabled={isSaving}
                          />
                        ) : (
                          <div
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: "600",
                              color: "#ed8936",
                            }}
                          >
                            {formatLakhs(depositsValue)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {showActions && (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginTop: "8px",
                        }}
                      >
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdits(record.month)}
                              style={{
                                flex: 1,
                                padding: "8px",
                                backgroundColor: "#48bb78",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: isSaving ? "not-allowed" : "pointer",
                                fontSize: "0.85rem",
                                fontWeight: "500",
                                opacity: isSaving ? 0.6 : 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                              }}
                              title="Save"
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <>
                                  <div
                                    style={{
                                      width: "12px",
                                      height: "12px",
                                      border: "2px solid #ffffff",
                                      borderTop: "2px solid transparent",
                                      borderRadius: "50%",
                                      animation: "spin 1s linear infinite",
                                    }}
                                  ></div>
                                  Saving...
                                </>
                              ) : (
                                "✓ Save"
                              )}
                            </button>
                            <button
                              onClick={cancelEditing}
                              style={{
                                flex: 1,
                                padding: "8px",
                                backgroundColor: "#a0aec0",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                fontWeight: "500",
                              }}
                              title="Cancel"
                              disabled={isSaving}
                            >
                              ✕ Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                startEditing(
                                  record.month,
                                  record.savings,
                                  record.totalDeposits,
                                )
                              }
                              style={{
                                flex: 1,
                                padding: "8px",
                                backgroundColor: "#4299e1",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor:
                                  editingMonth !== null
                                    ? "not-allowed"
                                    : "pointer",
                                fontSize: "0.85rem",
                                fontWeight: "500",
                                opacity: editingMonth !== null ? 0.5 : 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                              }}
                              title="Edit"
                              disabled={editingMonth !== null}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => confirmDelete(record.month)}
                              style={{
                                flex: 1,
                                padding: "8px",
                                backgroundColor: "#f56565",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor:
                                  editingMonth !== null
                                    ? "not-allowed"
                                    : "pointer",
                                fontSize: "0.85rem",
                                fontWeight: "500",
                                opacity: editingMonth !== null ? 0.5 : 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                              }}
                              title="Delete"
                              disabled={editingMonth !== null}
                            >
                              🗑️ Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmMonth && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                fontSize: "1.1rem",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Confirm Delete
            </h3>
            <p
              style={{ margin: "0 0 20px 0", color: "#666", lineHeight: "1.5" }}
            >
              Are you sure you want to delete the history record for{" "}
              <strong>{formatMonthDisplay(deleteConfirmMonth)}</strong>? This
              action cannot be undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setDeleteConfirmMonth(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                  borderRadius: "8px",
                  color: "#495057",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#ea4335",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
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

export default HistoryTab;
