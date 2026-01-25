import { CSSProperties } from "react";

export const jewelleryStyles = {
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
    maxWidth: "500px",
    margin: "0 auto",
    width: "100%",
  },

  centeredContainer: {
    display: "flex",
    flexDirection: "column" as const,
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  // Top Navigation
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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

  // Table Styles
  tableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  } as CSSProperties,

  tableHeader: {
    display: "flex",
    padding: "8px 10px",
    backgroundColor: "#f9fafb",
    borderBottom: "2px solid #e9ecef",
    fontWeight: "600",
    fontSize: "13px",
    color: "#374151",
  } as CSSProperties,

  tableRow: (index: number, isActive: boolean) => ({
    display: "flex",
    alignItems: "center",
    padding: "10px 10px",
    minHeight: "48px",
    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
    borderBottom: "1px solid #f3f4f6",
    opacity: isActive ? 1 : 0.7,
  }) as CSSProperties,

  tableCell: (flex: number, align: string = "left") => ({
    flex,
    padding: "0 8px",
    textAlign: align as any,
  }),

  // Status Badges
  statusBadge: (status: string) => {
    let backgroundColor, color;
    switch (status) {
      case "Verified":
        backgroundColor = "#f0fdf4";
        color = "#10b981";
        break;
      case "Missing":
        backgroundColor = "#fef2f2";
        color = "#dc2626";
        break;
      default:
        backgroundColor = "#f3f4f6";
        color = "#6b7280";
    }
    return {
      fontSize: "0.75rem",
      fontWeight: "600",
      color,
      backgroundColor,
      padding: "3px 8px",
      borderRadius: "12px",
      display: "inline-block",
      whiteSpace: "nowrap" as const,
    } as CSSProperties;
  },

  // Action Buttons
  actionButton: {
    padding: "6px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "6px",
  } as CSSProperties,

  editButton: {
    color: "#3b82f6",
    backgroundColor: "#eff6ff",
    '&:hover': {
      backgroundColor: "#dbeafe",
    },
  } as CSSProperties,

  deleteButton: {
    color: "#ef4444",
    backgroundColor: "#fef2f2",
    '&:hover': {
      backgroundColor: "#fee2e2",
    },
  } as CSSProperties,

  // Form Styles
  formContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    margin: "15px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  } as CSSProperties,

  formGroup: {
    marginBottom: "20px",
  } as CSSProperties,

  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: "500",
    color: "#374151",
    fontSize: "14px",
  } as CSSProperties,

  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
    '&:focus': {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
  } as CSSProperties,

  select: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
    '&:focus': {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
  } as CSSProperties,

  textarea: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    minHeight: "80px",
    resize: "vertical",
    boxSizing: "border-box",
    '&:focus': {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
  } as CSSProperties,

  // Image Upload
  imageUploadContainer: {
    border: "2px dashed #d1d5db",
    borderRadius: "8px",
    padding: "20px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.3s",
    '&:hover': {
      borderColor: "#3b82f6",
    },
  } as CSSProperties,

  imagePreview: {
    maxWidth: "200px",
    maxHeight: "200px",
    borderRadius: "8px",
    margin: "10px auto",
    display: "block",
  } as CSSProperties,

  // Buttons
  primaryButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    '&:hover': {
      backgroundColor: "#2563eb",
    },
    '&:disabled': {
      backgroundColor: "#93c5fd",
      cursor: "not-allowed",
    },
  } as CSSProperties,

  secondaryButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    color: "#374151",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    marginTop: "10px",
    '&:hover': {
      backgroundColor: "#e5e7eb",
    },
  } as CSSProperties,

  // Empty State
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    textAlign: "center",
    color: "#6c757d",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  } as CSSProperties,

  // Stats Card
  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "16px",
    margin: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  } as CSSProperties,

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "15px",
    marginTop: "15px",
  } as CSSProperties,

  statItem: {
    textAlign: "center",
    padding: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
  } as CSSProperties,

  statLabel: {
    fontSize: "0.85rem",
    color: "#6b7280",
    marginBottom: "4px",
  } as CSSProperties,

  statValue: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1f2937",
  } as CSSProperties,

  // Dialog
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
    padding: "20px",
    zIndex: 1000,
  } as CSSProperties,

  dialog: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    maxWidth: "400px",
    width: "100%",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
  } as CSSProperties,

  dialogTitle: {
    margin: "0 0 15px 0",
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#333",
  } as CSSProperties,

  dialogMessage: {
    margin: "0 0 20px 0",
    color: "#666",
    lineHeight: "1.5",
  } as CSSProperties,

  dialogButtons: {
    display: "flex",
    gap: "10px",
  } as CSSProperties,

  dialogButton: (isCancel: boolean = false) => ({
    flex: 1,
    padding: "12px",
    backgroundColor: isCancel ? "#f8f9fa" : "#ef4444",
    border: isCancel ? "1px solid #e9ecef" : "none",
    borderRadius: "8px",
    color: isCancel ? "#495057" : "#ffffff",
    fontWeight: "500",
    cursor: "pointer",
  }) as CSSProperties,

  // Home Page Cards
  featureCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "16px",
    margin: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    '&:hover': {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
  } as CSSProperties,

  featureIcon: {
    fontSize: "2rem",
    marginBottom: "10px",
  } as CSSProperties,

  featureTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#333",
    marginBottom: "5px",
  } as CSSProperties,

  featureDescription: {
    fontSize: "0.9rem",
    color: "#6c757d",
  } as CSSProperties,
};

// Add CSS animation for spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);