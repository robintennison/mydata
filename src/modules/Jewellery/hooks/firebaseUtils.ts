// jewellery/utils/firebaseUtils.ts
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../../../lib/firebase";
import { Bill } from "../models/types";

// Upload image with compression - matching your Kotlin uploadImage function
export const uploadImage = async (file: File): Promise<string> => {
  try {
    // Generate UUID for filename
    const fileName = `${generateUUID()}.jpg`;
    const imageRef = ref(storage, `jewellery_images/${fileName}`);

    console.log(`Uploading to path: jewellery_images/${fileName}`);

    // Upload the file
    await uploadBytes(imageRef, file);

    // Get download URL
    const downloadUri = await getDownloadURL(imageRef);
    return downloadUri.toString();
  } catch (e) {
    console.error("Exception during upload", e);
    throw new Error("Failed to upload image");
  }
};

// Update bill notes - matching your Kotlin updateBillNotes
export const updateBillNotes = async (billId: string, notes?: string): Promise<void> => {
  try {
    const updateData = {
      notes: notes || null,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(doc(firestore, "bills", billId), updateData);
  } catch (e) {
    console.error("Error updating bill notes", e);
    throw e;
  }
};

// Get bill by ID - matching your Kotlin getBill
export const getBill = async (billId: string): Promise<Bill | null> => {
  try {
    const snap = await getDoc(doc(firestore, "bills", billId));
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        downloadUrl: data.downloadUrl,
        mimeType: data.mimeType,
        notes: data.notes || undefined, // Convert null to undefined
        createdAt: data.createdAt?.toMillis() || data.createdAt || 0,
        updatedAt: data.updatedAt?.toMillis() || data.updatedAt,
      };
    }
    return null;
  } catch (e) {
    console.error("Error getting bill", e);
    throw e;
  }
};

// Upload bill and create document - matching your Kotlin uploadBillAndCreateDoc
export const uploadBillAndCreateDoc = async (
  file: File,
  notes?: string
): Promise<string> => {
  try {
    const mime = file.type || "application/octet-stream";
    const ext = mime === "application/pdf" 
      ? "pdf" 
      : mime.startsWith("image/") 
        ? mime.split('/')[1] || "jpg" 
        : "bin";

    const fileName = `${generateUUID()}.${ext}`;
    const storageRef = ref(storage, `bills/${fileName}`);

    // Upload the file
    await uploadBytes(storageRef, file);
    const httpsUrl = await getDownloadURL(storageRef);

    const billData = {
      downloadUrl: httpsUrl,
      mimeType: mime,
      createdAt: Timestamp.now(),
      notes: notes || null,
    };

    const docRef = await addDoc(collection(firestore, "bills"), billData);
    return docRef.id;
  } catch (e) {
    console.error("Error uploading bill", e);
    throw e;
  }
};

// Utility to generate UUID (since crypto.randomUUID might not be available everywhere)
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};