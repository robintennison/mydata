import React, { useState, useEffect, useRef } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, deleteObject } from "firebase/storage";
import { Jewellery, VerificationStatus } from "../models/types";
import { useJewellerySettings } from "../hooks/useSettingsData";
import { useNavigate } from "react-router-dom";
import {
  optimizeFile,
  validateFile,
  formatFileSize,
} from "../../../utils/fileOptimizer";
import { useImageSize, ImageSizeBadge } from "../../../utils/imageSizeUtils";

interface JewelleryFormProps {
  initialData?: Partial<Jewellery>;
  onSubmit: (data: Partial<Jewellery>) => void;
  onDelete?: () => void;
  isEditing?: boolean;
  onCancel?: () => void;
  showDelete?: boolean;
}

interface Bill {
  id: string;
  downloadUrl: string;
  mimeType: string;
  notes: string | null;
  createdAt: number;
  uploadedAt: number;
}

const JewelleryForm: React.FC<JewelleryFormProps> = ({
  initialData,
  onSubmit,
  onDelete,
  isEditing = false,
  onCancel,
  showDelete = false,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storage] = useState(getStorage());

  const [formData, setFormData] = useState<Partial<Jewellery>>({
    code: "",
    description: "",
    weight: 0,
    location: "",
    boughtFor: "",
    purchaseDate: Date.now(),
    active: true,
    verificationStatus: VerificationStatus.NOT_VERIFIED,
    verificationNotes: "",
    lastVerified: 0,
    billId: "",
    imageUrl: "",
    ...initialData,
  });

  const [bills, setBills] = useState<Bill[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [assignedBill, setAssignedBill] = useState<Bill | null>(null);
  const [loadingAssignedBill, setLoadingAssignedBill] = useState(false);
  const [showBillDropdown, setShowBillDropdown] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);

  // Image states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [optimizationInfo, setOptimizationInfo] = useState<{
    originalSize: number;
    optimizedSize: number;
    savedPercentage: number;
  } | null>(null);

  // Use the image size hook
  const { size: currentImageSize, loading: loadingImageSize } = useImageSize(
    formData.imageUrl || null,
  );

  // Calendar states
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(formData.purchaseDate || Date.now()),
  );
  const [showYearSelector, setShowYearSelector] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Get settings data
  const {
    locations,
    boughtForOptions,
    loading: settingsLoading,
  } = useJewellerySettings();

  // Fetch assigned bill details based on billId
  useEffect(() => {
    const fetchAssignedBill = async () => {
      if (!formData.billId) {
        setAssignedBill(null);
        setShowBillDropdown(false);
        setBillError(null);
        return;
      }

      try {
        setLoadingAssignedBill(true);
        setBillError(null);
        const db = getFirestore();
        const billRef = doc(db, "bills", formData.billId);
        const billDoc = await getDoc(billRef);

        if (billDoc.exists()) {
          const data = billDoc.data();

          const billData: Bill = {
            id: billDoc.id,
            downloadUrl: data.downloadUrl || "",
            mimeType: data.mimeType || "",
            notes: data.notes || null,
            createdAt: data.createdAt || 0,
            uploadedAt: data.uploadedAt || 0,
          };

          // Check for alternative URL fields if downloadUrl is empty
          if (!billData.downloadUrl) {
            const possibleUrlFields = [
              "url",
              "fileUrl",
              "imageUrl",
              "pdfUrl",
              "billUrl",
              "documentUrl",
              "attachmentUrl",
            ];

            for (const field of possibleUrlFields) {
              if (data[field]) {
                billData.downloadUrl = data[field];
                break;
              }
            }
          }

          if (!billData.downloadUrl) {
            setBillError("No downloadable content available");
          }

          setAssignedBill(billData);
          setShowBillDropdown(false);
        } else {
          setAssignedBill(null);
          setBillError("Bill document not found");
          setShowBillDropdown(true);
        }
      } catch (error: any) {
        console.error("Error fetching assigned bill:", error);
        setAssignedBill(null);
        setBillError(`Failed to load bill: ${error.message}`);
        setShowBillDropdown(true);
      } finally {
        setLoadingAssignedBill(false);
      }
    };

    fetchAssignedBill();
  }, [formData.billId]);

  // Fetch all bills for dropdown
  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoadingBills(true);
        const db = getFirestore();
        const billsRef = collection(db, "bills");
        const snapshot = await getDocs(billsRef);

        const billsList: Bill[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          billsList.push({
            id: doc.id,
            downloadUrl: data.downloadUrl || "",
            mimeType: data.mimeType || "",
            notes: data.notes || null,
            createdAt: data.createdAt || 0,
            uploadedAt: data.uploadedAt || 0,
          });
        });

        // Sort bills by notes
        billsList.sort((a, b) => {
          const noteA = (a.notes || "").toLowerCase();
          const noteB = (b.notes || "").toLowerCase();
          return noteA.localeCompare(noteB);
        });

        setBills(billsList);
      } catch (error: any) {
        console.error("Error fetching bills:", error);
      } finally {
        setLoadingBills(false);
      }
    };

    fetchBills();
  }, []);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".date-input")
      ) {
        setShowCalendar(false);
        setShowYearSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (name === "weight") {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const openCalendar = () => {
    setShowCalendar(true);
    setShowYearSelector(false);
    setCurrentMonth(new Date(formData.purchaseDate || Date.now()));
  };

  const selectDate = (date: Date) => {
    setFormData((prev) => ({
      ...prev,
      purchaseDate: date.getTime(),
    }));
    setShowCalendar(false);
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

  const isSelectedDate = (date: Date) => {
    const selectedDate = new Date(formData.purchaseDate || Date.now());
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
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
      const isSelected = isSelectedDate(date);

      days.push(
        <button
          key={day}
          onClick={() => selectDate(date)}
          className={`
            p-2 bg-none border-none rounded cursor-pointer text-sm transition-colors hover:bg-gray-100
            ${isSelected ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
            ${isTodayDate ? "border border-blue-500" : ""}
          `}
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
          className={`
            p-2 bg-none border-none rounded cursor-pointer text-sm
            ${year === currentYear ? "bg-blue-500 text-white font-semibold" : "text-gray-700"}
          `}
        >
          {year}
        </button>,
      );
    }

    return (
      <div className="max-h-[300px] overflow-y-auto p-2 grid grid-cols-4 gap-2">
        {years}
      </div>
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/jpg",
      "image/heic",
      "image/heif",
    ];

    const validation = validateFile(file, validTypes, 5); // 5MB max
    if (!validation.valid) {
      setImageError(validation.error || "Invalid file");
      setSelectedFile(null);
      setOptimizationInfo(null);
      return;
    }

    setSelectedFile(file);
    setImageError(null);
    setOptimizationInfo(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      // Preview is handled by the file URL
    };
    reader.readAsDataURL(file);

    // Optimize the file in background
    try {
      const optimized = await optimizeFile(file);
      const originalSize = file.size;
      const optimizedSize = optimized.size;
      const savedPercentage =
        ((originalSize - optimizedSize) / originalSize) * 100;

      setOptimizationInfo({
        originalSize,
        optimizedSize,
        savedPercentage,
      });

      console.log(
        `Image will be optimized: ${formatFileSize(originalSize)} → ${formatFileSize(optimizedSize)} (${savedPercentage.toFixed(1)}% saved)`,
      );
    } catch (err: any) {
      console.error("Error optimizing image:", err);
      setOptimizationInfo(null);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) {
      setImageError("Please select an image file first");
      return;
    }

    try {
      setUploadingImage(true);
      setImageError(null);

      // Optimize the image
      let fileToUpload = selectedFile;
      if (optimizationInfo && optimizationInfo.savedPercentage > 0) {
        try {
          fileToUpload = await optimizeFile(selectedFile);
          console.log(
            `Uploading optimized file: ${formatFileSize(fileToUpload.size)}`,
          );
        } catch (err) {
          console.error(
            "Error during final optimization, using original:",
            err,
          );
        }
      }

      // Generate a unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const fileExtension = fileToUpload.name.split(".").pop();
      const fileName = `jewellery_${timestamp}_${randomId}.${fileExtension}`;

      // Create storage reference
      const storageRef = ref(storage, `jewellery_images/${fileName}`);

      // Upload optimized file
      const snapshot = await uploadBytes(storageRef, fileToUpload);

      // Get download URL
      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${snapshot.ref.bucket}/o/${encodeURIComponent(snapshot.ref.fullPath)}?alt=media`;

      // Update form data with new image URL
      setFormData((prev) => ({
        ...prev,
        imageUrl: downloadURL,
      }));

      // Clear selected file
      setSelectedFile(null);
      setOptimizationInfo(null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      setImageError(`Failed to upload image: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!formData.imageUrl) {
      setShowDeleteConfirm(false);
      return;
    }

    try {
      setDeletingImage(true);
      setImageError(null);

      // Extract file path from URL
      const url = new URL(formData.imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+?)(?:\?|$)/);

      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const storageRef = ref(storage, filePath);

        // Delete file from storage
        await deleteObject(storageRef);

        // Update form data
        setFormData((prev) => ({
          ...prev,
          imageUrl: "",
        }));
      } else {
        throw new Error("Could not extract file path from URL");
      }
    } catch (error: any) {
      console.error("Error deleting image:", error);
      setImageError(`Failed to delete image: ${error.message}`);
    } finally {
      setDeletingImage(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleViewBill = () => {
    if (!assignedBill) return;

    if (assignedBill.downloadUrl) {
      window.open(assignedBill.downloadUrl, "_blank");
    } else {
      alert(
        `Bill Details:\n\nBill Notes: ${assignedBill.notes || "No notes"}\n\nNo bill document available.`,
      );
    }
  };

  const handleDownloadBill = () => {
    if (!assignedBill || !assignedBill.downloadUrl) {
      alert("No bill document available for download.");
      return;
    }

    const link = document.createElement("a");
    link.href = assignedBill.downloadUrl;

    let filename = `Bill_${formData.code || "Document"}`;

    try {
      const urlObj = new URL(assignedBill.downloadUrl);
      const pathParts = urlObj.pathname.split("/");
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.includes(".")) {
        filename = lastPart;
      }
    } catch (e) {
      console.log("Could not parse URL for filename");
    }

    if (assignedBill.mimeType) {
      if (
        assignedBill.mimeType.includes("pdf") &&
        !filename.toLowerCase().endsWith(".pdf")
      ) {
        filename += ".pdf";
      } else if (
        assignedBill.mimeType.includes("image") &&
        !filename.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)
      ) {
        if (assignedBill.mimeType.includes("jpeg")) {
          filename += ".jpg";
        } else if (assignedBill.mimeType.includes("png")) {
          filename += ".png";
        } else if (assignedBill.mimeType.includes("gif")) {
          filename += ".gif";
        } else {
          filename += ".jpg";
        }
      }
    }

    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleChangeBillClick = () => {
    setShowBillDropdown(true);
  };

  const handleCancelChangeBill = () => {
    setShowBillDropdown(false);
  };

  const handleAddBillClick = () => {
    setShowBillDropdown(true);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Changed from "/jewellery" to "/jewellery/list"
      navigate("/jewellery/list");
    }
  };

  const handleCancelImageUpload = () => {
    setSelectedFile(null);
    setImageError(null);
    setOptimizationInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get image preview URL (either from selected file or existing URL)
  const getImagePreview = () => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    return formData.imageUrl || null;
  };

  const imagePreview = getImagePreview();

  return (
    <form onSubmit={handleSubmit} className="p-4">
      {/* Image Section */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2">
          Jewellery Image
        </label>

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 text-center relative">
            <div className="inline-block max-w-full relative">
              <img
                src={imagePreview}
                alt="Jewellery preview"
                className="max-w-[300px] max-h-[300px] rounded-lg border border-gray-200 shadow-sm mx-auto"
              />

              {/* Size badge overlay */}
              {selectedFile ? (
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  <span className="font-medium">
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
              ) : (
                <ImageSizeBadge
                  size={currentImageSize}
                  loading={loadingImageSize}
                  position="overlay"
                />
              )}

              {/* Delete button overlay */}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deletingImage}
                className="absolute top-2 right-2 bg-red-600/90 text-white border-none rounded-full w-8 h-8 cursor-pointer flex items-center justify-center text-sm hover:bg-red-700/90 disabled:opacity-70 transition-colors"
                title="Delete Image"
              >
                {deletingImage ? "⏳" : "🗑️"}
              </button>
            </div>

            {/* Size badge below image */}
            {formData.imageUrl && !selectedFile && (
              <div className="mt-2 text-center">
                <ImageSizeBadge
                  size={currentImageSize}
                  loading={loadingImageSize}
                  position="below"
                />
              </div>
            )}
          </div>
        )}

        {/* File Upload Section */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploadingImage || deletingImage}
                className="w-full p-2 border border-gray-300 rounded text-sm bg-white file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>

            {selectedFile ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={uploadingImage || deletingImage}
                  className="px-3 py-2 bg-green-500 text-white border-none rounded text-sm cursor-pointer flex items-center gap-1.5 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? (
                    <>
                      <span>⏳</span>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span>📤</span>
                      <span>Upload</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancelImageUpload}
                  disabled={uploadingImage || deletingImage}
                  className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded text-sm cursor-pointer hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              !imagePreview && (
                <div className="text-xs text-gray-500 italic">
                  No image selected
                </div>
              )
            )}
          </div>

          {/* File info and optimization details */}
          {selectedFile && (
            <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
              <div className="flex justify-between items-center mb-1">
                <div className="font-medium">Selected: {selectedFile.name}</div>
                <div>{formatFileSize(selectedFile.size)}</div>
              </div>

              {optimizationInfo && optimizationInfo.savedPercentage > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded">
                  <div className="flex justify-between items-center text-green-800">
                    <div className="font-medium flex items-center gap-1">
                      <span>🎯</span>
                      <span>
                        {optimizationInfo.savedPercentage.toFixed(1)}% saved
                      </span>
                    </div>
                    <div className="font-mono">
                      {formatFileSize(optimizationInfo.originalSize)} →{" "}
                      {formatFileSize(optimizationInfo.optimizedSize)}
                    </div>
                  </div>
                </div>
              )}

              {optimizationInfo && optimizationInfo.savedPercentage === 0 && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-blue-800">
                  <div className="flex items-center gap-1">
                    <span>ℹ️</span>
                    <span>File is already optimized</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {imageError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              ⚠️ {imageError}
            </div>
          )}

          {!imagePreview && !selectedFile && (
            <div className="p-5 border-2 border-dashed border-gray-300 rounded text-center text-gray-500">
              <div className="text-2xl mb-2">📷</div>
              <div className="text-sm">No image uploaded</div>
              <div className="text-xs mt-1">
                Click "Choose File" to add an image (max 5MB)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Code and Weight in same row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">Code *</label>
          <input
            type="text"
            name="code"
            value={formData.code || ""}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
          />
        </div>

        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">
            Weight (g) *
          </label>
          <input
            type="number"
            name="weight"
            step="0.01"
            value={formData.weight || ""}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
          />
        </div>
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="block text-xs text-gray-600 mb-1">Description</label>
        <input
          type="text"
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
          placeholder="Description"
        />
      </div>

      {/* Location and Bought For in same row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">Location</label>
          <select
            name="location"
            value={formData.location || ""}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
          >
            <option value="">Select Location</option>
            {settingsLoading ? (
              <option value="" disabled>
                Loading locations...
              </option>
            ) : (
              locations.map((location, index) => (
                <option key={index} value={location}>
                  {location}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">Bought For</label>
          <select
            name="boughtFor"
            value={formData.boughtFor || ""}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
          >
            <option value="">Select Purpose</option>
            {settingsLoading ? (
              <option value="" disabled>
                Loading options...
              </option>
            ) : (
              boughtForOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Purchase Date with Calendar and Active checkbox in same row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">
            Purchase Date
          </label>
          <div className="relative">
            <input
              type="text"
              value={formatDate(formData.purchaseDate || Date.now())}
              readOnly
              onClick={openCalendar}
              className="w-full p-2 pr-10 border border-gray-300 rounded text-sm bg-white cursor-pointer date-input"
            />
            <button
              type="button"
              onClick={openCalendar}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-none border-none cursor-pointer text-gray-500 p-1"
              title="Pick purchase date"
            >
              📅
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-end">
          <label className="flex items-center gap-3 cursor-pointer text-sm">
            <input
              type="checkbox"
              name="active"
              checked={formData.active !== false}
              onChange={handleChange}
              className="w-4 h-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Active Item
          </label>
        </div>
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <div
          ref={calendarRef}
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-5 min-w-[300px] max-w-[400px] w-[90%] max-h-[80vh] overflow-hidden ${showYearSelector ? "min-w-[350px] max-w-[400px]" : ""}`}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex gap-2">
              <button
                onClick={() => navigateYear("prev")}
                className="bg-white border border-gray-200 rounded p-1.5 cursor-pointer text-sm text-gray-700 min-w-10 hover:bg-gray-50"
                title="Previous Year"
                type="button"
              >
                &lt;&lt;
              </button>
              <button
                onClick={() => navigateMonth("prev")}
                className="bg-white border border-gray-200 rounded p-1.5 cursor-pointer text-sm text-gray-700 min-w-10 hover:bg-gray-50"
                title="Previous Month"
                type="button"
              >
                &lt;
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowYearSelector(!showYearSelector)}
                className="text-base font-semibold text-gray-900 cursor-pointer px-2 py-1 rounded hover:bg-gray-100"
                title="Select Year"
                type="button"
              >
                {currentMonth.toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigateMonth("next")}
                className="bg-white border border-gray-200 rounded p-1.5 cursor-pointer text-sm text-gray-700 min-w-10 hover:bg-gray-50"
                title="Next Month"
                type="button"
              >
                &gt;
              </button>
              <button
                onClick={() => navigateYear("next")}
                className="bg-white border border-gray-200 rounded p-1.5 cursor-pointer text-sm text-gray-700 min-w-10 hover:bg-gray-50"
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
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm text-gray-600 font-medium py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
            </>
          )}

          <div className="mt-3 text-center flex justify-center gap-2">
            <button
              onClick={() => {
                const today = new Date();
                selectDate(today);
              }}
              className="px-3 py-1.5 bg-blue-500 text-white border-none rounded cursor-pointer text-sm"
              type="button"
            >
              Today
            </button>
            <button
              onClick={() => {
                setShowCalendar(false);
                setShowYearSelector(false);
              }}
              className="px-3 py-1.5 bg-gray-100 border-none rounded cursor-pointer text-sm"
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Bill Section */}
      <div className="mt-5 pt-4 border-t border-gray-200">
        <label className="text-sm font-medium text-gray-700 mb-2">
          Bill Assignment
        </label>

        {/* Show assigned bill details when available */}
        {!showBillDropdown && assignedBill && !loadingAssignedBill && (
          <div className="flex flex-col gap-2">
            {/* Bill details card */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">📄</span>
                  <span className="font-medium text-gray-900 text-sm">
                    {assignedBill.notes ||
                      `Bill ${assignedBill.id.substring(0, 8)}...`}
                  </span>
                </div>

                {billError && (
                  <span className="text-xs text-red-600">{billError}</span>
                )}
              </div>

              {/* Bill Action Buttons */}
              <div className="flex gap-2 mt-2">
                {assignedBill.downloadUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={handleViewBill}
                      className="px-2 py-1 bg-blue-500 text-white border-none rounded text-xs cursor-pointer flex items-center gap-1 hover:bg-blue-600"
                      title="View Bill"
                    >
                      <span>👁️</span>
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadBill}
                      className="px-2 py-1 bg-green-500 text-white border-none rounded text-xs cursor-pointer flex items-center gap-1 hover:bg-green-600"
                      title="Download Bill"
                    >
                      <span>📥</span>
                      <span>Download</span>
                    </button>
                  </>
                ) : (
                  <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs flex items-center gap-1">
                    <span>⚠️</span>
                    <span>No file available</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleChangeBillClick}
                  className="ml-auto px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs cursor-pointer hover:bg-gray-200"
                >
                  Change Bill
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show loading state for assigned bill */}
        {!showBillDropdown && loadingAssignedBill && (
          <div className="p-3 border border-gray-300 rounded bg-gray-100 text-gray-600 text-center">
            Loading bill information...
          </div>
        )}

        {/* Show "Add Bill" when no bill is assigned */}
        {!showBillDropdown &&
          !assignedBill &&
          !loadingAssignedBill &&
          formData.billId === "" && (
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="flex-1">
                <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded text-gray-600 text-center">
                  No bill assigned to this jewellery item
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddBillClick}
                className="px-3 py-2 bg-green-500 text-white border-none rounded text-sm cursor-pointer flex items-center justify-center gap-1.5 hover:bg-green-600"
              >
                <span>+</span>
                <span>Add Bill</span>
              </button>
            </div>
          )}

        {/* Show dropdown when adding or changing bill */}
        {showBillDropdown && (
          <div>
            {loadingBills ? (
              <div className="p-3 border border-gray-300 rounded bg-gray-100 text-gray-600 text-center">
                Loading available bills...
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  name="billId"
                  value={formData.billId || ""}
                  onChange={handleChange}
                  className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white"
                >
                  <option value="">-- No bill --</option>
                  {bills.map((bill) => (
                    <option key={bill.id} value={bill.id}>
                      {bill.notes || `Bill ${bill.id.substring(0, 8)}...`}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleCancelChangeBill}
                  className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded text-sm cursor-pointer hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            )}

            {assignedBill && (
              <div className="mt-2 text-xs text-gray-500 italic">
                Currently assigned:{" "}
                {assignedBill.notes ||
                  `Bill ${assignedBill.id.substring(0, 12)}...`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit and Cancel Buttons - FIXED FOR MOBILE */}
      <div className="mt-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2.5 sm:px-6 bg-gray-100 text-gray-700 border border-gray-300 rounded cursor-pointer text-base font-medium flex items-center justify-center gap-1.5 hover:bg-gray-200"
          >
            <span>←</span>
            <span>Cancel</span>
          </button>

          {/* Only show Delete button when showDelete is true and onDelete function is provided */}
          {showDelete && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={uploadingImage || deletingImage}
              className="px-4 py-2.5 sm:px-6 bg-red-600 text-white border-none rounded cursor-pointer text-base font-medium flex items-center justify-center gap-1.5 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          )}

          <button
            type="submit"
            disabled={uploadingImage || deletingImage}
            className="px-4 py-2.5 sm:px-6 bg-blue-500 text-white border-none rounded cursor-pointer text-base font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isEditing ? "Update" : "Add Item"}
          </button>
        </div>
      </div>

      {/* Delete Image Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-[400px] w-full shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Delete Image
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this image? This action cannot be
              undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingImage}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteImage}
                disabled={deletingImage}
                className="px-4 py-2 bg-red-600 text-white border-none rounded-lg cursor-pointer hover:bg-red-700"
              >
                {deletingImage ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default JewelleryForm;
