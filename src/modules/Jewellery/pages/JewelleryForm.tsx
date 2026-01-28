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

interface JewelleryFormProps {
  initialData?: Partial<Jewellery>;
  onSubmit: (data: Partial<Jewellery>) => void;
  isEditing?: boolean;
  onCancel?: () => void;
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
  isEditing = false,
  onCancel,
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
      days.push(<div key={`empty-${i}`} style={{ padding: "10px 0" }}></div>);
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
          style={{
            padding: "10px 0",
            background: "none",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.9rem",
            color: "#333",
            transition: "all 0.2s",
            ...(isSelected
              ? {
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  fontWeight: 600,
                }
              : {}),
            ...(isTodayDate
              ? {
                  border: "2px solid #3b82f6",
                }
              : {}),
          }}
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
          style={{
            padding: "10px 0",
            background: year === currentYear ? "#3b82f6" : "none",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.9rem",
            color: year === currentYear ? "#fff" : "#333",
            fontWeight: year === currentYear ? 600 : 400,
            transition: "all 0.2s",
          }}
        >
          {year}
        </button>,
      );
    }

    return (
      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          padding: "10px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
        }}
      >
        {years}
      </div>
    );
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

  // FIXED: Now navigates to jewellery list instead of browser history
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Navigate back to jewellery list instead of browser history
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
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: "600px", margin: "0 auto" }}
    >
      {/* Image Section - ADDED AT THE TOP */}
      <div style={{ marginBottom: "25px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "10px",
            fontSize: "14px",
            color: "#374151",
            fontWeight: "500",
          }}
        >
          Jewellery Image
        </label>

        {/* Image Preview */}
        {imagePreview && (
          <div
            style={{
              marginBottom: "15px",
              textAlign: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "inline-block",
                maxWidth: "100%",
                position: "relative",
              }}
            >
              <img
                src={imagePreview}
                alt="Jewellery preview"
                style={{
                  maxWidth: "300px",
                  maxHeight: "300px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />

              {/* Delete button overlay */}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deletingImage}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  backgroundColor: "rgba(220, 38, 38, 0.9)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: deletingImage ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  opacity: deletingImage ? 0.7 : 1,
                  transition: "all 0.2s",
                }}
                title="Delete Image"
                onMouseEnter={(e) => {
                  if (!deletingImage) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(185, 28, 28, 0.9)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!deletingImage) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(220, 38, 38, 0.9)";
                  }
                }}
              >
                {deletingImage ? "⏳" : "🗑️"}
              </button>
            </div>
          </div>
        )}

        {/* File Upload Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div
            style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}
          >
            <div style={{ flex: 1 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploadingImage || deletingImage}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  backgroundColor: "white",
                  boxSizing: "border-box",
                  opacity: uploadingImage || deletingImage ? 0.7 : 1,
                  cursor:
                    uploadingImage || deletingImage ? "not-allowed" : "pointer",
                }}
              />
            </div>

            {selectedFile ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={uploadingImage || deletingImage}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: uploadingImage ? "#94a3b8" : "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: uploadingImage ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                    opacity: uploadingImage || deletingImage ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
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
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    cursor:
                      uploadingImage || deletingImage
                        ? "not-allowed"
                        : "pointer",
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                    opacity: uploadingImage || deletingImage ? 0.7 : 1,
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              !imagePreview && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    fontStyle: "italic",
                  }}
                >
                  No image selected
                </div>
              )
            )}
          </div>

          {/* File info and errors */}
          {selectedFile && (
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#475569",
              }}
            >
              Selected: {selectedFile.name} (
              {(selectedFile.size / 1024).toFixed(1)} KB)
            </div>
          )}

          {imageError && (
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#dc2626",
              }}
            >
              ⚠️ {imageError}
            </div>
          )}

          {!imagePreview && !selectedFile && (
            <div
              style={{
                padding: "20px",
                border: "2px dashed #d1d5db",
                borderRadius: "8px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "24px" }}>📷</span>
              </div>
              <div>No image uploaded</div>
              <div style={{ fontSize: "12px", marginTop: "4px" }}>
                Click "Choose File" to add an image
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rest of the form fields remain the same */}
      {/* Code and Weight in same row */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Code *
          </label>
          <input
            type="text"
            name="code"
            value={formData.code || ""}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Weight (g) *
          </label>
          <input
            type="number"
            name="weight"
            step="0.01"
            value={formData.weight || ""}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: "15px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "5px",
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          Description
        </label>
        <input
          type="text"
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
          placeholder="Description"
        />
      </div>

      {/* Location and Bought For in same row - NOW AS DROPDOWNS */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Location
          </label>
          <select
            name="location"
            value={formData.location || ""}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              backgroundColor: "white",
              boxSizing: "border-box",
            }}
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

        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Bought For
          </label>
          <select
            name="boughtFor"
            value={formData.boughtFor || ""}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              backgroundColor: "white",
              boxSizing: "border-box",
            }}
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
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Purchase Date
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={formatDate(formData.purchaseDate || Date.now())}
              readOnly
              onClick={openCalendar}
              className="date-input"
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
                boxSizing: "border-box",
                cursor: "pointer",
                paddingRight: "40px",
                backgroundColor: "#fff",
              }}
            />
            <button
              type="button"
              onClick={openCalendar}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6c757d",
                fontSize: "1.2rem",
                padding: "4px",
              }}
              title="Pick purchase date"
            >
              📅
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              color: "#374151",
              height: "100%",
              paddingBottom: "8px",
            }}
          >
            <input
              type="checkbox"
              name="active"
              checked={formData.active !== false}
              onChange={handleChange}
              style={{ width: "16px", height: "16px" }}
            />
            Active Item
          </label>
        </div>
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <div
          ref={calendarRef}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            zIndex: 10001,
            padding: "20px",
            minWidth: showYearSelector ? "350px" : "300px",
            maxWidth: showYearSelector ? "400px" : "350px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => navigateYear("prev")}
                style={{
                  background: "none",
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  color: "#333",
                  minWidth: "40px",
                }}
                title="Previous Year"
                type="button"
              >
                &lt;&lt;
              </button>
              <button
                onClick={() => navigateMonth("prev")}
                style={{
                  background: "none",
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  color: "#333",
                  minWidth: "40px",
                }}
                title="Previous Month"
                type="button"
              >
                &lt;
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <button
                onClick={() => setShowYearSelector(!showYearSelector)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#333",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                title="Select Year"
                type="button"
              >
                {currentMonth.toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => navigateMonth("next")}
                style={{
                  background: "none",
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  color: "#333",
                  minWidth: "40px",
                }}
                title="Next Month"
                type="button"
              >
                &gt;
              </button>
              <button
                onClick={() => navigateYear("next")}
                style={{
                  background: "none",
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  color: "#333",
                  minWidth: "40px",
                }}
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  marginBottom: "8px",
                }}
              >
                {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                  <div
                    key={day}
                    style={{
                      textAlign: "center" as const,
                      fontSize: "0.85rem",
                      color: "#666",
                      fontWeight: 500,
                      padding: "4px 0",
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "4px",
                }}
              >
                {renderCalendar()}
              </div>
            </>
          )}

          <div
            style={{
              marginTop: "15px",
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <button
              onClick={() => {
                // Set to today
                const today = new Date();
                selectDate(today);
              }}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.9rem",
                color: "#fff",
              }}
              type="button"
            >
              Today
            </button>
            <button
              onClick={() => {
                setShowCalendar(false);
                setShowYearSelector(false);
              }}
              style={{
                padding: "8px 20px",
                backgroundColor: "#f0f0f0",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Bill Section */}
      <div
        style={{
          marginBottom: "20px",
          borderTop: "1px solid #e5e7eb",
          paddingTop: "20px",
        }}
      >
        <label
          style={{
            display: "block",
            marginBottom: "10px",
            fontSize: "14px",
            color: "#374151",
            fontWeight: "500",
          }}
        >
          Bill Assignment
        </label>

        {/* Show assigned bill details when available */}
        {!showBillDropdown && assignedBill && !loadingAssignedBill && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {/* Bill details card */}
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "16px", color: "#3b82f6" }}>📄</span>
                  <span
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#1e293b",
                    }}
                  >
                    {assignedBill.notes ||
                      `Bill ${assignedBill.id.substring(0, 8)}...`}
                  </span>
                </div>

                {billError && (
                  <span style={{ fontSize: "12px", color: "#ef4444" }}>
                    {billError}
                  </span>
                )}
              </div>

              {/* Bill Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                {assignedBill.downloadUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={handleViewBill}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="View Bill"
                    >
                      <span>👁️</span>
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadBill}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Download Bill"
                    >
                      <span>📥</span>
                      <span>Download</span>
                    </button>
                  </>
                ) : (
                  <div
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "#fef3c7",
                      borderRadius: "4px",
                      color: "#92400e",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>⚠️</span>
                    <span>No file available</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleChangeBillClick}
                  style={{
                    marginLeft: "auto",
                    padding: "6px 12px",
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Change Bill
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show loading state for assigned bill */}
        {!showBillDropdown && loadingAssignedBill && (
          <div
            style={{
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              backgroundColor: "#f3f4f6",
              color: "#6b7280",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            Loading bill information...
          </div>
        )}

        {/* Show "Add Bill" when no bill is assigned */}
        {!showBillDropdown &&
          !assignedBill &&
          !loadingAssignedBill &&
          formData.billId === "" && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#64748b",
                    textAlign: "center",
                  }}
                >
                  No bill assigned to this jewellery item
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddBillClick}
                style={{
                  padding: "8px 15px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
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
              <div
                style={{
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                  fontSize: "14px",
                  textAlign: "center",
                }}
              >
                Loading available bills...
              </div>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <select
                  name="billId"
                  value={formData.billId || ""}
                  onChange={handleChange}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                    backgroundColor: "white",
                    boxSizing: "border-box",
                  }}
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
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {assignedBill && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "#6b7280",
                  fontStyle: "italic",
                }}
              >
                Currently assigned:{" "}
                {assignedBill.notes ||
                  `Bill ${assignedBill.id.substring(0, 12)}...`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit and Cancel Buttons */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          justifyContent: "center",
          marginTop: "10px",
        }}
      >
        <button
          type="button"
          onClick={handleCancel}
          style={{
            padding: "10px 30px",
            backgroundColor: "#f3f4f6",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>←</span>
          <span>Cancel</span>
        </button>

        <button
          type="submit"
          disabled={uploadingImage || deletingImage}
          style={{
            padding: "10px 30px",
            backgroundColor:
              uploadingImage || deletingImage ? "#94a3b8" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: uploadingImage || deletingImage ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "500",
            opacity: uploadingImage || deletingImage ? 0.7 : 1,
          }}
        >
          {isEditing ? "Update" : "Add Item"}
        </button>
      </div>

      {/* Delete Image Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#333",
              }}
            >
              Delete Image
            </h3>
            <p
              style={{
                margin: "0 0 24px 0",
                color: "#666",
                lineHeight: "1.5",
                fontSize: "0.95rem",
              }}
            >
              Are you sure you want to delete this image? This action cannot be
              undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingImage}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "transparent",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  color: "#666",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  minWidth: "80px",
                  opacity: deletingImage ? 0.7 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteImage}
                disabled={deletingImage}
                style={{
                  padding: "10px 20px",
                  backgroundColor: deletingImage ? "#9ca3af" : "#dc2626",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontWeight: 500,
                  cursor: deletingImage ? "not-allowed" : "pointer",
                  fontSize: "0.95rem",
                  minWidth: "80px",
                  opacity: deletingImage ? 0.7 : 1,
                }}
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
