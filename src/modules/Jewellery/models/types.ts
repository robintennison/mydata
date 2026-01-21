// Use string union types instead of enums
export type VerificationStatus = 
  | "Not Verified" 
  | "Verified" 
  | "Missing";

// Helper object for accessing the values (like an enum)
export const VerificationStatus = {
  NOT_VERIFIED: "Not Verified",
  VERIFIED: "Verified",
  MISSING: "Missing",
} as const;

// TypeScript interfaces matching Kotlin data classes
export interface Jewellery {
  id?: string;
  code: string;
  description: string;
  weight: number;        // grams
  location: string;       // Locker, Home... (from settings)
  boughtFor: string;      // Robin, Sheela... (from settings)
  purchaseDate: number;   // timestamp
  imageUrl: string;
  active: boolean;
  billId?: string;
  lastVerified: number;        // timestamp of last verification
  verificationStatus: string; // Use string type, not VerificationStatus type
  verificationNotes: string;
}

export interface Bill {
  id?: string;
  downloadUrl: string;
  mimeType: string;
  createdAt: number;
  notes?: string;
  updatedAt?: number;
}

// Helper array for dropdowns
export const VerificationStatusList = [
  "Not Verified",
  "Verified",
  "Missing"
] as const;