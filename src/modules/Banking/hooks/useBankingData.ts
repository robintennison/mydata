import { useEffect, useState } from "react";
import { firestore } from "../../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import type {
  BankAccount,
  Deposit,
  History,
  DepositAdjustment,
} from "../../../types/banking.types";

export interface BankingData {
  loading: boolean;
  accounts: BankAccount[];
  deposits: Deposit[];
  history: History[];
  adjustments: DepositAdjustment[];
  settings: { showInactive: boolean };
}

export const useBankingData = (): BankingData => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [adjustments, setAdjustments] = useState<DepositAdjustment[]>([]);
  const [settings, setSettings] = useState<{ showInactive: boolean }>({
    showInactive: false, // Default value
  });

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        // Load accounts
        const accountsSnapshot = await getDocs(collection(firestore, "accounts"));
        const accountsData = accountsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as BankAccount)
        );
        setAccounts(accountsData);

        // Load deposits
        const depositsSnapshot = await getDocs(collection(firestore, "deposits"));
        const depositsData = depositsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Deposit)
        );
        setDeposits(depositsData);

        // Load history
        const historySnapshot = await getDocs(collection(firestore, "history"));
        const historyData = historySnapshot.docs.map(
          (doc) =>
            ({
              month: doc.id,
              ...doc.data(),
            } as History)
        );
        setHistory(historyData);

        // Load adjustments
        const adjustmentsSnapshot = await getDocs(
          collection(firestore, "deposit_adjustments")
        );
        const adjustmentsData = adjustmentsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as DepositAdjustment)
        );
        setAdjustments(adjustmentsData);

        // Load settings from Firestore if you have a settings collection
        // Or keep the default value if no settings collection exists
        try {
          const settingsSnapshot = await getDocs(collection(firestore, "settings"));
          if (!settingsSnapshot.empty) {
            const settingsData = settingsSnapshot.docs[0].data();
            setSettings({
              showInactive: settingsData.showInactive || false,
            });
          }
        } catch (error) {
          console.log("No settings found, using defaults");
          // Keep default settings
        }

      } catch (error) {
        console.error("Error loading banking data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  return {
    loading,
    accounts,
    deposits,
    history,
    adjustments,
    settings,
  };
};