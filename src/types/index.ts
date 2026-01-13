// Banking types
export * from './banking.types';

// Add other module types here when you create them:
// export * from './jewellery.types';
// export * from './properties.types';
// export * from './online.types';

// Common/shared types
export interface BaseEntity {
  id: string;
  createdAt?: number | Date;
  updatedAt?: number | Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}