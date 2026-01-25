// src/modules/banking/styles/SummaryTab.styles.ts
export const summaryTabStyles = {
  container: {
    padding: "0",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  // Loading
  loadingContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "300px",
  },
  spinner: {
    border: "4px solid #f3f4f6",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  loadingText: {
    fontSize: "14px",
    color: "#6b7280",
  },

  // Error
  errorContainer: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    padding: "12px 16px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorIcon: {
    marginRight: "12px",
    fontSize: "16px",
  },
  errorText: {
    flex: 1,
    color: "#dc2626",
    fontSize: "14px",
    fontWeight: 500,
  },
  errorClose: {
    background: "none",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: "18px",
    padding: "0",
    marginLeft: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
  },

  // Empty State
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    textAlign: "center" as const,
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
    color: "#9ca3af",
  },
  emptyText: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "8px",
  },
  emptySubtext: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "24px",
    maxWidth: "300px",
  },

  // Table - Match DepositsTab fonts
  tableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    marginBottom: "16px",
  },
  tableHeader: {
    display: "flex",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e9ecef", // Match DepositsTab border
    padding: "6px 4px", // Match DepositsTab padding
    fontWeight: 600,
    color: "#374151",
    fontSize: "11px", // Match DepositsTab font size
  },
  headerCell: {
    padding: "0 4px",
    display: "flex",
    alignItems: "center",
  },
  tableRow: {
    display: "flex",
    padding: "6px 4px", // Match DepositsTab padding
    alignItems: "center",
    minHeight: "36px", // Match DepositsTab min-height
    borderBottom: "1px solid #f3f4f6", // Add border like DepositsTab
  },
  tableCell: {
    padding: "0 4px",
    display: "flex",
    alignItems: "center",
    fontSize: "12px", // Match DepositsTab font size
  },
  accountCode: {
    fontWeight: 600,
    color: "#111827",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    fontSize: "12px", // Match DepositsTab font size
  },
  amountDisplay: {
    fontWeight: 600,
    color: "#111827",
    fontSize: "12px", // Match DepositsTab font size
  },

  // Edit Input - Match DepositsTab style
  editInputContainer: {
    display: "flex",
    justifyContent: "flex-end",
    width: "100%",
  },
  editInput: {
    width: "80%",
    padding: "6px 8px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "12px", // Match DepositsTab font size
    textAlign: "right" as const,
    backgroundColor: "#ffffff",
    outline: "none",
    maxWidth: "120px",
  },

  // Action Buttons - Smaller to match DepositsTab
  actionButtons: {
    display: "flex",
    gap: "4px",
  },
  saveButton: {
    backgroundColor: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    padding: "4px 6px", // Reduced to match DepositsTab compactness
    fontSize: "10px", // Smaller to match DepositsTab
    fontWeight: 600,
    cursor: "pointer",
    minWidth: "28px", // Smaller
    minHeight: "28px", // Smaller
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    padding: "4px 6px", // Reduced
    fontSize: "10px", // Smaller
    fontWeight: 600,
    cursor: "pointer",
    minWidth: "28px", // Smaller
    minHeight: "28px", // Smaller
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    padding: "4px 6px", // Reduced
    fontSize: "10px", // Smaller
    cursor: "pointer",
    minWidth: "28px", // Smaller
    minHeight: "28px", // Smaller
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // Totals - Match DepositsTab footer styling
  totalsRow: {
    display: "flex",
    backgroundColor: "#f3f4f6", // Match DepositsTab footer background
    borderTop: "1px solid #e9ecef", // Match DepositsTab border
    padding: "8px 4px", // Match DepositsTab padding
    fontWeight: 700,
    color: "#111827",
    fontSize: "14px", // Slightly larger for totals like DepositsTab
  },
  totalsCell: {
    padding: "0 4px",
    display: "flex",
    alignItems: "center",
  },

  // History Section
  historySection: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    marginTop: "24px",
  },
  historyButton: {
    backgroundColor: "#8b5cf6",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "280px",
    transition: "background-color 0.2s",
  },
  historyNote: {
    fontSize: "12px", // Match DepositsTab note font size
    color: "#6b7280",
    marginTop: "8px",
    textAlign: "center" as const,
  },

  // Spinner
  spinnerSmall: {
    border: "2px solid #ffffff33",
    borderTop: "2px solid #ffffff",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    animation: "spin 1s linear infinite",
  },

  // Add new styles to match DepositsTab
  numericCell: {
    fontSize: "12px", // Match DepositsTab
    color: "#666",
    fontFamily: "monospace", // Match DepositsTab date styling
  },
  
  // Match DepositsTab summary styling
  summaryInfo: {
    fontSize: "11px", // Match DepositsTab info font
    color: "#6b7280",
    textAlign: "center" as const,
  },

  // Optional: Add cursor pointer for clickable rows like DepositsTab
  clickableRow: {
    cursor: "pointer",
    backgroundColor: "white",
  },
  clickableRowHover: {
    backgroundColor: "#f8f9fa", // Light hover effect like DepositsTab
  },
};