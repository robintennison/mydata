// jewellery/hooks/firebaseUtils.ts
import { firestore, storage } from "../../../lib/firebase"; // Use firestore, not db
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  Timestamp 
} from "firebase/firestore";

interface Bill {
  id: string;
  downloadUrl: string;
  mimeType: string;
  notes?: string;
  createdAt: number;
  updatedAt?: number;
}

export const getFirebaseUtils = () => ({
  // Upload image with compression (similar to your Kotlin uploadImage)
  uploadImage: async (file: File): Promise<string> => {
    try {
      // Compress image before upload (you can add compression logic here)
      const compressedFile = await compressImage(file);
      
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `jewellery_images/${timestamp}.${fileExtension}`;
      
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, compressedFile);
      
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },

  // Get bill by ID (similar to your Kotlin getBill)
  getBill: async (billId: string): Promise<Bill | null> => {
    try {
      const billDoc = await getDoc(doc(firestore, "bills", billId)); // Use firestore
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
      console.error("Error getting bill:", error);
      return null;
    }
  },

  // Update bill notes (similar to your Kotlin updateBillNotes)
  updateBillNotes: async (billId: string, notes?: string): Promise<void> => {
    try {
      const billRef = doc(firestore, "bills", billId); // Use firestore
      const updateData = {
        notes: notes || null,
        updatedAt: Timestamp.now(),
      };
      
      await updateDoc(billRef, updateData);
    } catch (error) {
      console.error("Error updating bill notes:", error);
      throw error;
    }
  },

  // Upload bill and create document (similar to your Kotlin uploadBillAndCreateDoc)
  uploadBillAndCreateDoc: async (
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
      };
      
      const docRef = await addDoc(collection(firestore, "bills"), billData); // Use firestore
      return docRef.id;
    } catch (error) {
      console.error("Error uploading bill:", error);
      throw error;
    }
  },
});

// Image compression helper (matches your Kotlin compression)
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions (max 800px)
        let width = img.width;
        let height = img.height;
        const maxSize = 800;
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with 70% quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.7
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};