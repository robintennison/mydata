import { CSSProperties } from "react";

export const onlineStyles = {
  // Container
  container: {
    display: "flex",
    flexDirection: "column" as const,
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },

  contentWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    maxWidth: "100%", // Changed from 500px to fill the Layout container
    margin: "0 auto",
    width: "100%",
  },

  // Top Navigation
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 15px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e9ecef",
    marginBottom: "10px",
  } as CSSProperties,

  navButton: {
    padding: "8px 12px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #e9ecef",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
    minWidth: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#333",
  } as CSSProperties,

  navTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#333",
  } as CSSProperties,

  navSubtitle: {
    fontSize: "0.875rem",
    color: "#718096",
    margin: "0",
    fontWeight: "500",
  } as CSSProperties,

  headerLeft: {
    flex: 1,
  } as CSSProperties,

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  } as CSSProperties,

  addButton: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 6px rgba(102, 126, 234, 0.2)",
  } as CSSProperties,

  // Loading
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
  } as CSSProperties,

  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3498db",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  } as CSSProperties,

  // Search
  searchContainer: {
    position: "relative",
    margin: "0 15px 20px 15px",
  } as CSSProperties,

  searchInput: {
    width: "100%",
    padding: "12px 40px 12px 15px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
    backgroundColor: "white",
  } as CSSProperties,

  searchIcon: {
    position: "absolute",
    right: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#a0aec0",
  } as CSSProperties,

  // Section
  section: {
    backgroundColor: "white",
    borderRadius: "12px",
    margin: "0 4px 8px 4px", // Reduced margins for edge-to-edge look
    padding: "8px", // Reduced padding
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e9ecef",
  } as CSSProperties,

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  } as CSSProperties,

  sectionTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#333",
  } as CSSProperties,

  viewAllButton: {
    backgroundColor: "transparent",
    color: "#4285f4",
    border: "1px solid #4285f4",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "0.75rem",
    fontWeight: "500",
    cursor: "pointer",
  } as CSSProperties,

  // Table
  tableResponsiveContainer: {
    width: "100%",
    overflowX: "auto",
    borderRadius: "8px",
    border: "1px solid #e9ecef",
  } as CSSProperties,

  responsiveTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.85rem",
  } as CSSProperties,

  tableHeader: {
    backgroundColor: "#f8f9fa",
    fontWeight: "600",
    color: "#333",
    textAlign: "left",
    padding: "12px 15px",
    borderBottom: "2px solid #dee2e6",
    whiteSpace: "nowrap",
  } as CSSProperties,

  tableCell: {
    padding: "10px 15px",
    borderBottom: "1px solid #e9ecef",
    verticalAlign: "middle",
  } as CSSProperties,

  tableRow: {
    '&:hover': {
      backgroundColor: "#f8f9fa",
    },
  } as CSSProperties,

  // Action Buttons
  actionButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  } as CSSProperties,

  viewButton: {
    padding: "6px 12px",
    backgroundColor: "#4299e1",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.2s",
  } as CSSProperties,

  editButton: {
    padding: "6px 12px",
    backgroundColor: "#48bb78",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.2s",
  } as CSSProperties,

  deleteButton: {
    padding: "6px 12px",
    backgroundColor: "#f56565",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.2s",
  } as CSSProperties,

  // Form Styles
  form: {
    maxWidth: "600px",
    margin: "0 auto",
  } as CSSProperties,

  formGroup: {
    marginBottom: "20px",
  } as CSSProperties,

  formRow: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px",
  } as CSSProperties,

  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
  } as CSSProperties,

  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box",
    backgroundColor: "white",
  } as CSSProperties,

  select: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "white",
    boxSizing: "border-box",
  } as CSSProperties,

  textarea: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    minHeight: "80px",
    resize: "vertical",
    boxSizing: "border-box",
  } as CSSProperties,

  fileInput: {
    width: "100%",
    padding: "8px",
    border: "1px dashed #d1d5db",
    borderRadius: "6px",
    backgroundColor: "#f9fafb",
  } as CSSProperties,

  // Form Actions
  formActions: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
    marginTop: "30px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
  } as CSSProperties,

  cancelButton: {
    padding: "12px 30px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
  } as CSSProperties,

  submitButton: {
    padding: "12px 30px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
  } as CSSProperties,

  // Empty State
  emptyState: {
    textAlign: "center" as const,
    padding: "40px 20px",
    color: "#6c757d",
  } as CSSProperties,

  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
    opacity: "0.5",
  } as CSSProperties,

  emptyText: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: "8px",
  } as CSSProperties,

  emptySubtext: {
    fontSize: "14px",
    color: "#9ca3af",
  } as CSSProperties,

  // Truncate Text
  truncateText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "200px",
  } as CSSProperties,

  // Badges
  expiredBadge: {
    padding: "4px 8px",
    backgroundColor: "#fed7d7",
    color: "#c53030",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
    display: "inline-block",
  } as CSSProperties,

  warningBadge: {
    padding: "4px 8px",
    backgroundColor: "#feebc8",
    color: "#c05621",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
    display: "inline-block",
  } as CSSProperties,

  normalBadge: {
    padding: "4px 8px",
    backgroundColor: "#c6f6d5",
    color: "#22543d",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
    display: "inline-block",
  } as CSSProperties,

  // Row Status
  warningRow: {
    backgroundColor: "#fffaf0 !important",
    borderLeft: "3px solid #ed8936",
  } as CSSProperties,

  expiredRow: {
    backgroundColor: "#fff5f5 !important",
    borderLeft: "3px solid #fc8181",
  } as CSSProperties,

  immediateRow: {
    backgroundColor: "#fff8e1 !important",
    borderLeft: "3px solid #ff9800",
  } as CSSProperties,
};