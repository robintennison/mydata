export const colors = {
  // Primary colors
  primary: "#2563eb", // Blue-600
  primaryLight: "#3b82f6", // Blue-500
  primaryDark: "#1d4ed8", // Blue-700
  
  // Secondary colors
  secondary: "#059669", // Emerald-600
  secondaryLight: "#10b981", // Emerald-500
  secondaryDark: "#047857", // Emerald-700
  
  // Status colors
  success: "#10b981", // Emerald-500
  successLight: "#34d399", // Emerald-400
  successDark: "#059669", // Emerald-600
  
  danger: "#ef4444", // Red-500
  dangerLight: "#f87171", // Red-400
  dangerDark: "#dc2626", // Red-600
  
  warning: "#f59e0b", // Amber-500
  warningLight: "#fbbf24", // Amber-400
  warningDark: "#d97706", // Amber-600
  
  info: "#3b82f6", // Blue-500
  infoLight: "#60a5fa", // Blue-400
  infoDark: "#2563eb", // Blue-600
  
  // Neutral colors - Better contrast
  light: "#f8fafc", // Slate-50
  lighter: "#f1f5f9", // Slate-100
  dark: "#1e293b", // Slate-800
  darker: "#0f172a", // Slate-900
  gray: "#64748b", // Slate-500
  grayLight: "#cbd5e1", // Slate-300
  grayDark: "#475569", // Slate-600
  
  // Background colors
  white: "#ffffff",
  black: "#000000",
  background: "#f8fafc", // Slate-50
  surface: "#ffffff",
  card: "#ffffff",
  
  // Text colors - Better contrast
  textPrimary: "#1e293b", // Slate-800 - Dark for good readability
  textSecondary: "#475569", // Slate-600
  textTertiary: "#64748b", // Slate-500
  textDisabled: "#94a3b8", // Slate-400
  textInverse: "#ffffff",
  textOnDark: "#f8fafc", // Slate-50
  
  // Border colors
  border: "#e2e8f0", // Slate-200
  borderLight: "#f1f5f9", // Slate-100
  borderDark: "#cbd5e1", // Slate-300
  
  // Table colors
  tableHeader: "#f1f5f9", // Slate-100
  tableRowEven: "#ffffff",
  tableRowOdd: "#f8fafc", // Slate-50
  tableBorder: "#e2e8f0", // Slate-200
  
  // Form colors
  formBackground: "#ffffff",
  formBorder: "#cbd5e1", // Slate-300
  formFocus: "#3b82f6", // Blue-500
  
  // Chart colors
  chartPrimary: "#3b82f6", // Blue-500
  chartSecondary: "#10b981", // Emerald-500
  chartTertiary: "#f59e0b", // Amber-500
};

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
  xxxl: "64px",
};

export const borderRadius = {
  xs: "4px",
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  xxl: "24px",
  circle: "50%",
};

export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
};