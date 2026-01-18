import { CSSProperties } from "react";

const HistoryListPageStyles: { [key: string]: CSSProperties } = {
  container: {
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
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
    borderRadius: "8px",
    margin: "0 0 16px 0",
    padding: "16px",
    border: "1px solid #e5e7eb",
  },
  chartWrapper: {
    position: "relative",
    height: "220px",
    width: "100%",
    marginTop: "8px",
  },
  emptyChart: {
    textAlign: "center",
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
    padding: "16px 16px 0 16px",
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
    borderRadius: "8px",
    margin: "0 0 16px 0",
    padding: "16px",
    border: "1px solid #e5e7eb",
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
    borderRadius: "8px",
    margin: "0 0 16px 0",
    padding: "0",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },
  tableContainer: {
    overflow: "hidden",
    borderRadius: "8px",
    border: "1px solid #e9ecef",
  },
  
  // FIXED TABLE HEADER STYLES
  tableHeader: {
    display: "flex",
    padding: "12px 12px",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: 600,
    fontSize: "13px",
    color: "#374151",
    minHeight: "44px",
    alignItems: "center",
  },
  
  // SPECIFIC HEADER CELL STYLES FOR PERFECT ALIGNMENT
  headerCellMonth: {
    flex: "1.5",
    minWidth: "0",
    paddingLeft: "8px",
    boxSizing: "border-box",
  },
  
  headerCellDeposits: {
    flex: "1",
    minWidth: "0",
    textAlign: "right",
    paddingRight: "12px",
    boxSizing: "border-box",
  },
  
  headerCellTotal: {
    flex: "1",
    minWidth: "0",
    textAlign: "right",
    paddingRight: "12px",
    boxSizing: "border-box",
  },
  
  headerCellActions: {
    flex: "0.5",
    minWidth: "60px",
    textAlign: "center",
    boxSizing: "border-box",
  },

  tableBody: {
    maxHeight: "400px",
    overflowY: "auto",
  },
  
  // FIXED TABLE ROW STYLES
  tableRow: {
    display: "flex",
    alignItems: "center",
    padding: "12px 12px",
    minHeight: "48px",
    borderBottom: "1px solid #f3f4f6",
    boxSizing: "border-box",
  },
  
  // SPECIFIC CELL STYLES FOR PERFECT ALIGNMENT
  cellMonth: {
    flex: "1.5",
    minWidth: "0",
    paddingLeft: "8px",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  
  cellDeposits: {
    flex: "1",
    minWidth: "0",
    textAlign: "right",
    paddingRight: "12px",
    boxSizing: "border-box",
  },
  
  cellTotal: {
    flex: "1",
    minWidth: "0",
    textAlign: "right",
    paddingRight: "12px",
    boxSizing: "border-box",
  },
  
  cellActions: {
    flex: "0.5",
    minWidth: "60px",
    display: "flex",
    justifyContent: "center",
    boxSizing: "border-box",
  },

  monthDisplay: {
    minWidth: "0",
  },
  monthName: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#1e293b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: 1.2,
  },
  monthId: {
    fontSize: "0.7rem",
    color: "#888",
    marginTop: "1px",
  },
  amountDisplay: {
    fontSize: "14px",
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
  
  // FIXED EDIT INPUT STYLES
  editInput: {
    width: "90px",
    padding: "6px 8px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "13px",
    textAlign: "right",
    boxSizing: "border-box",
  },
  
  editInputContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  
  actionButtons: {
    display: "flex",
    gap: "6px",
  },
  
  // FIXED BUTTON STYLES
  editButton: {
    width: "32px",
    height: "32px",
    backgroundColor: "transparent",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  deleteButton: {
    width: "32px",
    height: "32px",
    backgroundColor: "transparent",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  saveButton: {
    width: "32px",
    height: "32px",
    backgroundColor: "#10b981",
    border: "none",
    borderRadius: "4px",
    color: "white",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  cancelButton: {
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
  },
  
  emptyState: {
    textAlign: "center",
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

export default HistoryListPageStyles;