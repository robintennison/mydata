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
import { onlineStyles } from "../styles/onlineStyles";
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
  const showDelete = settings?.showDelete || false;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState<number>(150); // Default height

  // Determine mode from the current URL path
  const getModeFromPath = (): "add" | "edit" | "view" => {
    const path = location.pathname;

    if (path.includes("/online/items/add")) return "add";
    if (path.includes("/online/items/edit/")) return "edit";
    if (path.includes("/online/items/view/")) return "view";

    // If we have an ID but path doesn't specify mode, default to view
    // Otherwise, it's add mode
    return id ? "view" : "add";
  };

  const mode = getModeFromPath();
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";
  const isViewMode = mode === "view";

  console.log("Form details:", {
    path: location.pathname,
    id,
    mode,
    isAddMode,
    isEditMode,
    isViewMode,
    showDelete,
  });

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

  // Calculate textarea height based on content
  useEffect(() => {
    if (textareaRef.current && !isViewMode) {
      // Reset height to auto to get the scrollHeight
      textareaRef.current.style.height = "auto";

      // Calculate the new height based on scrollHeight
      const newHeight = Math.max(150, textareaRef.current.scrollHeight);
      setTextareaHeight(newHeight);

      // Set the height on the textarea
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [formData.detail, isViewMode]);

  useEffect(() => {
    console.log("useEffect triggered with:", {
      path: location.pathname,
      id,
      mode,
    });

    fetchCategories();
    if (id) {
      fetchItem();
    } else {
      // Reset form for add mode
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
        console.log("Fetched item data:", data);

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
        // Clear file states when fetching item
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
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } catch (error) {
      return "Error formatting date";
    }
  };

  if (loading) {
    return (
      <div style={onlineStyles.pageContainer}>
        <div style={onlineStyles.loading}>
          <div style={onlineStyles.spinner}></div>
          <p>Loading item...</p>
        </div>
      </div>
    );
  }

  // Create a dynamic textarea style for edit mode
  const textareaStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    lineHeight: "1.5",
    color: "#111827",
    backgroundColor: "white",
    resize: "vertical",
    height: `${textareaHeight}px`, // Use dynamic height
    boxSizing: "border-box",
    outline: "none",
    cursor: saving ? "not-allowed" : "text",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowY: "auto",
  };

  return (
    <div style={onlineStyles.pageContainer}>
      {/* Top Navigation */}
      <div style={onlineStyles.topNav}>
        <button
          onClick={() => navigate("/online", { state: { activeTab: "items" } })}
          style={onlineStyles.navButton}
          title="Back"
        >
          ←
        </button>
        <div style={onlineStyles.headerLeft}>
          <div style={onlineStyles.navTitle}>{getPageTitle()}</div>
          <div style={onlineStyles.navSubtitle}>{getPageSubtitle()}</div>
        </div>

        {/* View mode: Show Edit button */}
        {isViewMode && (
          <button
            onClick={() =>
              navigate(`/online/items/edit/${id}`, {
                state: { returnTo: "/online", activeTab: "items" },
              })
            }
            style={{
              ...onlineStyles.editButton,
              padding: "6px 12px",
              fontSize: "14px",
              marginRight: "8px",
            }}
            title="Edit this item"
          >
            ✏️ Edit
          </button>
        )}
      </div>

      {/* Form/View Content */}
      <div style={onlineStyles.formContentWrapper}>
        <div style={onlineStyles.section}>
          <form onSubmit={handleSubmit} style={onlineStyles.form}>
            <div style={onlineStyles.formGroup}>
              <label style={onlineStyles.label}>
                Item Name {!isViewMode && "*"}
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) =>
                  !isViewMode &&
                  setFormData({ ...formData, name: e.target.value })
                }
                style={{
                  ...onlineStyles.input,
                  backgroundColor: isViewMode ? "#f9fafb" : "white",
                  cursor: isViewMode ? "default" : "text",
                }}
                placeholder="Enter item name"
                required={!isViewMode}
                disabled={isViewMode || saving}
                readOnly={isViewMode}
                autoFocus={!isViewMode}
              />
            </div>

            <div style={onlineStyles.formGroup}>
              <label style={onlineStyles.label}>Category</label>
              {isViewMode ? (
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#111827",
                    minHeight: "40px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {formData.category || "Not specified"}
                </div>
              ) : (
                <select
                  value={formData.category || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  style={onlineStyles.select}
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

            {/* DETAILS FIELD - UPDATED WITH DYNAMIC HEIGHT */}
            <div style={onlineStyles.formGroup}>
              <label style={onlineStyles.label}>Details</label>
              {isViewMode ? (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#111827",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflow: "auto",
                    maxHeight: "none",
                    minHeight: "80px",
                    lineHeight: "1.5",
                  }}
                >
                  {formData.detail || "No details provided"}
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={formData.detail || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, detail: e.target.value })
                  }
                  style={textareaStyle}
                  placeholder="Enter item details"
                  disabled={saving}
                />
              )}
            </div>

            <div style={onlineStyles.formRow}>
              <div style={{ ...onlineStyles.formGroup, flex: 1 }}>
                <label style={onlineStyles.label}>Image 1</label>
                {isViewMode ? (
                  <div style={{ textAlign: "center" }}>
                    {formData.image1 ? (
                      <>
                        <img
                          src={formData.image1}
                          alt="Image 1"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "200px",
                            borderRadius: "6px",
                            border: "1px solid #e5e7eb",
                          }}
                        />
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginTop: "8px",
                          }}
                        >
                          Image 1
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          padding: "40px 20px",
                          backgroundColor: "#f9fafb",
                          border: "1px dashed #e5e7eb",
                          borderRadius: "6px",
                          color: "#6b7280",
                          fontSize: "14px",
                        }}
                      >
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
                  </>
                )}
              </div>

              <div style={{ ...onlineStyles.formGroup, flex: 1 }}>
                <label style={onlineStyles.label}>Image 2</label>
                {isViewMode ? (
                  <div style={{ textAlign: "center" }}>
                    {formData.image2 ? (
                      <>
                        <img
                          src={formData.image2}
                          alt="Image 2"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "200px",
                            borderRadius: "6px",
                            border: "1px solid #e5e7eb",
                          }}
                        />
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginTop: "8px",
                          }}
                        >
                          Image 2
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          padding: "40px 20px",
                          backgroundColor: "#f9fafb",
                          border: "1px dashed #e5e7eb",
                          borderRadius: "6px",
                          color: "#6b7280",
                          fontSize: "14px",
                        }}
                      >
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
                  </>
                )}
              </div>
            </div>

            {/* Timestamps - Show in View mode */}
            {isViewMode && (
              <div style={{ ...onlineStyles.formRow, marginTop: "16px" }}>
                <div style={{ ...onlineStyles.formGroup, flex: 1 }}>
                  <label
                    style={{
                      ...onlineStyles.label,
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    Created
                  </label>
                  <div style={{ fontSize: "13px", color: "#111827" }}>
                    {formatDate(formData.createdAt)}
                  </div>
                </div>
                <div style={{ ...onlineStyles.formGroup, flex: 1 }}>
                  <label
                    style={{
                      ...onlineStyles.label,
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    Last Updated
                  </label>
                  <div style={{ fontSize: "13px", color: "#111827" }}>
                    {formatDate(formData.updatedAt)}
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions - Hide in View mode */}
            {!isViewMode && (
              <div
                style={{
                  ...onlineStyles.formActions,
                  marginTop: "30px",
                  paddingTop: "20px",
                  borderTop: "1px solid #e5e7eb",
                  paddingBottom: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate("/online", { state: { activeTab: "items" } })
                  }
                  style={onlineStyles.cancelButton}
                  disabled={saving}
                >
                  Cancel
                </button>

                {/* DELETE Button - Only show in edit mode and when showDelete is true */}
                {isEditMode && showDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    style={{
                      ...onlineStyles.deleteButton,
                      padding: "12px 30px",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                    disabled={saving}
                  >
                    {saving ? "Deleting..." : "Delete"}
                  </button>
                )}

                <button
                  type="submit"
                  style={onlineStyles.submitButton}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : isAddMode
                      ? "Add Item"
                      : "Update Item"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnlineForm;
