import { firestore } from "../../../lib/firebase";
import {
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { toFirestoreData } from "../../../utils/firestoreHelpers";
import type {
  BankAccount,
  Deposit,
  History,
  DepositAdjustment,
} from "../../../types/banking.types";

export const useBankingOperations = () => {
  // Account CRUD operations
  const handleSaveAccount = async (account: BankAccount) => {
    try {
      if (account.id) {
        await updateDoc(doc(firestore, "accounts", account.id), toFirestoreData(account));
      } else {
        await addDoc(collection(firestore, "accounts"), toFirestoreData(account));
      }
      window.location.reload();
    } catch (error) {
      console.error("Error saving account:", error);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!window.confirm("Delete this account? This will also delete related deposits."))
      return;

    try {
      // Note: You might want to add deletion of related deposits here
      await deleteDoc(doc(firestore, "accounts", accountId));
      window.location.reload();
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  // Deposit CRUD operations
  const handleSaveDeposit = async (deposit: Deposit) => {
    try {
      if (deposit.id) {
        await updateDoc(doc(firestore, "deposits", deposit.id), toFirestoreData(deposit));
      } else {
        await addDoc(collection(firestore, "deposits"), toFirestoreData(deposit));
      }
      window.location.reload();
    } catch (error) {
      console.error("Error saving deposit:", error);
    }
  };

  const handleDeleteDeposit = async (depositId: string) => {
    if (!window.confirm("Delete this deposit?")) return;

    try {
      await deleteDoc(doc(firestore, "deposits", depositId));
      window.location.reload();
    } catch (error) {
      console.error("Error deleting deposit:", error);
    }
  };

  // History CRUD operations
  const handleSaveHistory = async (history: History) => {
    try {
      await updateDoc(doc(firestore, "history", history.month), toFirestoreData(history));
      window.location.reload();
    } catch (error) {
      console.error("Error saving history:", error);
    }
  };

  const handleDeleteHistory = async (month: string) => {
    if (!window.confirm("Delete this history record?")) return;

    try {
      await deleteDoc(doc(firestore, "history", month));
      window.location.reload();
    } catch (error) {
      console.error("Error deleting history:", error);
    }
  };

  // Handle summary adjustment
  const handleSummaryAdjustment = async (
    accountId: string,
    adjustmentAmount: number,
    note: string
  ) => {
    try {
      const adjustment: DepositAdjustment = {
        id: "",
        accountId,
        adjustmentAmount,
        timestamp: Date.now(),
        note: note || "Manual adjustment from summary screen",
      };

      await addDoc(
        collection(firestore, "deposit_adjustments"),
        toFirestoreData(adjustment)
      );
      window.location.reload();
    } catch (error) {
      console.error("Error creating adjustment:", error);
    }
  };

  return {
    handleSaveAccount,
    handleDeleteAccount,
    handleSaveDeposit,
    handleDeleteDeposit,
    handleSaveHistory,
    handleDeleteHistory,
    handleSummaryAdjustment,
  };
};