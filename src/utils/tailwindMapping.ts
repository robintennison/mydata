// src/utils/tailwindMapping.ts
export const tw = {
  // ===== LAYOUT & CONTAINERS =====
  container: "w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden",
  appContainer: "bg-gray-50 flex flex-col flex-1",
  app: "bg-white max-w-2xl mx-auto w-full flex flex-col flex-1 min-h-0",
  main: "flex-1 max-w-2xl w-full mx-auto p-4 pb-0 flex flex-col min-h-0",
  pageContainer: "flex flex-col min-h-screen bg-gray-50",
  contentWrapper: "flex-1 flex flex-col w-full overflow-hidden min-h-0",
  scrollableArea: "flex-1 overflow-y-auto min-h-0 p-2 px-1",
  
  // Banking specific containers
  bankingContainer: "w-full max-w-2xl mx-auto min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 pb-20 px-2",
  bankingCenteredContainer: "min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 max-w-2xl mx-auto w-full",

  // ===== HEADER & NAVIGATION =====
  header: "bg-white text-gray-900 p-4 border-b border-gray-200 mb-4 shadow-sm sticky top-0 z-50 h-14",
  headerTopRow: "flex justify-between items-center",
  headerLeft: "flex-1",
  headerContent: "flex justify-between items-center max-w-2xl mx-auto w-full px-4 h-full gap-2",
  headerActions: "flex items-center gap-2",
  
  // Banking Headers
  bankingHeader: "bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5 text-center shadow-lg",
  bankingHeaderTitle: "text-2xl font-bold mb-2",
  bankingHeaderSubtitle: "text-sm opacity-90",
  
  // Navigation
  topNav: "flex items-center justify-between p-2.5 px-4 bg-white border-b border-gray-200 mb-2.5 shrink-0",
  moduleNav: "flex gap-3 flex-1 justify-center min-w-0",
  navButton: "px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-base cursor-pointer min-w-10 flex items-center justify-center text-gray-800",
  moduleButton: "bg-transparent border-none text-gray-700 cursor-pointer p-2 rounded-lg flex flex-col items-center justify-center min-w-12 min-h-12 opacity-80 hover:bg-gray-100 hover:opacity-100 hover:-translate-y-0.5 transition-all",
  activeModule: "bg-blue-50 text-blue-600 opacity-100 shadow-sm",
  moduleIcon: "text-xl leading-none",
  moduleLabel: "hidden",
  
  // Banking Navigation
  bankingTopNav: "flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200",
  bankingNavTitle: "text-lg font-semibold text-gray-800 flex-1 text-center",
  bankingNavButton: "bg-transparent border-none text-xl cursor-pointer p-2 rounded-lg text-blue-500 flex items-center justify-center min-w-10 min-h-10 hover:bg-blue-50 transition-colors",

  // ===== TYPOGRAPHY =====
  title: "text-xl font-extrabold mb-1 text-gray-900 tracking-tight",
  subtitle: "text-sm text-gray-600 m-0 font-medium",
  sectionTitle: "text-sm font-semibold text-gray-800",
  cardTitle: "text-xs font-semibold text-gray-600 mb-1",
  cardValue: "text-base font-bold text-gray-800 mb-0.5",
  cardSubtitle: "text-xs text-gray-600",
  
  // Banking Typography
  bankingTitle: "text-2xl font-bold text-gray-900 mb-1",
  bankingSubtitle: "text-sm text-gray-600 mb-4",
  bankingCardTitle: "text-base font-semibold text-gray-800 mb-3 flex items-center gap-2",
  bankingSectionTitle: "text-lg font-bold text-gray-900 mb-4",

  // ===== CARDS & STATS =====
  // General Cards
  card: "bg-white rounded-xl p-4 shadow-sm border border-gray-200",
  section: "bg-white rounded-xl my-2.5 p-3 shadow-sm border border-gray-200 shrink-0",
  sectionHeader: "flex justify-between items-center mb-2", // Added back
  maturityCount: "text-xs text-gray-600 ml-1 font-normal", // Added back
  
  // Stats Cards
  statsRow: "grid grid-cols-3 gap-2 p-0 mb-4",
  statCard: "bg-white rounded-xl p-2.5 text-center shadow-sm border border-gray-200 transition-all duration-200 cursor-pointer flex flex-col justify-center min-h-[70px] hover:shadow-md hover:-translate-y-0.5",
  
  // Banking Cards
  bankingCard: "bg-white rounded-2xl p-5 shadow-lg border border-gray-100 mb-4",
  bankingStatsCard: "bg-white rounded-2xl p-5 text-center shadow-md border border-gray-100",
  bankingItemCard: "bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3",
  
  // Banking Specific Card Styles
  totalBalanceCard: "bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl p-5 shadow-lg mb-4",
  emwCard: "bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-100 relative overflow-hidden",
  
  // Card Content
  statsValue: "text-3xl font-bold text-blue-600 my-2",
  statsLabel: "text-sm text-gray-500 uppercase tracking-wide",
  totalBalanceValue: "text-3xl font-bold text-white my-2",
  totalBalanceLabel: "text-sm text-blue-100 uppercase tracking-wide",

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
  
  // Banking Buttons
  bankingActionButton: "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-xl py-3 px-6 font-medium cursor-pointer text-sm flex items-center justify-center gap-2 w-full hover:shadow-lg hover:-translate-y-0.5 transition-all",
  bankingEditButton: "bg-green-500 text-white border-none rounded-lg py-2 px-4 text-sm font-medium cursor-pointer flex items-center gap-2 hover:bg-green-600",
  bankingDeleteButton: "bg-red-500 text-white border-none rounded-lg py-2 px-4 text-sm font-medium cursor-pointer flex items-center gap-2 hover:bg-red-600",

  // ===== TABLES & LISTS =====
  compactTable: "flex flex-col gap-0.5",
  compactRow: "flex items-center gap-2 p-1 bg-white text-xs flex-nowrap overflow-hidden min-h-7 border-b border-gray-100 last:border-b-0",
  compactCell: "flex items-center overflow-hidden text-center",
  compactCellValue: "text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis text-xs text-center",
  
  // Cell flex ratios
  cellFlex1: "flex-1 min-w-0",
  cellFlex2: "flex-2 min-w-0",
  
  // Status Rows
  immediateRow: "bg-orange-50 border-l-2 border-orange-300",
  warningRow: "bg-yellow-50 border-l-4 border-yellow-500",
  expiredRow: "bg-red-50 border-l-4 border-red-500",
  
  // Banking Lists
  historyItem: "flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0",
  historyMonth: "font-medium text-gray-900",
  historyBalance: "font-semibold text-gray-900",
  historyDetails: "text-xs text-gray-500 flex gap-2 mt-1",

  // ===== FORMS =====
  form: "max-w-lg mx-auto w-full",
  formGroup: "mb-5",
  formRow: "flex gap-5 mb-5",
  label: "block mb-1.5 text-sm font-medium text-gray-700",
  input: "w-full p-2.5 px-3 border border-gray-300 rounded text-sm bg-white box-border",
  select: "w-full p-2.5 px-3 border border-gray-300 rounded text-sm bg-white box-border",
  textarea: "w-full p-3 border border-gray-300 rounded text-sm font-sans leading-normal text-gray-900 bg-white resize-y min-h-[150px] max-h-[400px] overflow-y-auto box-border",
  
  // Banking Forms
  bankingInput: "w-full p-3 border border-gray-300 rounded-xl text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition",
  bankingLabel: "block mb-2 text-sm font-medium text-gray-700",

  // ===== STATUS & BADGES =====
  expiredBadge: "px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold inline-block",
  warningBadge: "px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold inline-block",
  normalBadge: "px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold inline-block",
  immediateBadge: "bg-red-600 text-white text-xs px-1 py-0.5 rounded ml-1 whitespace-nowrap",
  
  // Banking Badges
  bankingBadge: "inline-block px-3 py-1 rounded-full text-xs font-semibold",
  bankingBadgeSuccess: "bg-green-100 text-green-800",
  bankingBadgeDanger: "bg-red-100 text-red-800",
  bankingBadgeWarning: "bg-yellow-100 text-yellow-800",
  bankingBadgeInfo: "bg-blue-100 text-blue-800",
  
  // Account Status
  accountStatusActive: "bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium",
  accountStatusInactive: "bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium",
  
  // ===== NAVIGATION ICONS =====
  navGrid: "grid grid-cols-2 gap-3 p-4",
  navIcon: "bg-white rounded-2xl p-5 text-center cursor-pointer border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center justify-center min-h-[100px]",
  navIconText: "text-sm font-semibold text-gray-800 mt-2",
  
  // ===== EMW SPECIFIC STYLES =====
  emwGrid: "grid grid-cols-2 gap-3 mb-4",
  emwBox: "bg-white rounded-xl p-4 border border-gray-100 text-center",
  emwBoxLabel: "text-xs text-gray-500 mb-2",
  emwBoxValue: "text-xl font-bold text-gray-900",
  emwBoxSubtext: "text-xs text-gray-400 mt-1",
  
  emwBadge: "bg-blue-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold",
  interestBadge: "text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium",
  
  lastMonthBox: "bg-white rounded-xl p-4 border border-gray-100 flex justify-between items-center mb-3",
  lastMonthLabel: "text-xs text-gray-500",
  lastMonthValue: "text-sm font-semibold text-gray-900",
  
  infoBox: "text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500",
  infoBoxTitle: "flex items-center gap-2 mb-1 font-medium",
  
  // ===== FINANCIAL INDICATORS =====
  positiveText: "text-green-600",
  negativeText: "text-red-600",
  
  trendBadge: "px-2 py-1 rounded-full text-xs font-medium",
  trendUp: "bg-green-100 text-green-800",
  trendDown: "bg-red-100 text-red-800",
  
  // ===== LOADING STATES =====
  loading: "flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-gray-700 m-0 p-0",
  loadingContainer: "flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-600 to-blue-800 text-white text-center p-8",
  spinner: "w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin",
  largeSpinner: "w-15 h-15 border-5 border-white/20 border-t-white rounded-full animate-spin",
  
  // Banking Loading
  bankingLoading: "flex flex-col items-center justify-center h-screen",
  bankingSpinner: "w-10 h-10 border-3 border-gray-300 border-t-blue-500 rounded-full animate-spin",
  
  // ===== ERROR STATES =====
  errorContainer: "flex flex-col items-center justify-center h-screen bg-gradient-to-br from-red-500 to-red-700 text-white text-center p-8",
  errorIcon: "text-5xl mb-6",
  retryButton: "bg-white text-red-600 border-none py-2 px-6 rounded-lg font-semibold cursor-pointer transition-all text-sm hover:-translate-y-0.5 hover:shadow active:translate-y-0",
  
  // ===== EMPTY STATES =====
  emptyState: "text-center p-8 text-gray-600",
  emptyIcon: "text-4xl mb-3 opacity-50",
  emptyText: "text-sm font-medium text-gray-600 mb-0.5",
  emptySubtext: "text-xs text-gray-500",
  
  // Banking Empty State
  bankingEmptyState: "text-center py-10 px-4 bg-gray-50 rounded-xl",
  
  // ===== TOTAL & SUMMARY SECTIONS =====
  totalSection: "bg-gray-50 rounded-xl p-4 border border-gray-200",
  totalLabel: "text-sm font-semibold text-gray-700",
  totalValue: "text-xl font-bold text-blue-600",
  
  // Adjustment Breakdown
  adjustmentBreakdown: "mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200",
  breakdownItem: "flex justify-between text-xs mb-1",
  breakdownTotal: "flex justify-between mt-2 pt-2 border-t border-dashed border-gray-300 text-sm font-medium",
  
  // ===== FLEX UTILITIES =====
  flexRow: "flex items-center gap-3",
  flexColumn: "flex flex-col gap-3",
  
  // ===== DECORATIVE ELEMENTS =====
  emwDecorativeCorner: "absolute top-0 right-0 w-0 h-0 border-t-[60px] border-t-blue-50 border-l-[60px] border-l-transparent z-0",
  
  // ===== SPACING & PADDING =====
  sectionPadding: "px-4 py-3",
  contentPadding: "px-4 py-4",
  
  // ===== ANIMATIONS =====
  hoverLift: "hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200",
  clickScale: "active:scale-95 transition-transform",

  // Add these to your existing tw object in tailwindMapping.ts:

// ===== CHECKBOXES & SELECTION =====
checkbox: "w-5 h-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500",
checkboxLabel: "flex items-center gap-3 cursor-pointer text-sm",

// ===== LIST ITEMS =====
listItem: "bg-white p-3 border-b border-gray-100 last:border-b-0",
listItemContent: "flex-1 min-w-0",
listItemHeader: "flex justify-between items-start mb-1",
listItemTitle: "font-semibold text-gray-900 text-base",
listItemDescription: "text-sm text-gray-600 truncate",
listItemMeta: "flex items-center gap-3 text-xs text-gray-500",

// ===== BADGES & INDICATORS =====
statusBadge: "text-xs px-2 py-1 rounded-full font-medium",
activeBadge: "bg-green-100 text-green-800",
inactiveBadge: "bg-gray-100 text-gray-800",
locationBadge: "bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded",

// ===== MESSAGES & ALERTS =====
message: "mt-3 p-3 rounded-lg text-sm text-center",
successMessage: "bg-green-100 text-green-800",
errorMessage: "bg-red-100 text-red-800",
infoMessage: "bg-blue-100 text-blue-800",

// ===== SPECIFIC FOR BATCH EDIT =====
batchInfo: "text-sm text-gray-600 mb-3 flex justify-between items-center",
batchCounter: "text-xs text-gray-500 text-center mb-2",
emptyStateIcon: "text-5xl mb-4 opacity-50",


} as const; // Added 'as const' for better TypeScript inference

