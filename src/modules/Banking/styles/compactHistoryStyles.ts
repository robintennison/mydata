import { CSSProperties } from "react";

export const compactHistoryStyles: { [key: string]: CSSProperties } = {
  container: {
    width: "100%",
    backgroundColor: "#ffffff",
    minHeight: "100%",
    padding: "0",
    margin: "0",
  },

  chartSection: {
    backgroundColor: "white",
    margin: "0",
    padding: "0", // ← CHANGED FROM 16px
    borderBottom: "1px solid #e5e7eb",
    borderRadius: "0",
  },

  chartWrapper: {
    position: "relative",
    height: "180px", // Reduced from 220px
    width: "100%",
    margin: "0",
    padding: "0",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0", // Changed from 12px
    padding: "8px 4px", // Reduced from 16px
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e9ecef",
  },

  sectionTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#333",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  tableContainer: {
    overflow: "hidden",
    border: "1px solid #e9ecef",
    borderRadius: "0",
    margin: "0",
    padding: "0",
  },

  tableHeader: {
    display: "flex",
    padding: "6px 4px", // Reduced from 12px
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: 600,
    fontSize: "11px",
    color: "#374151",
    minHeight: "32px", // Reduced from 44px
    alignItems: "center",
  },

  tableRow: {
    display: "flex",
    alignItems: "center",
    padding: "4px", // Reduced from 12px
    minHeight: "32px", // Reduced from 48px
    borderBottom: "1px solid #f3f4f6",
    boxSizing: "border-box",
  },

  // Compact cell styles
  cellMonth: {
    flex: "1.5",
    minWidth: "0",
    paddingLeft: "4px", // Reduced from 8px
    overflow: "hidden",
    boxSizing: "border-box",
  },

  cellDeposits: {
    flex: "1",
    minWidth: "0",
    textAlign: "right",
    paddingRight: "4px", // Reduced from 12px
    boxSizing: "border-box",
  },

  cellTotal: {
    flex: "1",
    minWidth: "0",
    textAlign: "right",
    paddingRight: "4px", // Reduced from 12px
    boxSizing: "border-box",
  },

  monthName: {
    fontSize: "11px", // Reduced from 14px
    fontWeight: 500,
    color: "#1e293b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: 1.2,
  },

  amountDisplay: {
    fontSize: "11px", // Reduced from 14px
    fontWeight: 600,
    color: "#333",
    lineHeight: 1.2,
  },

  // Compact buttons
  editButton: {
    width: "24px", // Reduced from 32px
    height: "24px",
    backgroundColor: "transparent",
    border: "none",
    fontSize: "12px", // Reduced from 16px
    cursor: "pointer",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
  },

  deleteButton: {
    width: "24px",
    height: "24px",
    backgroundColor: "transparent",
    border: "none",
    fontSize: "12px",
    cursor: "pointer",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
  },

  // Remove all empty states padding
  emptyState: {
    textAlign: "center",
    padding: "20px 10px", // Reduced from 30px 20px
    color: "#6c757d",
  },

  // Remove all unnecessary margins
};