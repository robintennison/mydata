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
import {
  OnlineItem,
  Category,
  FileType,
  FileInfo,
  FILE_TYPES,
} from "../types/online.types";
import { useSettings } from "../../../contexts/SettingsContext";
import {
  optimizeFile,
  validateFile,
  formatFileSize,
} from "../../../utils/fileOptimizer";
import { useImageSize, ImageSizeBadge } from "../../../utils/imageSizeUtils";

// Helper function to safely parse timestamps
const parseTimestamp = (timestamp: any): number | null => {
  if (timestamp === null || timestamp === undefined) return null;
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
  return null;
};

// Helper to format date for input fields (YYYY-MM-DD)
const formatDateInput = (timestamp?: number | null): string => {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch (error) {
    return "";
  }
};

// Helper to determine file type from name
const getFileTypeFromName = (filename: string): FileType => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"];
  const pdfExtensions = ["pdf"];

  const extension = filename.split(".").pop()?.toLowerCase() || "";

  if (imageExtensions.includes(extension)) return FILE_TYPES.IMAGE;
  if (pdfExtensions.includes(extension)) return FILE_TYPES.PDF;
  return FILE_TYPES.NONE;
};

// Helper to get file icon based on type
const getFileIcon = (type: FileType): string => {
  switch (type) {
    case FILE_TYPES.IMAGE:
      return "🖼️";
    case FILE_TYPES.PDF:
      return "📄";
    default:
      return "📁";
  }
};

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

  // State for toggling renewable option
  const [isRenewable, setIsRenewable] = useState(false);

  const [formData, setFormData] = useState<Partial<OnlineItem>>({
    id: "",
    name: "",
    detail: "",
    category: "",
    startDate: null,
    endDate: null,
    file1: "",
    file2: "",
    file1Type: FILE_TYPES.NONE,
    file2Type: FILE_TYPES.NONE,
    file1Name: "",
    file2Name: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // File states with proper typing
  const [file1Info, setFile1Info] = useState<FileInfo>({
    file: null,
    optimization: null,
    type: FILE_TYPES.NONE,
    url: "",
    name: "",
  });

  const [file2Info, setFile2Info] = useState<FileInfo>({
    file: null,
    optimization: null,
    type: FILE_TYPES.NONE,
    url: "",
    name: "",
  });

  // Use image size hooks for images only
  const { size: file1Size, loading: loadingFile1Size } = useImageSize(
    formData.file1 && formData.file1Type === FILE_TYPES.IMAGE
      ? formData.file1
      : null,
  );
  const { size: file2Size, loading: loadingFile2Size } = useImageSize(
    formData.file2 && formData.file2Type === FILE_TYPES.IMAGE
      ? formData.file2
      : null,
  );

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchItem();
    } else {
      // Add mode - initialize with null dates
      setFormData({
        id: "",
        name: "",
        detail: "",
        category: "",
        startDate: null,
        endDate: null,
        file1: "",
        file2: "",
        file1Type: FILE_TYPES.NONE,
        file2Type: FILE_TYPES.NONE,
        file1Name: "",
        file2Name: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setIsRenewable(false);
      resetFileStates();
    }
  }, [id, location.pathname]);

  const resetFileStates = () => {
    setFile1Info({
      file: null,
      optimization: null,
      type: FILE_TYPES.NONE,
      url: "",
      name: "",
    });
    setFile2Info({
      file: null,
      optimization: null,
      type: FILE_TYPES.NONE,
      url: "",
      name: "",
    });
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
          createdAt: parseTimestamp(data.createdAt) || undefined,
          updatedAt: parseTimestamp(data.updatedAt) || undefined,
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
        const startDate = parseTimestamp(data.startDate);
        const endDate = parseTimestamp(data.endDate);

        // Check if this is old data (has image fields) or new data (has file fields)
        const hasOldImageFields =
          data.image1 !== undefined || data.image2 !== undefined;

        // Determine file types from stored type or URL
        let file1Type = data.file1Type;
        if (!file1Type && data.file1) {
          file1Type = data.file1?.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i)
            ? FILE_TYPES.IMAGE
            : data.file1?.match(/\.pdf$/i)
              ? FILE_TYPES.PDF
              : FILE_TYPES.NONE;
        } else if (!file1Type && data.image1) {
          file1Type = FILE_TYPES.IMAGE; // Old image data
        }

        let file2Type = data.file2Type;
        if (!file2Type && data.file2) {
          file2Type = data.file2?.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i)
            ? FILE_TYPES.IMAGE
            : data.file2?.match(/\.pdf$/i)
              ? FILE_TYPES.PDF
              : FILE_TYPES.NONE;
        } else if (!file2Type && data.image2) {
          file2Type = FILE_TYPES.IMAGE; // Old image data
        }

        // Set renewable state based on whether dates exist
        setIsRenewable(!!(startDate && endDate));

        setFormData({
          id: itemDoc.id,
          name: data.name || "",
          detail: data.detail || "",
          category: data.category || "",
          startDate: startDate,
          endDate: endDate,
          // Handle both old and new field names
          file1: data.file1 || data.image1 || "",
          file2: data.file2 || data.image2 || "",
          file1Type: file1Type || FILE_TYPES.NONE,
          file2Type: file2Type || FILE_TYPES.NONE,
          file1Name:
            data.file1Name ||
            (hasOldImageFields && data.image1 ? "Legacy Image" : ""),
          file2Name:
            data.file2Name ||
            (hasOldImageFields && data.image2 ? "Legacy Image" : ""),
          createdAt: parseTimestamp(data.createdAt) || Date.now(),
          updatedAt: parseTimestamp(data.updatedAt) || Date.now(),
        });
        resetFileStates();
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

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileNumber: 1 | 2,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine file type
    const fileType = getFileTypeFromName(file.name);

    if (fileType === FILE_TYPES.NONE) {
      const errorInfo: Partial<FileInfo> = {
        error: "Unsupported file type. Please upload images or PDF files.",
        file: null,
        optimization: null,
        type: FILE_TYPES.NONE,
        url: "",
        name: "",
      };

      if (fileNumber === 1) {
        setFile1Info((prev) => ({ ...prev, ...errorInfo }));
      } else {
        setFile2Info((prev) => ({ ...prev, ...errorInfo }));
      }
      return;
    }

    // Set allowed types based on file type detection
    const allowedTypes =
      fileType === FILE_TYPES.IMAGE
        ? [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/jpg",
            "image/heic",
            "image/heif",
          ]
        : ["application/pdf"];

    const validation = validateFile(file, allowedTypes, 10); // 10MB max for both types
    if (!validation.valid) {
      const errorInfo: Partial<FileInfo> = {
        error: validation.error,
        file: null,
        optimization: null,
        type: fileType,
        url: "",
        name: file.name,
      };

      if (fileNumber === 1) {
        setFile1Info((prev) => ({ ...prev, ...errorInfo }));
      } else {
        setFile2Info((prev) => ({ ...prev, ...errorInfo }));
      }
      return;
    }

    // Clear any previous error and set file info
    const fileInfo: Partial<FileInfo> = {
      error: undefined,
      file: file,
      optimization: null,
      type: fileType,
      url: "",
      name: file.name,
    };

    if (fileNumber === 1) {
      setFile1Info((prev) => ({ ...prev, ...fileInfo }));
    } else {
      setFile2Info((prev) => ({ ...prev, ...fileInfo }));
    }

    // Optimize the file in background (only images are optimized, PDFs are kept as is)
    if (fileType === FILE_TYPES.IMAGE) {
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

        const optimizationUpdate: Partial<FileInfo> = {
          optimization: optimizationInfo,
          file: optimized, // Use optimized file
        };

        if (fileNumber === 1) {
          setFile1Info((prev) => ({ ...prev, ...optimizationUpdate }));
        } else {
          setFile2Info((prev) => ({ ...prev, ...optimizationUpdate }));
        }

        console.log(
          `File ${fileNumber} optimized: ${formatFileSize(originalSize)} → ${formatFileSize(optimizedSize)} (${savedPercentage.toFixed(1)}% saved)`,
        );
      } catch (err: any) {
        console.error(`Error optimizing file ${fileNumber}:`, err);
        const optimizationUpdate: Partial<FileInfo> = {
          optimization: null,
        };

        if (fileNumber === 1) {
          setFile1Info((prev) => ({ ...prev, ...optimizationUpdate }));
        } else {
          setFile2Info((prev) => ({ ...prev, ...optimizationUpdate }));
        }
      }
    }
  };

  const handleRemoveFile = (fileNumber: 1 | 2) => {
    const resetInfo: FileInfo = {
      file: null,
      optimization: null,
      type: FILE_TYPES.NONE,
      url: "",
      name: "",
      error: undefined,
    };

    if (fileNumber === 1) {
      setFile1Info(resetInfo);
    } else {
      setFile2Info(resetInfo);
    }

    // Reset file input
    const input = document.getElementById(
      `file${fileNumber}Input`,
    ) as HTMLInputElement;
    if (input) input.value = "";
  };

  const handleDeleteExistingFile = async (fileNumber: 1 | 2) => {
    const fileUrl = fileNumber === 1 ? formData.file1 : formData.file2;
    const fileType =
      (fileNumber === 1 ? formData.file1Type : formData.file2Type) ||
      FILE_TYPES.NONE;

    if (!fileUrl) return;

    const fileTypeDisplay = fileType === FILE_TYPES.IMAGE ? "Image" : "PDF";
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${fileTypeDisplay} ${fileNumber}? This action cannot be undone.`,
    );

    if (!confirmDelete) return;

    try {
      // Try to delete from storage - only if it's a Firebase Storage URL
      if (fileUrl.includes("firebasestorage.googleapis.com")) {
        const url = new URL(fileUrl);
        const pathMatch = url.pathname.match(/\/o\/(.+?)(?:\?|$)/);

        if (pathMatch) {
          const filePath = decodeURIComponent(pathMatch[1]);
          const storageRef = ref(storage, filePath);

          // Delete file from storage
          await deleteObject(storageRef);
        }
      }

      // Update form data
      if (fileNumber === 1) {
        setFormData((prev) => ({
          ...prev,
          file1: "",
          file1Type: FILE_TYPES.NONE,
          file1Name: "",
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          file2: "",
          file2Type: FILE_TYPES.NONE,
          file2Name: "",
        }));
      }

      alert(`${fileTypeDisplay} ${fileNumber} deleted successfully!`);
    } catch (error: any) {
      console.error(`Error deleting file ${fileNumber}:`, error);
      alert(`Failed to delete file: ${error.message}`);
    }
  };
  const uploadFile = async (
    fileInfo: FileInfo,
    fileNumber: 1 | 2,
  ): Promise<{ url: string; type: FileType; name: string }> => {
    if (!fileInfo.file) throw new Error("No file to upload");

    try {
      let fileToUpload = fileInfo.file;

      // Use optimized version if available and it's an image
      if (fileInfo.type === FILE_TYPES.IMAGE && fileInfo.optimization) {
        fileToUpload = fileInfo.file; // Already optimized in handleFileChange
        console.log(
          `Uploading optimized file ${fileNumber}: ${formatFileSize(fileToUpload.size)}`,
        );
      }

      // Generate a unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const fileExtension = fileToUpload.name.split(".").pop();
      const fileType = fileInfo.type === FILE_TYPES.IMAGE ? "image" : "pdf";
      const fileName = `online_${fileType}_${fileNumber}_${timestamp}_${randomId}.${fileExtension}`;

      // Create storage reference
      const storageRef = ref(storage, `online_files/${fileName}`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, fileToUpload);

      // Get download URL
      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${snapshot.ref.bucket}/o/${encodeURIComponent(snapshot.ref.fullPath)}?alt=media`;

      return {
        url: downloadURL,
        type: fileInfo.type,
        name: fileInfo.file.name, // Store original filename
      };
    } catch (error: any) {
      console.error(`Error uploading file ${fileNumber}:`, error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      alert("Item name is required");
      return;
    }

    // Validate dates only if item is renewable
    if (isRenewable) {
      // Only validate end date is required
      if (!formData.endDate) {
        alert("End date is required for renewable items");
        return;
      }
      // Only validate date order if both dates exist
      if (
        formData.startDate &&
        formData.endDate &&
        formData.startDate > formData.endDate
      ) {
        alert("End date must be after start date");
        return;
      }
    }

    try {
      setSaving(true);
      setUploadingFiles(true);
      const db = getFirestore();

      let file1Url = formData.file1 || "";
      let file2Url = formData.file2 || "";
      let file1Type = formData.file1Type || FILE_TYPES.NONE;
      let file2Type = formData.file2Type || FILE_TYPES.NONE;
      let file1Name = formData.file1Name || "";
      let file2Name = formData.file2Name || "";

      // Upload new files if selected
      if (file1Info.file) {
        const result = await uploadFile(file1Info, 1);
        file1Url = result.url;
        file1Type = result.type;
        file1Name = result.name;
      }
      if (file2Info.file) {
        const result = await uploadFile(file2Info, 2);
        file2Url = result.url;
        file2Type = result.type;
        file2Name = result.name;
      }

      // Prepare data for submission - always save as new format
      const itemData = {
        name: (formData.name || "").trim(),
        detail: (formData.detail || "").trim(),
        category: formData.category || "",
        // If not renewable, set dates to null
        startDate: isRenewable ? formData.startDate : null,
        endDate: isRenewable ? formData.endDate : null,
        // Always save as file fields (new format)
        file1: file1Url,
        file2: file2Url,
        file1Type: file1Type,
        file2Type: file2Type,
        file1Name: file1Name,
        file2Name: file2Name,
        updatedAt: new Date(),
        ...(isAddMode ? { createdAt: new Date() } : {}),
      };

      // Remove old image fields if they exist (to clean up)
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
          "Storage quota exceeded. Files are optimized to save space.";
      } else if (error.code === "storage/unauthorized") {
        errorMessage =
          "Upload failed: You don't have permission to upload files.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      setSaving(false);
      setUploadingFiles(false);
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

      // Delete files from storage if they exist
      if (formData.file1) {
        try {
          const url = new URL(formData.file1);
          const pathMatch = url.pathname.match(/\/o\/(.+?)(?:\?|$)/);
          if (pathMatch) {
            const filePath = decodeURIComponent(pathMatch[1]);
            const storageRef = ref(storage, filePath);
            await deleteObject(storageRef);
          }
        } catch (error) {
          console.error("Error deleting file 1:", error);
        }
      }

      if (formData.file2) {
        try {
          const url = new URL(formData.file2);
          const pathMatch = url.pathname.match(/\/o\/(.+?)(?:\?|$)/);
          if (pathMatch) {
            const filePath = decodeURIComponent(pathMatch[1]);
            const storageRef = ref(storage, filePath);
            await deleteObject(storageRef);
          }
        } catch (error) {
          console.error("Error deleting file 2:", error);
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

  const formatDate = (timestamp?: number | null): string => {
    if (!timestamp) return "Not applicable";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString();
    } catch (error) {
      return "Error formatting date";
    }
  };

  const renderFileSection = (fileNumber: 1 | 2) => {
    const isView = isViewMode;
    const fileInfo = fileNumber === 1 ? file1Info : file2Info;
    const existingFileUrl = fileNumber === 1 ? formData.file1 : formData.file2;
    // Provide default value of NONE if undefined
    const existingFileType =
      (fileNumber === 1 ? formData.file1Type : formData.file2Type) ||
      FILE_TYPES.NONE;
    const existingFileName =
      fileNumber === 1 ? formData.file1Name : formData.file2Name;
    const hasExistingFile = !!existingFileUrl;
    const hasNewFile = !!fileInfo.file;
    const fileSize = fileNumber === 1 ? file1Size : file2Size;
    const loadingSize = fileNumber === 1 ? loadingFile1Size : loadingFile2Size;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          File {fileNumber} {hasExistingFile && getFileIcon(existingFileType)}
        </label>

        {isView ? (
          <div className="text-center">
            {hasExistingFile ? (
              <div className="relative">
                {existingFileType === FILE_TYPES.IMAGE ? (
                  <img
                    src={existingFileUrl}
                    alt={`File ${fileNumber}`}
                    className="max-w-full max-h-48 rounded-lg border border-gray-300 mx-auto"
                  />
                ) : (
                  <div className="p-6 bg-gray-50 border border-gray-300 rounded-lg flex flex-col items-center">
                    <span className="text-4xl mb-2">📄</span>
                    <span className="text-sm font-medium text-gray-700 mb-1">
                      {existingFileName || "PDF Document"}
                    </span>
                    <a
                      href={existingFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View PDF
                    </a>
                  </div>
                )}
                {existingFileType === FILE_TYPES.IMAGE && (
                  <ImageSizeBadge
                    size={fileSize}
                    loading={loadingSize}
                    position="overlay"
                  />
                )}
              </div>
            ) : (
              <div className="p-10 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
                No file
              </div>
            )}

            {/* Size badge below image in view mode */}
            {hasExistingFile && existingFileType === FILE_TYPES.IMAGE && (
              <div className="mt-2 text-center">
                <ImageSizeBadge
                  size={fileSize}
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
              id={`file${fileNumber}Input`}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange(e, fileNumber)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              disabled={saving || uploadingFiles}
            />
            <p className="text-xs text-gray-500 mb-2">
              Supported: Images (JPG, PNG, GIF, WEBP, HEIC) and PDF files (Max:
              10MB)
            </p>

            {/* Error message */}
            {fileInfo.error && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                ⚠️ {fileInfo.error}
              </div>
            )}

            {/* Optimization info - only for images */}
            {fileInfo.optimization &&
              fileInfo.optimization.savedPercentage > 0 && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex flex-col text-green-800 text-xs">
                    <div className="flex items-center gap-1 font-medium mb-1">
                      <span>🎯</span>
                      <span>
                        {fileInfo.optimization.savedPercentage.toFixed(1)}%
                        space saved
                      </span>
                    </div>
                    <div className="font-mono text-xs">
                      {formatFileSize(fileInfo.optimization.originalSize)} →{" "}
                      {formatFileSize(fileInfo.optimization.optimizedSize)}
                    </div>
                  </div>
                </div>
              )}

            {/* File preview and actions */}
            <div className="space-y-3">
              {/* Existing file preview */}
              {hasExistingFile && !hasNewFile && (
                <div className="relative">
                  {existingFileType === FILE_TYPES.IMAGE ? (
                    <>
                      <img
                        src={existingFileUrl}
                        alt={`Current File ${fileNumber}`}
                        className="max-w-full max-h-36 rounded-lg border border-gray-300"
                      />
                      <ImageSizeBadge
                        size={fileSize}
                        loading={loadingSize}
                        position="overlay"
                      />
                    </>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">
                          {existingFileName || "PDF Document"}
                        </div>
                        <a
                          href={existingFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                        >
                          View PDF
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingFile(fileNumber)}
                      disabled={saving || uploadingFiles}
                      className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-medium hover:bg-red-100 disabled:opacity-50"
                    >
                      Delete{" "}
                      {existingFileType === FILE_TYPES.IMAGE ? "Image" : "PDF"}
                    </button>
                  </div>
                </div>
              )}

              {/* New file preview */}
              {hasNewFile && fileInfo.file && (
                <div className="relative">
                  {fileInfo.type === FILE_TYPES.IMAGE ? (
                    <img
                      src={URL.createObjectURL(fileInfo.file)}
                      alt={`New File ${fileNumber}`}
                      className="max-w-full max-h-36 rounded-lg border border-gray-300"
                    />
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">
                          {fileInfo.file.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          PDF Document • {formatFileSize(fileInfo.file.size)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Size badge for new image files */}
                  {fileInfo.type === FILE_TYPES.IMAGE && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      <span className="font-medium">
                        {formatFileSize(fileInfo.file.size)}
                      </span>
                    </div>
                  )}

                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(fileNumber)}
                      disabled={saving || uploadingFiles}
                      className="px-3 py-1 bg-gray-50 text-gray-700 border border-gray-300 rounded text-xs font-medium hover:bg-gray-100 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Size badge below existing image */}
            {hasExistingFile &&
              !hasNewFile &&
              existingFileType === FILE_TYPES.IMAGE && (
                <div className="mt-2 text-center">
                  <ImageSizeBadge
                    size={fileSize}
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
                disabled={isViewMode || saving || uploadingFiles}
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
                  disabled={saving || uploadingFiles}
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

            {/* Renewable Toggle - Show in both add and edit modes */}
            {!isViewMode && (
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="isRenewable"
                  checked={isRenewable}
                  onChange={(e) => {
                    setIsRenewable(e.target.checked);
                    if (!e.target.checked) {
                      // Clear dates when unchecking
                      setFormData({
                        ...formData,
                        startDate: null,
                        endDate: null,
                      });
                    } else {
                      // Only set default end date when checking (30 days from now)
                      // Start date remains null/optional
                      if (!formData.endDate) {
                        const now = Date.now();
                        const thirtyDaysFromNow =
                          now + 30 * 24 * 60 * 60 * 1000;
                        setFormData({
                          ...formData,
                          endDate: thirtyDaysFromNow,
                          // Don't set start date automatically
                        });
                      }
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  disabled={saving || uploadingFiles}
                />
                <label
                  htmlFor="isRenewable"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  This item has renewal dates
                </label>
                <span className="text-xs text-gray-500">
                  (Check if this item requires an end date - start date is
                  optional)
                </span>
              </div>
            )}

            {/* Date Range Fields - Show if renewable OR (in view mode and either date exists) */}
            {(isRenewable ||
              (isViewMode && (formData.startDate || formData.endDate))) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date {!isViewMode && "(Optional)"}
                  </label>
                  {isViewMode ? (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 min-h-[40px] flex items-center">
                      {formatDate(formData.startDate) || "Not specified"}
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={formatDateInput(formData.startDate)}
                      onChange={(e) => {
                        const dateValue = e.target.value;
                        setFormData({
                          ...formData,
                          startDate: dateValue
                            ? new Date(dateValue).getTime()
                            : null,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      // Remove required attribute for start date
                      disabled={saving || uploadingFiles}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date {!isViewMode && "*"}
                  </label>
                  {isViewMode ? (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 min-h-[40px] flex items-center">
                      {formatDate(formData.endDate) || "Not specified"}
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={formatDateInput(formData.endDate)}
                      onChange={(e) => {
                        const dateValue = e.target.value;
                        setFormData({
                          ...formData,
                          endDate: dateValue
                            ? new Date(dateValue).getTime()
                            : null,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required={isRenewable} // End date still required
                      disabled={saving || uploadingFiles}
                    />
                  )}
                </div>
              </div>
            )}

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
                  disabled={saving || uploadingFiles}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderFileSection(1)}
              {renderFileSection(2)}
            </div>

            {/* Optimization note */}
            {!isViewMode && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-blue-500 mt-0.5">ℹ️</div>
                  <div className="text-xs text-blue-800">
                    <div className="font-medium mb-1">
                      File Support & Optimization
                    </div>
                    <div>
                      • Images are automatically compressed to save storage
                      space. HEIC files are converted to JPEG.
                    </div>
                    <div>
                      • PDF files are uploaded as-is without compression.
                    </div>
                    <div className="mt-1 text-blue-600">
                      Max file size: 10MB | Supported: Images and PDFs
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
                    disabled={saving || uploadingFiles}
                  >
                    Cancel
                  </button>

                  {/* DELETE Button */}
                  {isEditMode && showDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                      disabled={saving || uploadingFiles}
                    >
                      {saving ? "Deleting..." : "Delete"}
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    disabled={saving || uploadingFiles}
                  >
                    {saving || uploadingFiles
                      ? "Saving..."
                      : isAddMode
                        ? "Add Item"
                        : "Update"}
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
