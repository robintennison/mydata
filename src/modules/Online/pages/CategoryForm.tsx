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
import { Category } from "../types/online.types";
import { onlineStyles } from "../styles/onlineStyles";

const CategoryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState<Category>({
    id: "",
    name: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      fetchCategory();
    }
  }, [id, isEditing]);

  const fetchCategory = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const db = getFirestore();
      const categoryRef = doc(db, "online_categories", id);
      const categoryDoc = await getDoc(categoryRef);

      if (categoryDoc.exists()) {
        const data = categoryDoc.data();
        setFormData({
          id: categoryDoc.id,
          name: data.name || "",
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      } else {
        alert("Category not found");
        navigate("/online", { state: { activeTab: "categories" } }); // UPDATED
      }
    } catch (error) {
      console.error("Error fetching category:", error);
      alert("Failed to load category");
      navigate("/online", { state: { activeTab: "categories" } }); // UPDATED
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Category name is required");
      return;
    }

    try {
      setSaving(true);
      const db = getFirestore();
      const categoryData = {
        name: formData.name.trim(),
        updatedAt: Date.now(),
        ...(isEditing ? {} : { createdAt: Date.now() }),
      };

      if (isEditing && id) {
        await setDoc(doc(db, "online_categories", id), categoryData, {
          merge: true,
        });
        alert("Category updated successfully!");
      } else {
        await addDoc(collection(db, "online_categories"), categoryData);
        alert("Category added successfully!");
      }

      navigate("/online", { state: { activeTab: "categories" } }); // UPDATED
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={onlineStyles.container}>
        <div style={onlineStyles.loading}>
          <div style={onlineStyles.spinner}></div>
          <p>Loading category...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={onlineStyles.container}>
      {/* Top Navigation */}
      <div style={onlineStyles.topNav}>
        <button
          onClick={() =>
            navigate("/online", { state: { activeTab: "categories" } })
          } // UPDATED
          style={onlineStyles.navButton}
          title="Back"
        >
          ←
        </button>
        <div style={onlineStyles.headerLeft}>
          <div style={onlineStyles.navTitle}>
            {isEditing ? "Edit Category" : "Add Category"}
          </div>
          <div style={onlineStyles.navSubtitle}>
            {isEditing ? "Update category details" : "Create a new category"}
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={onlineStyles.section}>
        <form onSubmit={handleSubmit} style={onlineStyles.form}>
          <div style={onlineStyles.formGroup}>
            <label style={onlineStyles.label}>Category Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              style={onlineStyles.input}
              placeholder="Enter category name"
              required
              disabled={saving}
              autoFocus
            />
          </div>

          {/* Form Actions */}
          <div style={onlineStyles.formActions}>
            <button
              type="button"
              onClick={() =>
                navigate("/online", { state: { activeTab: "categories" } })
              } // UPDATED
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

export default CategoryForm;
