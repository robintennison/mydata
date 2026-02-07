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

      // Changed from "/jewellery" to "/jewellery/list"
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

      // Changed from "/jewellery" to "/jewellery/list"
      navigate("/jewellery/list");
    } catch (error: any) {
      console.error("Error deleting jewellery item:", error);
      setError(`Failed to delete jewellery item: ${error.message}`);
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    // Changed from "/jewellery" to "/jewellery/list"
    navigate("/jewellery/list");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading jewellery data...</p>
      </div>
    );
  }

  if (error && isEditing && id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md max-w-md w-full p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-2">⚠️</span>
            <strong className="text-lg font-semibold text-gray-900">
              Error
            </strong>
          </div>
          <div className="text-gray-700 mb-6">{error}</div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate("/jewellery/list")} // Changed to list
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Back to List
            </button>
            {isEditing && (
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-blue-500 text-white border border-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
        <button
          onClick={handleCancel}
          className="w-11 h-11 flex items-center justify-center text-2xl text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <div className="text-xl mr-3">⚠️</div>
            <div className="text-red-700">{error}</div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
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
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-700">Deleting jewellery item...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JewelleryFormWrapper;
