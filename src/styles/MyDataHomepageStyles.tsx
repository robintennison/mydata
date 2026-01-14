// src/styles/MyDataHomepageStyles.tsx
import type { CSSProperties } from "react";

export const myDataHomepageStyles: Record<string, CSSProperties> = {
  container: {
    width: "100%",
    maxWidth: "500px",
    margin: "0 auto",
    backgroundColor: "#f5f7fa",
    minHeight: "100vh",
    paddingBottom: "20px",
  },
  header: {
    background: "linear-gradient(135deg, #4285f4 0%, #5c9cff 100%)",
    color: "white",
    padding: "25px 20px 30px 20px",
    borderRadius: "0 0 20px 20px",
    marginBottom: "20px",
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
    fontSize: "1.8rem",
    fontWeight: 700,
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "0.95rem",
    opacity: 0.9,
    margin: 0,
  },
  settingsButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    color: "white",
    cursor: "pointer",
    position: "relative",
    transition: "all 0.2s",
    marginLeft: "15px",
  },
  editBadge: {
    position: "absolute",
    top: "-2px",
    right: "-2px",
    fontSize: "0.7rem",
    backgroundColor: "#34a853",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    padding: "0 15px",
    marginBottom: "25px",
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "18px 15px",
    textAlign: "center",
    boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
    transition: "transform 0.2s",
    cursor: "pointer",
  },
  cardIcon: {
    fontSize: "1.8rem",
    marginBottom: "10px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px auto",
  },
  cardTitle: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#666",
    marginBottom: "8px",
  },
  cardValue: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#333",
    marginBottom: "5px",
  },
  cardSubtitle: {
    fontSize: "0.8rem",
    color: "#888",
    marginBottom: "8px",
  },
  cardDetail: {
    fontSize: "0.75rem",
    color: "#4285f4",
    fontWeight: 500,
  },
  section: {
    backgroundColor: "white",
    borderRadius: "16px",
    margin: "15px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e9ecef",
    marginBottom: "20px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#333",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  sectionIcon: {
    fontSize: "1.3rem",
  },
  viewAllButton: {
    backgroundColor: "transparent",
    color: "#4285f4",
    border: "1px solid #4285f4",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "0.85rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  maturitiesList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  maturityCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    borderLeft: "4px solid #4285f4",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  maturityLeft: {
    flex: 1,
  },
  maturityDate: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#333",
    marginBottom: "4px",
  },
  maturityAccount: {
    fontSize: "0.85rem",
    color: "#666",
  },
  maturityRight: {
    textAlign: "right",
  },
  maturityAmount: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#34a853",
    marginBottom: "4px",
  },
  maturityStatus: {
    fontSize: "0.8rem",
    fontWeight: 500,
  },
  emptyState: {
    textAlign: "center",
    padding: "30px 20px",
    color: "#6c757d",
  },
  emptyIcon: {
    fontSize: "2.5rem",
    marginBottom: "15px",
    opacity: 0.5,
  },
  emptyText: {
    fontSize: "1rem",
    fontWeight: 500,
    marginBottom: "5px",
  },
  emptySubtext: {
    fontSize: "0.85rem",
  },
  placeholderCard: {
    backgroundColor: "#f0f7ff",
    borderRadius: "12px",
    padding: "25px",
    textAlign: "center",
    border: "2px dashed #c2e0ff",
  },
  placeholderIcon: {
    fontSize: "2.5rem",
    marginBottom: "15px",
    opacity: 0.7,
  },
  placeholderTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#4285f4",
    marginBottom: "10px",
  },
  placeholderText: {
    fontSize: "0.9rem",
    color: "#666",
    lineHeight: 1.5,
  },
  navContainer: {
    backgroundColor: "white",
    borderRadius: "16px",
    margin: "15px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e9ecef",
    marginBottom: "20px",
  },
  navTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#333",
    marginBottom: "20px",
    textAlign: "center",
  },
  navGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "15px",
  },
  navItem: {
    textAlign: "center",
    cursor: "pointer",
    padding: "15px",
    borderRadius: "12px",
    backgroundColor: "#f8f9fa",
    transition: "all 0.2s",
    border: "1px solid transparent",
  },
  navIcon: {
    fontSize: "1.8rem",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px auto",
    transition: "all 0.2s",
  },
  navItemName: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#333",
    marginBottom: "5px",
  },
  navItemDesc: {
    fontSize: "0.8rem",
    color: "#666",
    lineHeight: 1.4,
  },
};

// Global styles for this component
export const myDataHomepageGlobalStyles = `
  .card-icon-1 {
    background-color: #e8f0fe;
    color: #4285f4;
  }
  .card-icon-2 {
    background-color: #e6f4ea;
    color: #34a853;
  }
  .card-icon-3 {
    background-color: #fce8e6;
    color: #ea4335;
  }
  
  /* Add hover effects */
  .statCard:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  .navItem:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border-color: #4285f4;
  }
  
  .navItem:hover .navIcon {
    transform: scale(1.1);
  }
  
  .maturityCard:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .settingsButton:hover {
    background-color: rgba(255, 255, 255, 0.3);
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
