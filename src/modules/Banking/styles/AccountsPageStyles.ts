import { CSSProperties } from "react";

export const accountsPageStyles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  } as CSSProperties,

  header: {
    padding: "20px 15px 10px",
    textAlign: "center" as const,
  } as CSSProperties,

  headerTitle: {
    fontSize: "1.8rem",
    fontWeight: "600" as const,
    color: "#333",
    margin: "0 0 5px 0",
  } as CSSProperties,

  headerSubtitle: {
    fontSize: "0.9rem",
    color: "#6c757d",
  } as CSSProperties,

  topNav: {
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    padding: "10px 15px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e9ecef",
  } as CSSProperties,

  navButton: {
    padding: "8px 12px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #e9ecef",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer" as const,
    minWidth: "40px",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    color: "#333",
  } as CSSProperties,

  navTitle: {
    fontSize: "1.1rem",
    fontWeight: "600" as const,
    color: "#333",
  } as CSSProperties,

  searchInputContainer: {
    position: "relative" as const,
  } as CSSProperties,

  searchInput: {
    paddingLeft: "40px",
    width: "100%",
  } as CSSProperties,

  searchIcon: {
    position: "absolute" as const,
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#6c757d",
  } as CSSProperties,

  clearSearchButton: {
    position: "absolute" as const,
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#6c757d",
    fontSize: "1.2rem",
    cursor: "pointer" as const,
  } as CSSProperties,

  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center" as const,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: "15px",
  } as CSSProperties,

  statsLabel: {
    fontSize: "0.9rem",
    color: "#6c757d",
    marginBottom: "5px",
  } as CSSProperties,

  statsValue: {
    fontSize: "2rem",
    fontWeight: "700" as const,
    color: "#4285f4",
    marginBottom: "5px",
  } as CSSProperties,

  statusIndicators: {
    marginTop: "8px",
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: "4px",
  } as CSSProperties,

  statusIndicator: {
    fontSize: "0.7rem",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: "4px",
  } as CSSProperties,

  statusText: {
    fontWeight: "600" as const,
  } as CSSProperties,

  accountsListCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "15px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  } as CSSProperties,

  tableHeader: {
    display: "flex" as const,
    padding: "12px 0",
    marginBottom: "8px",
    fontSize: "0.9rem",
    fontWeight: "600" as const,
    color: "#495057",
    borderBottom: "2px solid #e9ecef",
  } as CSSProperties,

  tableHeaderCell: (flex: number, align: string = "left") => ({
    flex,
    padding: "0 8px",
    textAlign: align as any,
  }),

  tableRow: (isLast: boolean, isActive: boolean) => ({
    display: "flex" as const,
    alignItems: "center" as const,
    padding: "12px 0",
    borderBottom: isLast ? "none" : "1px solid #e9ecef",
    opacity: isActive ? 1 : 0.7,
  }) as CSSProperties,

  accountCode: (isActive: boolean) => ({
    fontWeight: "500" as const,
    color: isActive ? "#333" : "#6c757d",
    fontSize: "0.95rem",
    textDecoration: isActive ? "none" : "line-through" as const,
  }) as CSSProperties,

  inactiveLabel: {
    fontSize: "0.7rem",
    color: "#dc2626",
    marginLeft: "6px",
  } as CSSProperties,

  savingsAmount: (isActive: boolean) => ({
    fontSize: "0.95rem",
    fontWeight: "600" as const,
    color: isActive ? "#4285f4" : "#6c757d",
  }) as CSSProperties,

  mpinText: (isActive: boolean) => ({
    fontFamily: "'Courier New', monospace",
    fontSize: "0.9rem",
    color: isActive ? "#666" : "#9ca3af",
  }) as CSSProperties,

  statusBadge: (isActive: boolean) => ({
    fontSize: "0.8rem",
    fontWeight: "600" as const,
    color: isActive ? "#10b981" : "#dc2626",
    backgroundColor: isActive ? "#f0fdf4" : "#fef2f2",
    padding: "4px 8px",
    borderRadius: "12px",
    display: "inline-block" as const,
  }) as CSSProperties,

  actionsContainer: {
    width: "80px",
    display: "flex" as const,
    justifyContent: "center" as const,
    gap: "6px",
    padding: "0 8px",
  } as CSSProperties,

  editButton: (isEnabled: boolean) => ({
    padding: "6px 10px",
    fontSize: "0.8rem",
    minWidth: "auto",
    opacity: isEnabled ? 1 : 0.6,
    cursor: isEnabled ? "pointer" as const : "not-allowed" as const,
    backgroundColor: "#f8f9fa",
    border: "1px solid #e9ecef",
    borderRadius: "6px",
    color: "#333",
  }) as CSSProperties,

  deleteButton: {
    padding: "6px 10px",
    fontSize: "0.8rem",
    minWidth: "auto",
    backgroundColor: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    color: "#dc2626",
    cursor: "pointer" as const,
  } as CSSProperties,

  emptyState: {
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: "40px 20px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    textAlign: "center" as const,
    color: "#6c757d",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  } as CSSProperties,

  emptyStateIcon: {
    fontSize: "2rem",
    marginBottom: "10px",
  } as CSSProperties,

  actionButton: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#4285f4",
    border: "none",
    borderRadius: "10px",
    color: "#ffffff",
    fontSize: "1rem",
    fontWeight: "500" as const,
    cursor: "pointer" as const,
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: "8px",
  } as CSSProperties,

  viewToggleButton: (showInactive: boolean) => ({
    width: "100%",
    padding: "14px",
    backgroundColor: showInactive ? "#10b981" : "#f59e0b",
    border: "none",
    borderRadius: "10px",
    color: "#ffffff",
    fontSize: "1rem",
    fontWeight: "500" as const,
    cursor: "pointer" as const,
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: "8px",
    marginTop: "15px",
  }) as CSSProperties,

  settingsInfoBox: {
    marginTop: "15px",
    padding: "12px",
    backgroundColor: "#fef3c7",
    border: "1px solid #fbbf24",
    borderRadius: "8px",
    fontSize: "0.85rem",
    color: "#92400e",
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "8px",
  } as CSSProperties,

  settingsLink: {
    background: "none",
    border: "none",
    color: "#2563eb",
    textDecoration: "underline" as const,
    cursor: "pointer" as const,
    padding: "0",
    fontSize: "0.85rem",
  } as CSSProperties,

  deleteDialogOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: "20px",
    zIndex: 1000,
  } as CSSProperties,

  deleteDialog: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    maxWidth: "400px",
    width: "100%",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
  } as CSSProperties,

  deleteDialogTitle: {
    margin: "0 0 15px 0",
    fontSize: "1.1rem",
    fontWeight: "600" as const,
    color: "#333",
  } as CSSProperties,

  deleteDialogMessage: {
    margin: "0 0 20px 0",
    color: "#666",
    lineHeight: "1.5",
  } as CSSProperties,

  deleteDialogButtons: {
    display: "flex" as const,
    gap: "10px",
  } as CSSProperties,

  deleteDialogButton: (isCancel: boolean = false) => ({
    flex: 1,
    padding: "12px",
    backgroundColor: isCancel ? "#f8f9fa" : "#ea4335",
    border: isCancel ? "1px solid #e9ecef" : "none",
    borderRadius: "8px",
    color: isCancel ? "#495057" : "#ffffff",
    fontWeight: "500" as const,
    cursor: "pointer" as const,
  }) as CSSProperties,

  bottomSpacing: {
    height: "20px",
  } as CSSProperties,
};