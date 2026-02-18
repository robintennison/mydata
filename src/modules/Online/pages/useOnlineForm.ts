import { useState, useEffect } from "react";
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
} from "../../../utils/fileOptimizer";
import { parseTimestamp, getFileTypeFromName } from "../../../utils/onlineFormHelpers";

export const useOnlineForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const { settings } = useSettings();
  const showDelete = settings?.showDelete || false;
  const [storage] = useState(() => getStorage());

  // Calendar state
  const [showCalendar, setShowCalendar] = useState<"start" | "end" | null>(null);
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
  const [deleting, setDeleting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // File states
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

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const calendar = document.getElementById("calendar-popup");
      if (
        calendar &&
        !calendar.contains(event.target as Node) &&
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
      resetForm();
    }
  }, [id, location.pathname]);

  const resetForm = () => {
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
  };

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

        const hasOldImageFields =
          data.image1 !== undefined || data.image2 !== undefined;

        let file1Type = data.file1Type;
        if (!file1Type && data.file1) {
          file1Type = data.file1?.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i)
            ? FILE_TYPES.IMAGE
            : data.file1?.match(/\.pdf$/i)
              ? FILE_TYPES.PDF
              : FILE_TYPES.NONE;
        } else if (!file1Type && data.image1) {
          file1Type = FILE_TYPES.IMAGE;
        }

        let file2Type = data.file2Type;
        if (!file2Type && data.file2) {
          file2Type = data.file2?.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i)
            ? FILE_TYPES.IMAGE
            : data.file2?.match(/\.pdf$/i)
              ? FILE_TYPES.PDF
              : FILE_TYPES.NONE;
        } else if (!file2Type && data.image2) {
          file2Type = FILE_TYPES.IMAGE;
        }

        setFormData({
          id: itemDoc.id,
          name: data.name || "",
          detail: data.detail || "",
          category: data.category || "",
          startDate: startDate,
          endDate: endDate,
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

  // Calendar functions
  const openCalendar = (field: "start" | "end") => {
    setShowCalendar(field);
    setShowYearSelector(false);
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

  // File functions
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileNumber: 1 | 2,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    const validation = validateFile(file, allowedTypes, 10);
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
          file: optimized,
        };

        if (fileNumber === 1) {
          setFile1Info((prev) => ({ ...prev, ...optimizationUpdate }));
        } else {
          setFile2Info((prev) => ({ ...prev, ...optimizationUpdate }));
        }
      } catch (err: any) {
        console.error(`Error optimizing file ${fileNumber}:`, err);
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

    const input = document.getElementById(
      `file${fileNumber}Input`,
    ) as HTMLInputElement;
    if (input) input.value = "";
  };

  const uploadFile = async (
    fileInfo: FileInfo,
    fileNumber: 1 | 2,
  ): Promise<{ url: string; type: FileType; name: string }> => {
    if (!fileInfo.file) throw new Error("No file to upload");

    try {
      let fileToUpload = fileInfo.file;

      if (fileInfo.type === FILE_TYPES.IMAGE && fileInfo.optimization) {
        fileToUpload = fileInfo.file;
      }

      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const fileExtension = fileToUpload.name.split(".").pop();
      const fileType = fileInfo.type === FILE_TYPES.IMAGE ? "image" : "pdf";
      const fileName = `online_${fileType}_${fileNumber}_${timestamp}_${randomId}.${fileExtension}`;

      const storageRef = ref(storage, `online_files/${fileName}`);
      const snapshot = await uploadBytes(storageRef, fileToUpload);

      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${snapshot.ref.bucket}/o/${encodeURIComponent(snapshot.ref.fullPath)}?alt=media`;

      return {
        url: downloadURL,
        type: fileInfo.type,
        name: fileInfo.file.name,
      };
    } catch (error: any) {
      console.error(`Error uploading file ${fileNumber}:`, error);
      throw error;
    }
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
      if (fileUrl.includes("firebasestorage.googleapis.com")) {
        const url = new URL(fileUrl);
        const pathMatch = url.pathname.match(/\/o\/(.+?)(?:\?|$)/);

        if (pathMatch) {
          const filePath = decodeURIComponent(pathMatch[1]);
          const storageRef = ref(storage, filePath);
          await deleteObject(storageRef);
        }
      }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      alert("Item name is required");
      return;
    }

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

      const itemData = {
        name: (formData.name || "").trim(),
        detail: (formData.detail || "").trim(),
        category: formData.category || "",
        startDate: formData.startDate,
        endDate: formData.endDate,
        file1: file1Url,
        file2: file2Url,
        file1Type: file1Type,
        file2Type: file2Type,
        file1Name: file1Name,
        file2Name: file2Name,
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
        errorMessage = "Storage quota exceeded. Files are optimized to save space.";
      } else if (error.code === "storage/unauthorized") {
        errorMessage = "Upload failed: You don't have permission to upload files.";
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
      setDeleting(true);

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

      const db = getFirestore();
      await deleteDoc(doc(db, "online", id));

      alert("Item deleted successfully!");
      navigate("/online", { state: { activeTab: "items" } });
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    } finally {
      setDeleting(false);
    }
  };

  const getPageTitle = () => {
    if (isAddMode) return "Add Item";
    if (isEditMode) return "Edit Item";
    if (isViewMode) return "View Item";
    return "Item Details";
  };

  return {
    // State
    formData,
    setFormData,
    categories,
    loading,
    saving,
    deleting,
    uploadingFiles,
    file1Info,
    file2Info,
    showDelete,
    isAddMode,
    isEditMode,
    isViewMode,
    id,
    
    // Calendar state
    showCalendar,
    currentMonth,
    showYearSelector,
    openCalendar,
    selectDate,
    navigateMonth,
    navigateYear,
    selectYear,
    setShowCalendar,
    setShowYearSelector,
    
    // Actions
    handleSubmit,
    handleDelete,
    handleFileChange,
    handleRemoveFile,
    handleDeleteExistingFile,
    getPageTitle,
    navigate,
  };
};