import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { bankingStyles } from "../styles";
import { useBankingData } from "../hooks/useBankingData";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import HistoryChart from "./HistoryChart.tsx";
import styles from "../styles/HistoryListPage.styles.ts";
import BankingNavigation from "./BankingNavigation"; //

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const HistoryListPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { loading, history } = useBankingData(); // Only need 'history' and 'loading'
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [monthToDelete, setMonthToDelete] = useState<string | null>(null);
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [formMonth, setFormMonth] = useState("");
  const [formTotalDeposits, setFormTotalDeposits] = useState("");
  const [formSavings, setFormSavings] = useState("");

  // Sort history by month (descending)
  const sortedHistory = [...history].sort((a, b) =>
    b.month.localeCompare(a.month)
  );

  // Format to lakhs without 'L' suffix
  const formatLakhs = (amount: number): string => {
    return (amount / 100000).toFixed(2);
  };

  // Format month for table display - only show short month and 2-digit year
  const formatMonthForTable = (month: string): string => {
    try {
      const date = new Date(month + "-01");
      return date.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });
    } catch {
      return month;
    }
  };

  // Handle edit
  const handleEdit = (record: any) => {
    setEditingMonth(record.month);
    setFormMonth(record.month);
    setFormTotalDeposits((record.totalDeposits / 100000).toFixed(2));
    setFormSavings((record.savings / 100000).toFixed(2));
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingMonth(null);
    setFormMonth("");
    setFormTotalDeposits("");
    setFormSavings("");
  };

  // Save edit
  const saveEdit = () => {
    if (formMonth && formTotalDeposits && formSavings) {
      const record = {
        month: formMonth,
        totalDeposits: parseFloat(formTotalDeposits) * 100000 || 0,
        savings: parseFloat(formSavings) * 100000 || 0,
      };

      // TODO: Save to Firebase
      console.log("Updating history record:", record);

      // Reset form
      cancelEditing();
    }
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
      {/* Header - Compact single row */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "12px 16px",
          borderBottom: "1px solid #e9ecef",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <button
            onClick={() => navigate("/banking")}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#495057",
              padding: "0",
              lineHeight: "1",
            }}
            title="Back to Banking"
          >
            ←
          </button>
          <h1
            style={{
              margin: "0",
              fontSize: "1.2rem",
              fontWeight: "600",
              color: "#333",
            }}
          >
            Banking / History
          </h1>
        </div>
        <div>
          <button
            onClick={() => navigate("/settings")}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              cursor: "pointer",
              color: "#495057",
              padding: "6px",
              lineHeight: "1",
            }}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Chart Section */}
      <HistoryChart history={history} />

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
              History will be added automatically each month
            </div>
          </div>
        ) : (
          <div
            style={{
              ...styles.tableContainer,
              margin: 0,
              padding: 0,
              borderRadius: 0,
              width: "100%",
            }}
          >
            {/* Table Header - Compact */}
            <div
              style={{
                ...styles.tableHeader,
                padding: "12px 16px",
                margin: 0,
              }}
            >
              <div style={{ ...styles.headerCell, flex: 1.2 }}>Month</div>
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
              {settings?.showDelete && (
                <div style={{ ...styles.headerCell, flex: 0.4 }}></div>
              )}
            </div>

            {/* Table Body - Compact */}
            <div style={styles.tableBody}>
              {sortedHistory.map((record, index) => {
                const monthDisplay = formatMonthForTable(record.month);
                const total = calculateTotal(
                  record.savings,
                  record.totalDeposits
                );
                const isEditing = editingMonth === record.month;

                return (
                  <div
                    key={record.month}
                    style={{
                      ...styles.tableRow,
                      backgroundColor: index % 2 === 0 ? "white" : "#fafafa",
                      padding: "12px 16px",
                      margin: 0,
                    }}
                  >
                    {isEditing ? (
                      // Edit mode for this row - Compact
                      <div style={styles.editRow}>
                        <div style={{ flex: 1.2 }}>
                          <input
                            type="text"
                            value={formMonth}
                            onChange={(e) => setFormMonth(e.target.value)}
                            style={styles.editInput}
                            disabled
                            placeholder="YYYY-MM"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <input
                            type="number"
                            value={formTotalDeposits}
                            onChange={(e) =>
                              setFormTotalDeposits(e.target.value)
                            }
                            style={styles.editInput}
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <input
                            type="number"
                            value={formSavings}
                            onChange={(e) => setFormSavings(e.target.value)}
                            style={styles.editInput}
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                        {settings?.showDelete && (
                          <div
                            style={{
                              flex: 0.4,
                              display: "flex",
                              gap: "4px",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <button
                              onClick={saveEdit}
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
                        )}
                      </div>
                    ) : (
                      // Display mode for this row - Compact
                      <>
                        <div style={{ ...styles.cell, flex: 1.2 }}>
                          <div style={styles.monthDisplay}>
                            <div style={styles.monthName}>{monthDisplay}</div>
                          </div>
                        </div>
                        <div
                          style={{
                            ...styles.cell,
                            flex: 1,
                            textAlign: "right" as "right",
                          }}
                        >
                          <div style={styles.amountDisplay}>
                            {formatLakhs(record.totalDeposits)}
                          </div>
                        </div>
                        <div
                          style={{
                            ...styles.cell,
                            flex: 1,
                            textAlign: "right" as "right",
                          }}
                        >
                          <div style={styles.amountDisplay}>
                            {formatLakhs(total)}
                          </div>
                          <div style={styles.savingsNote}>
                            {formatLakhs(record.savings)}
                          </div>
                        </div>
                        {/* Edit/Delete buttons only if showDelete is enabled */}
                        {settings?.showDelete && (
                          <div
                            style={{
                              ...styles.cell,
                              flex: 0.4,
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
                        )}
                      </>
                    )}
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
      <BankingNavigation />
      {/* Bottom spacing */}
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default HistoryListPage;
