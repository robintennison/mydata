// src/styles/globals.ts
// This combines App.css and index.css content
export const globalStyles = `
  /* Reset and base styles */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* Animation */
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Body styles */
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 1.6;
  }

  /* Form elements */
  button {
    font-family: inherit;
    cursor: pointer;
  }

  button:hover {
    opacity: 0.9;
  }

  input, button, textarea, select {
    font-size: 1rem;
    font-family: inherit;
  }

  /* Code blocks */
  pre, code {
    font-family: 'Courier New', Courier, monospace;
  }

  /* Links */
  a {
    color: #4285f4;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  /* Utility classes */
  .text-center {
    text-align: center;
  }

  .text-error {
    color: #ea4335;
  }

  .text-success {
    color: #34a853;
  }

  .hidden {
    display: none !important;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

// Single injection function for all global styles
let globalStylesInjected = false;
export const injectGlobalStyles = () => {
  if (typeof document !== "undefined" && !globalStylesInjected) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "global-styles";
    styleSheet.textContent = globalStyles;
    document.head.appendChild(styleSheet);
    globalStylesInjected = true;
  }
};