import React, { useState, useEffect, useRef } from "react";
import {
  getFirestore,
  collection,
  getDocs,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, deleteObject } from "firebase/storage";
import { Jewellery, VerificationStatus } from "../models/types";
import { useJewellerySettings } from "../hooks/useSettingsData";
import { useNavigate, useLocation } from "react-router-dom";
import {
  optimizeFile,
  validateFile,
  formatFileSize,
} from "../../../utils/fileOptimizer";
import { useImageSize, ImageSizeBadge } from "../../../utils/imageSizeUtils";
import CustomCalendar from "../../../components/UI/CustomCalendar";
import BillAssignment from "./BillAssignment";
import DeleteConfirmationDialog from "../../../components/DeleteConfirmationDialog";

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
  const location = useLocation();
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

  // Calendar states - simplified
  const [showCalendar, setShowCalendar] = useState(false);

  // Get settings data
  const {
    locations,
    boughtForOptions,
    loading: settingsLoading,
  } = useJewellerySettings();

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

  const handleBillChange = (billId: string) => {
    setFormData({ ...formData, billId });
  };

  const selectDate = (timestamp: number) => {
    setFormData((prev) => ({
      ...prev,
      purchaseDate: timestamp,
    }));
    setShowCalendar(false);
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
    if (!formData.imageUrl) return;

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

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Get return location and active tab from navigation state
      const returnTo = location.state?.returnTo || "/jewellery";
      const activeTab = location.state?.activeTab || "list";

      navigate(returnTo, {
        state: { activeTab: activeTab },
      });
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
              onClick={() => setShowCalendar(true)}
              className="w-full p-2 pr-10 border border-gray-300 rounded text-sm bg-white cursor-pointer date-input"
            />
            <button
              type="button"
              onClick={() => setShowCalendar(true)}
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
        <CustomCalendar
          selectedDate={formData.purchaseDate || Date.now()}
          onSelectDate={selectDate}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* Bill Assignment Component */}
      <BillAssignment
        billId={formData.billId || ""}
        bills={bills}
        loadingBills={loadingBills}
        onBillChange={handleBillChange}
      />

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
              <span>Delete Item</span>
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

      {/* Delete Image Confirmation Dialog - Using reusable component */}
      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
        }}
        onConfirm={handleDeleteImage}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        itemName="jewellery image"
        isDeleting={deletingImage}
      />
    </form>
  );
};

export default JewelleryForm;