import React, { useState } from "react";
import HistoryChart from "./HistoryChart";
import { useBankingData } from "../hooks/useBankingData";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { useSettings } from "../../../contexts/SettingsContext";
import { CSSProperties } from "react";

// COMPACT STYLES - NO PADDING
const compactHistoryStyles: { [key: string]: CSSProperties } = {
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    padding: "0",
    margin: "0",
  },
  chartContainer: {
    backgroundColor: "white",
    padding: "0",
    margin: "0 0 16px 0", // Added vertical spacing
    borderBottom: "1px solid #e9ecef",
  },
  header: {
    padding: "4px 0", // Removed horizontal padding
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e9ecef",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#333",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    paddingLeft: "4px", // Slight indent for text
  },
  headerCount: {
    fontSize: "10px",
    color: "#666",
    paddingRight: "4px", // Slight indent for text
  },
  tableHeader: {
    display: "flex",
    padding: "4px 0", // Removed horizontal padding
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e9ecef",
    fontWeight: "600",
    fontSize: "10px",
    color: "#374151",
  },
  tableRow: {
    display: "flex",
    alignItems: "center",
    padding: "4px 0", // Removed horizontal padding
    borderBottom: "1px solid #f3f4f6",
    minHeight: "32px",
  },
  cellMonth: {
    flex: 2,
    padding: "0 2px 0 4px", // Adjusted padding
    fontSize: "11px",
    color: "#333",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cellSavings: {
    flex: 2,
    padding: "0 2px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#48bb78",
    textAlign: "right" as const,
  },
  cellDeposits: {
    flex: 2,
    padding: "0 2px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#ed8936",
    textAlign: "right" as const,
  },
  cellTotal: {
    flex: 2,
    padding: "0 4px 0 2px", // Adjusted padding
    fontSize: "11px",
    fontWeight: "600",
    color: "#1976d2",
    textAlign: "right" as const,
  },
  editInput: {
    width: "70px",
    padding: "2px",
    border: "1px solid #e9ecef",
    borderRadius: "2px",
    fontSize: "10px",
  },
  smallButton: {
    width: "24px",
    height: "24px",
    padding: "0",
    fontSize: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    width: "60px",
    display: "flex",
    gap: "2px",
    padding: "0 2px",
  },
};

