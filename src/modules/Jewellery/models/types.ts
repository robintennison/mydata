

export interface Bill {
  id?: string;
  downloadUrl: string;
  mimeType: string;
  notes?: string | null;
  createdAt: number;      // Both fields exist
  uploadedAt: number;     // Both fields exist
}


// new

export const VerificationStatus = {
  VERIFIED: "Verified",
  MISSING: "Missing",
  NOT_VERIFIED: "Not Verified"
} as const;

// This creates the TYPE from the values
export type VerificationStatusType = typeof VerificationStatus[keyof typeof VerificationStatus];

// Jewellery interface should use VerificationStatusType
export interface Jewellery {
  id: string;
  code: string;
  description: string;
  weight: number;
  location: string;
  boughtFor: string;
  purchaseDate: number;
  imageUrl: string;
  active: boolean;
  billId?: string;
  lastVerified: number;
  verificationStatus: VerificationStatusType;  // Use the TYPE
  verificationNotes: string;
}