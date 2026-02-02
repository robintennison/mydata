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
        navigate("/online", { state: { activeTab: "categories" } });
      }
    } catch (error) {
      console.error("Error fetching category:", error);
      alert("Failed to load category");
      navigate("/online", { state: { activeTab: "categories" } });
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

      navigate("/online", { state: { activeTab: "categories" } });
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() =>
                navigate("/online", { state: { activeTab: "categories" } })
              }
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditing ? "Edit Category" : "Add Category"}
              </h1>
              <p className="text-sm text-gray-500">
                {isEditing
                  ? "Update category details"
                  : "Create a new category"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter category name"
              required
              disabled={saving}
              autoFocus
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() =>
                navigate("/online", { state: { activeTab: "categories" } })
              }
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
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