const HistoryTab: React.FC = () => {
  const { settings } = useSettings();
  const { loading, history } = useBankingData();

  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editedSavings, setEditedSavings] = useState("");
  const [editedDeposits, setEditedDeposits] = useState("");
  const [deleteConfirmMonth, setDeleteConfirmMonth] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const rupeesToLakhs = (rupees: number): number => rupees / 100000;
  const formatLakhs = (lakhs: number): string => lakhs.toFixed(2);

  const startEditing = (month: string, savings: number, deposits: number) => {
    setEditingMonth(month);
    setEditedSavings(rupeesToLakhs(savings).toFixed(2));
    setEditedDeposits(rupeesToLakhs(deposits).toFixed(2));
  };

  const cancelEditing = () => {
    setEditingMonth(null);
    setEditedSavings("");
    setEditedDeposits("");
  };

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

      window.location.reload();
      cancelEditing();
      alert("✓ History updated successfully!");
    } catch (error: any) {
      console.error("Error updating history:", error);
      alert(`Failed to update: ${error.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirmMonth) return;
    try {
      const historyRef = doc(firestore, "history", deleteConfirmMonth);
      await deleteDoc(historyRef);
      window.location.reload();
      setDeleteConfirmMonth(null);
      alert("✓ History record deleted!");
    } catch (error: any) {
      console.error("Error deleting history:", error);
      alert(`Failed to delete: ${error.message || "Unknown error"}`);
    }
  };

  const filteredHistory = history.sort((a, b) =>
    b.month.localeCompare(a.month),
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex" as const,
          flexDirection: "column" as const,
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
          }}
        ></div>
        <p>Loading history...</p>
      </div>
    );
  }

  return (
    <div style={compactHistoryStyles.container}>
      {/* Chart - NO PADDING */}
      <div style={compactHistoryStyles.chartContainer}>
        <HistoryChart history={history} compact={true} />
      </div>

      {/* Table - NO PADDING */}
      <div style={{ flex: 1, overflowY: "auto" as const }}>
        {/* Header */}
        <div style={compactHistoryStyles.header}>
          <div style={compactHistoryStyles.headerTitle}>
            <span>📊</span>
            <span>History</span>
          </div>
          <div style={compactHistoryStyles.headerCount}>
            {history.length} record{history.length !== 1 ? "s" : ""}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div
            style={{
              textAlign: "center" as const,
              padding: "40px 20px",
              color: "#6c757d",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "16px",
                opacity: "0.5",
              }}
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
            <div
              style={{
                fontSize: "14px",
                color: "#9ca3af",
              }}
            >
              Update current month summary to create history
            </div>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div style={compactHistoryStyles.tableHeader}>
              <div style={{ flex: 2, padding: "0 2px" }}>Month</div>
              <div
                style={{
                  flex: 2,
                  padding: "0 2px",
                  textAlign: "right" as const,
                }}
              >
                Savings
              </div>
              <div
                style={{
                  flex: 2,
                  padding: "0 2px",
                  textAlign: "right" as const,
                }}
              >
                Deposits
              </div>
              <div
                style={{
                  flex: 2,
                  padding: "0 2px",
                  textAlign: "right" as const,
                }}
              >
                Total
              </div>
              {settings?.showDelete && <div style={{ width: "60px" }}></div>}
            </div>

            {/* Table Rows */}
            {filteredHistory.map((record) => {
              const isEditing = editingMonth === record.month;
              const savingsValue = rupeesToLakhs(record.savings);
              const depositsValue = rupeesToLakhs(record.totalDeposits);
              const totalValue = savingsValue + depositsValue;

              return (
                <div key={record.month} style={compactHistoryStyles.tableRow}>
                  {/* Month */}
                  <div style={compactHistoryStyles.cellMonth}>
                    {record.month}
                  </div>

                  {/* Savings */}
                  <div style={compactHistoryStyles.cellSavings}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedSavings}
                        onChange={(e) => setEditedSavings(e.target.value)}
                        style={compactHistoryStyles.editInput}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        disabled={isSaving}
                      />
                    ) : (
                      formatLakhs(savingsValue)
                    )}
                  </div>

                  {/* Deposits */}
                  <div style={compactHistoryStyles.cellDeposits}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedDeposits}
                        onChange={(e) => setEditedDeposits(e.target.value)}
                        style={compactHistoryStyles.editInput}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        disabled={isSaving}
                      />
                    ) : (
                      formatLakhs(depositsValue)
                    )}
                  </div>

                  {/* Total */}
                  <div style={compactHistoryStyles.cellTotal}>
                    {formatLakhs(totalValue)}
                  </div>

                  {/* Actions */}
                  {settings?.showDelete && (
                    <div style={compactHistoryStyles.buttonContainer}>
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdits(record.month)}
                            style={{
                              ...compactHistoryStyles.smallButton,
                              backgroundColor: "#48bb78",
                              color: "white",
                            }}
                            disabled={isSaving}
                            title="Save"
                          >
                            {isSaving ? "⏳" : "✓"}
                          </button>
                          <button
                            onClick={cancelEditing}
                            style={{
                              ...compactHistoryStyles.smallButton,
                              backgroundColor: "#a0aec0",
                              color: "white",
                            }}
                            title="Cancel"
                          >
                            ✕
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
                              ...compactHistoryStyles.smallButton,
                              backgroundColor: "#4299e1",
                              color: "white",
                            }}
                            disabled={editingMonth !== null}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteConfirmMonth(record.month)}
                            style={{
                              ...compactHistoryStyles.smallButton,
                              backgroundColor: "#f56565",
                              color: "white",
                            }}
                            disabled={editingMonth !== null}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteConfirmMonth && (
        <div
          style={{
            position: "fixed" as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex" as const,
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
              style={{
                margin: "0 0 20px 0",
                color: "#666",
                lineHeight: "1.5",
              }}
            >
              Are you sure you want to delete the history record for{" "}
              <strong>{deleteConfirmMonth}</strong>?
            </p>
            <div
              style={{
                display: "flex" as const,
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

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default HistoryTab;
