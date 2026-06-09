import { formatDate } from "./formatters";

// File type as a union type
export type FileType = 'image' | 'pdf' | 'none';

// Constants for file types
export const FILE_TYPES = {
  IMAGE: 'image' as FileType,
  PDF: 'pdf' as FileType,
  NONE: 'none' as FileType,
} as const;

// Helper function to safely parse timestamps
export const parseTimestamp = (timestamp: any): number | null => {
  if (timestamp === null || timestamp === undefined) return null;
  if (typeof timestamp === "number") {
    return timestamp;
  }
  if (timestamp && typeof timestamp.toDate === "function") {
    return timestamp.toDate().getTime();
  }
  if (typeof timestamp === "string") {
    const parsed = Date.parse(timestamp);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
};

// Helper to determine file type from name
export const getFileTypeFromName = (filename: string): FileType => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"];
  const pdfExtensions = ["pdf"];

  const extension = filename.split(".").pop()?.toLowerCase() || "";

  if (imageExtensions.includes(extension)) return FILE_TYPES.IMAGE;
  if (pdfExtensions.includes(extension)) return FILE_TYPES.PDF;
  return FILE_TYPES.NONE;
};

// Helper to get file icon based on type
export const getFileIcon = (type: FileType): string => {
  switch (type) {
    case FILE_TYPES.IMAGE:
      return "🖼️";
    case FILE_TYPES.PDF:
      return "📄";
    default:
      return "📁";
  }
};

// Format date for display - Re-export from formatters.ts to avoid duplication
// This function now uses the centralized formatDate from formatters.ts
export const formatDateDisplay = (timestamp?: number | null): string => {
  if (!timestamp) return "Not specified";
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Invalid date";
    return formatDate(timestamp, "en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    return "Error formatting date";
  }
};

// Calendar utility functions
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isSelectedDate = (
  date: Date,
  selectedDate?: number | null
): boolean => {
  if (!selectedDate) return false;
  const compareDate = new Date(selectedDate);
  return (
    date.getDate() === compareDate.getDate() &&
    date.getMonth() === compareDate.getMonth() &&
    date.getFullYear() === compareDate.getFullYear()
  );
};