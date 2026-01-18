// BankingStyles.tsx - Shared styles for all banking pages
import type { CSSProperties } from "react";

export const bankingStyles: Record<string, CSSProperties> = {
  // Container styles
  container: {
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    minHeight: "100vh",
    padding: "0",
    boxSizing: "border-box",
    overflowX: "hidden",
  },

  // Header styles
  header: {
    background: "#4285f4",
    color: "#ffffff",
    padding: "20px 15px",
    textAlign: "center",
    boxShadow: "0 2px 10px rgba(66, 133, 244, 0.3)",
  },

  headerTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
    margin: "0 0 10px 0",
  },

  headerSubtitle: {
    fontSize: "0.9rem",
    opacity: 0.9,
  },

  // Top navigation bar
  topNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px",
    backgroundColor: "#f8f9fa",
    borderBottom: "1px solid #e9ecef",
  },

  navButton: {
    background: "transparent",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    color: "#4285f4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "40px",
    minHeight: "40px",
  },

  navTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#333333",
    textAlign: "center",
    flex: 1,
  },

  // Card styles
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    margin: "15px 0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
  },

  cardTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#495057",
    margin: "0 0 15px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  // Stats card
  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    margin: "15px 0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
    textAlign: "center",
  },

  statsValue: {
    fontSize: "1.8rem",
    fontWeight: 700,
    color: "#4285f4",
    margin: "10px 0",
  },

  statsLabel: {
    fontSize: "0.9rem",
    color: "#6c757d",
    marginBottom: "5px",
  },

  // Item card (for lists)
  itemCard: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    padding: "15px",
    margin: "10px 15px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    border: "1px solid #e9ecef",
  },

  // Navigation icons grid - FIXED: Changed to flexible layout
  navGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", // Flexible columns
    gap: "15px",
    padding: "20px 15px",
  },

  navIcon: {
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    cursor: "pointer",
    border: "2px solid transparent",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    minHeight: "120px",
  },

  navIconText: {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#495057",
  },

  // Action buttons
  actionButton: {
    backgroundColor: "#4285f4",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    fontSize: "0.95rem",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    marginTop: "15px",
  },

  // Edit/Delete buttons
  editButton: {
    backgroundColor: "#34a853",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "0.85rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },

  deleteButton: {
    backgroundColor: "#ea4335",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "0.85rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },

  // Footer/Total section
  totalSection: {
    backgroundColor: "#f8f9fa",
    padding: "15px",
    margin: "20px 15px",
    borderRadius: "10px",
    border: "1px solid #e9ecef",
  },

  totalLabel: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#495057",
  },

  totalValue: {
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "#4285f4",
  },

  // Loading spinner
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },

  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #4285f4",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  // Input fields
  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "1rem",
    boxSizing: "border-box",
  },

  // Form labels
  label: {
    fontSize: "0.9rem",
    color: "#666",
    marginBottom: "5px",
    display: "block",
  },

  // Flex utilities
  flexRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  flexColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  // Status colors
  positiveText: {
    color: "#34a853",
  },

  negativeText: {
    color: "#ea4335",
  },

  // Empty state
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#6c757d",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
    margin: "20px 15px",
  },
};

// Alternative: Add spinner animation using CSS-in-JS approach
export const globalStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Helper function to inject global styles (call this once in your app)
export const injectGlobalStyles = () => {
  if (
    typeof document !== "undefined" &&
    !document.getElementById("banking-global-styles")
  ) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "banking-global-styles";
    styleSheet.textContent = globalStyles;
    document.head.appendChild(styleSheet);
  }
};
