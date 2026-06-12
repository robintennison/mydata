import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { firestore } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useError } from "./ErrorContext";
import { useAuth } from "./AuthContext";
import type {
  BankAccount,
  Deposit,
  History,
  DepositAdjustment,
  HistoryDetail,
  Liability,
} from "../types/banking.types";

interface BankingDataContextType {
  loading: boolean;
  accounts: BankAccount[];
  deposits: Deposit[];
  history: History[];
  adjustments: DepositAdjustment[];
  historyDetail: HistoryDetail[];
  liabilities: Liability[];
  settings: { showInactive: boolean };
  refresh: () => Promise<void>;
}

const BankingDataContext = createContext<BankingDataContextType | undefined>(undefined);

export const useBankingDataContext = () => {
  const context = useContext(BankingDataContext);
  if (!context) {
    throw new Error("useBankingDataContext must be used within a BankingDataProvider");
  }
  return context;
};

interface BankingDataProviderProps {
  children: ReactNode;
}

export const BankingDataProvider: React.FC<BankingDataProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [adjustments, setAdjustments] = useState<DepositAdjustment[]>([]);
  const [historyDetail, setHistoryDetail] = useState<HistoryDetail[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [settings, setSettings] = useState<{ showInactive: boolean }>({
    showInactive: false,
  });
  const { setError } = useError();
  const { isAuthenticated } = useAuth();

  const loadAllData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [
        accountsSnap,
        depositsSnap,
        historySnap,
        adjustmentsSnap,
        historyDetailSnap,
        liabilitiesSnap,
        settingsSnap,
      ] = await Promise.all([
        getDocs(collection(firestore, "accounts")),
        getDocs(collection(firestore, "deposits")),
        getDocs(collection(firestore, "history")),
        getDocs(collection(firestore, "deposit_adjustments")),
        getDocs(collection(firestore, "history_detail")),
        getDocs(collection(firestore, "liabilities")),
        getDocs(collection(firestore, "settings")),
      ]);

      setAccounts(
        accountsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BankAccount))
      );
      setDeposits(
        depositsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Deposit))
      );
      setHistory(
        historySnap.docs.map((doc) => ({ month: doc.id, ...doc.data() } as History))
      );
      setAdjustments(
        adjustmentsSnap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as DepositAdjustment)
        )
      );
      setHistoryDetail(
        historyDetailSnap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as HistoryDetail)
        )
      );
      setLiabilities(
        liabilitiesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Liability))
      );

      if (!settingsSnap.empty) {
        const settingsData = settingsSnap.docs[0].data();
        setSettings({
          showInactive: settingsData.showInactive || false,
        });
      }
    } catch (error) {
      console.error("Error loading banking data:", error);
      setError("Failed to load banking data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [isAuthenticated, setError]);

  return (
    <BankingDataContext.Provider
      value={{
        loading,
        accounts,
        deposits,
        history,
        adjustments,
        historyDetail,
        liabilities,
        settings,
        refresh: loadAllData,
      }}
    >
      {children}
    </BankingDataContext.Provider>
  );
};
