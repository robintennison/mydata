import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  ChartOptions,
  ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";

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
  const { loading, history, accounts, deposits, adjustments } =
    useBankingData();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [monthToDelete, setMonthToDelete] = useState<string | null>(null);
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [formMonth, setFormMonth] = useState("");
  const [formTotalDeposits, setFormTotalDeposits] = useState("");
  const [formSavings, setFormSavings] = useState("");
  const [chartData, setChartData] = useState<ChartData<"line"> | null>(null);

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

  // Format month for chart display
  const formatMonthForChart = (month: string): string => {
    try {
      const [year, monthNum] = month.split("-");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthName = monthNames[parseInt(monthNum) - 1] || monthNum;
      const shortYear = year.slice(2);
      return `${monthName} '${shortYear}`;
    } catch {
      return month;
    }
  };

  // Format month for table display
  const formatMonthForTable = (month: string): string => {
    try {
      const date = new Date(month + "-01");
      const monthName = date.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });
      // Extract just the last 2 digits of year
      return monthName.replace(/\d{4}/, (year) => year.slice(2));
    } catch {
      return month;
    }
  };

  // Prepare chart data
  useEffect(() => {
    if (history.length < 2) return;

    // Get last 6 months, sorted chronologically
    const chartHistory = [...history]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    const labels = chartHistory.map((record) =>
      formatMonthForChart(record.month)
    );
    const depositsData = chartHistory.map((record) =>
      parseFloat((record.totalDeposits / 100000).toFixed(2))
    );
    const totalData = chartHistory.map((record) =>
      parseFloat(((record.savings + record.totalDeposits) / 100000).toFixed(2))
    );

    // Find min and max for better Y-axis scaling
    //const allValues = [...depositsData, ...totalData];
    //const minValue = Math.min(...allValues);
    //const maxValue = Math.max(...allValues);
    //const padding = (maxValue - minValue) * 0.15;

    const data: ChartData<"line"> = {
      labels,
      datasets: [
        {
          label: "Deposits",
          data: depositsData,
          borderColor: "#2196F3",
          backgroundColor: "rgba(33, 150, 243, 0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: "Total (Deposits + Savings)",
          data: totalData,
          borderColor: "#4CAF50",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    };

    setChartData(data);
  }, [history]);

  // Chart options - optimized for mobile viewing
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 11,
          },
          padding: 8,
          boxWidth: 10,
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 8,
        cornerRadius: 4,
        titleFont: {
          size: 11,
        },
        bodyFont: {
          size: 11,
        },
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            if (value === null || value === undefined) {
              return `${context.dataset.label}: No data`;
            }
            return `${context.dataset.label}: ${value.toFixed(2)} L`;
          },
        },
      },
    },

    scales: {
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            size: 10,
          },
          maxRotation: 0,
          padding: 4,
        },
        title: {
          display: true,
          text: "Months",
          font: {
            size: 11,
            weight: 500,
          },
          padding: { top: 8, bottom: 4 },
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            size: 10,
          },
          padding: 4,
          callback: function (value) {
            if (value === null || value === undefined) return "";
            if (typeof value === "number") return `${value} L`;
            return value;
          },
        },
        title: {
          display: true,
          text: "Amount (in Lakhs)",
          font: {
            size: 11,
            weight: 500,
          },
          padding: { top: 4, bottom: 8 },
        },
      },
    },

    interaction: {
      intersect: false,
      mode: "index",
    },
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
              onClick={() => navigate("/settings")}
              style={styles.iconButton}
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div style={styles.chartSection}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>📈</span>
            Last 6 Months Trend
          </div>
        </div>

        {history.length < 2 ? (
          <div style={styles.emptyChart}>
            <div style={styles.emptyChartIcon}>📊</div>
            <div style={styles.emptyChartText}>
              {history.length === 0
                ? "No history data"
                : "Need more data for chart"}
            </div>
            <div style={styles.emptyChartSubtext}>
              Add at least 2 months of history
            </div>
          </div>
        ) : chartData ? (
          <div style={styles.chartWrapper}>
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : null}
      </div>

      {/* Current Month Total Card */}
      <div style={styles.currentMonthCard}>
        <div style={styles.currentMonthHeader}>
          <div style={styles.currentMonthIcon}>📅</div>
          <div>
            <div style={styles.currentMonthTitle}>Current Month</div>
            <div style={styles.currentMonthDate}>
              {new Date().toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
        <div style={styles.currentMonthValues}>
          <div style={styles.currentMonthRow}>
            <span>Total Deposits:</span>
            <span style={styles.currentMonthAmount}>
              {formatLakhs(totalDeposits)}
            </span>
          </div>
          <div style={styles.currentMonthRow}>
            <span>Total Savings:</span>
            <span style={styles.currentMonthAmount}>
              {formatLakhs(totalSavings)}
            </span>
          </div>
          <div
            style={{ ...styles.currentMonthRow, ...styles.currentMonthTotal }}
          >
            <span>Grand Total:</span>
            <span style={styles.currentMonthTotalAmount}>
              {formatLakhs(totalSavings + totalDeposits)}
            </span>
          </div>
        </div>
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
              History will be added automatically each month
            </div>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            {/* Table Header - Compact */}
            <div style={styles.tableHeader}>
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
              <div style={{ ...styles.headerCell, flex: 0.4 }}></div>
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
                      </div>
                    ) : (
                      // Display mode for this row - Compact
                      <>
                        <div style={{ ...styles.cell, flex: 1.2 }}>
                          <div style={styles.monthDisplay}>
                            <div style={styles.monthName}>{monthDisplay}</div>
                            <div style={styles.monthId}>{record.month}</div>
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

      {/* Bottom spacing */}
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

// Styles - Optimized for mobile
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
  chartSection: {
    backgroundColor: "white",
    borderRadius: "12px",
    margin: "15px",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
  },
  chartWrapper: {
    position: "relative",
    height: "220px",
    width: "100%",
    marginTop: "8px",
  },
  emptyChart: {
    textAlign: "center" as const,
    padding: "20px",
    color: "#6c757d",
  },
  emptyChartIcon: {
    fontSize: "2rem",
    marginBottom: "8px",
    opacity: 0.5,
  },
  emptyChartText: {
    fontSize: "0.9rem",
    fontWeight: 500,
    marginBottom: "4px",
  },
  emptyChartSubtext: {
    fontSize: "0.8rem",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#333",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sectionIcon: {
    fontSize: "1.1rem",
  },
  sectionSubtitle: {
    fontSize: "0.8rem",
    color: "#666",
  },
  currentMonthCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    margin: "15px",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
  },
  currentMonthHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  currentMonthIcon: {
    fontSize: "1.8rem",
    backgroundColor: "#e8f0fe",
    color: "#4285f4",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  currentMonthTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#333",
  },
  currentMonthDate: {
    fontSize: "0.85rem",
    color: "#666",
  },
  currentMonthValues: {
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    padding: "12px",
  },
  currentMonthRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    fontSize: "0.9rem",
  },
  currentMonthAmount: {
    fontWeight: 600,
    color: "#333",
  },
  currentMonthTotal: {
    borderTop: "1px solid #ddd",
    paddingTop: "8px",
    marginTop: "4px",
  },
  currentMonthTotalAmount: {
    fontWeight: 700,
    fontSize: "1rem",
    color: "#4285f4",
  },
  section: {
    backgroundColor: "white",
    borderRadius: "12px",
    margin: "15px",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e9ecef",
  },
  tableContainer: {
    overflow: "hidden",
    borderRadius: "8px",
    border: "1px solid #e9ecef",
  },
  tableHeader: {
    display: "flex",
    padding: "10px 12px",
    backgroundColor: "#f8f9fa",
    borderBottom: "1px solid #e9ecef",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#495057",
  },
  headerCell: {
    padding: "0 4px",
  },
  tableBody: {
    maxHeight: "400px",
    overflowY: "auto",
  },
  tableRow: {
    display: "flex",
    alignItems: "center",
    padding: "8px 12px",
    minHeight: "44px",
    borderBottom: "1px solid #f0f0f0",
  },
  editRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
  },
  cell: {
    padding: "0 4px",
    display: "flex",
    alignItems: "center",
  },
  monthDisplay: {
    minWidth: "0",
  },
  monthName: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#333",
    lineHeight: 1.2,
  },
  monthId: {
    fontSize: "0.7rem",
    color: "#888",
    marginTop: "1px",
  },
  amountDisplay: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#333",
    lineHeight: 1.2,
  },
  savingsNote: {
    fontSize: "0.7rem",
    color: "#666",
    marginTop: "1px",
    fontStyle: "italic",
  },
  editInput: {
    padding: "6px 8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "0.85rem",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  actionButtons: {
    display: "flex",
    gap: "6px",
  },
  editButton: {
    background: "none",
    border: "none",
    fontSize: "0.9rem",
    cursor: "pointer",
    opacity: 0.7,
    padding: "4px",
    borderRadius: "4px",
    minWidth: "28px",
    minHeight: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    background: "none",
    border: "none",
    fontSize: "0.9rem",
    cursor: "pointer",
    opacity: 0.7,
    padding: "4px",
    borderRadius: "4px",
    minWidth: "28px",
    minHeight: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    background: "none",
    border: "none",
    fontSize: "1rem",
    color: "#34a853",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    minWidth: "28px",
    minHeight: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    background: "none",
    border: "none",
    fontSize: "1rem",
    color: "#ea4335",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    minWidth: "28px",
    minHeight: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "30px 20px",
    color: "#6c757d",
  },
  emptyIcon: {
    fontSize: "2.5rem",
    marginBottom: "12px",
    opacity: 0.5,
  },
  emptyText: {
    fontSize: "0.95rem",
    fontWeight: 500,
    marginBottom: "4px",
  },
  emptySubtext: {
    fontSize: "0.8rem",
  },
  dialogOverlay: {
    position: "fixed" as const,
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
    padding: "20px",
    width: "90%",
    maxWidth: "350px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  dialogTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#333",
    marginBottom: "12px",
  },
  dialogMessage: {
    fontSize: "0.9rem",
    color: "#666",
    marginBottom: "20px",
    lineHeight: 1.4,
  },
  dialogButtons: {
    display: "flex",
    gap: "10px",
  },
  dialogCancel: {
    flex: 1,
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    backgroundColor: "white",
    color: "#666",
    fontSize: "0.9rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  dialogConfirm: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#ea4335",
    color: "white",
    fontSize: "0.9rem",
    fontWeight: 500,
    cursor: "pointer",
  },
};

export default HistoryListPage;
