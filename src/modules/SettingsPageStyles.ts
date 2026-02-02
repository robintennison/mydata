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
    padding: "0",
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


// New Tailwind styles
export const settingsTw = {
  // Layout
  container: "min-h-screen bg-slate-50 max-w-2xl mx-auto shadow-lg",
  content: "p-0 bg-white min-h-[calc(100vh-160px)]",
  
  // Navigation
  topNav: "flex items-center justify-between p-3 px-5 bg-white border-b border-slate-200",
  navButton: "w-10 h-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-900 text-2xl cursor-pointer transition-all hover:bg-slate-50",
  navTitle: "text-lg font-semibold text-slate-900",
  navHomeButton: "text-2xl border-none bg-transparent hover:bg-transparent",
  
  // Sections
  section: "mb-6 px-1.5",
  sectionTitle: "m-0 mb-4 text-lg font-semibold text-slate-900 flex items-center justify-between",
  
  // Toggle Fields - Preserving the working toggle structure
  toggleContainer: "flex justify-between items-center py-3 border-b border-slate-50",
  toggleLabel: "flex-1 pr-4",
  toggleTitle: "font-medium text-slate-900 mb-1 text-sm",
  toggleDescription: "text-xs text-slate-500 leading-snug",
  toggleSwitch: "w-12 h-7 bg-slate-300 rounded-full relative cursor-pointer transition-colors flex-shrink-0",
  toggleSwitchOn: "bg-blue-600",
  toggleKnob: "absolute top-1.5 left-1.5 w-4 h-4 bg-white rounded-full transition-all",
  toggleKnobOn: "left-6.5",
  
  // Editable Fields
  editableValue: "text-sm font-semibold text-slate-700 flex items-center gap-1",
  editButton: "bg-transparent border-none text-base cursor-pointer text-slate-500 p-0.5 hover:text-slate-700",
  
  // Edit Input
  editInputContainer: "flex items-center gap-2",
  editInput: "w-20 p-2 text-sm border border-slate-300 rounded text-right",
  iconButton: "p-1.5 border-none rounded cursor-pointer text-sm flex items-center justify-center min-w-8 h-8 transition-all",
  saveButton: "bg-emerald-500 text-white hover:bg-emerald-600",
  cancelButton: "bg-red-500 text-white hover:bg-red-600",
  
  // List Sections
  listSection: "mb-6 px-1.5",
  listHeader: "flex justify-between items-center mb-4",
  listTitleContainer: "flex-1",
  listTitle: "m-0 mb-1 text-lg font-semibold text-slate-900",
  listCount: "text-xs text-slate-500",
  listActions: "flex gap-2",
  listButton: "px-4 py-2 bg-indigo-100 border border-indigo-200 rounded text-indigo-600 font-medium cursor-pointer text-sm transition-all hover:bg-indigo-200 min-w-15",
  expandButton: "p-2 bg-indigo-100 border border-indigo-200 rounded text-indigo-600 cursor-pointer text-sm flex items-center justify-center w-10 h-10 transition-all hover:bg-indigo-200",
  expandButtonActive: "bg-indigo-200",
  
  // List Items
  listContainer: "border border-slate-200 rounded overflow-hidden mt-2.5",
  listItem: "flex justify-between items-center p-3 border-b border-slate-100 bg-white transition-colors",
  listItemEven: "bg-slate-50",
  listItemText: "text-sm text-slate-900 flex-1 pr-2.5",
  listItemActions: "flex gap-2 flex-shrink-0",
  
  // Icon Action Buttons
  iconActionButton: "p-1.5 border rounded cursor-pointer text-sm flex items-center justify-center w-8 h-8 transition-all",
  editActionButton: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
  deleteActionButton: "bg-red-50 border-red-200 text-red-600 hover:bg-red-100",
  
  // Empty States
  emptyList: "p-5 text-center text-slate-500 italic",
  
  // Loading
  loadingContainer: "flex flex-col items-center justify-center min-h-[60vh] bg-slate-50",
  loadingSpinner: "w-10 h-10 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4",
  loadingText: "text-slate-500 text-sm font-medium",
  
  // Dialogs
  dialogOverlay: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5",
  dialog: "bg-white rounded-xl p-6 max-w-sm w-full shadow-xl",
  dialogTitle: "m-0 mb-4 text-lg font-semibold text-slate-900",
  dialogInput: "w-full p-3 border border-slate-300 rounded text-sm text-slate-900 bg-white mb-4",
  dialogActions: "flex gap-3 justify-end",
  dialogButton: "px-5 py-2.5 rounded font-medium cursor-pointer text-sm transition-all min-w-20",
  cancelDialogButton: "bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200",
  confirmDialogButton: "bg-emerald-500 text-white hover:bg-emerald-600",
  disabledButton: "bg-slate-400 cursor-not-allowed opacity-60",
  
  // EMW Date Display
  emwDateContainer: "flex items-center gap-2",
  emwDateValue: "text-sm font-semibold text-slate-700 text-right",
  emwDateSubtext: "text-xs text-slate-500 font-normal",
};

// Helper function for conditional classes
export const cls = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(' ');