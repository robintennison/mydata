// src/styles/MyDataHomepageStyles.tsx
import type { CSSProperties } from "react";

// Base styles - more compact version
export const myDataHomepageStyles: Record<string, CSSProperties> = {
  container: {
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#f5f7fa",
    minHeight: "calc(100vh - 80px)",
    paddingBottom: "100px",
  },
  header: {
    background: "linear-gradient(135deg, #4285f4 0%, #5c9cff 100%)",
    color: "white",
    padding: "20px 15px 25px 15px",
    borderRadius: "0 0 20px 20px",
    marginBottom: "15px",
    boxShadow: "0 4px 12px rgba(66, 133, 244, 0.3)",
  },
  headerTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    margin: "0 0 6px 0",
  },
  subtitle: {
    fontSize: "0.85rem",
    opacity: 0.9,
    margin: 0,
  },
  settingsButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.2rem",
    color: "white",
    cursor: "pointer",
    position: "relative",
    transition: "all 0.2s",
    marginLeft: "10px",
  },
  editBadge: {
    position: "absolute",
    top: "-2px",
    right: "-2px",
    fontSize: "0.7rem",
    backgroundColor: "#34a853",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    padding: "0 12px",
    marginBottom: "20px",
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "12px 10px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e9ecef",
    transition: "transform 0.2s",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: "80px",
  },
  cardTitle: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#666",
    marginBottom: "6px",
  },
  cardValue: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#333",
    marginBottom: "3px",
  },
  cardSubtitle: {
    fontSize: "0.7rem",
    color: "#888",
  },
  // Dynamic section style - use helper function for marginBottom
  section: {
    backgroundColor: "white",
    borderRadius: "12px",
    margin: "12px",
    padding: "15px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e9ecef",
    marginBottom: "15px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#333",
  },
  viewAllButton: {
    backgroundColor: "transparent",
    color: "#4285f4",
    border: "1px solid #4285f4",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "0.75rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  maturitiesList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  maturityCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
    borderLeft: "3px solid #4285f4",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  maturityLeft: {
    flex: 1,
  },
  maturityDate: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#333",
    marginBottom: "3px",
  },
  maturityAccount: {
    fontSize: "0.75rem",
    color: "#666",
  },
  maturityRight: {
    textAlign: "right",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "3px",
  },
  maturityAmount: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#34a853",
  },
  maturityStatus: {
    fontSize: "0.7rem",
    fontWeight: 500,
  },
  emptyState: {
    textAlign: "center",
    padding: "15px 10px",
    color: "#6c757d",
  },
  emptyText: {
    fontSize: "0.9rem",
    fontWeight: 500,
    marginBottom: "3px",
  },
  emptySubtext: {
    fontSize: "0.75rem",
  },
  placeholderCard: {
    backgroundColor: "#f0f7ff",
    borderRadius: "10px",
    padding: "15px",
    textAlign: "center",
    border: "2px dashed #c2e0ff",
  },
  placeholderTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#4285f4",
    marginBottom: "8px",
  },
  placeholderText: {
    fontSize: "0.8rem",
    color: "#666",
    lineHeight: 1.4,
  },
  // Footer styles (for other pages)
  footer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTop: "1px solid #e9ecef",
    padding: "10px 15px",
    zIndex: 100,
    maxWidth: "500px",
    margin: "0 auto",
    boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
  },
  navGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "5px",
  },
  navItem: {
    textAlign: "center",
    cursor: "pointer",
    padding: "8px 5px",
    borderRadius: "8px",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  navIcon: {
    fontSize: "1.4rem",
    marginBottom: "4px",
    transition: "transform 0.2s",
  },
  navItemName: {
    fontSize: "0.7rem",
    fontWeight: 500,
    color: "#666",
  },
};

// Helper functions for dynamic styles
export const getSectionStyle = (hasMaturities: boolean): CSSProperties => ({
  ...myDataHomepageStyles.section,
  minHeight: hasMaturities ? "auto" : "80px",
});

export const getSectionHeaderStyle = (
  hasMaturities: boolean
): CSSProperties => ({
  ...myDataHomepageStyles.sectionHeader,
  marginBottom: hasMaturities ? "15px" : "0",
});

// Global styles for this component
export const myDataHomepageGlobalStyles = `
  /* Add hover effects */
  .statCard:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  .maturityCard:hover {
    transform: translateX(4px);
    boxShadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .settingsButton:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
  
  /* Footer hover effects */
  .footerNavItem:hover {
    background-color: #f8f9fa;
  }
  
  .footerNavItem:hover .footerNavIcon {
    transform: scale(1.1);
  }
`;

// Helper function to inject global styles
let stylesInjected = false;
export const injectMyDataHomepageStyles = () => {
  if (typeof document !== "undefined" && !stylesInjected) {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = myDataHomepageGlobalStyles;
    document.head.appendChild(styleSheet);
    stylesInjected = true;
  }
};
