import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bill } from "../models/types";

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
    createdAt: Date.now(),
    notes: "",
  });

  useEffect(() => {
    if (isEditMode) {
      // TODO: Load bill data from Firebase
      setLoading(true);
      setTimeout(() => {
        const mockData: Bill = {
          id,
          downloadUrl: "https://example.com/bill.pdf",
          mimeType: "application/pdf",
          createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
          notes: "Gold chain purchase bill",
        };
        setFormData(mockData);
        setFileName("existing-bill.pdf");
        setLoading(false);
      }, 500);
    }
  }, [id, isEditMode]);

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
    setLoading(true);

    try {
      // TODO: Upload file to Firebase and get download URL
      let downloadUrl = formData.downloadUrl;
      if (file) {
        // TODO: Call Firebase upload function
        // downloadUrl = await uploadBillFile(file);
      }

      const billData = {
        ...formData,
        downloadUrl,
        updatedAt: Date.now(),
      };

      // TODO: Save to Firebase
      console.log("Saving bill:", billData);

      // Show success message and navigate back
      setTimeout(() => {
        setLoading(false);
        navigate("/jewellery/bills");
      }, 1000);
    } catch (error) {
      console.error("Error saving bill:", error);
      setLoading(false);
      alert("Error saving bill. Please try again.");
    }
  };

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
          onClick={() => navigate("/jewellery/bills")}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-base cursor-pointer min-w-10 flex items-center justify-center text-gray-800"
          title="Back to Bills"
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
              accept=".pdf,.jpg,.jpeg,.png"
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
            Notes
          </label>
          <textarea
            value={formData.notes || ""}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full p-3 border border-gray-300 rounded text-sm font-sans leading-normal text-gray-900 bg-white resize-y min-h-[150px] max-h-[400px] overflow-y-auto box-border"
            placeholder="Add notes about this bill (optional)"
            rows={3}
          />
        </div>

        {/* Creation Date */}
        {isEditMode && (
          <div className="mb-6">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              Created Date
            </label>
            <input
              type="date"
              value={new Date(formData.createdAt).toISOString().split("T")[0]}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  createdAt: new Date(e.target.value).getTime(),
                })
              }
              className="w-full p-2.5 px-3 border border-gray-300 rounded text-sm bg-white box-border"
            />
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
            onClick={() => navigate("/jewellery/bills")}
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
