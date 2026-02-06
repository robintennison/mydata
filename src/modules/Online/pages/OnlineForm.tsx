import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { OnlineItem, Category } from "../types/online.types";
import { useSettings } from "../../../contexts/SettingsContext";

// Helper function to safely parse timestamps
const parseTimestamp = (timestamp: any): number => {
  if (typeof timestamp === "number") {
    return timestamp;
  }
  if (timestamp && typeof timestamp.toDate === "function") {
    return timestamp.toDate().getTime();
  }
  if (typeof timestamp === "string") {
    const parsed = Date.parse(timestamp);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return Date.now();
};

const OnlineForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const { settings } = useSettings();
  const showDelete = settings?.showDelete || false; // Get showDelete setting
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getModeFromPath = (): "add" | "edit" | "view" => {
    const path = location.pathname;

    if (path.includes("/online/items/add")) return "add";
    if (path.includes("/online/items/edit/")) return "edit";
    if (path.includes("/online/items/view/")) return "view";

    return id ? "view" : "add";
  };

  const mode = getModeFromPath();
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";
  const isViewMode = mode === "view";

  const [formData, setFormData] = useState<Partial<OnlineItem>>({
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
    if (id) {
      fetchItem();
    } else {
      setFormData({
        id: "",
        name: "",
        detail: "",
        category: "",
        image1: "",
        image2: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setImage1File(null);
      setImage2File(null);
    }
  }, [id, location.pathname]);

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
          createdAt: parseTimestamp(data.createdAt),
          updatedAt: parseTimestamp(data.updatedAt),
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
          createdAt: parseTimestamp(data.createdAt),
          updatedAt: parseTimestamp(data.updatedAt),
        });
        setImage1File(null);
        setImage2File(null);
      } else {
        alert("Item not found");
        navigate("/online", { state: { activeTab: "items" } });
      }
    } catch (error) {
      console.error("Error fetching item:", error);
      alert("Failed to load item");
      navigate("/online", { state: { activeTab: "items" } });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    return `https://via.placeholder.com/300x200?text=${encodeURIComponent(file.name)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      alert("Item name is required");
      return;
    }

    try {
      setSaving(true);
      const db = getFirestore();

      let image1Url = formData.image1 || "";
      let image2Url = formData.image2 || "";

      if (image1File) {
        image1Url = await handleImageUpload(image1File);
      }
      if (image2File) {
        image2Url = await handleImageUpload(image2File);
      }

      const itemData = {
        name: (formData.name || "").trim(),
        detail: (formData.detail || "").trim(),
        category: formData.category || "",
        image1: image1Url,
        image2: image2Url,
        updatedAt: new Date(),
        ...(isAddMode ? { createdAt: new Date() } : {}),
      };

      if (isEditMode && id) {
        await setDoc(doc(db, "online", id), itemData, { merge: true });
        alert("Item updated successfully!");
      } else if (isAddMode) {
        await addDoc(collection(db, "online"), itemData);
        alert("Item added successfully!");
      }

      navigate("/online", { state: { activeTab: "items" } });
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item? This action cannot be undone.",
    );

    if (!confirmDelete) return;

    try {
      setSaving(true);
      const db = getFirestore();
      await deleteDoc(doc(db, "online", id));
      alert("Item deleted successfully!");
      navigate("/online", { state: { activeTab: "items" } });
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
      setSaving(false);
    }
  };

  const getPageTitle = () => {
    if (isAddMode) return "Add Item";
    if (isEditMode) return "Edit Item";
    if (isViewMode) return "View Item";
    return "Item Details";
  };

  const getPageSubtitle = () => {
    if (isAddMode) return "Create a new online item";
    if (isEditMode) return "Update item details";
    if (isViewMode) return "View item details";
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
                navigate("/online", { state: { activeTab: "items" } })
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
            <p className="mt-4 text-gray-600">Loading item...</p>
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
                navigate("/online", { state: { activeTab: "items" } })
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
                navigate(`/online/items/edit/${id}`, {
                  state: { returnTo: "/online", activeTab: "items" },
                })
              }
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Edit this item"
            >
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      {/* Form/View Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name {!isViewMode && "*"}
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) =>
                  !isViewMode &&
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isViewMode ? "bg-gray-50 cursor-default" : "bg-white"
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="Enter item name"
                required={!isViewMode}
                disabled={isViewMode || saving}
                readOnly={isViewMode}
                autoFocus={!isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              {isViewMode ? (
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 min-h-[40px] flex items-center">
                  {formData.category || "Not specified"}
                </div>
              ) : (
                <select
                  value={formData.category || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* DETAILS FIELD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Details
              </label>
              {isViewMode ? (
                <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 whitespace-pre-wrap break-words overflow-auto min-h-[80px] leading-relaxed">
                  {formData.detail || "No details provided"}
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={formData.detail || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, detail: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y min-h-[150px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter item details"
                  disabled={saving}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image 1
                </label>
                {isViewMode ? (
                  <div className="text-center">
                    {formData.image1 ? (
                      <>
                        <img
                          src={formData.image1}
                          alt="Image 1"
                          className="max-w-full max-h-48 rounded-lg border border-gray-300 mx-auto"
                        />
                        <div className="text-xs text-gray-500 mt-2">
                          Image 1
                        </div>
                      </>
                    ) : (
                      <div className="p-10 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
                        No image
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setImage1File(e.target.files?.[0] || null)
                      }
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={saving}
                    />
                    {formData.image1 && !image1File && (
                      <div className="mt-4 text-center">
                        <img
                          src={formData.image1}
                          alt="Preview 1"
                          className="max-w-full max-h-36 rounded-lg border border-gray-300 mx-auto"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Current Image
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image 2
                </label>
                {isViewMode ? (
                  <div className="text-center">
                    {formData.image2 ? (
                      <>
                        <img
                          src={formData.image2}
                          alt="Image 2"
                          className="max-w-full max-h-48 rounded-lg border border-gray-300 mx-auto"
                        />
                        <div className="text-xs text-gray-500 mt-2">
                          Image 2
                        </div>
                      </>
                    ) : (
                      <div className="p-10 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
                        No image
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setImage2File(e.target.files?.[0] || null)
                      }
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={saving}
                    />
                    {formData.image2 && !image2File && (
                      <div className="mt-4 text-center">
                        <img
                          src={formData.image2}
                          alt="Preview 2"
                          className="max-w-full max-h-36 rounded-lg border border-gray-300 mx-auto"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Current Image
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
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

            {/* Form Actions - Hide in View mode */}
            {!isViewMode && (
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/online", { state: { activeTab: "items" } })
                    }
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  {/* DELETE Button */}
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
                        ? "Add Item"
                        : "Update Item"}
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

export default OnlineForm;
