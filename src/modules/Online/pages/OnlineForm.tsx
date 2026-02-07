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
import { getStorage, ref, uploadBytes, deleteObject } from "firebase/storage";
import { OnlineItem, Category } from "../types/online.types";
import { useSettings } from "../../../contexts/SettingsContext";
import {
  optimizeFile,
  validateFile,
  formatFileSize,
} from "../../../utils/fileOptimizer";
import { useImageSize, ImageSizeBadge } from "../../../utils/imageSizeUtils";

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

interface OptimizationInfo {
  originalSize: number;
  optimizedSize: number;
  savedPercentage: number;
  fileName: string;
}

const OnlineForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const { settings } = useSettings();
  const showDelete = settings?.showDelete || false;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [storage] = useState(() => getStorage());

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
  const [uploadingImages, setUploadingImages] = useState(false);

  // Image states
  const [image1File, setImage1File] = useState<File | null>(null);
  const [image2File, setImage2File] = useState<File | null>(null);
  const [image1Optimization, setImage1Optimization] =
    useState<OptimizationInfo | null>(null);
  const [image2Optimization, setImage2Optimization] =
    useState<OptimizationInfo | null>(null);
  const [imageErrors, setImageErrors] = useState<{
    image1?: string;
    image2?: string;
  }>({});

  // Use image size hooks for both images
  const { size: image1Size, loading: loadingImage1Size } = useImageSize(
    formData.image1 || null,
  );
  const { size: image2Size, loading: loadingImage2Size } = useImageSize(
    formData.image2 || null,
  );

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
      resetImageStates();
    }
  }, [id, location.pathname]);

  const resetImageStates = () => {
    setImage1File(null);
    setImage2File(null);
    setImage1Optimization(null);
    setImage2Optimization(null);
    setImageErrors({});
  };

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
        resetImageStates();
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

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    imageNumber: 1 | 2,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/jpg",
      "image/heic",
      "image/heif",
    ];

    const validation = validateFile(file, allowedTypes, 5); // 5MB max
    if (!validation.valid) {
      setImageErrors((prev) => ({
        ...prev,
        [`image${imageNumber}`]: validation.error,
      }));
      return;
    }

    // Clear any previous error
    setImageErrors((prev) => ({
      ...prev,
      [`image${imageNumber}`]: undefined,
    }));

    // Set file
    if (imageNumber === 1) {
      setImage1File(file);
    } else {
      setImage2File(file);
    }

    // Optimize the file in background
    try {
      const optimized = await optimizeFile(file);
      const originalSize = file.size;
      const optimizedSize = optimized.size;
      const savedPercentage =
        ((originalSize - optimizedSize) / originalSize) * 100;

      const optimizationInfo = {
        originalSize,
        optimizedSize,
        savedPercentage,
        fileName: file.name,
      };

      if (imageNumber === 1) {
        setImage1Optimization(optimizationInfo);
      } else {
        setImage2Optimization(optimizationInfo);
      }

      console.log(
        `Image ${imageNumber} optimized: ${formatFileSize(originalSize)} → ${formatFileSize(optimizedSize)} (${savedPercentage.toFixed(1)}% saved)`,
      );
    } catch (err: any) {
      console.error(`Error optimizing image ${imageNumber}:`, err);
      if (imageNumber === 1) {
        setImage1Optimization(null);
      } else {
        setImage2Optimization(null);
      }
    }
  };

  const handleRemoveImage = (imageNumber: 1 | 2) => {
    if (imageNumber === 1) {
      setImage1File(null);
      setImage1Optimization(null);
      setImageErrors((prev) => ({ ...prev, image1: undefined }));

      // Reset file input
      const input = document.getElementById(
        `image${imageNumber}Input`,
      ) as HTMLInputElement;
      if (input) input.value = "";
    } else {
      setImage2File(null);
      setImage2Optimization(null);
      setImageErrors((prev) => ({ ...prev, image2: undefined }));

      // Reset file input
      const input = document.getElementById(
        `image${imageNumber}Input`,
      ) as HTMLInputElement;
      if (input) input.value = "";
    }
  };

  const handleDeleteExistingImage = async (imageNumber: 1 | 2) => {
    const imageUrl = imageNumber === 1 ? formData.image1 : formData.image2;
    if (!imageUrl) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete Image ${imageNumber}? This action cannot be undone.`,
    );

    if (!confirmDelete) return;

    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+?)(?:\?|$)/);

      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const storageRef = ref(storage, filePath);

        // Delete file from storage
        await deleteObject(storageRef);

        // Update form data
        if (imageNumber === 1) {
          setFormData((prev) => ({ ...prev, image1: "" }));
        } else {
          setFormData((prev) => ({ ...prev, image2: "" }));
        }

        alert(`Image ${imageNumber} deleted successfully!`);
      }
    } catch (error: any) {
      console.error(`Error deleting image ${imageNumber}:`, error);
      alert(`Failed to delete image: ${error.message}`);
    }
  };

  const uploadImage = async (
    file: File,
    imageNumber: 1 | 2,
  ): Promise<string> => {
    try {
      let fileToUpload = file;

      // Optimize the image before upload
      const optimization =
        imageNumber === 1 ? image1Optimization : image2Optimization;
      if (optimization && optimization.savedPercentage > 0) {
        try {
          fileToUpload = await optimizeFile(file);
          console.log(
            `Uploading optimized image ${imageNumber}: ${formatFileSize(fileToUpload.size)}`,
          );
        } catch (err) {
          console.error(
            `Error during final optimization for image ${imageNumber}:`,
            err,
          );
        }
      }

      // Generate a unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const fileExtension = fileToUpload.name.split(".").pop();
      const fileName = `online_${imageNumber}_${timestamp}_${randomId}.${fileExtension}`;

      // Create storage reference
      const storageRef = ref(storage, `online_images/${fileName}`);

      // Upload optimized file
      const snapshot = await uploadBytes(storageRef, fileToUpload);

      // Get download URL
      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${snapshot.ref.bucket}/o/${encodeURIComponent(snapshot.ref.fullPath)}?alt=media`;

      return downloadURL;
    } catch (error: any) {
      console.error(`Error uploading image ${imageNumber}:`, error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      alert("Item name is required");
      return;
    }

    try {
      setSaving(true);
      setUploadingImages(true);
      const db = getFirestore();

      let image1Url = formData.image1 || "";
      let image2Url = formData.image2 || "";

      // Upload new images if selected
      if (image1File) {
        image1Url = await uploadImage(image1File, 1);
      }
      if (image2File) {
        image2Url = await uploadImage(image2File, 2);
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
    } catch (error: any) {
      console.error("Error saving item:", error);

      let errorMessage = "Failed to save item";
      if (error.message?.includes("quota")) {
        errorMessage =
          "Storage quota exceeded. Images are optimized to save space.";
      } else if (error.code === "storage/unauthorized") {
        errorMessage =
          "Upload failed: You don't have permission to upload files.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      setSaving(false);
      setUploadingImages(false);
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

      // Delete images from storage if they exist
      if (formData.image1) {
        try {
          const url = new URL(formData.image1);
          const pathMatch = url.pathname.match(/\/o\/(.+?)(?:\?|$)/);
          if (pathMatch) {
            const filePath = decodeURIComponent(pathMatch[1]);
            const storageRef = ref(storage, filePath);
            await deleteObject(storageRef);
          }
        } catch (error) {
          console.error("Error deleting image 1:", error);
        }
      }

      if (formData.image2) {
        try {
          const url = new URL(formData.image2);
          const pathMatch = url.pathname.match(/\/o\/(.+?)(?:\?|$)/);
          if (pathMatch) {
            const filePath = decodeURIComponent(pathMatch[1]);
            const storageRef = ref(storage, filePath);
            await deleteObject(storageRef);
          }
        } catch (error) {
          console.error("Error deleting image 2:", error);
        }
      }

      // Delete document from Firestore
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

  const renderImageSection = (imageNumber: 1 | 2) => {
    const isView = isViewMode;
    const file = imageNumber === 1 ? image1File : image2File;
    const optimization =
      imageNumber === 1 ? image1Optimization : image2Optimization;
    const error = imageNumber === 1 ? imageErrors.image1 : imageErrors.image2;
    const existingImage = imageNumber === 1 ? formData.image1 : formData.image2;
    const hasExistingImage = !!existingImage;
    const hasNewFile = !!file;
    const imageSize = imageNumber === 1 ? image1Size : image2Size;
    const loadingSize =
      imageNumber === 1 ? loadingImage1Size : loadingImage2Size;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image {imageNumber}
        </label>

        {isView ? (
          <div className="text-center">
            {existingImage ? (
              <div className="relative">
                <img
                  src={existingImage}
                  alt={`Image ${imageNumber}`}
                  className="max-w-full max-h-48 rounded-lg border border-gray-300 mx-auto"
                />
                <ImageSizeBadge
                  size={imageSize}
                  loading={loadingSize}
                  position="overlay"
                />
              </div>
            ) : (
              <div className="p-10 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
                No image
              </div>
            )}

            {/* Size badge below image in view mode */}
            {existingImage && (
              <div className="mt-2 text-center">
                <ImageSizeBadge
                  size={imageSize}
                  loading={loadingSize}
                  position="below"
                />
              </div>
            )}
          </div>
        ) : (
          <>
            {/* File input */}
            <input
              id={`image${imageNumber}Input`}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, imageNumber)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              disabled={saving || uploadingImages}
            />

            {/* Error message */}
            {error && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                ⚠️ {error}
              </div>
            )}

            {/* Optimization info */}
            {optimization && optimization.savedPercentage > 0 && (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex flex-col text-green-800 text-xs">
                  <div className="flex items-center gap-1 font-medium mb-1">
                    <span>🎯</span>
                    <span>
                      {optimization.savedPercentage.toFixed(1)}% space saved
                    </span>
                  </div>
                  <div className="font-mono text-xs">
                    {formatFileSize(optimization.originalSize)} →{" "}
                    {formatFileSize(optimization.optimizedSize)}
                  </div>
                </div>
              </div>
            )}

            {/* Image preview and actions */}
            <div className="space-y-3">
              {/* Existing image preview */}
              {hasExistingImage && !hasNewFile && (
                <div className="relative">
                  <img
                    src={existingImage}
                    alt={`Current Image ${imageNumber}`}
                    className="max-w-full max-h-36 rounded-lg border border-gray-300"
                  />
                  <ImageSizeBadge
                    size={imageSize}
                    loading={loadingSize}
                    position="overlay"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingImage(imageNumber)}
                      disabled={saving || uploadingImages}
                      className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-medium hover:bg-red-100 disabled:opacity-50"
                    >
                      Delete Image
                    </button>
                  </div>
                </div>
              )}

              {/* New image preview */}
              {hasNewFile && (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New Image ${imageNumber}`}
                    className="max-w-full max-h-36 rounded-lg border border-gray-300"
                  />
                  {/* Size badge for new file */}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    <span className="font-medium">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(imageNumber)}
                      disabled={saving || uploadingImages}
                      className="px-3 py-1 bg-gray-50 text-gray-700 border border-gray-300 rounded text-xs font-medium hover:bg-gray-100 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Size badge below existing image */}
            {hasExistingImage && !hasNewFile && (
              <div className="mt-2 text-center">
                <ImageSizeBadge
                  size={imageSize}
                  loading={loadingSize}
                  position="below"
                />
              </div>
            )}
          </>
        )}
      </div>
    );
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
                disabled={isViewMode || saving || uploadingImages}
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
                  disabled={saving || uploadingImages}
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
                  disabled={saving || uploadingImages}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderImageSection(1)}
              {renderImageSection(2)}
            </div>

            {/* Optimization note */}
            {!isViewMode && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-blue-500 mt-0.5">ℹ️</div>
                  <div className="text-xs text-blue-800">
                    <div className="font-medium mb-1">
                      Automatic Image Optimization
                    </div>
                    <div>
                      Images are automatically compressed to save storage space.
                      HEIC files are converted to JPEG.
                    </div>
                    <div className="mt-1 text-blue-600">
                      Max file size: 5MB | Recommended: Images under 1MB
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                    disabled={saving || uploadingImages}
                  >
                    Cancel
                  </button>

                  {/* DELETE Button */}
                  {isEditMode && showDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                      disabled={saving || uploadingImages}
                    >
                      {saving ? "Deleting..." : "Delete"}
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    disabled={saving || uploadingImages}
                  >
                    {saving || uploadingImages
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
