// Category types
export interface Category {
  id: string;
  name: string;
  createdAt?: number;
  updatedAt?: number;
}

// OnlineItem types
export interface OnlineItem {
  id: string;
  name: string;
  detail: string;
  category: string;
  image1: string;
  image2: string;
  createdAt?: number;
  updatedAt?: number;
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