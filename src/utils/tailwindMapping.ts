// src/utils/tailwindMapping.ts
export const tw = {
  // Layout
  container: "flex flex-col h-screen overflow-hidden bg-gray-50",
  contentWrapper: "flex-1 flex flex-col w-full overflow-hidden min-h-0",
  scrollableArea: "flex-1 overflow-y-auto min-h-0 p-2 px-1",
  pageContainer: "flex flex-col min-h-screen bg-gray-50",
  
  // Navigation
  topNav: "flex items-center justify-between p-2.5 px-4 bg-white border-b border-gray-200 mb-2.5 shrink-0",
  navButton: "px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-base cursor-pointer min-w-10 flex items-center justify-center text-gray-800",
  navTitle: "text-lg font-semibold text-gray-800",
  
  // Buttons
  addButton: "px-5 py-2.5 bg-gradient-to-br from-primary to-primary-dark text-white border-none rounded-lg cursor-pointer text-sm font-medium transition-all duration-300 shadow hover:shadow-md",
  viewButton: "px-3 py-1.5 bg-blue-500 text-white border-none rounded cursor-pointer text-xs font-medium",
  editButton: "px-3 py-1.5 bg-green-500 text-white border-none rounded cursor-pointer text-xs font-medium",
  deleteButton: "px-3 py-1.5 bg-red-500 text-white border-none rounded cursor-pointer text-xs font-medium",
  cancelButton: "px-8 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium",
  submitButton: "px-8 py-3 bg-gradient-to-br from-blue-500 to-purple-600 text-white border-none rounded-lg cursor-pointer text-sm font-medium",
  
  // Forms
  form: "max-w-lg mx-auto w-full",
  formGroup: "mb-5",
  formRow: "flex gap-5 mb-5",
  label: "block mb-1.5 text-sm font-medium text-gray-700",
  input: "w-full p-2.5 px-3 border border-gray-300 rounded text-sm bg-white box-border",
  select: "w-full p-2.5 px-3 border border-gray-300 rounded text-sm bg-white box-border",
  textarea: "w-full p-3 border border-gray-300 rounded text-sm font-sans leading-normal text-gray-900 bg-white resize-y min-h-[150px] max-h-[400px] overflow-y-auto box-border",
  
  // Sections & Tables
  section: "bg-white rounded-xl mx-1 mb-2 p-2 shadow-sm border border-gray-200 shrink-0",
  sectionHeader: "flex justify-between items-center mb-4",
  sectionTitle: "text-base font-semibold text-gray-800",
  
  // Status
  expiredBadge: "px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold inline-block",
  warningBadge: "px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold inline-block",
  normalBadge: "px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold inline-block",
  
  // Rows
  warningRow: "bg-yellow-50 border-l-4 border-yellow-500",
  expiredRow: "bg-red-50 border-l-4 border-red-500",
  immediateRow: "bg-orange-50 border-l-4 border-orange-500",
  
  // Empty States
  emptyState: "text-center py-10 px-5 text-gray-600 flex-1 flex flex-col justify-center items-center",
  emptyIcon: "text-4xl mb-4 opacity-50",
  emptyText: "text-base font-medium text-gray-600 mb-2",
  emptySubtext: "text-sm text-gray-400",
  
  // Loading
  loading: "flex flex-col items-center justify-center py-15 px-5 flex-1",
  spinner: "w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin",
};

// Helper for conditional classes
export const cls = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(' ');