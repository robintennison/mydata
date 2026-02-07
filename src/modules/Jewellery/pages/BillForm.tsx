import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bill } from "../models/types";
import { doc, setDoc, addDoc, collection, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditMode && !file) {
      alert("Please select a file to upload");
      return;
    }

    setLoading(true);
    setUploadError(null);

    try {
      let downloadUrl = formData.downloadUrl;
      let mimeType = formData.mimeType;
      let uploadedAt = formData.uploadedAt;
      let optimizedFileName = "";

      // Upload file if a new file is selected
      if (file) {
        let fileToUpload = file;

        // Optimize the file before upload
        if (optimizationInfo && optimizationInfo.savedPercentage > 0) {
          try {
            fileToUpload = await optimizeFile(file);
            console.log(
              `Uploading optimized bill: ${formatFileSize(fileToUpload.size)}`,
            );
          } catch (err) {
            console.error(
              "Error during final optimization, using original:",
              err,
            );
          }
        }

        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 9);
        const fileExtension =
          fileToUpload.name.split(".").pop() ||
          (fileToUpload.type === "application/pdf"
            ? "pdf"
            : fileToUpload.type.startsWith("image/")
              ? "jpg"
              : "dat");

        optimizedFileName = `bill_${timestamp}_${randomId}.${fileExtension}`;

        // Use imported storage
        const storageRef = ref(storage, `bills/${optimizedFileName}`);

        await uploadBytes(storageRef, fileToUpload);
        downloadUrl = await getDownloadURL(storageRef);
        mimeType = fileToUpload.type;
        uploadedAt = Date.now();
      }

      const billData = {
        downloadUrl,
        mimeType,
        notes: formData.notes || null,
        createdAt: isEditMode ? formData.createdAt : Date.now(),
        uploadedAt,
        originalFileName: file ? file.name : null,
        optimizedFileName: optimizedFileName || null,
        originalFileSize: file ? file.size : null,
        optimizedFileSize: optimizationInfo?.optimizedSize || null,
        optimizationSavedPercentage: optimizationInfo?.savedPercentage || 0,
      };

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
            {isEditMode ? "Replace File" : "Upload File"}
            <span className="text-xs text-gray-500 ml-2">
              (Max 20MB, PDF, Images, Word, Text)
            </span>
          </label>

          <div
            className={`border-2 ${file ? "border-solid border-blue-300" : "border-dashed border-gray-300"} rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-300 mb-3`}
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
                <div className="text-5xl mb-3 text-gray-500">📄</div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Existing file uploaded
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {formData.mimeType || "Unknown type"}
                </div>
                <div className="text-xs text-blue-500">
                  Click to replace file (optional)
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3 text-gray-400">📁</div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Tap to select file
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
            <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
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

          {uploadError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              ⚠️ {uploadError}
            </div>
          )}

          {!isEditMode && !file && (
            <div className="text-xs text-red-600 mt-2">
              * File is required for new bills
            </div>
          )}

          {/* Optimization info note */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-blue-500 mt-0.5">ℹ️</div>
              <div className="text-xs text-blue-800">
                <div className="font-medium mb-1">
                  Automatic File Optimization
                </div>
                <div>
                  Images are compressed, HEIC files converted to JPEG, PDFs
                  optimized
                </div>
                <div className="mt-1 text-blue-600">
                  Helps save storage space while maintaining quality
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block mb-1.5 text-sm font-medium text-gray-700">
            Notes (optional)
          </label>
          <textarea
            value={formData.notes || ""}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value || null })
            }
            className="w-full p-3 border border-gray-300 rounded text-sm font-sans leading-normal text-gray-900 bg-white resize-y min-h-[150px] max-h-[400px] overflow-y-auto box-border"
            placeholder="Add notes about this bill (optional)"
            rows={3}
          />
          <div className="text-xs text-gray-500 mt-1">
            e.g., "Gold necklace purchase invoice", "Repair bill", etc.
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
              <span className="font-medium">Uploaded:</span>{" "}
              {new Date(formData.uploadedAt).toLocaleString()}
            </div>
            {formData.downloadUrl && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => window.open(formData.downloadUrl, "_blank")}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100"
                >
                  📄 View Current Bill
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex flex-col gap-3 mt-8">
          <button
            type="submit"
            className={`px-8 py-3 rounded-lg font-medium text-base transition-colors ${
              loading || (!isEditMode && !file)
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 cursor-pointer"
            }`}
            disabled={loading || (!isEditMode && !file)}
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
    </div>
  );
};

export default BillForm;
