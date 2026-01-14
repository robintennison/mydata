// src/modules/Banking/styles/TableStyles.tsx
import type { CSSProperties } from "react";

export const tableStyles: Record<string, CSSProperties> = {
  // Table container
  tableResponsiveContainer: {
    width: "100%",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    borderRadius: "8px",
    border: "1px solid #e9ecef",
    marginTop: "12px",
    marginBottom: "20px",
    position: "relative",
    maxWidth: "100vw",
    boxSizing: "border-box",
  },

  // Table
  responsiveTable: {
    minWidth: "600px",
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.9rem",
  },

  // Table header
  tableHeader: {
    backgroundColor: "#f8f9fa",
    fontWeight: 600,
    color: "#333",
    textAlign: "left",
    padding: "14px 16px",
    borderBottom: "2px solid #dee2e6",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },

  // Table cell
  tableCell: {
    padding: "12px 16px",
    borderBottom: "1px solid #e9ecef",
    verticalAlign: "middle",
    wordBreak: "break-word",
    maxWidth: "200px",
  },

  // Table row hover
  tableRowHover: {
    backgroundColor: "#f8f9fa",
  },

  // Action button in tables
  tableActionButton: {
    padding: "6px 12px",
    fontSize: "0.85rem",
    margin: "2px",
    minWidth: "70px",
    whiteSpace: "nowrap",
  },

  // Zebra striping
  tableRowEven: {
    backgroundColor: "#fcfcfc",
  },

  // Mobile card view (alternative to tables)
  mobileCardView: {
    display: "none",
  },
  mobileCard: {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
  },
  mobileCardRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  mobileCardLabel: {
    fontWeight: 600,
    color: "#666",
    fontSize: "0.85rem",
    minWidth: "120px",
  },
  mobileCardValue: {
    fontSize: "0.9rem",
    textAlign: "right",
    wordBreak: "break-word",
    flex: 1,
  },

  // Utility classes
  textAlignRight: {
    textAlign: "right",
  },
  textAlignLeft: {
    textAlign: "left",
  },
  textAlignCenter: {
    textAlign: "center",
  },
  fontWeightBold: {
    fontWeight: 600,
  },
  fontWeightNormal: {
    fontWeight: 400,
  },
};

// Global table styles for CSS injection
export const tableGlobalStyles = `
  /* Hide scrollbar but keep functionality */
  .table-responsive-container::-webkit-scrollbar {
    height: 6px;
  }

  .table-responsive-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  .table-responsive-container::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  .table-responsive-container::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  /* Mobile scrollbar */
  @media (max-width: 768px) {
    .table-responsive-container::-webkit-scrollbar {
      height: 4px;
    }
    
    .responsive-table {
      min-width: 700px;
      font-size: 0.85rem;
    }
    
    .table-responsive-container {
      margin-left: -8px;
      margin-right: -8px;
      width: calc(100% + 16px);
      border: none;
      border-radius: 0;
    }
    
    /* Add visual indicator for scrollable tables */
    .table-responsive-container::after {
      content: '→';
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #4285f4;
      font-size: 1.2rem;
      opacity: 0.7;
      pointer-events: none;
      display: none;
    }
    
    .table-responsive-container.scrollable::after {
      display: block;
    }
    
    /* Show mobile card view, hide desktop table */
    .mobile-card-view {
      display: block !important;
    }
    
    .desktop-table-view {
      display: none !important;
    }
  }

  /* Compact mobile view */
  @media (max-width: 480px) {
    .mobile-card {
      padding: 12px;
    }
    
    .mobile-card-row {
      flex-direction: column;
      align-items: flex-start;
      padding: 6px 0;
    }
    
    .mobile-card-label {
      min-width: auto;
      margin-bottom: 2px;
      font-size: 0.8rem;
    }
    
    .mobile-card-value {
      text-align: left;
      font-size: 0.85rem;
      width: 100%;
    }
  }

  /* Table row hover effect */
  .responsive-table tr:hover {
    background-color: #f8f9fa;
  }

  .responsive-table tr:last-child td {
    border-bottom: none;
  }

  /* Zebra striping */
  .responsive-table tbody tr:nth-child(even) {
    background-color: #fcfcfc;
  }
`;

// Helper function to inject table styles
let tableStylesInjected = false;
export const injectTableGlobalStyles = () => {
  if (typeof document !== "undefined" && !tableStylesInjected) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "banking-table-styles";
    styleSheet.textContent = tableGlobalStyles;
    document.head.appendChild(styleSheet);
    tableStylesInjected = true;
  }
};
