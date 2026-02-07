import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bill } from "../models/types";
import { doc, setDoc, addDoc, collection, getDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { firestore, storage } from "../../../lib/firebase";
import {
  optimizeFile,
  validateFile,
  formatFileSize,
} from "../../../utils/fileOptimizer";

const BillForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [optimizationInfo, setOptimizationInfo] = useState<{
    originalSize: number;
    optimizedSize: number;
    savedPercentage: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingFile, setDeletingFile] = useState(false);

  const [formData, setFormData] = useState<Bill>({
    downloadUrl: "",
    mimeType: "",
    notes: null,
    createdAt: Date.now(),
    uploadedAt: Date.now(),
  });

  // Allowed file types for bills
  const allowedFileTypes = [
    "image/*",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  // Load bill data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadBillData();
    }
  }, [id, isEditMode]);

  const loadBillData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const billRef = doc(firestore, "bills", id);
      const billDoc = await getDoc(billRef);

      if (billDoc.exists()) {
        const data = billDoc.data();
        setFormData({
          id: billDoc.id,
          downloadUrl: data.downloadUrl || "",
          mimeType: data.mimeType || "",
          notes: data.notes || null,
          createdAt: data.createdAt || Date.now(),
          uploadedAt: data.uploadedAt || Date.now(),
        });

        // Extract filename from URL if possible
        if (data.downloadUrl) {
          try {
            const url = new URL(data.downloadUrl);
            const pathname = url.pathname;
            const extractedName = pathname.split("/").pop() || "existing-file";
            setFileName(extractedName);
          } catch {
            setFileName("existing-file");
          }
        }
      } else {
        alert("Bill not found");
        navigate("/jewellery");
      }
    } catch (error) {
      console.error("Error loading bill:", error);
      alert("Failed to load bill");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file
    const validation = validateFile(selectedFile, allowedFileTypes, 20); // 20MB max for bills
    if (!validation.valid) {
      setUploadError(validation.error || "Invalid file");
      setFile(null);
      setOptimizationInfo(null);
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setUploadError(null);
    setFormData({
      ...formData,
      mimeType: selectedFile.type,
    });

    // Optimize the file in background
    try {
      const optimized = await optimizeFile(selectedFile);
      const originalSize = selectedFile.size;
      const optimizedSize = optimized.size;
      const savedPercentage =
        ((originalSize - optimizedSize) / originalSize) * 100;

      setOptimizationInfo({
        originalSize,
        optimizedSize,
        savedPercentage,
      });

      console.log(
        `Bill file optimized: ${formatFileSize(originalSize)} → ${formatFileSize(optimizedSize)} (${savedPercentage.toFixed(1)}% saved)`,
      );
    } catch (err: any) {
      console.error("Error optimizing bill file:", err);
      setOptimizationInfo(null);
    }
  };

  const handleDeleteDocument = async () => {
    if (!formData.downloadUrl) {
      setShowDeleteConfirm(false);
      return;
    }

    try {
      setDeletingFile(true);

      // Extract file path from Firebase Storage URL
      // Firebase Storage URLs have format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media
      const url = new URL(formData.downloadUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+?)(?:\?|$)/);

      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        console.log("Deleting file from path:", filePath);

        const storageRef = ref(storage, filePath);

        // Check if file exists before deleting
        try {
          // This will throw if file doesn't exist
          await getDownloadURL(storageRef);

          // Delete file from storage
          await deleteObject(storageRef);
          console.log("File deleted successfully from storage");

          // Update form data
          setFormData((prev) => ({
            ...prev,
            downloadUrl: "",
            mimeType: "",
          }));
          setFileName("");

          alert("Document deleted successfully!");
        } catch (error: any) {
          if (error.code === "storage/object-not-found") {
            console.log("File already deleted from storage");
            // Still update the form data even if file doesn't exist
            setFormData((prev) => ({
              ...prev,
              downloadUrl: "",
              mimeType: "",
            }));
            setFileName("");
            alert("Document removed from record (file was already deleted)");
          } else {
            throw error;
          }
        }
      } else {
        throw new Error("Could not extract file path from URL");
      }
    } catch (error: any) {
      console.error("Error deleting document:", error);
      alert(`Failed to delete document: ${error.message}`);
    } finally {
      setDeletingFile(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Remove file requirement for new bills
    if (!isEditMode && !file && !formData.notes?.trim()) {
      alert("Please provide either a file or notes for the bill");
      return;
    }

    setLoading(true);
    setUploadError(null);

    try {
      let downloadUrl = formData.downloadUrl;
      let mimeType = formData.mimeType;
      let uploadedAt = formData.uploadedAt;
      let optimizedFileName = "";
      let originalFileSize = null;
      let optimizedFileSize = null;
      let optimizationSavedPercentage = 0;
      let originalFileName = null;

      // Upload file if a new file is selected
      if (file) {
        let fileToUpload = file;

        // Check file type and only optimize images
        const isImage = file.type.startsWith("image/");
        const isPDF =
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf");

        console.log(
          `File type: ${file.type}, Is Image: ${isImage}, Is PDF: ${isPDF}`,
        );

        // Only optimize images, not PDFs or other documents
        if (
          isImage &&
          optimizationInfo &&
          optimizationInfo.savedPercentage > 0
        ) {
          try {
            fileToUpload = await optimizeFile(file);
            console.log(
              `Uploading optimized image: ${formatFileSize(fileToUpload.size)}`,
            );
          } catch (err) {
            console.error(
              "Error during final optimization, using original:",
              err,
            );
          }
        } else if (isPDF) {
          console.log("PDF file - no optimization applied, uploading as-is");
        } else {
          console.log("Other document type - no optimization applied");
        }

        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 9);
        const fileExtension =
          fileToUpload.name.split(".").pop() ||
          (fileToUpload.type === "application/pdf"
            ? "pdf"
            : fileToUpload.type.startsWith("image/")
              ? fileToUpload.type.includes("png")
                ? "png"
                : fileToUpload.type.includes("jpeg") ||
                    fileToUpload.type.includes("jpg")
                  ? "jpg"
                  : fileToUpload.type.includes("gif")
                    ? "gif"
                    : "jpg"
              : "dat");

        // CACHE BUSTING FIX: Add timestamp and random ID to filename to prevent caching
        optimizedFileName = `bill_${timestamp}_${randomId}.${fileExtension}`;
        console.log(`Generated unique filename: ${optimizedFileName}`);

        // Use imported storage
        const storageRef = ref(storage, `bills/${optimizedFileName}`);

        // Upload with metadata to prevent caching
        const metadata = {
          contentType: fileToUpload.type,
          cacheControl: "no-cache, max-age=0", // Prevent caching
          customMetadata: {
            originalName: file.name,
            uploadedAt: timestamp.toString(),
            optimized: (fileToUpload !== file).toString(),
          },
        };

        await uploadBytes(storageRef, fileToUpload, metadata);

        // Get download URL with cache-busting parameter
        const baseUrl = await getDownloadURL(storageRef);
        downloadUrl = `${baseUrl}?t=${timestamp}`; // Add timestamp query parameter

        mimeType = fileToUpload.type;
        uploadedAt = Date.now();
        originalFileSize = file.size;
        optimizedFileSize = fileToUpload.size;
        optimizationSavedPercentage = isImage
          ? optimizationInfo?.savedPercentage || 0
          : 0;
        originalFileName = file.name;

        console.log(`Upload completed. URL: ${downloadUrl}`);
        console.log(
          `Original size: ${formatFileSize(originalFileSize)}, Optimized size: ${formatFileSize(optimizedFileSize)}`,
        );
      }

      // ... rest of your code remains the same
      // Create bill data object with only necessary fields
      const billData: any = {
        notes: formData.notes?.trim() || null,
        createdAt: isEditMode ? formData.createdAt : Date.now(),
        uploadedAt,
      };

      // Only add document-related fields if we have a download URL
      if (downloadUrl) {
        billData.downloadUrl = downloadUrl;
        billData.mimeType = mimeType;
        billData.originalFileName = originalFileName;
        billData.optimizedFileName = optimizedFileName;
        billData.originalFileSize = originalFileSize;
        billData.optimizedFileSize = optimizedFileSize;
        billData.optimizationSavedPercentage = optimizationSavedPercentage;
      } else {
        // For notes-only bills, ensure document fields are cleared
        billData.downloadUrl = "";
        billData.mimeType = "";
        billData.originalFileName = null;
        billData.optimizedFileName = null;
        billData.originalFileSize = null;
        billData.optimizedFileSize = null;
        billData.optimizationSavedPercentage = 0;
      }

      if (isEditMode && id) {
        const billRef = doc(firestore, "bills", id);
        await setDoc(billRef, billData, { merge: true });
        alert("Bill updated successfully!");
      } else {
        await addDoc(collection(firestore, "bills"), billData);
        alert("Bill added successfully!");
      }

      navigate("/jewellery");
    } catch (error: any) {
      console.error("Error saving bill:", error);

      let errorMessage = "Error saving bill. Please try again.";

      if (error.code === "storage/unauthorized") {
        errorMessage =
          "Upload failed: You don't have permission to upload files.";
      } else if (error.code === "storage/canceled") {
        errorMessage = "Upload was cancelled.";
      } else if (error.code === "storage/unknown") {
        errorMessage = "An unknown error occurred during upload.";
      } else if (error.message?.includes("quota")) {
        errorMessage =
          "Storage quota exceeded. Files are now optimized to save space.";
      } else if (error.code === "permission-denied") {
        errorMessage = "Permission denied. Please check Firebase rules.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      setUploadError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName("");
    setOptimizationInfo(null);
    setUploadError(null);

    // Reset file input
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  // Loading state
  if (loading && isEditMode) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-gray-700 m-0 p-0">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p>Loading bill data...</p>
        </div>
      </div>
    );
  }

  const hasExistingDocument = isEditMode && formData.downloadUrl;
  const hasNewFile = !!file;
  const hasDocument = hasExistingDocument || hasNewFile;

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-2.5 px-4 bg-white border-b border-gray-200 mb-2.5 shrink-0">
        <button
          onClick={() => navigate("/jewellery")}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-base cursor-pointer min-w-10 flex items-center justify-center text-gray-800"
          title="Back to Jewellery"
        >
          ←
        </button>
        <div className="text-lg font-semibold text-gray-900 flex-1 text-center">
          {isEditMode ? "Edit Bill" : "Add Bill"}
        </div>
        <div className="w-10"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto w-full">
        {/* File Upload */}
        <div className="mb-6">
          <label className="block mb-1.5 text-sm font-medium text-gray-700">
            {isEditMode ? "Document (Optional)" : "Upload Document (Optional)"}
            <span className="text-xs text-gray-500 ml-2">
              (Max 20MB, PDF, Images, Word, Text)
            </span>
          </label>

          <div
            className={`border-2 ${hasDocument ? "border-solid border-blue-300" : "border-dashed border-gray-300"} rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-300 mb-3`}
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={handleFileSelect}
              className="hidden"
            />

            {fileName ? (
              <>
                <div className="text-5xl mb-3 text-blue-500">📄</div>
                <div className="text-sm font-medium text-gray-900 mb-2 truncate">
                  {fileName}
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  Size: {formatFileSize(file?.size || 0)}
                </div>

                {optimizationInfo && optimizationInfo.savedPercentage > 0 && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex flex-col items-center text-green-800 text-xs">
                      <div className="flex items-center gap-1 font-medium mb-1">
                        <span>🎯</span>
                        <span>
                          {optimizationInfo.savedPercentage.toFixed(1)}% space
                          saved
                        </span>
                      </div>
                      <div className="font-mono text-xs">
                        {formatFileSize(optimizationInfo.originalSize)} →{" "}
                        {formatFileSize(optimizationInfo.optimizedSize)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-3 text-xs text-blue-500">
                  Tap to select different file
                </div>
              </>
            ) : isEditMode && formData.downloadUrl ? (
              <>
                <div className="text-5xl mb-3 text-blue-500">📄</div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Current document attached
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {formData.mimeType || "Unknown type"}
                </div>
                <div className="text-xs text-blue-500">
                  Click to replace document (optional)
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3 text-gray-400">📁</div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Tap to upload document (Optional)
                </div>
                <div className="text-xs text-gray-500">
                  PDF, JPG, PNG, DOC, TXT files accepted
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Files are automatically optimized
                </div>
              </>
            )}
          </div>

          {/* File info and actions */}
          {file && (
            <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-lg mb-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-700 text-sm">{fileName}</span>
                <span className="text-xs text-gray-500">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-medium hover:bg-red-100"
              >
                Remove
              </button>
            </div>
          )}

          {/* Existing document actions */}
          {isEditMode && formData.downloadUrl && !file && (
            <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
              <div className="flex items-center gap-2">
                <div className="text-green-600">✓</div>
                <div>
                  <div className="text-sm text-green-800 font-medium">
                    Document attached
                  </div>
                  <div className="text-xs text-green-700">
                    {fileName || "Existing document"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.open(formData.downloadUrl, "_blank")}
                  className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-medium hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              ⚠️ {uploadError}
            </div>
          )}

          {/* File requirement note */}
          <div className="text-xs text-gray-500 mt-2">
            {!isEditMode ? (
              <div className="flex items-center gap-1">
                <span>ℹ️</span>
                <span>Document is optional. You can add notes only.</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span>ℹ️</span>
                <span>You can update notes without changing the document.</span>
              </div>
            )}
          </div>

          {/* Optimization info note */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-blue-500 mt-0.5">ℹ️</div>
              <div className="text-xs text-blue-800">
                <div className="font-medium mb-1">File Optimization Info</div>
                <div className="space-y-1">
                  <div>
                    • <span className="font-medium">Images:</span> Automatically
                    compressed
                  </div>
                  <div>
                    • <span className="font-medium">PDFs:</span> Uploaded as-is
                    (no compression)
                  </div>
                  <div>
                    • <span className="font-medium">Other docs:</span> Uploaded
                    as-is
                  </div>
                  <div>
                    • <span className="font-medium">HEIC files:</span> Converted
                    to JPEG
                  </div>
                </div>
                <div className="mt-1 text-blue-600">
                  Each upload gets a unique filename to prevent caching issues
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block mb-1.5 text-sm font-medium text-gray-700">
            Notes *
            <span className="text-xs text-gray-500 ml-2">
              (Required if no document is attached)
            </span>
          </label>
          <textarea
            value={formData.notes || ""}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value || null })
            }
            className="w-full p-3 border border-gray-300 rounded text-sm font-sans leading-normal text-gray-900 bg-white resize-y min-h-[150px] max-h-[400px] overflow-y-auto box-border"
            placeholder="Add notes about this bill (e.g., purchase details, vendor information, etc.)"
            rows={3}
            required={!hasDocument && !file}
          />
          <div className="text-xs text-gray-500 mt-1">
            Provide details about the bill. Notes are required if no document is
            attached.
          </div>
        </div>

        {/* Display timestamps in edit mode */}
        {isEditMode && (
          <div className="mb-6 space-y-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Created:</span>{" "}
              {new Date(formData.createdAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{" "}
              {new Date(formData.uploadedAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Status:</span>{" "}
              <span
                className={
                  hasExistingDocument ? "text-green-600" : "text-blue-600"
                }
              >
                {hasExistingDocument ? "Document attached" : "Notes only"}
              </span>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex flex-col gap-3 mt-8">
          <button
            type="submit"
            className={`px-8 py-3 rounded-lg font-medium text-base transition-colors ${
              loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 cursor-pointer"
            }`}
            disabled={loading}
          >
            {loading ? "Saving..." : isEditMode ? "Update Bill" : "Add Bill"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/jewellery")}
            className="px-8 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Delete Document Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-[400px] w-full shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Delete Document
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this document? This will remove
              the file from storage and cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingFile}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDocument}
                disabled={deletingFile}
                className="px-4 py-2 bg-red-600 text-white border-none rounded-lg cursor-pointer hover:bg-red-700"
              >
                {deletingFile ? "Deleting..." : "Delete Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillForm;
