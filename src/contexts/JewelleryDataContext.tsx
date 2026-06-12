import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { firestore } from "../lib/firebase";
import { Jewellery } from "../modules/Jewellery/models/types";
import { useAuth } from "./AuthContext";
import { 
  uploadImage, 
  getBill, 
  uploadBillAndCreateDoc, 
  updateBillNotes 
} from "../modules/Jewellery/hooks/firebaseUtils";

interface JewelleryDataContextType {
  items: Jewellery[];
  loading: boolean;
  error: string | null;
  addItem: (item: Jewellery) => Promise<string>;
  updateItem: (id: string, item: Jewellery) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  uploadImage: typeof uploadImage;
  getBill: typeof getBill;
  uploadBillAndCreateDoc: typeof uploadBillAndCreateDoc;
  updateBillNotes: typeof updateBillNotes;
  refresh: () => Promise<void>;
}

const JewelleryDataContext = createContext<JewelleryDataContextType | undefined>(undefined);

export const useJewelleryDataContext = () => {
  const context = useContext(JewelleryDataContext);
  if (!context) {
    throw new Error("useJewelleryDataContext must be used within a JewelleryDataProvider");
  }
  return context;
};

interface JewelleryDataProviderProps {
  children: ReactNode;
}

export const JewelleryDataProvider: React.FC<JewelleryDataProviderProps> = ({ children }) => {
  const [items, setItems] = useState<Jewellery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const loadItems = async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const jewelleryRef = collection(firestore, "jewellery");
      const q = query(jewelleryRef, orderBy("code"));
      const querySnapshot = await getDocs(q);
      
      const jewelleryItems: Jewellery[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        jewelleryItems.push({
          id: doc.id,
          code: data.code || "",
          description: data.description || "",
          weight: data.weight || 0,
          location: data.location || "",
          boughtFor: data.boughtFor || "",
          purchaseDate: data.purchaseDate || 0,
          imageUrl: data.imageUrl || "",
          active: data.active !== false,
          billId: data.billId || undefined,
          lastVerified: data.lastVerified || 0,
          verificationStatus: data.verificationStatus || "Not Verified",
          verificationNotes: data.verificationNotes || "",
        });
      });
      
      setItems(jewelleryItems);
    } catch (err) {
      console.error("Error loading jewellery items:", err);
      setError("Failed to load jewellery items");
    } finally {
      setLoading(false);
    }
  };

  const getPurchaseTimestamp = (purchaseDate: number | Date): number => {
    if (purchaseDate instanceof Date) {
      return purchaseDate.getTime();
    }
    return Number(purchaseDate);
  };

  const addItem = async (item: Jewellery): Promise<string> => {
    setLoading(true);
    try {
      const purchaseTimestamp = getPurchaseTimestamp(item.purchaseDate);
      
      const jewelleryData = {
        code: item.code,
        description: item.description,
        weight: item.weight,
        location: item.location,
        boughtFor: item.boughtFor,
        purchaseDate: purchaseTimestamp,
        imageUrl: item.imageUrl || "",
        active: item.active !== false,
        billId: item.billId || null,
        lastVerified: item.lastVerified || 0,
        verificationStatus: item.verificationStatus || "Not Verified",
        verificationNotes: item.verificationNotes || "",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(collection(firestore, "jewellery"), jewelleryData);
      
      // Update the document with its own ID
      await updateDoc(docRef, { id: docRef.id });
      
      // Refresh the list
      await loadItems();
      
      return docRef.id;
    } catch (err) {
      console.error("Error adding jewellery item:", err);
      setError("Failed to add jewellery item");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, item: Jewellery): Promise<void> => {
    setLoading(true);
    try {
      const jewelleryRef = doc(firestore, "jewellery", id);
      
      const purchaseTimestamp = getPurchaseTimestamp(item.purchaseDate);
      
      const updateData = {
        code: item.code,
        description: item.description,
        weight: item.weight,
        location: item.location,
        boughtFor: item.boughtFor,
        purchaseDate: purchaseTimestamp,
        imageUrl: item.imageUrl || "",
        active: item.active !== false,
        billId: item.billId || null,
        lastVerified: item.lastVerified || 0,
        verificationStatus: item.verificationStatus || "Not Verified",
        verificationNotes: item.verificationNotes || "",
        updatedAt: Timestamp.now(),
      };
      
      await updateDoc(jewelleryRef, updateData);
      await loadItems();
    } catch (err) {
      console.error("Error updating jewellery item:", err);
      setError("Failed to update jewellery item");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await deleteDoc(doc(firestore, "jewellery", id));
      await loadItems();
    } catch (err) {
      console.error("Error deleting jewellery item:", err);
      setError("Failed to delete jewellery item");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [isAuthenticated]);

  return (
    <JewelleryDataContext.Provider
      value={{
        items,
        loading,
        error,
        addItem,
        updateItem,
        deleteItem,
        uploadImage,
        getBill,
        uploadBillAndCreateDoc,
        updateBillNotes,
        refresh: loadItems,
      }}
    >
      {children}
    </JewelleryDataContext.Provider>
  );
};
