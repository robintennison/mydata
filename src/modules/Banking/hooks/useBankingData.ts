import { useBankingDataContext } from "../../../contexts/BankingDataContext";
import type {
  BankAccount,
  Deposit,
  History,
  DepositAdjustment,
  HistoryDetail,
  Liability,
} from "../../../types/banking.types";

export interface BankingData {
  loading: boolean;
  accounts: BankAccount[];
  deposits: Deposit[];
  history: History[];
  adjustments: DepositAdjustment[];
  historyDetail: HistoryDetail[];
  liabilities: Liability[];
  settings: { showInactive: boolean };
}

export const useBankingData = (): BankingData => {
  return useBankingDataContext();
};