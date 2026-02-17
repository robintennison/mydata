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
import { formatDate } from "../../../utils/formatters";

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

  // Calendar refs
  const calendarRef = useRef<HTMLDivElement>(null);
  const [showCalendar, setShowCalendar] = useState<"start" | "end" | null>(
    null,
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showYearSelector, setShowYearSelector] = useState(false);

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

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".date-input")
      ) {
        setShowCalendar(null);
        setShowYearSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  // Calendar helper functions
  const openCalendar = (field: "start" | "end") => {
    setShowCalendar(field);
    setShowYearSelector(false);
    // Set current month based on the selected date
    const dateValue = field === "start" ? formData.startDate : formData.endDate;
    setCurrentMonth(dateValue ? new Date(dateValue) : new Date());
  };

  const selectDate = (date: Date, field: "start" | "end") => {
    setFormData((prev) => ({
      ...prev,
      [field === "start" ? "startDate" : "endDate"]: date.getTime(),
    }));
    setShowCalendar(null);
    setShowYearSelector(false);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const navigateYear = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      newMonth.setFullYear(newMonth.getFullYear() - 1);
    } else {
      newMonth.setFullYear(newMonth.getFullYear() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const selectYear = (year: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(year);
    setCurrentMonth(newMonth);
    setShowYearSelector(false);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDate = (date: Date, field: "start" | "end") => {
    const selectedDate =
      field === "start" ? formData.startDate : formData.endDate;
    if (!selectedDate) return false;
    const compareDate = new Date(selectedDate);
    return (
      date.getDate() === compareDate.getDate() &&
      date.getMonth() === compareDate.getMonth() &&
      date.getFullYear() === compareDate.getFullYear()
    );
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="py-2.5"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isTodayDate = isToday(date);
      const isSelectedStart = isSelectedDate(date, "start");
      const isSelectedEnd = isSelectedDate(date, "end");
      const isSelected =
        showCalendar === "start" ? isSelectedStart : isSelectedEnd;

      days.push(
        <button
          key={day}
          onClick={() => selectDate(date, showCalendar!)}
          className={`py-2.5 bg-transparent border-none rounded text-sm transition-all ${
            isSelected
              ? "bg-blue-500 text-white font-semibold"
              : "text-gray-800 hover:bg-gray-100"
          } ${isTodayDate && !isSelected ? "border-2 border-blue-500" : ""}`}
          type="button"
        >
          {day}
        </button>,
      );
    }

    return days;
  };

  const renderYearSelector = () => {
    const currentYear = currentMonth.getFullYear();
    const startYear = currentYear - 6;
    const years = [];

    for (let year = startYear; year <= startYear + 12; year++) {
      years.push(
        <button
          key={year}
          onClick={() => selectYear(year)}
          className={`py-2.5 border-none rounded text-sm transition-all ${
            year === currentYear
              ? "bg-blue-500 text-white font-semibold"
              : "bg-transparent text-gray-800 hover:bg-gray-100"
          }`}
          type="button"
        >
          {year}
        </button>,
      );
    }

    return (
      <div className="max-h-72 overflow-y-auto p-2.5 grid grid-cols-4 gap-2">
        {years}
      </div>
    );
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

    // Only validate date order if both dates exist
    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate > formData.endDate
    ) {
      alert("End date must be after start date");
      return;
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
        // Dates are now always included (can be null)
        startDate: formData.startDate,
        endDate: formData.endDate,
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

  const formatDateDisplay = (timestamp?: number | null): string => {
    if (!timestamp) return "Not specified";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid date";
      return formatDate(timestamp, "en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
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

            {/* Date Range Fields with Custom Calendar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date {!isViewMode && "(Optional)"}
                </label>
                {isViewMode ? (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 min-h-[40px] flex items-center">
                    {formatDateDisplay(formData.startDate)}
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={formatDateDisplay(formData.startDate)}
                      readOnly
                      onClick={() => openCalendar("start")}
                      className="date-input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition cursor-pointer pr-10"
                      placeholder="Select start date"
                    />
                    <button
                      onClick={() => openCalendar("start")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 p-1"
                      title="Pick start date"
                      type="button"
                    >
                      📅
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date {!isViewMode && "(Optional)"}
                </label>
                {isViewMode ? (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 min-h-[40px] flex items-center">
                    {formatDateDisplay(formData.endDate)}
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={formatDateDisplay(formData.endDate)}
                      readOnly
                      onClick={() => openCalendar("end")}
                      className="date-input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition cursor-pointer pr-10"
                      placeholder="Select end date"
                    />
                    <button
                      onClick={() => openCalendar("end")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 p-1"
                      title="Pick end date"
                      type="button"
                    >
                      📅
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar Popup */}
            {showCalendar && !isViewMode && (
              <div
                ref={calendarRef}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-xl shadow-2xl z-[10001] p-5 w-[90%] max-w-sm max-h-[80vh] overflow-hidden"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigateYear("prev")}
                      className="px-2.5 py-1.5 border border-gray-300 rounded text-sm text-gray-700 min-w-10 hover:bg-gray-50"
                      title="Previous Year"
                      type="button"
                    >
                      &lt;&lt;
                    </button>
                    <button
                      onClick={() => navigateMonth("prev")}
                      className="px-2.5 py-1.5 border border-gray-300 rounded text-sm text-gray-700 min-w-10 hover:bg-gray-50"
                      title="Previous Month"
                      type="button"
                    >
                      &lt;
                    </button>
                  </div>

                  <button
                    onClick={() => setShowYearSelector(!showYearSelector)}
                    className="px-2 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-100 rounded"
                    title="Select Year"
                    type="button"
                  >
                    {currentMonth.toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigateMonth("next")}
                      className="px-2.5 py-1.5 border border-gray-300 rounded text-sm text-gray-700 min-w-10 hover:bg-gray-50"
                      title="Next Month"
                      type="button"
                    >
                      &gt;
                    </button>
                    <button
                      onClick={() => navigateYear("next")}
                      className="px-2.5 py-1.5 border border-gray-300 rounded text-sm text-gray-700 min-w-10 hover:bg-gray-50"
                      title="Next Year"
                      type="button"
                    >
                      &gt;&gt;
                    </button>
                  </div>
                </div>

                {showYearSelector ? (
                  renderYearSelector()
                ) : (
                  <>
                    <div className="grid grid-cols-7 mb-2">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                        <div
                          key={day}
                          className="text-center text-xs text-gray-500 font-medium py-1"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {renderCalendar()}
                    </div>
                  </>
                )}

                <div className="flex justify-center gap-2.5 mt-4">
                  <button
                    onClick={() => {
                      const today = new Date();
                      selectDate(today, showCalendar);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                    type="button"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      setShowCalendar(null);
                      setShowYearSelector(false);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                    type="button"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        [showCalendar === "start" ? "startDate" : "endDate"]:
                          null,
                      }));
                      setShowCalendar(null);
                      setShowYearSelector(false);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                    type="button"
                  >
                    Clear
                  </button>
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

            {/* Timestamps - Show in View mode */}
            {isViewMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Created
                  </label>
                  <div className="text-sm text-gray-900">
                    {formatDateDisplay(formData.createdAt)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Last Updated
                  </label>
                  <div className="text-sm text-gray-900">
                    {formatDateDisplay(formData.updatedAt)}
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
