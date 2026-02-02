// src/utils/tailwindMapping.ts
export const tw = {
  // ===== LAYOUT & CONTAINERS =====
  container: "w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden",
  appContainer: "bg-gray-50 flex flex-col flex-1",
  app: "bg-white max-w-2xl mx-auto w-full flex flex-col flex-1 min-h-0",
  main: "flex-1 max-w-2xl w-full mx-auto p-4 pb-0 flex flex-col min-h-0",
  pageContainer: "flex flex-col min-h-screen bg-gray-50",

  // Add the missing properties:
  contentWrapper: "flex-1 flex flex-col w-full overflow-hidden min-h-0",
  scrollableArea: "flex-1 overflow-y-auto min-h-0 p-2 px-1",
  
  // ===== HEADER & NAVIGATION =====
  header: "bg-white text-gray-900 p-4 border-b border-gray-200 mb-4 shadow-sm sticky top-0 z-50 h-14",
  headerTopRow: "flex justify-between items-center",
  headerLeft: "flex-1",
  headerContent: "flex justify-between items-center max-w-2xl mx-auto w-full px-4 h-full gap-2",
  headerActions: "flex items-center gap-2",
  
  // Navigation
  topNav: "flex items-center justify-between p-2.5 px-4 bg-white border-b border-gray-200 mb-2.5 shrink-0",
  moduleNav: "flex gap-3 flex-1 justify-center min-w-0",
  navButton: "px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-base cursor-pointer min-w-10 flex items-center justify-center text-gray-800",
  moduleButton: "bg-transparent border-none text-gray-700 cursor-pointer p-2 rounded-lg flex flex-col items-center justify-center min-w-12 min-h-12 opacity-80 hover:bg-gray-100 hover:opacity-100 hover:-translate-y-0.5 transition-all",
  activeModule: "bg-blue-50 text-blue-600 opacity-100 shadow-sm",
  moduleIcon: "text-xl leading-none",
  moduleLabel: "hidden",
  
  // ===== TYPOGRAPHY =====
  title: "text-xl font-extrabold mb-1 text-gray-900 tracking-tight",
  subtitle: "text-sm text-gray-600 m-0 font-medium",
  sectionTitle: "text-sm font-semibold text-gray-800",
  cardTitle: "text-xs font-semibold text-gray-600 mb-1",
  cardValue: "text-base font-bold text-gray-800 mb-0.5",
  cardSubtitle: "text-xs text-gray-600",
  
  // ===== STATS & CARDS =====
  statsRow: "grid grid-cols-3 gap-2 p-0 mb-4",
  statCard: "bg-white rounded-xl p-2.5 text-center shadow-sm border border-gray-200 transition-all duration-200 cursor-pointer flex flex-col justify-center min-h-[70px] hover:shadow-md hover:-translate-y-0.5",
  
  // ===== SECTIONS =====
  section: "bg-white rounded-xl my-2.5 p-3 shadow-sm border border-gray-200 shrink-0",
  sectionHeader: "flex justify-between items-center mb-2",
  maturityCount: "text-xs text-gray-600 ml-1 font-normal",
  
  // ===== BUTTONS =====
  addButton: "bg-white border border-gray-200 text-lg cursor-pointer p-2 rounded-lg transition-all duration-200 text-indigo-600 shadow-sm hover:bg-indigo-50 hover:shadow flex items-center justify-center w-11 h-11",
  viewAllButton: "bg-transparent text-blue-500 border border-blue-500 rounded-lg py-1 px-2 text-xs font-medium cursor-pointer",
  settingsButton: "bg-transparent border-none text-lg cursor-pointer p-2 rounded-lg transition-all duration-200 text-gray-700 flex items-center justify-center w-11 h-11 hover:bg-gray-100 hover:shadow",
  logoutButton: "bg-transparent border-none text-lg cursor-pointer p-2 rounded-lg transition-all duration-200 text-red-600 flex items-center justify-center w-11 h-11 hover:bg-red-50 hover:shadow",
  homeButton: "bg-none border-none text-blue-600 text-lg font-bold cursor-pointer p-1.5 rounded-lg flex items-center justify-center transition-all hover:bg-blue-50 hover:text-blue-700 hover:underline decoration-2 underline-offset-2",
  
  // Form Buttons
  editButton: "px-3 py-1.5 bg-green-500 text-white border-none rounded cursor-pointer text-xs font-medium",
  deleteButton: "px-3 py-1.5 bg-red-500 text-white border-none rounded cursor-pointer text-xs font-medium",
  cancelButton: "px-8 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium",
  submitButton: "px-8 py-3 bg-gradient-to-br from-blue-500 to-purple-600 text-white border-none rounded-lg cursor-pointer text-sm font-medium",
  
  // ===== TABLES & ROWS =====
  compactTable: "flex flex-col gap-0.5",
  compactRow: "flex items-center gap-2 p-1 bg-white text-xs flex-nowrap overflow-hidden min-h-7 border-b border-gray-100 last:border-b-0",
  compactCell: "flex items-center overflow-hidden text-center",
  compactCellValue: "text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis text-xs text-center",
  
  // Cell flex ratios (for equal spacing)
  cellFlex1: "flex-1 min-w-0",
  cellFlex2: "flex-2 min-w-0",
  
  // Status Rows
  immediateRow: "bg-orange-50 border-l-2 border-orange-300",
  warningRow: "bg-yellow-50 border-l-4 border-yellow-500",
  expiredRow: "bg-red-50 border-l-4 border-red-500",
  
  immediateBadge: "bg-red-600 text-white text-xs px-1 py-0.5 rounded ml-1 whitespace-nowrap",
  
  // ===== FORMS =====
  form: "max-w-lg mx-auto w-full",
  formGroup: "mb-5",
  formRow: "flex gap-5 mb-5",
  label: "block mb-1.5 text-sm font-medium text-gray-700",
  input: "w-full p-2.5 px-3 border border-gray-300 rounded text-sm bg-white box-border",
  select: "w-full p-2.5 px-3 border border-gray-300 rounded text-sm bg-white box-border",
  textarea: "w-full p-3 border border-gray-300 rounded text-sm font-sans leading-normal text-gray-900 bg-white resize-y min-h-[150px] max-h-[400px] overflow-y-auto box-border",
  
  // ===== STATUS BADGES =====
  expiredBadge: "px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold inline-block",
  warningBadge: "px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold inline-block",
  normalBadge: "px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold inline-block",
  
  // ===== EMPTY STATES =====
  emptyState: "text-center p-3 px-2 text-gray-600",
  emptyIcon: "text-4xl mb-3 opacity-50",
  emptyText: "text-sm font-medium text-gray-600 mb-0.5",
  emptySubtext: "text-xs text-gray-500",
  
  // ===== LOADING STATES =====
  loading: "flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-gray-700 m-0 p-0",
  loadingContainer: "flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-600 to-blue-800 text-white text-center p-8",
  spinner: "w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin",
  largeSpinner: "w-15 h-15 border-5 border-white/20 border-t-white rounded-full animate-spin",
  
  // ===== ERROR STATES =====
  errorContainer: "flex flex-col items-center justify-center h-screen bg-gradient-to-br from-red-500 to-red-700 text-white text-center p-8",
  errorIcon: "text-5xl mb-6",
  retryButton: "bg-white text-red-600 border-none py-2 px-6 rounded-lg font-semibold cursor-pointer transition-all text-sm hover:-translate-y-0.5 hover:shadow active:translate-y-0",
};

// Helper for responsive classes
export const responsive = {
  // For your responsive breakpoints
  desktopOnly: "lg:block hidden",
  mobileOnly: "lg:hidden block",
  tabletUp: "md:block hidden",
};

// Helper for conditional classes with responsive support
export const cls = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(' ');