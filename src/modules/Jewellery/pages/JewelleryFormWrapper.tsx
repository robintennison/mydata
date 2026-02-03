import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import JewelleryForm from "./JewelleryForm";
import { Jewellery } from "../models/types";
import { useSettings } from "../../../contexts/SettingsContext";
import { tw } from "../../../utils/tailwindMapping";

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
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore();

  // Get settings data
  const { settings } = useSettings();

  // Fetch jewellery data if editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchJewellery = async () => {
        try {
          const docRef = doc(db, "jewellery", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
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
            setError("Jewellery item not found");
          }
        } catch (error) {
          console.error("Error fetching jewellery:", error);
          setError("Failed to load jewellery item");
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
      setError(null);

      if (!formData.code || !formData.weight) {
        alert("Code and weight are required!");
        return;
      }

      if (isEditing && id) {
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
        const newDocRef = doc(collection(db, "jewellery"));
        await setDoc(newDocRef, {
          ...formData,
          id: newDocRef.id,
          createdAt: new Date().toISOString(),
        });
        alert("Jewellery added successfully!");
      }

      navigate("/jewellery/list");
    } catch (error) {
      console.error("Error saving jewellery:", error);
      setError("Failed to save jewellery. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    if (
      !window.confirm(
        `Are you sure you want to delete "${initialData.code}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      const docRef = doc(db, "jewellery", id);
      await deleteDoc(docRef);

      console.log("Jewellery item deleted successfully");
      alert("Jewellery item deleted successfully!");

      navigate("/jewellery/list");
    } catch (error: any) {
      console.error("Error deleting jewellery item:", error);
      setError(`Failed to delete jewellery item: ${error.message}`);
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    navigate("/jewellery/list");
  };

  if (loading) {
    return (
      <div className={tw.loading}>
        <div className={tw.spinner}></div>
        <p>Loading jewellery data...</p>
      </div>
    );
  }

  if (error && isEditing && id) {
    return (
      <div className={tw.errorContainer}>
        <div className={tw.errorHeader}>
          <span>⚠️</span>
          <strong>Error</strong>
        </div>
        <div className={tw.errorMessage}>{error}</div>
        <div className={tw.errorButtons}>
          <button
            onClick={() => navigate("/jewellery/list")}
            className={tw.errorButton}
          >
            Back to List
          </button>
          {isEditing && (
            <button
              onClick={() => window.location.reload()}
              className={`${tw.errorButton} bg-blue-500 text-white border-blue-500 hover:bg-blue-600`}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className={tw.topNav}>
        <button
          onClick={handleCancel}
          className={tw.navButton}
          title="Back to List"
        >
          ←
        </button>
        <div className="text-lg font-semibold text-gray-900 flex-1 text-center">
          {isEditing ? "Edit Jewellery" : "Add New Jewellery"}
        </div>
        <div style={{ width: "44px" }}></div>
      </div>

      {/* Form Content - This is the main scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 relative">
        {error && (
          <div className={tw.errorAlert}>
            <div className={tw.errorAlertIcon}>⚠️</div>
            <div>{error}</div>
          </div>
        )}

        <div className={tw.formContentWrapper}>
          <JewelleryForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onDelete={
              isEditing && settings?.showDelete ? handleDelete : undefined
            }
            isEditing={isEditing}
            onCancel={handleCancel}
            showDelete={isEditing && settings?.showDelete ? true : false}
          />
        </div>

        {/* Loading overlay for delete */}
        {deleting && (
          <div className={tw.loadingOverlay}>
            <div className={tw.spinner}></div>
            <p className="mt-2">Deleting jewellery item...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JewelleryFormWrapper;
