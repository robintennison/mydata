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
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <div>Loading jewellery data...</div>
      </div>
    );
  }

  if (error && isEditing && id) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorHeader}>
          <span>⚠️</span>
          <strong>Error</strong>
        </div>
        <div style={styles.errorMessage}>{error}</div>
        <div style={styles.errorButtons}>
          <button
            onClick={() => navigate("/jewellery/list")}
            style={styles.errorButton}
          >
            Back to List
          </button>
          {isEditing && (
            <button
              onClick={() => window.location.reload()}
              style={{ ...styles.errorButton, backgroundColor: "#3b82f6" }}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Top Navigation Bar */}
      <div style={styles.topNav}>
        <button
          onClick={handleCancel}
          style={styles.navButton}
          title="Back to List"
        >
          ←
        </button>
        <div style={styles.navTitle}>
          {isEditing ? "Edit Jewellery" : "Add New Jewellery"}
        </div>
        <div style={{ width: "44px" }}></div>
      </div>

      {/* Form Content - This is the main scrollable area */}
      <div style={styles.formContainer}>
        {error && (
          <div style={styles.errorAlert}>
            <div style={styles.errorAlertIcon}>⚠️</div>
            <div>{error}</div>
          </div>
        )}

        <div style={styles.formContentWrapper}>
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
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner}></div>
            <div>Deleting jewellery item...</div>
          </div>
        )}
      </div>

      {/* REMOVED: Bottom spacing div - it was causing extra space */}
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    height: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    backgroundColor: "#fff",
    borderBottom: "1px solid #e5e7eb",
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
    flexShrink: 0,
  },
  navButton: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#374151",
    padding: "6px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
  },
  navTitle: {
    fontSize: "16px",
    fontWeight: "600" as const,
    color: "#111827",
    textAlign: "center" as const,
    flex: 1,
  },
  formContainer: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "16px",
    position: "relative" as const,
    // REMOVED: paddingBottom: "80px" - Let the form handle its own padding
  },
  formContentWrapper: {
    maxWidth: "600px",
    margin: "0 auto",
    width: "100%",
    // REMOVED: paddingBottom: "20px" - Let the form handle its own padding
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    gap: "16px",
  },
  spinner: {
    border: "4px solid #f3f4f6",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
  },
  loadingOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  errorContainer: {
    padding: "20px",
    maxWidth: "600px",
    margin: "0 auto",
  },
  errorHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    fontSize: "18px",
    color: "#dc2626",
  },
  errorMessage: {
    margin: "12px 0",
    color: "#6b7280",
  },
  errorButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "16px",
  },
  errorButton: {
    padding: "10px 20px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  errorAlert: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "14px",
    color: "#dc2626",
  },
  errorAlertIcon: {
    fontSize: "16px",
    flexShrink: 0,
  },
};

// Add CSS animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Add this for mobile spacing */
  @media (max-width: 768px) {
    .jewellery-form-container {
      padding-bottom: 20px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default JewelleryFormWrapper;
