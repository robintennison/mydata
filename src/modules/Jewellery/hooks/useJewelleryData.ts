import { useState, useEffect } from "react";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../../../lib/firebase";
import { Jewellery } from "../models/types";

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
          billId: data.billId || null,
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

  // Helper function to convert purchaseDate to timestamp
  const convertPurchaseDate = (purchaseDate: number | Date): number => {
    if (purchaseDate instanceof Date) {
      return purchaseDate.getTime();
    }
    // If it's already a timestamp (number), return it
    return Number(purchaseDate);
  };

  // Add a new jewellery item
  const addItem = async (item: Jewellery): Promise<string> => {
    setLoading(true);
    try {
      const purchaseDate = convertPurchaseDate(item.purchaseDate);
      
      const jewelleryData = {
        code: item.code,
        description: item.description,
        weight: item.weight,
        location: item.location,
        boughtFor: item.boughtFor,
        purchaseDate: purchaseDate,
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
      
      const purchaseDate = convertPurchaseDate(item.purchaseDate);
      
      const updateData = {
        code: item.code,
        description: item.description,
        weight: item.weight,
        location: item.location,
        boughtFor: item.boughtFor,
        purchaseDate: purchaseDate,
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

  // Upload image to Firebase Storage
  const uploadImage = async (file: File): Promise<string> => {
    try {
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `jewellery_images/${timestamp}.${fileExtension}`;
      
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image");
    }
  };

  // Get bill by ID
  const getBill = async (billId: string) => {
    try {
      const billDoc = await getDoc(doc(firestore, "bills", billId));
      if (billDoc.exists()) {
        const data = billDoc.data();
        return {
          id: billDoc.id,
          downloadUrl: data.downloadUrl,
          mimeType: data.mimeType,
          notes: data.notes,
          createdAt: data.createdAt?.toMillis() || 0,
          updatedAt: data.updatedAt?.toMillis(),
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching bill:", error);
      return null;
    }
  };

  // Upload bill file
  const uploadBillAndCreateDoc = async (
    file: File,
    notes?: string
  ): Promise<string> => {
    try {
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'pdf';
      const fileName = `bills/${timestamp}.${fileExtension}`;
      
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      
      const downloadURL = await getDownloadURL(storageRef);
      
      const billData = {
        downloadUrl: downloadURL,
        mimeType: file.type,
        notes: notes || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(collection(firestore, "bills"), billData);
      return docRef.id;
    } catch (error) {
      console.error("Error uploading bill:", error);
      throw new Error("Failed to upload bill");
    }
  };

  // Update bill notes
  const updateBillNotes = async (billId: string, notes?: string): Promise<void> => {
    try {
      const billRef = doc(firestore, "bills", billId);
      const updateData = {
        notes: notes || null,
        updatedAt: Timestamp.now(),
      };
      
      await updateDoc(billRef, updateData);
    } catch (error) {
      console.error("Error updating bill notes:", error);
      throw new Error("Failed to update bill notes");
    }
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
    uploadImage,
    getBill,
    uploadBillAndCreateDoc,
    updateBillNotes,
    refresh: loadItems,
  };
};