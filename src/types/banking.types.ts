import { Timestamp } from "firebase/firestore";

// Main data types
export interface BankAccount {
  id: string;
  acctCode: string;
  acctDetails: string;
  mpin: string;
  isActive?: boolean; // Add this property for active/inactive filtering
  createdAt?: Timestamp | number;
  updatedAt?: Timestamp | number;
}

export interface Deposit {
  id: string;
  accountId: string;
  amount: number;
  startDate: number;
  endDate: number;
  comments: string;
  active: boolean;
  createdAt?: Timestamp | number;
  updatedAt?: Timestamp | number;
}

export interface History {
  month: string; // Format: YYYY-MM
  totalDeposits: number;
  savings: number;
  createdAt?: Timestamp | number;
  updatedAt?: Timestamp | number;
}

export interface DepositAdjustment {
  id: string;
  accountId: string;
  adjustmentAmount: number;
  timestamp: number;
  note: string;
  createdAt?: Timestamp | number;
  updatedAt?: Timestamp | number;
}

export interface ChartPoint {
  month: string;
  value: number;
  displayValue: string;
  normalizedValue: number;
}

// Form data types
export interface AccountFormData {
  id: string;
  acctCode: string;
  acctDetails: string;
  mpin: string;
  isActive?: boolean; // Add to form data as well
}

export interface DepositFormData {
  id: string;
  accountId: string;
  amount: number;
  startDate: number;
  endDate: number;
  comments: string;
  active: boolean;
}

export interface HistoryFormData {
  month: string;
  totalDeposits: number;
  savings: number;
}

// Component props types
export type BankingTab = "accounts" | "deposits" | "summary" | "history" | "settings";

export interface AccountsTabProps {
  accounts: BankAccount[];
  editingAccount: BankAccount | null;
  setEditingAccount: (account: BankAccount | null) => void;
  onSaveAccount: (account: BankAccount) => void;
  onDeleteAccount: (accountId: string) => void;
  enableEditDelete: boolean;
  formatCurrency: (amount: number) => string;
}

export interface DepositsTabProps {
  deposits: Deposit[];
  accounts: BankAccount[];
  editingDeposit: Deposit | null;
  setEditingDeposit: (deposit: Deposit | null) => void;
  onSaveDeposit: (deposit: Deposit) => Promise<void>;
  onDeleteDeposit: (depositId: string) => Promise<void>;
  enableEditDelete: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (timestamp: number) => string;
}

export interface SummaryTabProps {
  accounts: BankAccount[];
  deposits: Deposit[];
  adjustments: DepositAdjustment[];
  onAdjustment: (accountId: string, adjustmentAmount: number, note: string) => void;
  enableEditDelete: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (timestamp: number) => string;
}

export interface HistoryTabProps {
  history: History[];
  chartData: ChartPoint[];
  editingHistory: History | null;
  setEditingHistory: (history: History | null) => void;
  onSaveHistory: (history: History) => void;
  onDeleteHistory: (month: string) => void;
  enableEditDelete: boolean;
  formatCurrency: (amount: number) => string;
}

export interface SettingsTabProps {
  // Add props here if needed later
}

// Hook return types
export interface UseBankingDataReturn {
  loading: boolean;
  accounts: BankAccount[];
  deposits: Deposit[];
  history: History[];
  adjustments: DepositAdjustment[];
}

export interface UseBankingOperationsReturn {
  handleSaveAccount: (account: BankAccount) => Promise<void>;
  handleDeleteAccount: (accountId: string) => Promise<void>;
  handleSaveDeposit: (deposit: Deposit) => Promise<void>;
  handleDeleteDeposit: (depositId: string) => Promise<void>;
  handleSaveHistory: (history: History) => Promise<void>;
  handleDeleteHistory: (month: string) => Promise<void>;
  handleSummaryAdjustment: (accountId: string, adjustmentAmount: number, note: string) => Promise<void>;
}

// API response types
export interface BankingApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Filter/Sort types
export interface BankingFilters {
  accountId?: string;
  active?: boolean;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface BankingSortOptions {
  field: keyof BankAccount | keyof Deposit | keyof History;
  direction: 'asc' | 'desc';
}

// Helper type for safe property access
export type WithOptionalIsActive<T> = T & {
  isActive?: boolean;
};

export interface HistoryDetail {
  id?: string; // Document ID from Firestore
  month: string; // Format: YYYY-MM
  acctCode: string; // Account code
  savings: number; // Savings amount for this account in this month
  deposits: number; // Deposits amount for this account in this month
}

export interface Liability {
  id: string;
  description: string;
  amount: number;
}