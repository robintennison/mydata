// src/styles/AppStyles.tsx
import type { CSSProperties } from "react";

export const appStyles: Record<string, CSSProperties> = {
  // Container styles
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  app: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },

  // Loading styles
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #f3f3f3",
    borderTop: "5px solid #4285f4",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },

  // Header styles (only shown on login page)
  header: {
    backgroundColor: "#4285f4",
    color: "white",
    padding: "1rem 2rem",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  headerContent: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
  },
  logo: {
    margin: 0,
    fontSize: "1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: {
    fontSize: "1.8rem",
  },

  // Main content area
  main: {
    flex: 1,
  },

  // Login page styles
  loginContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
    padding: "20px",
  },
  loginCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
    maxWidth: "500px",
    width: "100%",
  },
  welcome: {
    textAlign: "center",
    marginBottom: "30px",
  },
  features: {
    marginTop: "30px",
    padding: "20px",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
  },
  featureList: {
    listStyleType: "none",
    padding: 0,
    margin: "10px 0 0 0",
  },

  // Footer styles
  footer: {
    backgroundColor: "#333",
    color: "white",
    textAlign: "center",
    padding: "15px",
    fontSize: "0.8rem",
    marginTop: "auto",
  },

  // Utility styles
  flexCenter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  flexColumn: {
    display: "flex",
    flexDirection: "column",
  },
  textCenter: {
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  button: {
    backgroundColor: "#4285f4",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 500,
    transition: "opacity 0.2s",
  },
  buttonSecondary: {
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 500,
    transition: "opacity 0.2s",
  },
  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  label: {
    fontSize: "0.9rem",
    color: "#666",
    marginBottom: "5px",
    display: "block",
  },
};

// Global styles that were in App.css
export const appGlobalStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  button {
    font-family: inherit;
  }

  button:hover {
    opacity: 0.9;
  }

  input, button {
    font-size: 1rem;
  }

  pre {
    font-family: 'Courier New', Courier, monospace;
  }

  /* App-specific global styles */
  .app-link {
    color: #4285f4;
    text-decoration: none;
  }

  .app-link:hover {
    text-decoration: underline;
  }

  .error-message {
    color: #ea4335;
    font-size: 0.9rem;
    margin-top: 5px;
  }

  .success-message {
    color: #34a853;
    font-size: 0.9rem;
    margin-top: 5px;
  }
`;

// Helper function to inject global styles
let appStylesInjected = false;
export const injectAppGlobalStyles = () => {
  if (typeof document !== "undefined" && !appStylesInjected) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "app-global-styles";
    styleSheet.textContent = appGlobalStyles;
    document.head.appendChild(styleSheet);
    appStylesInjected = true;
  }
};