// Banking-specific color variants
export const bankingColors = {
  primary: {
    text: "text-blue-600",
    bg: "bg-blue-600",
    hover: "hover:bg-blue-700",
    light: "bg-blue-50 text-blue-800",
  },
  success: {
    text: "text-green-600",
    bg: "bg-green-600",
    hover: "hover:bg-green-700",
    light: "bg-green-50 text-green-800",
  },
  danger: {
    text: "text-red-600",
    bg: "bg-red-600",
    hover: "hover:bg-red-700",
    light: "bg-red-50 text-red-800",
  },
  warning: {
    text: "text-yellow-600",
    bg: "bg-yellow-600",
    hover: "hover:bg-yellow-700",
    light: "bg-yellow-50 text-yellow-800",
  },
} as const;

// Account type indicators
export const accountTypes = {
  saving: "before:content-['💵'] before:mr-2",
  current: "before:content-['🏦'] before:mr-2",
  loan: "before:content-['💰'] before:mr-2",
  investment: "before:content-['📈'] before:mr-2",
  credit: "before:content-['💳'] before:mr-2",
} as const;

// Helper for responsive classes
export const responsive = {
  desktopOnly: "lg:block hidden",
  mobileOnly: "lg:hidden block",
  tabletUp: "md:block hidden",
  bankingNavGrid: "grid grid-cols-2 sm:grid-cols-4 gap-3",
} as const;

