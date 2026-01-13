import type { CSSProperties } from "react";

export const styles: { [key: string]: CSSProperties } = {
  // Main container - responsive
  container: {
    backgroundColor: "white",
    padding: "12px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    overflowX: "hidden",
    margin: "0 auto",
  },

  // Loading state
  loading: {
    textAlign: "center",
    padding: "30px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "250px",
  },

  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #4285f4",
    borderRadius: "50%",
    margin: "0 auto 16px",
  },

  // Header section
  header: {
    marginBottom: "20px",
    padding: "16px 12px",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
    border: "1px solid #e9ecef",
    textAlign: "center",
  },

  title: {
    color: "#212529",
    margin: "0 0 8px 0",
    fontSize: "1.5rem",
    lineHeight: "1.2",
    fontWeight: "600",
  },

  subtitle: {
    color: "#6c757d",
    margin: 0,
    fontSize: "0.85rem",
    lineHeight: "1.4",
  },

  // Tabs - horizontal scroll on mobile
  tabs: {
    display: "flex",
    overflowX: "auto",
    gap: "8px",
    marginBottom: "20px",
    padding: "8px 0 16px 0",
    WebkitOverflowScrolling: "touch",
    msOverflowStyle: "none",
    scrollbarWidth: "none",
  },

  // Content area
  content: {
    minHeight: "350px",
    width: "100%",
    overflowX: "auto",
    padding: "4px 0",
    boxSizing: "border-box",
  },
};

// Separate responsive tab styles
export const tabStyle = {
  default: {
    padding: "12px 16px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: "all 0.2s",
    flexShrink: 0,
    minWidth: "120px",
    whiteSpace: "nowrap",
    textAlign: "center",
    fontWeight: "600",
  },
  active: {
    backgroundColor: "#4285f4",
    color: "white",
    boxShadow: "0 2px 8px rgba(66, 133, 244, 0.3)",
  },
  inactive: {
    backgroundColor: "#f8f9fa",
    color: "#333",
    border: "1px solid #e9ecef",
  },
};

// Breakpoints
export const breakpoints = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
};

// Type for responsive style objects
type ResponsiveStyle = CSSProperties & {
  [key: string]: any;
};

// Responsive style utility
export const responsiveStyles: { [key: string]: ResponsiveStyle } = {
  containerPadding: {
    padding: "12px",
    "@media (min-width: 768px)": {
      padding: "20px",
    },
    "@media (min-width: 1024px)": {
      padding: "25px",
    },
  },

  titleSize: {
    fontSize: "1.5rem",
    "@media (min-width: 768px)": {
      fontSize: "1.7rem",
    },
    "@media (min-width: 1024px)": {
      fontSize: "1.8rem",
    },
  },

  tabSize: {
    minWidth: "120px",
    padding: "10px 14px",
    fontSize: "0.85rem",
    "@media (min-width: 768px)": {
      minWidth: "140px",
      padding: "12px 18px",
      fontSize: "0.9rem",
    },
    "@media (min-width: 1024px)": {
      minWidth: "160px",
      padding: "12px 20px",
      fontSize: "0.95rem",
    },
  },
};

// Child component base styles
export const childComponentStyles: { [key: string]: ResponsiveStyle } = {
  container: {
    width: "100%",
    overflowX: "auto",
    padding: "8px 0",
  },
  
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
    "@media (min-width: 768px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
    "@media (min-width: 1024px)": {
      gridTemplateColumns: "repeat(3, 1fr)",
    },
  },
  
  card: {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
    "@media (min-width: 768px)": {
      padding: "20px",
    },
  },
  
  tableContainer: {
    width: "100%",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    borderRadius: "8px",
    border: "1px solid #e9ecef",
    marginTop: "12px",
  },
  
  table: {
    minWidth: "600px",
    width: "100%",
    borderCollapse: "collapse",
  },
};

// For inline styles that need scrollbar hiding
export const hideScrollbarStyle: React.CSSProperties = {
  msOverflowStyle: "none",
  scrollbarWidth: "none",
};

// Alternative: CSS classes for scrollbar hiding (use with className)
export const scrollbarClasses = {
  hide: "hide-scrollbar",
};