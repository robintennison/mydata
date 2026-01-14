// src/modules/Banking/styles/banking-global.ts
export const bankingGlobalStyles = `
  /* Banking-specific global styles */
  .banking-text-primary {
    color: #4285f4;
  }
  
  .banking-text-success {
    color: #34a853;
  }
  
  .banking-text-danger {
    color: #ea4335;
  }
  
  .banking-text-warning {
    color: #fbbc04;
  }
  
  .banking-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .banking-badge-success {
    background-color: #e6f4ea;
    color: #34a853;
  }
  
  .banking-badge-danger {
    background-color: #fce8e6;
    color: #ea4335;
  }
  
  .banking-badge-warning {
    background-color: #fff8e1;
    color: #fbbc04;
  }
  
  .banking-badge-info {
    background-color: #e8f0fe;
    color: #4285f4;
  }
`;

let bankingGlobalStylesInjected = false;
export const injectBankingGlobalStyles = () => {
  if (typeof document !== "undefined" && !bankingGlobalStylesInjected) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "banking-global-styles";
    styleSheet.textContent = bankingGlobalStyles;
    document.head.appendChild(styleSheet);
    bankingGlobalStylesInjected = true;
  }
};