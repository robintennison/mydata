// src/modules/SettingsPageStyles.ts
export const settingsStyles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    maxWidth: "500px",
    margin: "0 auto",
    boxShadow: "0 0 20px rgba(0,0,0,0.1)",
  } as React.CSSProperties,

  header: {
    backgroundColor: "#ffffff",
    padding: "24px 20px",
    borderBottom: "1px solid #e2e8f0",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
  } as React.CSSProperties,

  headerTitle: {
    margin: "0 0 8px 0",
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  } as React.CSSProperties,

  headerSubtitle: {
    margin: "0",
    fontSize: "14px",
    color: "#64748b",
  } as React.CSSProperties,

  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
  } as React.CSSProperties,

  navButton: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1e293b",
    fontSize: "24px",
    cursor: "pointer",
    transition: "all 0.2s",
  } as React.CSSProperties,

  navTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
  } as React.CSSProperties,

  content: {
    padding: "15px",
    backgroundColor: "#ffffff",
    minHeight: "calc(100vh - 160px)",
  } as React.CSSProperties,

  section: {
    marginBottom: "25px",
    padding: "0 5px",
  } as React.CSSProperties,

  sectionTitle: {
    margin: "0 0 15px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } as React.CSSProperties,

  fieldContainer: {
    marginBottom: "15px",
  } as React.CSSProperties,

  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
  } as React.CSSProperties,

  editableField: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 15px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #e9ecef",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  } as React.CSSProperties,

  editableFieldHover: {
    backgroundColor: "#f1f5f9",
  } as React.CSSProperties,

  editableValue: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "16px",
    color: "#1e293b",
  } as React.CSSProperties,

  editHint: {
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: "500",
  } as React.CSSProperties,

  currencySymbol: {
    color: "#666",
    fontWeight: "500",
    fontSize: "16px",
  } as React.CSSProperties,

  editControls: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginTop: "5px",
  } as React.CSSProperties,

  editInputContainer: {
    position: "relative",
    flex: 1,
  } as React.CSSProperties,

  currencyPrefix: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#666",
    fontWeight: "500",
    fontSize: "16px",
    zIndex: 1,
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "12px 15px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "16px",
    color: "#1f2937",
    backgroundColor: "#ffffff",
    boxSizing: "border-box" as "border-box",
  } as React.CSSProperties,

  inputWithPrefix: {
    paddingLeft: "35px",
  } as React.CSSProperties,

  buttonGroup: {
    display: "flex",
    gap: "5px",
  } as React.CSSProperties,

  iconButton: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    transition: "all 0.2s",
    minWidth: "40px",
    height: "40px",
  } as React.CSSProperties,

  saveButton: {
    backgroundColor: "#10b981",
    color: "white",
  } as React.CSSProperties,

  cancelButton: {
    backgroundColor: "#ef4444",
    color: "white",
  } as React.CSSProperties,

  toggleContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
  } as React.CSSProperties,

  toggleLabel: {
    flex: 1,
    paddingRight: "15px",
  } as React.CSSProperties,

  toggleTitle: {
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: "4px",
    fontSize: "15px",
  } as React.CSSProperties,

  toggleDescription: {
    fontSize: "0.85rem",
    color: "#64748b",
    lineHeight: "1.4",
  } as React.CSSProperties,

  toggleSwitch: {
    width: "50px",
    height: "26px",
    backgroundColor: "#ccc",
    borderRadius: "13px",
    position: "relative",
    cursor: "pointer",
    transition: "background-color 0.3s",
    flexShrink: 0,
  } as React.CSSProperties,

  toggleSwitchOn: {
    backgroundColor: "#2563eb",
  } as React.CSSProperties,

  toggleKnob: {
    position: "absolute",
    top: "3px",
    left: "3px",
    width: "20px",
    height: "20px",
    backgroundColor: "white",
    borderRadius: "10px",
    transition: "left 0.3s",
  } as React.CSSProperties,

  toggleKnobOn: {
    left: "27px",
  } as React.CSSProperties,

  listSection: {
    marginBottom: "25px",
    padding: "0 5px",
  } as React.CSSProperties,

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  } as React.CSSProperties,

  listTitleContainer: {
    flex: 1,
  } as React.CSSProperties,

  listTitle: {
    margin: "0 0 4px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
  } as React.CSSProperties,

  listCount: {
    fontSize: "0.9rem",
    color: "#64748b",
  } as React.CSSProperties,

  listActions: {
    display: "flex",
    gap: "8px",
  } as React.CSSProperties,

  listButton: {
    padding: "8px 16px",
    backgroundColor: "#e0e7ff",
    border: "1px solid #c7d2fe",
    borderRadius: "6px",
    color: "#4f46e5",
    fontWeight: "500",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s",
    minWidth: "60px",
  } as React.CSSProperties,

  listButtonHover: {
    backgroundColor: "#c7d2fe",
  } as React.CSSProperties,

  expandButton: {
    padding: "8px",
    backgroundColor: "#e0e7ff",
    border: "1px solid #c7d2fe",
    borderRadius: "6px",
    color: "#4f46e5",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    transition: "all 0.2s",
  } as React.CSSProperties,

  listContainer: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden",
    marginTop: "10px",
  } as React.CSSProperties,

  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 15px",
    borderBottom: "1px solid #f3f4f6",
    backgroundColor: "#ffffff",
    transition: "background-color 0.2s",
  } as React.CSSProperties,

  listItemEven: {
    backgroundColor: "#f9fafb",
  } as React.CSSProperties,

  listItemText: {
    fontSize: "16px",
    color: "#1e293b",
    flex: 1,
    paddingRight: "10px",
  } as React.CSSProperties,

  listItemActions: {
    display: "flex",
    gap: "8px",
    flexShrink: 0,
  } as React.CSSProperties,

  iconActionButton: {
    padding: "6px",
    border: "1px solid",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    transition: "all 0.2s",
  } as React.CSSProperties,

  editButton: {
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
    color: "#0369a1",
  } as React.CSSProperties,

  deleteButton: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    color: "#dc2626",
  } as React.CSSProperties,

  emptyList: {
    padding: "20px",
    textAlign: "center",
    color: "#6b7280",
    fontStyle: "italic",
  } as React.CSSProperties,

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    backgroundColor: "#f8fafc",
  } as React.CSSProperties,

  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "15px",
  } as React.CSSProperties,

  loadingText: {
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: "500",
  } as React.CSSProperties,

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
    padding: "20px",
  } as React.CSSProperties,

  dialog: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    maxWidth: "400px",
    width: "100%",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  } as React.CSSProperties,

  dialogTitle: {
    margin: "0 0 16px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
  } as React.CSSProperties,

  dialogText: {
    margin: "0 0 24px 0",
    color: "#6b7280",
    lineHeight: "1.5",
    fontSize: "14px",
  } as React.CSSProperties,

  dialogActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: "20px",
  } as React.CSSProperties,

  dialogButton: {
    padding: "10px 20px",
    borderRadius: "6px",
    fontWeight: "500",
    cursor: "pointer",
    border: "none",
    transition: "all 0.2s",
    fontSize: "14px",
    minWidth: "80px",
  } as React.CSSProperties,

  cancelDialogButton: {
    backgroundColor: "#f3f4f6",
    border: "1px solid #d1d5db",
    color: "#374151",
  } as React.CSSProperties,

  confirmDialogButton: {
    backgroundColor: "#10b981",
    color: "white",
  } as React.CSSProperties,

  deleteDialogButton: {
    backgroundColor: "#dc2626",
    color: "white",
  } as React.CSSProperties,

  disabledButton: {
    backgroundColor: "#9ca3af",
    cursor: "not-allowed",
    opacity: 0.6,
  } as React.CSSProperties,
};