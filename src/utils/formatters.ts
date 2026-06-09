// src/utils/formatters.ts

/**
 * Format currency amounts
 * @param amount - The amount to format
 * @param currency - ISO currency code (default: 'INR')
 * @param locale - Locale string (default: 'en-IN')
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number, 
  currency: string = "INR", 
  locale: string = "en-IN"
): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Core date formatter using Intl
 * @param timestamp - Timestamp in milliseconds or Date object
 * @param locale - Locale string (default: 'en-IN')
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDate = (
  timestamp: number | Date, 
  locale: string = "en-IN",
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  
  return date.toLocaleDateString(locale, options || defaultOptions);
};

/**
 * Specifically for "dd/mm/yy" format used in MyDataHomepage
 * @param timestamp - Timestamp in milliseconds
 * @returns Formatted date in dd/mm/yy format
 */
export const formatDateShort = (timestamp: number): string => {
  return formatDate(timestamp, "en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

/**
 * Safe date formatter with error handling for Firestore timestamps
 * Handles null, undefined, invalid, or Firestore timestamp objects
 * @param timestamp - Timestamp (milliseconds, Date object, Firestore Timestamp, or null)
 * @param locale - Locale string (default: 'en-IN')
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string or fallback value
 */
export const formatDateDisplay = (
  timestamp: any,
  locale: string = "en-IN",
  options?: Intl.DateTimeFormatOptions
): string => {
  try {
    if (!timestamp) return "N/A";
    
    let date: Date;
    
    // Handle Firestore Timestamp object
    if (typeof timestamp === "object" && timestamp !== null && "toDate" in timestamp) {
      date = timestamp.toDate();
    } 
    // Handle numeric timestamp
    else if (typeof timestamp === "number") {
      date = new Date(timestamp);
    }
    // Handle string timestamp
    else if (typeof timestamp === "string") {
      date = new Date(timestamp);
    }
    // Handle Date object
    else if (timestamp instanceof Date) {
      date = timestamp;
    }
    else {
      return "Invalid date";
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) return "Invalid date";
    
    return formatDate(date, locale, options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error";
  }
};

/**
 * Format date and time from timestamp
 * @param timestamp - Timestamp in milliseconds
 * @param locale - Locale string (default: 'en-IN')
 * @returns Formatted date-time string
 */
export const formatDateTime = (
  timestamp: number, 
  locale: string = "en-IN"
): string => {
  return new Date(timestamp).toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Format month name from YYYY-MM string
 * @param month - Month string in format YYYY-MM
 * @param locale - Locale string (default: 'en-IN')
 * @returns Formatted month name
 */
export const formatMonthName = (
  month: string, 
  locale: string = "en-IN"
): string => {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1, 1);
  
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
  });
};

/**
 * Format month name from previous month string (YYYY-MM)
 * @param previousMonth - Previous month string in YYYY-MM format
 * @param locale - Locale string (default: 'en-IN')
 * @returns Formatted month name
 */
export const getPreviousMonthName = (
  previousMonth: string,
  locale: string = "en-IN"
): string => {
  return formatMonthName(previousMonth, locale);
};

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Format percentage
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format number with commas for thousands separator
 * @param num - Number to format
 * @param locale - Locale string (default: 'en-IN')
 * @returns Formatted number string
 */
export const formatNumber = (num: number, locale: string = "en-IN"): string => {
  return new Intl.NumberFormat(locale).format(num);
};

/**
 * Format duration in milliseconds to human-readable format
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

/**
 * Capitalize first letter of each word
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export const capitalizeWords = (text: string): string => {
  return text
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Format phone number (Indian format)
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param timestamp - Timestamp in milliseconds
 * @returns Relative time string
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;
  
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < week) return `${Math.floor(diff / day)}d ago`;
  if (diff < month) return `${Math.floor(diff / week)}w ago`;
  if (diff < year) return `${Math.floor(diff / month)}mo ago`;
  return `${Math.floor(diff / year)}y ago`;
};

/**
 * Returns the current month in YYYY-MM format.
 * Used for database queries and month selectors.
 */
export const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

/**
 * Formats a number in Lakhs (divides by 100,000) with 2 decimal places.
 * Used for financial displays where privacy or space is a concern.
 */
export const formatLakhs = (amount: number): string => {
  return (amount / 100000).toFixed(2);
};

// Export all formatters
export default {
  formatCurrency,
  formatDate,
  formatDateShort,
  formatDateDisplay,
  formatDateTime,
  formatMonthName,
  getPreviousMonthName,
  formatFileSize,
  formatPercentage,
  formatNumber,
  formatDuration,
  truncateText,
  capitalizeWords,
  formatPhoneNumber,
  formatRelativeTime,
  getCurrentMonth,
  formatLakhs,
};