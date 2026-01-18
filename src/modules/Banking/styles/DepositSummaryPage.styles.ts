// src/modules/banking/styles/DepositSummaryPage.styles.ts
export const depositSummaryStyles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    maxWidth: "600px",
    margin: "0 auto",
  } as React.CSSProperties,

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky" as "sticky",
    top: 0,
    zIndex: 100,
  } as React.CSSProperties,

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  } as React.CSSProperties,

  backButton: {
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
  } as React.CSSProperties,

  headerTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
  } as React.CSSProperties,

  settingsButton: {
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
  } as React.CSSProperties,

  content: {
    padding: "0",
    backgroundColor: "#ffffff",
    minHeight: "calc(100vh - 120px)",
  } as React.CSSProperties,

  errorContainer: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    marginBottom: "16px",
  } as React.CSSProperties,

  errorIcon: {
    fontSize: "18px",
    marginRight: "12px",
    color: "#dc2626",
  } as React.CSSProperties,

  errorText: {
    flex: 1,
    fontSize: "14px",
    color: "#b91c1c",
    fontWeight: "500",
  } as React.CSSProperties,

  errorClose: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: "16px",
    color: "#dc2626",
    cursor: "pointer",
    padding: "4px",
    marginLeft: "8px",
  } as React.CSSProperties,

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    textAlign: "center",
  } as React.CSSProperties,

  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
    opacity: 0.5,
  } as React.CSSProperties,

  emptyText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px",
  } as React.CSSProperties,

  emptySubtext: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "24px",
    maxWidth: "300px",
    lineHeight: "1.5",
  } as React.CSSProperties,

  addButton: {
    padding: "12px 24px",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  } as React.CSSProperties,

  tableContainer: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden",
    marginBottom: "16px",
  } as React.CSSProperties,

  tableHeader: {
    display: "flex",
    padding: "10px 12px",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: "600",
    fontSize: "13px",
    color: "#374151",
  } as React.CSSProperties,

  headerCell: {
    flex: 1,
    minWidth: "0",
  } as React.CSSProperties,

  tableRow: {
    display: "flex",
    alignItems: "center",
    padding: "10px 12px",
    minHeight: "48px",
  } as React.CSSProperties,

  tableCell: {
    flex: 1,
    minWidth: "0",
  } as React.CSSProperties,

  accountCode: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
    whiteSpace: "nowrap" as "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as React.CSSProperties,

  amountDisplay: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
  } as React.CSSProperties,

  editInputContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  } as React.CSSProperties,

  editInput: {
    width: "90px",
    padding: "6px 8px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "13px",
    textAlign: "right",
  } as React.CSSProperties,

  actionButtons: {
    display: "flex",
    gap: "6px",
  } as React.CSSProperties,

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
  } as React.CSSProperties,

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
  } as React.CSSProperties,

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
  } as React.CSSProperties,

  totalsRow: {
    display: "flex",
    alignItems: "center",
    padding: "12px 12px",
    backgroundColor: "#f3f4f6",
    borderTop: "2px solid #e5e7eb",
    fontWeight: "600",
    fontSize: "14px",
    color: "#1f2937",
  } as React.CSSProperties,

  totalsCell: {
    flex: 1,
    minWidth: "0",
  } as React.CSSProperties,

  historySection: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
    border: "1px solid #e2e8f0",
    textAlign: "center",
  } as React.CSSProperties,

  historyButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    color: "white",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "8px",
  } as React.CSSProperties,

  historyNote: {
    fontSize: "12px",
    color: "#6b7280",
  } as React.CSSProperties,

  spinnerSmall: {
    width: "16px",
    height: "16px",
    border: "2px solid #ffffff",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  } as React.CSSProperties,
};