import { firestore } from "../../../lib/firebase";
import {
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  getDoc,
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
        console.log("DEBUG: Updated account:", account.id);
      } else {
        await addDoc(collection(firestore, "accounts"), toFirestoreData(account));
        console.log("DEBUG: Created new account");
      }
      return true;
    } catch (error) {
      console.error("Error saving account:", error);
      throw error;
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!window.confirm("Delete this account? This will also delete related deposits."))
      return false;

    try {
      await deleteDoc(doc(firestore, "accounts", accountId));
      console.log("DEBUG: Deleted account:", accountId);
      return true;
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  };

  // Deposit CRUD operations - FIXED VERSION
  const handleSaveDeposit = async (deposit: Deposit) => {
    try {
      console.log("DEBUG: handleSaveDeposit called with:", {
        id: deposit.id,
        accountId: deposit.accountId,
        amount: deposit.amount,
        isNewDeposit: deposit.id === "" || deposit.id.startsWith("deposit_")
      });

      if (deposit.id && deposit.id !== "") {
        // Check if this is an existing deposit or a new one with generated ID
        const docRef = doc(firestore, "deposits", deposit.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          // Document exists, update it
          await updateDoc(docRef, toFirestoreData(deposit));
          console.log("DEBUG: Updated existing deposit:", deposit.id);
        } else {
          // Document doesn't exist - this is a new deposit with client-generated ID
          // We should use addDoc instead and let Firebase handle the ID
          const { id, ...depositData } = deposit;
          const newDocRef = await addDoc(collection(firestore, "deposits"), toFirestoreData(depositData));
          console.log("DEBUG: Created new deposit with Firebase ID:", newDocRef.id);
        }
      } else {
        // No ID provided, create new deposit
        const { id, ...depositData } = deposit;
        const newDocRef = await addDoc(collection(firestore, "deposits"), toFirestoreData(depositData));
        console.log("DEBUG: Created new deposit with Firebase ID:", newDocRef.id);
      }
      
      return true;
    } catch (error) {
      console.error("Error saving deposit:", error);
      console.error("Full error details:", error);
      throw error;
    }
  };
  
  const handleDeleteDeposit = async (depositId: string) => {
    if (!window.confirm("Delete this deposit?")) return false;

    try {
      await deleteDoc(doc(firestore, "deposits", depositId));
      console.log("DEBUG: Deleted deposit:", depositId);
      return true;
    } catch (error) {
      console.error("Error deleting deposit:", error);
      throw error;
    }
  };

  // History CRUD operations
  const handleSaveHistory = async (history: History) => {
    try {
      await updateDoc(doc(firestore, "history", history.month), toFirestoreData(history));
      console.log("DEBUG: Updated history for month:", history.month);
      return true;
    } catch (error) {
      console.error("Error saving history:", error);
      throw error;
    }
  };

  const handleDeleteHistory = async (month: string) => {
    if (!window.confirm("Delete this history record?")) return false;

    try {
      await deleteDoc(doc(firestore, "history", month));
      console.log("DEBUG: Deleted history for month:", month);
      return true;
    } catch (error) {
      console.error("Error deleting history:", error);
      throw error;
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
      console.log("DEBUG: Created adjustment for account:", accountId);
      return true;
    } catch (error) {
      console.error("Error creating adjustment:", error);
      throw error;
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