// Helper for conditional classes with responsive support
export const cls = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(' ');

// Banking-specific class composition helpers
export const banking = {
  // Status badges
  statusBadge: (status: 'active' | 'inactive' | 'warning' | 'success' | 'danger') => 
    cls(
      tw.bankingBadge,
      status === 'active' || status === 'success' ? tw.bankingBadgeSuccess :
      status === 'inactive' || status === 'danger' ? tw.bankingBadgeDanger :
      status === 'warning' ? tw.bankingBadgeWarning : tw.bankingBadgeInfo
    ),
  
  // Trend indicator
  trendIndicator: (trend: 'up' | 'down' | 'neutral') =>
    cls(
      tw.trendBadge,
      trend === 'up' ? tw.trendUp :
      trend === 'down' ? tw.trendDown : "bg-gray-100 text-gray-800"
    ),
  
  // Account type
  accountType: (type: keyof typeof accountTypes) => cls("flex items-center", accountTypes[type]),
  
  // Card variants
  cardVariant: (variant: 'default' | 'total' | 'emw' | 'stats') =>
    cls(
      variant === 'total' ? tw.totalBalanceCard :
      variant === 'emw' ? tw.emwCard :
      variant === 'stats' ? tw.bankingStatsCard :
      tw.bankingCard
    ),
};

// Type for better IntelliSense
export type TailwindMapping = typeof tw;
export type BankingColors = typeof bankingColors;
export type AccountTypes = typeof accountTypes;
export type ResponsiveClasses = typeof responsive;