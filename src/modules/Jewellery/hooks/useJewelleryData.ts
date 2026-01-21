import { useState, useEffect } from "react";
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
import { firestore } from "../../../lib/firebase";
import { Jewellery } from "../models/types";
import { 
  uploadImage, 
  getBill, 
  uploadBillAndCreateDoc, 
  updateBillNotes 
} from "../hooks/firebaseUtils";

export const useJewelleryData = () => {
  const [items, setItems] = useState<Jewellery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all jewellery items from Firestore
  const loadItems = async () => {
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

  // Helper to safely convert purchase date to timestamp
  const getPurchaseTimestamp = (purchaseDate: number | Date): number => {
    if (purchaseDate instanceof Date) {
      return purchaseDate.getTime();
    }
    return Number(purchaseDate);
  };

  // Add a new jewellery item
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

  // Update an existing jewellery item
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

  // Delete a jewellery item
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

  // Export the imported functions directly
  const firebaseUtils = {
    uploadImage,
    getBill,
    uploadBillAndCreateDoc,
    updateBillNotes,
  };

  useEffect(() => {
    loadItems();
  }, []);

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    ...firebaseUtils, // Spread the Firebase utils
    refresh: loadItems,
  };
};