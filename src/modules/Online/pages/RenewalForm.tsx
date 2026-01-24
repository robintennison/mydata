import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { Renewal } from "../types/online.types";
import { onlineStyles } from "../styles/onlineStyles";

const RenewalForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState<Renewal>({
    id: "",
    name: "",
    startDate: Date.now(),
    endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    comments: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      fetchRenewal();
    }
  }, [id, isEditing]);

  const fetchRenewal = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const db = getFirestore();
      const renewalRef = doc(db, "renewals", id);
      const renewalDoc = await getDoc(renewalRef);

      if (renewalDoc.exists()) {
        const data = renewalDoc.data();
        setFormData({
          id: renewalDoc.id,
          name: data.name || "",
          startDate: data.startDate || Date.now(),
          endDate: data.endDate || Date.now(),
          comments: data.comments || "",
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      } else {
        alert("Renewal not found");
        navigate("/online"); // CHANGED: from "/online/renewals" to "/online"
      }
    } catch (error) {
      console.error("Error fetching renewal:", error);
      alert("Failed to load renewal");
      navigate("/online"); // CHANGED: from "/online/renewals" to "/online"
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Renewal name is required");
      return;
    }

    if (formData.endDate <= formData.startDate) {
      alert("End date must be after start date");
      return;
    }

    try {
      setSaving(true);
      const db = getFirestore();

      const renewalData = {
        name: formData.name.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        comments: formData.comments?.trim() || "",
        updatedAt: Date.now(),
        ...(isEditing ? {} : { createdAt: Date.now() }),
      };

      if (isEditing && id) {
        await setDoc(doc(db, "renewals", id), renewalData, { merge: true });
        alert("Renewal updated successfully!");
      } else {
        await addDoc(collection(db, "renewals"), renewalData);
        alert("Renewal added successfully!");
      }

      navigate("/online"); // CHANGED: from "/online/renewals" to "/online"
    } catch (error) {
      console.error("Error saving renewal:", error);
      alert("Failed to save renewal");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={onlineStyles.container}>
        <div style={onlineStyles.loading}>
          <div style={onlineStyles.spinner}></div>
          <p>Loading renewal...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={onlineStyles.container}>
      {/* Top Navigation with Save button */}
      <div style={onlineStyles.topNav}>
        <button
          onClick={() => navigate("/online")} // CHANGED: from "/online/renewals" to "/online"
          style={onlineStyles.navButton}
          title="Back"
        >
          ←
        </button>
        <div style={onlineStyles.headerLeft}>
          <div style={onlineStyles.navTitle}>
            {isEditing ? "Edit Renewal" : "Add Renewal"}
          </div>
          <div style={onlineStyles.navSubtitle}>
            {isEditing ? "Update renewal details" : "Create a new renewal"}
          </div>
        </div>
        <div style={onlineStyles.headerRight}>
          <button
            type="submit"
            form="renewal-form" // Connect to the form
            style={onlineStyles.addButton}
            disabled={saving}
          >
            {saving ? "Saving..." : isEditing ? "Update" : "Save"}
          </button>
        </div>
      </div>

      {/* Form */}
      <div style={onlineStyles.section}>
        <form
          id="renewal-form"
          onSubmit={handleSubmit}
          style={onlineStyles.form}
        >
          <div style={onlineStyles.formGroup}>
            <label style={onlineStyles.label}>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              style={onlineStyles.input}
              placeholder="Enter renewal name"
              required
              disabled={saving}
              autoFocus
            />
          </div>

          <div style={onlineStyles.formRow}>
            <div style={{ ...onlineStyles.formGroup, flex: 1 }}>
              <label style={onlineStyles.label}>Start Date *</label>
              <input
                type="date"
                value={new Date(formData.startDate).toISOString().split("T")[0]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startDate: new Date(e.target.value).getTime(),
                  })
                }
                style={onlineStyles.input}
                required
                disabled={saving}
              />
            </div>

            <div style={{ ...onlineStyles.formGroup, flex: 1 }}>
              <label style={onlineStyles.label}>End Date *</label>
              <input
                type="date"
                value={new Date(formData.endDate).toISOString().split("T")[0]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endDate: new Date(e.target.value).getTime(),
                  })
                }
                style={onlineStyles.input}
                required
                disabled={saving}
              />
            </div>
          </div>

          <div style={onlineStyles.formGroup}>
            <label style={onlineStyles.label}>Comments</label>
            <textarea
              value={formData.comments || ""}
              onChange={(e) =>
                setFormData({ ...formData, comments: e.target.value })
              }
              style={onlineStyles.textarea}
              placeholder="Enter any comments or notes"
              rows={3}
              disabled={saving}
            />
          </div>

          {/* Form Actions - Removed the bottom buttons */}
          <div
            style={{
              ...onlineStyles.formActions,
              display: "none", // Hide bottom buttons since we have top button
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/online")} // CHANGED: from "/online/renewals" to "/online"
              style={onlineStyles.cancelButton}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={onlineStyles.submitButton}
              disabled={saving}
            >
              {saving ? "Saving..." : isEditing ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenewalForm;
