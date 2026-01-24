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
import { onlineStyles } from "../styles/onlineStyles";

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
      const categoriesRef = collection(db, "online_categories");
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
          category: data.category || "", // This should be the category name
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
    // TODO: Implement Firebase Storage upload
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
        category: formData.category, // This will now be the category name
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
      <div style={onlineStyles.container}>
        <div style={onlineStyles.loading}>
          <div style={onlineStyles.spinner}></div>
          <p>Loading item...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={onlineStyles.container}>
      {/* Top Navigation */}
      <div style={onlineStyles.topNav}>
        <button
          onClick={() => navigate("/online/items")}
          style={onlineStyles.navButton}
          title="Back"
        >
          ←
        </button>
        <div style={onlineStyles.headerLeft}>
          <div style={onlineStyles.navTitle}>
            {isEditing ? "Edit Item" : "Add Item"}
          </div>
          <div style={onlineStyles.navSubtitle}>
            {isEditing ? "Update item details" : "Create a new online item"}
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={onlineStyles.section}>
        <form onSubmit={handleSubmit} style={onlineStyles.form}>
          <div style={onlineStyles.formGroup}>
            <label style={onlineStyles.label}>Item Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              style={onlineStyles.input}
              placeholder="Enter item name"
              required
              disabled={saving}
              autoFocus
            />
          </div>

          <div style={onlineStyles.formGroup}>
            <label style={onlineStyles.label}>Category</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              style={onlineStyles.select}
              disabled={saving}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {" "}
                  {/* CHANGED HERE: value={cat.name} instead of value={cat.id} */}
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div style={onlineStyles.formGroup}>
            <label style={onlineStyles.label}>Details</label>
            <textarea
              value={formData.detail}
              onChange={(e) =>
                setFormData({ ...formData, detail: e.target.value })
              }
              style={onlineStyles.textarea}
              placeholder="Enter item details"
              rows={4}
              disabled={saving}
            />
          </div>

          <div style={onlineStyles.formRow}>
            <div style={{ ...onlineStyles.formGroup, flex: 1 }}>
              <label style={onlineStyles.label}>Image 1</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage1File(e.target.files?.[0] || null)}
                style={onlineStyles.fileInput}
                disabled={saving}
              />
              {formData.image1 && !image1File && (
                <div style={{ marginTop: "10px", textAlign: "center" }}>
                  <img
                    src={formData.image1}
                    alt="Preview 1"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "150px",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "5px",
                    }}
                  >
                    Current Image
                  </div>
                </div>
              )}
            </div>

            <div style={{ ...onlineStyles.formGroup, flex: 1 }}>
              <label style={onlineStyles.label}>Image 2</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage2File(e.target.files?.[0] || null)}
                style={onlineStyles.fileInput}
                disabled={saving}
              />
              {formData.image2 && !image2File && (
                <div style={{ marginTop: "10px", textAlign: "center" }}>
                  <img
                    src={formData.image2}
                    alt="Preview 2"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "150px",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "5px",
                    }}
                  >
                    Current Image
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div style={onlineStyles.formActions}>
            <button
              type="button"
              onClick={() => navigate("/online/items")}
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

export default OnlineForm;
