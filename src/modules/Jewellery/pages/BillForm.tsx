import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bill } from "../models/types";
import { doc, setDoc, addDoc, collection, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../../../lib/firebase";

const BillForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");

  const [formData, setFormData] = useState<Bill>({
    downloadUrl: "",
    mimeType: "",
    notes: null,
    createdAt: Date.now(),
    uploadedAt: Date.now(),
  });

  // Load bill data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadBillData();
    }
  }, [id, isEditMode]);

  const loadBillData = async () => {
    if (!id) return; // Add this check

    setLoading(true);
    try {
      const billRef = doc(firestore, "bills", id); // Now id is guaranteed to be string
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setFormData({
        ...formData,
        mimeType: selectedFile.type,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditMode && !file) {
      alert("Please select a file to upload");
      return;
    }

    setLoading(true);

    try {
      let downloadUrl = formData.downloadUrl;
      let mimeType = formData.mimeType;
      let uploadedAt = formData.uploadedAt;

      // Upload file if a new file is selected
      if (file) {
        const timestamp = Date.now();
        const fileExtension =
          file.name.split(".").pop() ||
          (file.type === "application/pdf"
            ? "pdf"
            : file.type.startsWith("image/")
              ? "jpg"
              : "dat");

        const fileName = `${timestamp}.${fileExtension}`;

        // Use imported storage
        const storageRef = ref(storage, `bills/${fileName}`);

        await uploadBytes(storageRef, file);
        downloadUrl = await getDownloadURL(storageRef);
        mimeType = file.type;
        uploadedAt = Date.now();
      }

      const billData = {
        downloadUrl,
        mimeType,
        notes: formData.notes || null,
        createdAt: isEditMode ? formData.createdAt : Date.now(),
        uploadedAt,
      };

      if (isEditMode && id) {
        // id is guaranteed here because isEditMode is true
        // Use imported firestore
        const billRef = doc(firestore, "bills", id);
        await setDoc(billRef, billData, { merge: true });
        alert("Bill updated successfully!");
      } else {
        // Use imported firestore
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
        errorMessage = "Storage quota exceeded.";
      } else if (error.code === "permission-denied") {
        errorMessage = "Permission denied. Please check Firebase rules.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
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
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-300"
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            {fileName ? (
              <>
                <div className="text-5xl mb-3">📄</div>
                <div className="text-sm font-medium text-gray-900 mb-1 truncate">
                  {fileName}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {isEditMode ? "Tap to change file" : "File selected"}
                </div>
                <div className="text-xs text-blue-500">
                  Click to select different file
                </div>
              </>
            ) : isEditMode && formData.downloadUrl ? (
              <>
                <div className="text-5xl mb-3">📄</div>
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
                  PDF, JPG, PNG files accepted
                </div>
              </>
            )}
          </div>
          {!isEditMode && !file && (
            <div className="text-xs text-red-600 mt-2">
              * File is required for new bills
            </div>
          )}
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
