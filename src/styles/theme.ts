export const colors = {
  // Primary colors
  primary: "#4285f4",
  primaryLight: "#5c9aff",
  primaryDark: "#357abd",
  
  // Secondary colors
  secondary: "#34a853",
  secondaryLight: "#4bc06c",
  secondaryDark: "#2c8e46",
  
  // Status colors
  success: "#28a745",
  successLight: "#34ce57",
  successDark: "#218838",
  
  danger: "#ea4335",
  dangerLight: "#ff6b5c",
  dangerDark: "#d32f2f",
  
  warning: "#fbbc05",
  warningLight: "#ffd04d",
  warningDark: "#e6a800",
  
  info: "#4285f4",
  infoLight: "#5c9aff",
  infoDark: "#357abd",
  
  // Neutral colors
  light: "#f8f9fa",
  dark: "#212529",
  gray: "#6c757d",
  grayLight: "#e9ecef",
  grayDark: "#495057",
  
  // Background colors
  white: "#ffffff",
  black: "#000000",
  background: "#f5f5f5",
  surface: "#ffffff",
  
  // Text colors
  textPrimary: "#212529",
  textSecondary: "#6c757d",
  textDisabled: "#adb5bd",
  textInverse: "#ffffff",
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
  xs: "2px",
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  xxl: "24px",
  circle: "50%",
};

export const shadows = {
  sm: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
  md: "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)",
  lg: "0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)",
  xl: "0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)",
  inner: "inset 0 2px 4px rgba(0,0,0,0.06)",
};

export const typography = {
  fontFamily: {
    primary: "'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    mono: "'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace",
  },
  fontSize: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    base: "1rem",     // 16px
    lg: "1.125rem",   // 18px
    xl: "1.25rem",    // 20px
    xxl: "1.5rem",    // 24px
    xxxl: "2rem",     // 32px
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

export const breakpoints = {
  xs: "0px",
  sm: "600px",
  md: "960px",
  lg: "1280px",
  xl: "1920px",
};

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

export const transitions = {
  fast: "150ms ease",
  normal: "250ms ease",
  slow: "350ms ease",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  breakpoints,
  zIndex,
  transitions,
};