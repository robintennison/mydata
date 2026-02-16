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

// Constants for file types (optional, for convenience)
export const FILE_TYPES = {
  IMAGE: 'image' as FileType,
  PDF: 'pdf' as FileType,
  NONE: 'none' as FileType,
} as const;