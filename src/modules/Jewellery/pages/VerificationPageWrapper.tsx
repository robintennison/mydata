import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import VerificationPage from "./VerificationPage";
import { Jewellery, VerificationStatusType } from "../models/types";

// Initialize Firestore
const db = getFirestore();

const VerificationPageWrapper: React.FC = () => {
  const [jewelleryItems, setJewelleryItems] = useState<Jewellery[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch jewellery items from Firestore
  useEffect(() => {
    const fetchJewellery = async () => {
      try {
        const jewelleryRef = collection(db, "jewellery");
        const snapshot = await getDocs(jewelleryRef);

        const items: Jewellery[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id, // Always include document ID
            code: data.code || "",
            description: data.description || "",
            weight: data.weight || 0,
            location: data.location || "",
            boughtFor: data.boughtFor || "",
            purchaseDate: data.purchaseDate || 0,
            imageUrl: data.imageUrl || "",
            active: data.active !== false,
            billId: data.billId,
            lastVerified: data.lastVerified || 0,
            verificationStatus: data.verificationStatus || "Not Verified",
            verificationNotes: data.verificationNotes || "",
          });
        });

        setJewelleryItems(items);
      } catch (error) {
        console.error("Error fetching jewellery from Firestore:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJewellery();
  }, []);

  // Handle updating verification status
  const handleUpdateVerification = async (
    id: string,
    status: VerificationStatusType,
    notes?: string,
  ) => {
    try {
      const jewelleryRef = doc(db, "jewellery", id);
      await updateDoc(jewelleryRef, {
        verificationStatus: status,
        verificationNotes: notes || "",
        lastVerified: status === "Not Verified" ? 0 : Date.now(),
      });

      // Update local state
      setJewelleryItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                verificationStatus: status,
                verificationNotes: notes || "",
                lastVerified: status === "Not Verified" ? 0 : Date.now(),
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("Error updating verification:", error);
    }
  };

  // Handle bulk updates
  const handleBulkUpdate = async (
    location: string,
    status: VerificationStatusType,
  ) => {
    try {
      // Find all items in the location
      const itemsInLocation = jewelleryItems.filter(
        (item) =>
          item.location === location && item.verificationStatus !== status,
      );

      // Update each item in Firestore
      const updates = itemsInLocation.map(async (item) => {
        const jewelleryRef = doc(db, "jewellery", item.id);
        await updateDoc(jewelleryRef, {
          verificationStatus: status,
          verificationNotes: "",
          lastVerified: status === "Not Verified" ? 0 : Date.now(),
        });
        return item.id;
      });

      await Promise.all(updates);

      // Update local state
      setJewelleryItems((prev) =>
        prev.map((item) =>
          item.location === location && item.verificationStatus !== status
            ? {
                ...item,
                verificationStatus: status,
                verificationNotes: "",
                lastVerified: status === "Not Verified" ? 0 : Date.now(),
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("Error in bulk update:", error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
        }}
      >
        <div>Loading jewellery data...</div>
      </div>
    );
  }

  return (
    <VerificationPage
      jewelleryItems={jewelleryItems}
      onUpdateVerification={handleUpdateVerification}
      onBulkUpdate={handleBulkUpdate}
    />
  );
};

export default VerificationPageWrapper;
