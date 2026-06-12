import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { useError } from "./ErrorContext";
import { OnlineItem, Category, Renewal, FILE_TYPES } from "../modules/Online/types/online.types";

interface OnlineDataContextType {
  loading: boolean;
  items: OnlineItem[];
  categories: Category[];
  renewals: Renewal[];
  refresh: () => Promise<void>;
}

const OnlineDataContext = createContext<OnlineDataContextType | undefined>(undefined);

export const useOnlineDataContext = () => {
  const context = useContext(OnlineDataContext);
  if (!context) {
    throw new Error("useOnlineDataContext must be used within an OnlineDataProvider");
  }
  return context;
};

interface OnlineDataProviderProps {
  children: ReactNode;
}

export const OnlineDataProvider: React.FC<OnlineDataProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<OnlineItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const { setError } = useError();
  const { isAuthenticated } = useAuth();

  const loadAllData = async () => {
    if (!isAuthenticated) {
      setItems([]);
      setCategories([]);
      setRenewals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const db = getFirestore();
      
      const [categoriesSnap, itemsSnap, renewalsSnap] = await Promise.all([
        getDocs(collection(db, "online_categories")),
        getDocs(collection(db, "online")),
        getDocs(collection(db, "renewals")),
      ]);

      // Parse categories
      const categoriesList: Category[] = categoriesSnap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || "",
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt,
      }));

      // Parse items (handle legacy image fields)
      const itemsList: OnlineItem[] = [];
      itemsSnap.docs.forEach((doc) => {
        const data = doc.data();
        const hasOldImageFields = data.image1 !== undefined || data.image2 !== undefined;

        itemsList.push({
          id: doc.id,
          name: data.name || "",
          detail: data.detail || "",
          category: data.category || "",
          startDate: data.startDate !== undefined ? data.startDate : null,
          endDate: data.endDate !== undefined ? data.endDate : null,
          file1: data.file1 || data.image1 || "",
          file2: data.file2 || data.image2 || "",
          file1Type: data.file1Type || (data.image1 ? FILE_TYPES.IMAGE : FILE_TYPES.NONE),
          file2Type: data.file2Type || (data.image2 ? FILE_TYPES.IMAGE : FILE_TYPES.NONE),
          file1Name: data.file1Name || (hasOldImageFields && data.image1 ? "Legacy Image" : ""),
          file2Name: data.file2Name || (hasOldImageFields && data.image2 ? "Legacy Image" : ""),
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });
      itemsList.sort((a, b) => a.name.localeCompare(b.name));

      // Parse renewals
      const renewalsList: Renewal[] = renewalsSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "",
          startDate: data.startDate || 0,
          endDate: data.endDate || 0,
          comments: data.comments || "",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });

      setCategories(categoriesList);
      setItems(itemsList);
      setRenewals(renewalsList);
    } catch (error) {
      console.error("Error loading online data:", error);
      setError("Failed to load online data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [isAuthenticated, setError]);

  return (
    <OnlineDataContext.Provider
      value={{
        loading,
        items,
        categories,
        renewals,
        refresh: loadAllData,
      }}
    >
      {children}
    </OnlineDataContext.Provider>
  );
};
