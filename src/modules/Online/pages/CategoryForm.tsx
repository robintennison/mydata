import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  deleteDoc,
} from "firebase/firestore";
import { Category } from "../types/online.types";
import { useSettings } from "../../../contexts/SettingsContext";

const CategoryForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const { settings } = useSettings();
  const showDelete = settings?.showDelete || false;

  const getModeFromPath = (): "add" | "edit" | "view" => {
    const path = location.pathname;

    if (path.includes("/online/categories/add")) return "add";
    if (path.includes("/online/categories/edit/")) return "edit";
    if (path.includes("/online/categories/view/")) return "view";

    return id ? "view" : "add";
  };

  const mode = getModeFromPath();
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";
  const isViewMode = mode === "view";

  // If showDelete is false and we're in edit mode, redirect to view mode
  useEffect(() => {
    if (isEditMode && !showDelete && id) {
      navigate(`/online/categories/view/${id}`, { replace: true });
    }
  }, [isEditMode, showDelete, id, navigate]);

  const [formData, setFormData] = useState<Category>({
    id: "",
    name: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCategory();
    } else {
      setFormData({
        id: "",
        name: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }, [id, location.pathname]);

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
        ...(isAddMode ? { createdAt: Date.now() } : {}),
      };

      if (isEditMode && id) {
        await setDoc(doc(db, "online_categories", id), categoryData, {
          merge: true,
        });
        alert("Category updated successfully!");
      } else if (isAddMode) {
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

  const handleDelete = async () => {
    if (!id) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this category? This action cannot be undone.",
    );

    if (!confirmDelete) return;

    try {
      setSaving(true);
      const db = getFirestore();
      await deleteDoc(doc(db, "online_categories", id));
      alert("Category deleted successfully!");
      navigate("/online", { state: { activeTab: "categories" } });
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
      setSaving(false);
    }
  };

  const getPageTitle = () => {
    if (isAddMode) return "Add Category";
    if (isEditMode) return "Edit Category";
    if (isViewMode) return "View Category";
    return "Category Details";
  };

  const getPageSubtitle = () => {
    if (isAddMode) return "Create a new category";
    if (isEditMode) return "Update category details";
    if (isViewMode) return "View category details";
    return "";
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return "Unknown";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid date";
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } catch (error) {
      return "Error formatting date";
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() =>
                navigate("/online", { state: { activeTab: "categories" } })
              }
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Back"
            >
              ←
            </button>
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading category...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() =>
                navigate("/online", { state: { activeTab: "categories" } })
              }
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Back"
            >
              ←
            </button>
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
              <p className="text-sm text-gray-500">{getPageSubtitle()}</p>
            </div>
          </div>

          {/* EDIT button in header - Only show in view mode AND when showDelete is true */}
          {isViewMode && showDelete && (
            <button
              onClick={() =>
                navigate(`/online/categories/edit/${id}`, {
                  state: { returnTo: "/online", activeTab: "categories" },
                })
              }
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Edit this category"
            >
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      {/* Form/View Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name {!isViewMode && "*"}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  !isViewMode &&
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isViewMode ? "bg-gray-50 cursor-default" : "bg-white"
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="Enter category name"
                required={!isViewMode}
                disabled={isViewMode || saving}
                readOnly={isViewMode}
                autoFocus={!isViewMode}
              />
            </div>

            {/* Timestamps - Show in View mode */}
            {isViewMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Created
                  </label>
                  <div className="text-sm text-gray-900">
                    {formatDate(formData.createdAt)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Last Updated
                  </label>
                  <div className="text-sm text-gray-900">
                    {formatDate(formData.updatedAt)}
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions - Only show when NOT in view mode AND (is add mode OR showDelete is true for edit mode) */}
            {!isViewMode && (isAddMode || (isEditMode && showDelete)) && (
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/online", {
                        state: { activeTab: "categories" },
                      })
                    }
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  {/* DELETE Button - Only show in edit mode and when showDelete is true */}
                  {isEditMode && showDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                      disabled={saving}
                    >
                      {saving ? "Deleting..." : "Delete"}
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : isAddMode
                        ? "Add Category"
                        : "Update Category"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;
