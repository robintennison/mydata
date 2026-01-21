import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import JewelleryForm from "./JewelleryForm";
import { Jewellery } from "../models/types";

interface JewelleryFormWrapperProps {
  isEditing?: boolean;
}

const JewelleryFormWrapper: React.FC<JewelleryFormWrapperProps> = ({
  isEditing = false,
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<Partial<Jewellery>>({});
  const [loading, setLoading] = useState(isEditing);
  const db = getFirestore();

  // Fetch jewellery data if editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchJewellery = async () => {
        try {
          const docRef = doc(db, "jewellery", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Don't include id in initialData since it's not part of the form
            setInitialData({
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
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching jewellery:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchJewellery();
    } else {
      setLoading(false);
    }
  }, [isEditing, id, db]);

  const handleSubmit = async (formData: Partial<Jewellery>) => {
    try {
      // Ensure we have required fields
      if (!formData.code || !formData.weight) {
        alert("Code and weight are required!");
        return;
      }

      if (isEditing && id) {
        // Update existing document - don't include id in the update data
        const { id: _, ...updateData } = formData;
        const docRef = doc(db, "jewellery", id);
        await setDoc(
          docRef,
          {
            ...updateData,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
        alert("Jewellery updated successfully!");
      } else {
        // Create new document
        const newDocRef = doc(collection(db, "jewellery"));
        await setDoc(newDocRef, {
          ...formData,
          id: newDocRef.id, // Firestore will store the id separately
          createdAt: new Date().toISOString(),
        });
        alert("Jewellery added successfully!");
      }

      // Navigate back to list
      navigate("/jewellery/list");
    } catch (error) {
      console.error("Error saving jewellery:", error);
      alert("Failed to save jewellery. Please try again.");
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
        }}
      >
        <div>Loading jewellery data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>
        {isEditing ? "Edit Jewellery" : "Add New Jewellery"}
      </h1>
      <JewelleryForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isEditing={isEditing}
      />
    </div>
  );
};

export default JewelleryFormWrapper;
