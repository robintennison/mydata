// File type as a union type (replacing enum for erasableSyntaxOnly compatibility)
export type FileType = 'image' | 'pdf' | 'none';

// Category types
export interface Category {
  id: string;
  name: string;
  createdAt?: number;
  updatedAt?: number;
}

// OnlineItem types - Updated to support both images and PDFs
export interface OnlineItem {
  id: string;
  name: string;
  detail: string;
  category: string;
  startDate?: number | null; // Only relevant if isRenewable is true
  endDate?: number | null;   // Only relevant if isRenewable is true
  // File fields (replacing image fields)
  file1: string; // URL
  file2: string; // URL
  file1Type: FileType;
  file2Type: FileType;
  file1Name: string; // Original filename
  file2Name: string; // Original filename
  createdAt?: number;
  updatedAt?: number;
}

// File info interface for form state (used in OnlineForm)
export interface FileInfo {
  file: File | null;
  optimization: {
    originalSize: number;
    optimizedSize: number;
    savedPercentage: number;
    fileName: string;
  } | null;
  error?: string;
  type: FileType;
  url: string;
  name: string;
}

// Renewal types
export interface Renewal {
  id: string;
  name: string;
  startDate: number; // timestamp
  endDate: number; // timestamp
  comments?: string;
  createdAt?: number;
  updatedAt?: number;
}

// ============= MISSING TYPES ADDED BELOW =============

/**
 * Props for FileSection component
 */
export interface FileSectionProps {
  fileNumber: 1 | 2;
  isViewMode: boolean;
  fileInfo: FileInfo;
  existingFileUrl: string;
  existingFileType: FileType;
  existingFileName: string;
  hasExistingFile: boolean;
  fileSize: { width: number; height: number } | null;
  loadingSize: boolean;
  saving: boolean;
  uploadingFiles: boolean;
  deleting?: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, fileNumber: 1 | 2) => void;
  onDeleteExistingFile: (fileNumber: 1 | 2) => void;
  onRemoveFile: (fileNumber: 1 | 2) => void;
}

/**
 * Props for CalendarPopup component
 */
export interface CalendarPopupProps {
  showCalendar: "start" | "end" | null;
  currentMonth: Date;
  selectedDate?: number | null;
  showYearSelector: boolean;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
  onClear: () => void;
  onNavigateMonth: (direction: "prev" | "next") => void;
  onNavigateYear: (direction: "prev" | "next") => void;
  onToggleYearSelector: () => void;
  onSelectYear: (year: number) => void;
}

/**
 * Return type for useOnlineForm hook
 */
export interface UseOnlineFormReturn {
  // State
  formData: Partial<OnlineItem>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<OnlineItem>>>;
  categories: Category[];
  loading: boolean;
  saving: boolean;
  uploadingFiles: boolean;
  file1Info: FileInfo;
  file2Info: FileInfo;
  showDelete: boolean;
  isAddMode: boolean;
  isEditMode: boolean;
  isViewMode: boolean;
  id?: string;
  
  // Calendar state
  showCalendar: "start" | "end" | null;
  currentMonth: Date;
  showYearSelector: boolean;
  openCalendar: (field: "start" | "end") => void;
  selectDate: (date: Date, field: "start" | "end") => void;
  navigateMonth: (direction: "prev" | "next") => void;
  navigateYear: (direction: "prev" | "next") => void;
  selectYear: (year: number) => void;
  setShowCalendar: React.Dispatch<React.SetStateAction<"start" | "end" | null>>;
  setShowYearSelector: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Actions
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleDelete: () => Promise<void>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, fileNumber: 1 | 2) => Promise<void>;
  handleRemoveFile: (fileNumber: 1 | 2) => void;
  handleDeleteExistingFile: (fileNumber: 1 | 2) => Promise<void>;
  getPageTitle: () => string;
  navigate: (to: string, options?: { state?: any }) => void;
}

/**
 * Optimization options for file optimization
 */
export interface OptimizationOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  quality?: number;
}

/**
 * File validation result
 */
export interface ValidationResult {
  valid: boolean;
  error: string;
}

/**
 * Calendar utility functions return types
 */
export interface CalendarUtils {
  getDaysInMonth: (year: number, month: number) => number;
  getFirstDayOfMonth: (year: number, month: number) => number;
  isToday: (date: Date) => boolean;
  isSelectedDate: (date: Date, selectedDate?: number | null) => boolean;
  formatDateDisplay: (timestamp?: number | null) => string;
  getFileTypeFromName: (filename: string) => FileType;
  getFileIcon: (type: FileType) => string;
  parseTimestamp: (timestamp: any) => number | null;
}

// Constants for file types (optional, for convenience)
export const FILE_TYPES = {
  IMAGE: 'image' as FileType,
  PDF: 'pdf' as FileType,
  NONE: 'none' as FileType,
} as const;

// Type for the keys of FILE_TYPES
export type FileTypeKey = keyof typeof FILE_TYPES;