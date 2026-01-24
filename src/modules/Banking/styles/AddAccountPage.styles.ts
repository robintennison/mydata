// src/modules/banking/styles/AddAccountPage.styles.ts
export const addAccountPageStyles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    minHeight: "100vh",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    padding: "16px",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "16px",
    transition: "background-color 0.2s",
  },
  headerTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#111827",
    margin: 0,
  },

  // Error
  errorContainer: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    padding: "12px 16px",
    margin: "16px",
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

  // Form
  form: {
    padding: "0 16px 16px",
  },
  formContent: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "16px",
    color: "#111827",
    backgroundColor: "#ffffff",
    outline: "none",
    transition: "border-color 0.2s",
  },
  helperText: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "2px",
  },

  // Amount Input
  amountContainer: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    overflow: "hidden",
  },
  currencySymbol: {
    padding: "10px 12px",
    backgroundColor: "#f9fafb",
    borderRight: "1px solid #d1d5db",
    fontSize: "16px",
    fontWeight: 600,
    color: "#374151",
  },
  amountInput: {
    flex: 1,
    padding: "10px 12px",
    border: "none",
    fontSize: "16px",
    color: "#111827",
    backgroundColor: "#ffffff",
    outline: "none",
  },

  // Checkbox
  checkboxGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  checkboxText: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
  },

  // Buttons
  buttonGroup: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
  },
  cancelButton: {
    flex: 1,
    padding: "12px 16px",
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: 600,
    color: "#374151",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  submitButton: {
    flex: 2,
    padding: "12px 16px",
    backgroundColor: "#10b981",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: 600,
    color: "#ffffff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
  },

  // Info Box
  infoBox: {
    backgroundColor: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "6px",
    padding: "12px 16px",
    marginTop: "16px",
    display: "flex",
    gap: "12px",
  },
  infoIcon: {
    fontSize: "18px",
    color: "#0284c7",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#0369a1",
    marginBottom: "4px",
  },
  infoText: {
    fontSize: "13px",
    color: "#0c4a6e",
  },
  settingsLink: {
    background: "none",
    border: "none",
    color: "#0284c7",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: "13px",
    padding: 0,
    display: "inline",
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
};