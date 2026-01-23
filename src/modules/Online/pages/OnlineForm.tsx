import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { OnlineItem, Category } from "../types/online.types";
import styles from "./Online.module.css";

const OnlineForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState<OnlineItem>({
    id: "",
    name: "",
    detail: "",
    category: "",
    image1: "",
    image2: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [image1File, setImage1File] = useState<File | null>(null);
  const [image2File, setImage2File] = useState<File | null>(null);

  useEffect(() => {
    fetchCategories();
    if (isEditing && id) {
      fetchItem();
    }
  }, [id, isEditing]);

  const fetchCategories = async () => {
    try {
      const db = getFirestore();
      const categoriesRef = collection(db, "categories");
      const snapshot = await getDocs(categoriesRef);

      const categoriesList: Category[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        categoriesList.push({
          id: doc.id,
          name: data.name || "",
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });
      categoriesList.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(categoriesList);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchItem = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const db = getFirestore();
      const itemRef = doc(db, "online", id);
      const itemDoc = await getDoc(itemRef);

      if (itemDoc.exists()) {
        const data = itemDoc.data();
        setFormData({
          id: itemDoc.id,
          name: data.name || "",
          detail: data.detail || "",
          category: data.category || "",
          image1: data.image1 || "",
          image2: data.image2 || "",
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      } else {
        alert("Item not found");
        navigate("/online/items");
      }
    } catch (error) {
      console.error("Error fetching item:", error);
      alert("Failed to load item");
      navigate("/online/items");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    // TODO: Implement Firebase Storage upload here
    // For now, return a placeholder URL
    return `https://via.placeholder.com/300x200?text=${encodeURIComponent(file.name)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Item name is required");
      return;
    }

    try {
      setSaving(true);
      const db = getFirestore();

      // Upload images if new files are selected
      let image1Url = formData.image1;
      let image2Url = formData.image2;

      if (image1File) {
        image1Url = await handleImageUpload(image1File);
      }
      if (image2File) {
        image2Url = await handleImageUpload(image2File);
      }

      const itemData = {
        name: formData.name.trim(),
        detail: formData.detail.trim(),
        category: formData.category,
        image1: image1Url,
        image2: image2Url,
        updatedAt: Date.now(),
        ...(isEditing ? {} : { createdAt: Date.now() }),
      };

      if (isEditing && id) {
        await setDoc(doc(db, "online", id), itemData, { merge: true });
        alert("Item updated successfully!");
      } else {
        await addDoc(collection(db, "online"), itemData);
        alert("Item added successfully!");
      }

      navigate("/online/items");
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading item...</p>
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
              {isEditing ? "Edit Item" : "Add Item"}
            </h1>
            <p className={styles.subtitle}>
              {isEditing ? "Update item details" : "Create a new online item"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className={styles.section}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Item Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={styles.input}
              placeholder="Enter item name"
              required
              disabled={saving}
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Category</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className={styles.select}
              disabled={saving}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Details</label>
            <textarea
              value={formData.detail}
              onChange={(e) =>
                setFormData({ ...formData, detail: e.target.value })
              }
              className={styles.textarea}
              placeholder="Enter item details"
              rows={4}
              disabled={saving}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.label}>Image 1</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage1File(e.target.files?.[0] || null)}
                className={styles.fileInput}
                disabled={saving}
              />
              {formData.image1 && !image1File && (
                <div className={styles.imagePreview}>
                  <img
                    src={formData.image1}
                    alt="Preview 1"
                    className={styles.previewImage}
                  />
                  <span className={styles.currentImage}>Current Image</span>
                </div>
              )}
            </div>

            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.label}>Image 2</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage2File(e.target.files?.[0] || null)}
                className={styles.fileInput}
                disabled={saving}
              />
              {formData.image2 && !image2File && (
                <div className={styles.imagePreview}>
                  <img
                    src={formData.image2}
                    alt="Preview 2"
                    className={styles.previewImage}
                  />
                  <span className={styles.currentImage}>Current Image</span>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => navigate("/online/items")}
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

export default OnlineForm;
