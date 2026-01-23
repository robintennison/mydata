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
import styles from "./Online.module.css";

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
      const categoryRef = doc(db, "online_categories", id); // Corrected collection name
      console.log(`Fetching category from: online_categories/${id}`);

      const categoryDoc = await getDoc(categoryRef);

      if (categoryDoc.exists()) {
        const data = categoryDoc.data();
        console.log("Category data:", data);
        setFormData({
          id: categoryDoc.id,
          name: data.name || "",
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      } else {
        console.log("Category not found in online_categories collection");
        alert("Category not found");
        navigate("/online/categories");
      }
    } catch (error) {
      console.error("Error fetching category:", error);
      alert("Failed to load category");
      navigate("/online/categories");
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

      console.log("Saving category data:", categoryData);
      console.log("Collection: online_categories");

      if (isEditing && id) {
        await setDoc(doc(db, "online_categories", id), categoryData, {
          merge: true,
        });
        console.log("Category updated successfully");
        alert("Category updated successfully!");
      } else {
        const docRef = await addDoc(
          collection(db, "online_categories"),
          categoryData,
        );
        console.log("Category added with ID:", docRef.id);
        alert("Category added successfully!");
      }

      navigate("/online/categories");
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading category...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTopRow}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>
              {isEditing ? "Edit Category" : "Add Category"}
            </h1>
            <p className={styles.subtitle}>
              {isEditing ? "Update category details" : "Create a new category"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className={styles.section}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Category Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={styles.input}
              placeholder="Enter category name"
              required
              disabled={saving}
              autoFocus
            />
          </div>

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => navigate("/online/categories")}
              className={styles.cancelButton}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
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
