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
import { tw } from "../../../utils/tailwindMapping";

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
  const [imagePreview, setImagePreview] = useState<string | null>(
    formData.imageUrl || null,
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Initialize image preview when formData changes
  useEffect(() => {
    if (formData.imageUrl) {
      setImagePreview(formData.imageUrl);
    } else {
      setImagePreview(null);
    }
  }, [formData.imageUrl]);

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
            ${tw.calendarDay}
            ${isSelected ? tw.selectedDay : ""}
            ${isTodayDate ? tw.todayDay : ""}
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
            ${tw.yearButton}
            ${year === currentYear ? "bg-blue-500 text-white font-semibold" : "text-gray-700"}
          `}
        >
          {year}
        </button>,
      );
    }

    return <div className={tw.yearSelectorGrid}>{years}</div>;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/jpg",
    ];
    if (!validTypes.includes(file.type)) {
      setImageError("Please select a valid image file (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setImageError("Image size should be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setImageError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async () => {
    if (!selectedFile) {
      setImageError("Please select an image file first");
      return;
    }

    try {
      setUploadingImage(true);
      setImageError(null);

      // Generate a unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const fileExtension = selectedFile.name.split(".").pop();
      const fileName = `jewellery_${timestamp}_${randomId}.${fileExtension}`;

      // Create storage reference
      const storageRef = ref(storage, `jewellery_images/${fileName}`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, selectedFile);

      // Get download URL
      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${snapshot.ref.bucket}/o/${encodeURIComponent(snapshot.ref.fullPath)}?alt=media`;

      // Update form data with new image URL
      setFormData((prev) => ({
        ...prev,
        imageUrl: downloadURL,
      }));

      // Clear selected file
      setSelectedFile(null);

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

        // Clear preview
        setImagePreview(null);
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
      navigate("/jewellery/list");
    }
  };

  const handleCancelImageUpload = () => {
    setSelectedFile(null);
    setImageError(null);
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

  return (
    <form onSubmit={handleSubmit} className={tw.formContainer}>
      {/* Image Section */}
      <div className={tw.imageSection}>
        <label className={tw.formSectionTitle}>Jewellery Image</label>

        {/* Image Preview */}
        {imagePreview && (
          <div className={tw.imagePreviewContainer}>
            <div className="inline-block max-w-full relative">
              <img
                src={imagePreview}
                alt="Jewellery preview"
                className={tw.imagePreview}
              />

              {/* Delete button overlay */}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deletingImage}
                className={tw.deleteImageButton}
                title="Delete Image"
              >
                {deletingImage ? "⏳" : "🗑️"}
              </button>
            </div>
          </div>
        )}

        {/* File Upload Section */}
        <div className={tw.imageUploadArea}>
          <div className={tw.imageUploadRow}>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploadingImage || deletingImage}
                className={tw.fileInput}
              />
            </div>

            {selectedFile ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={uploadingImage || deletingImage}
                  className={tw.uploadButton}
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
                  className={tw.cancelUploadButton}
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

          {/* File info and errors */}
          {selectedFile && (
            <div className={tw.fileInfo}>
              Selected: {selectedFile.name} (
              {(selectedFile.size / 1024).toFixed(1)} KB)
            </div>
          )}

          {imageError && <div className={tw.imageError}>⚠️ {imageError}</div>}

          {!imagePreview && !selectedFile && (
            <div className={tw.noImagePlaceholder}>
              <div className={tw.placeholderIcon}>📷</div>
              <div className={tw.placeholderText}>No image uploaded</div>
              <div className={tw.placeholderSubtext}>
                Click "Choose File" to add an image
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Code and Weight in same row */}
      <div className={tw.formRow}>
        <div className={tw.formField}>
          <label className={tw.formLabel}>Code *</label>
          <input
            type="text"
            name="code"
            value={formData.code || ""}
            onChange={handleChange}
            required
            className={tw.formInput}
          />
        </div>

        <div className={tw.formField}>
          <label className={tw.formLabel}>Weight (g) *</label>
          <input
            type="number"
            name="weight"
            step="0.01"
            value={formData.weight || ""}
            onChange={handleChange}
            required
            className={tw.formInput}
          />
        </div>
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className={tw.formLabel}>Description</label>
        <input
          type="text"
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          className={tw.formInput}
          placeholder="Description"
        />
      </div>

      {/* Location and Bought For in same row */}
      <div className={tw.formRow}>
        <div className={tw.formField}>
          <label className={tw.formLabel}>Location</label>
          <select
            name="location"
            value={formData.location || ""}
            onChange={handleChange}
            className={tw.formSelect}
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

        <div className={tw.formField}>
          <label className={tw.formLabel}>Bought For</label>
          <select
            name="boughtFor"
            value={formData.boughtFor || ""}
            onChange={handleChange}
            className={tw.formSelect}
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
      <div className={tw.formRow}>
        <div className={tw.formField}>
          <label className={tw.formLabel}>Purchase Date</label>
          <div className={tw.dateInputContainer}>
            <input
              type="text"
              value={formatDate(formData.purchaseDate || Date.now())}
              readOnly
              onClick={openCalendar}
              className={`${tw.dateInput} date-input`}
            />
            <button
              type="button"
              onClick={openCalendar}
              className={tw.calendarButton}
              title="Pick purchase date"
            >
              📅
            </button>
          </div>
        </div>

        <div className={`${tw.formField} flex items-end`}>
          <label className={tw.checkboxLabel}>
            <input
              type="checkbox"
              name="active"
              checked={formData.active !== false}
              onChange={handleChange}
              className="w-4 h-4"
            />
            Active Item
          </label>
        </div>
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <div
          ref={calendarRef}
          className={`${tw.calendarPopup} ${showYearSelector ? tw.yearSelectorPopup : ""}`}
        >
          <div className={tw.calendarHeader}>
            <div className={tw.calendarNavButtons}>
              <button
                onClick={() => navigateYear("prev")}
                className={tw.calendarNavButton}
                title="Previous Year"
                type="button"
              >
                &lt;&lt;
              </button>
              <button
                onClick={() => navigateMonth("prev")}
                className={tw.calendarNavButton}
                title="Previous Month"
                type="button"
              >
                &lt;
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowYearSelector(!showYearSelector)}
                className={tw.calendarTitle}
                title="Select Year"
                type="button"
              >
                {currentMonth.toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </button>
            </div>

            <div className={tw.calendarNavButtons}>
              <button
                onClick={() => navigateMonth("next")}
                className={tw.calendarNavButton}
                title="Next Month"
                type="button"
              >
                &gt;
              </button>
              <button
                onClick={() => navigateYear("next")}
                className={tw.calendarNavButton}
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
              <div className={tw.daysGrid}>
                {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                  <div key={day} className={tw.dayHeader}>
                    {day}
                  </div>
                ))}
              </div>

              <div className={tw.calendarGrid}>{renderCalendar()}</div>
            </>
          )}

          <div className={tw.calendarActions}>
            <button
              onClick={() => {
                const today = new Date();
                selectDate(today);
              }}
              className={tw.todayButton}
              type="button"
            >
              Today
            </button>
            <button
              onClick={() => {
                setShowCalendar(false);
                setShowYearSelector(false);
              }}
              className={tw.closeCalendarButton}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Bill Section */}
      <div className={tw.billFormSection}>
        <label className={tw.formSectionTitle}>Bill Assignment</label>

        {/* Show assigned bill details when available */}
        {!showBillDropdown && assignedBill && !loadingAssignedBill && (
          <div className="flex flex-col gap-2">
            {/* Bill details card */}
            <div className={tw.billCard}>
              <div className={tw.billFormHeader}>
                <div className={tw.billFormInfo}>
                  <span className={tw.billFormIcon}>📄</span>
                  <span className={tw.billFormTitle}>
                    {assignedBill.notes ||
                      `Bill ${assignedBill.id.substring(0, 8)}...`}
                  </span>
                </div>

                {billError && (
                  <span className="text-xs text-red-600">{billError}</span>
                )}
              </div>

              {/* Bill Action Buttons */}
              <div className={tw.billFormActions}>
                {assignedBill.downloadUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={handleViewBill}
                      className={tw.billFormViewButton}
                      title="View Bill"
                    >
                      <span>👁️</span>
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadBill}
                      className={tw.billFormDownloadButton}
                      title="Download Bill"
                    >
                      <span>📥</span>
                      <span>Download</span>
                    </button>
                  </>
                ) : (
                  <div className={tw.billFormWarning}>
                    <span>⚠️</span>
                    <span>No file available</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleChangeBillClick}
                  className={tw.changeBillButton}
                >
                  Change Bill
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show loading state for assigned bill */}
        {!showBillDropdown && loadingAssignedBill && (
          <div className={tw.loadingText}>Loading bill information...</div>
        )}

        {/* Show "Add Bill" when no bill is assigned */}
        {!showBillDropdown &&
          !assignedBill &&
          !loadingAssignedBill &&
          formData.billId === "" && (
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <div className={tw.noBillCard}>
                  No bill assigned to this jewellery item
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddBillClick}
                className={tw.addBillButton}
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
              <div className={tw.loadingText}>Loading available bills...</div>
            ) : (
              <div className={tw.billSelectRow}>
                <select
                  name="billId"
                  value={formData.billId || ""}
                  onChange={handleChange}
                  className={tw.billSelect}
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
                  className={tw.billCancelButton}
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

      {/* Submit and Cancel Buttons */}
      <div className={tw.formActions}>
        <div className={tw.actionButtonsRow}>
          <button
            type="button"
            onClick={handleCancel}
            className={tw.formCancelButton}
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
              className={tw.formDeleteButton}
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          )}

          <button
            type="submit"
            disabled={uploadingImage || deletingImage}
            className={tw.formSubmitButton}
          >
            {isEditing ? "Update" : "Add Item"}
          </button>
        </div>
      </div>

      {/* Delete Image Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className={tw.modalOverlay}>
          <div className={tw.modalContainer}>
            <h3 className={tw.modalTitle}>Delete Image</h3>
            <p className={tw.modalContent}>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </p>
            <div className={tw.modalActions}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingImage}
                className={tw.modalCancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteImage}
                disabled={deletingImage}
                className={tw.modalConfirmButton}
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
