import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jewelleryStyles } from "../styles/jewelleryStyles";
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
      <div style={jewelleryStyles.container}>
        <div style={jewelleryStyles.loading}>
          <div style={jewelleryStyles.spinner}></div>
          <p>Loading bill data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={jewelleryStyles.container}>
      {/* Top Navigation */}
      <div style={jewelleryStyles.topNav}>
        <button
          onClick={() => navigate("/jewellery/bills")}
          style={jewelleryStyles.navButton}
          title="Back to Bills"
        >
          ←
        </button>
        <div style={jewelleryStyles.navTitle}>
          {isEditMode ? "Edit Bill" : "Add Bill"}
        </div>
        <div style={{ width: "40px" }}></div>
      </div>

      <form onSubmit={handleSubmit} style={jewelleryStyles.formContainer}>
        {/* File Upload */}
        <div style={jewelleryStyles.formGroup}>
          <label style={jewelleryStyles.label}>
            {isEditMode ? "Replace File" : "Upload File"}
          </label>
          <div
            style={jewelleryStyles.imageUploadContainer}
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            {fileName ? (
              <>
                <div style={{ fontSize: "3rem", marginBottom: "10px" }}>📄</div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#333",
                    marginBottom: "5px",
                  }}
                >
                  {fileName}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Tap to change file
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: "3rem", marginBottom: "10px" }}>📁</div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                  Tap to select file
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
                    marginTop: "5px",
                  }}
                >
                  PDF, JPG, PNG files accepted
                </div>
              </>
            )}
          </div>
          {!isEditMode && !file && (
            <div
              style={{
                fontSize: "12px",
                color: "#ef4444",
                marginTop: "5px",
              }}
            >
              * File is required for new bills
            </div>
          )}
        </div>

        {/* Notes */}
        <div style={jewelleryStyles.formGroup}>
          <label style={jewelleryStyles.label}>Notes</label>
          <textarea
            value={formData.notes || ""}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            style={jewelleryStyles.textarea}
            placeholder="Add notes about this bill (optional)"
            rows={3}
          />
        </div>

        {/* Creation Date */}
        {isEditMode && (
          <div style={jewelleryStyles.formGroup}>
            <label style={jewelleryStyles.label}>Created Date</label>
            <input
              type="date"
              value={new Date(formData.createdAt).toISOString().split("T")[0]}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  createdAt: new Date(e.target.value).getTime(),
                })
              }
              style={jewelleryStyles.input}
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          style={jewelleryStyles.primaryButton}
          disabled={loading || (!isEditMode && !file)}
        >
          {loading ? "Saving..." : isEditMode ? "Update Bill" : "Add Bill"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/jewellery/bills")}
          style={jewelleryStyles.secondaryButton}
          disabled={loading}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default BillForm;
