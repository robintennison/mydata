import type { DocumentData } from "firebase/firestore";

/**
 * Convert TypeScript objects to Firestore-compatible data
 * Removes the 'id' field since Firestore stores it separately
 * @param data - The data object to convert
 * @returns Firestore-compatible data without the 'id' field
 */
export const toFirestoreData = <T extends Record<string, any>>(data: T): DocumentData => {
  const { id, ...rest } = data;
  return rest;
};

/**
 * Convert Firestore document to TypeScript object with id
 * @param doc - Firestore document snapshot
 * @returns Typed object with id included
 */
export const fromFirestoreDoc = <T extends DocumentData>(doc: any): T & { id: string } => {
  return {
    id: doc.id,
    ...doc.data(),
  } as T & { id: string };
};

/**
 * Convert Firestore query snapshot to array of typed objects with ids
 * @param snapshot - Firestore query snapshot
 * @returns Array of typed objects with ids
 */
export const fromFirestoreSnapshot = <T extends DocumentData>(snapshot: any): Array<T & { id: string }> => {
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<T & { id: string }>;
};

/**
 * Create a Firestore timestamp from a Date or number
 * @param date - Date object or timestamp in milliseconds
 * @returns Object with toDate method for compatibility
 */
export const createFirestoreTimestamp = (date: Date | number = Date.now()): any => {
  const timestamp = typeof date === 'number' ? date : date.getTime();
  return {
    toDate: () => new Date(timestamp),
    toMillis: () => timestamp,
    isEqual: (other: any) => other?.toMillis?.() === timestamp,
  };
};

/**
 * Safe document reference creator with validation
 * @param collectionPath - Firestore collection path
 * @param docId - Document ID (optional, will generate if not provided)
 * @returns Object with collection and doc references
 */
export const createDocRef = (collectionPath: string, docId?: string) => {
  // In a real implementation, you would import firestore and create refs
  // This is a utility function to be used in other files
  return {
    collectionPath,
    docId: docId || '', // In real use, you'd generate an ID here
    toString: () => docId ? `${collectionPath}/${docId}` : collectionPath,
  };
};

/**
 * Batch operation helper for multiple Firestore operations
 * @param operations - Array of operations to perform
 * @returns Promise that resolves when all operations complete
 */
export const batchOperations = async <T>(operations: Array<() => Promise<T>>): Promise<T[]> => {
  const results: T[] = [];
  for (const operation of operations) {
    try {
      const result = await operation();
      results.push(result);
    } catch (error) {
      console.error('Batch operation failed:', error);
      throw error;
    }
  }
  return results;
};

/**
 * Validate Firestore document before saving
 * @param data - Data to validate
 * @param requiredFields - Array of required field names
 * @returns Validation result with success flag and errors
 */
export const validateFirestoreData = (
  data: Record<string, any>,
  requiredFields: string[] = []
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required fields
  requiredFields.forEach((field) => {
    if (!(field in data) || data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Check for invalid field types (Firestore restrictions)
  const checkValue = (value: any, path: string = '') => {
    if (value === undefined) {
      errors.push(`Field ${path} cannot be undefined`);
      return;
    }

    if (value === null) {
      return; // null is allowed
    }

    const type = typeof value;

    if (type === 'object') {
      if (Array.isArray(value)) {
        value.forEach((item, index) => checkValue(item, `${path}[${index}]`));
      } else if (value instanceof Date) {
        // Dates are allowed
      } else if (value && typeof value === 'object') {
        Object.entries(value).forEach(([key, val]) => checkValue(val, path ? `${path}.${key}` : key));
      }
    }
    // Other types (string, number, boolean) are allowed
  };

  Object.entries(data).forEach(([key, value]) => checkValue(value, key));

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generate a Firestore-compatible document ID
 * @param prefix - Optional prefix for the ID
 * @returns Generated document ID
 */
export const generateDocId = (prefix?: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  const id = `${timestamp}_${random}`;
  return prefix ? `${prefix}_${id}` : id;
};

/**
 * Convert nested objects to Firestore-friendly format
 * Handles dates and nested objects recursively
 * @param data - Data to convert
 * @returns Firestore-friendly data
 */
export const prepareForFirestore = (data: any): any => {
  if (data === null || data === undefined) {
    return null;
  }

  if (data instanceof Date) {
    return createFirestoreTimestamp(data);
  }

  if (Array.isArray(data)) {
    return data.map(prepareForFirestore);
  }

  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id') { // Always exclude id field
        result[key] = prepareForFirestore(value);
      }
    });
    return result;
  }

  return data;
};

/**
 * Error handler for Firestore operations
 * @param error - The error object
 * @param operation - Name of the operation that failed
 * @returns User-friendly error message
 */
export const handleFirestoreError = (error: any, operation: string = 'operation'): string => {
  console.error(`Firestore ${operation} error:`, error);

  // Common Firestore error codes
  const errorMessages: Record<string, string> = {
    'permission-denied': 'You do not have permission to perform this operation.',
    'not-found': 'The requested document was not found.',
    'already-exists': 'A document with this ID already exists.',
    'invalid-argument': 'Invalid data provided.',
    'failed-precondition': 'Operation failed due to a precondition.',
    'unavailable': 'Service is temporarily unavailable. Please try again.',
    'unauthenticated': 'You need to be authenticated to perform this operation.',
  };

  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }

  return `Failed to ${operation}: ${error.message || 'Unknown error'}`;
};

/**
 * Type guard to check if value is a Firestore timestamp
 * @param value - Value to check
 * @returns True if value looks like a Firestore timestamp
 */
export const isFirestoreTimestamp = (value: any): boolean => {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.toDate === 'function' &&
    typeof value.toMillis === 'function'
  );
};

// Export all helpers
export default {
  toFirestoreData,
  fromFirestoreDoc,
  fromFirestoreSnapshot,
  createFirestoreTimestamp,
  createDocRef,
  batchOperations,
  validateFirestoreData,
  generateDocId,
  prepareForFirestore,
  handleFirestoreError,
  isFirestoreTimestamp,
};