import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jewelleryStyles } from "../styles/jewelleryStyles";
import JewelleryNavigation from "../components/JewelleryNavigation";
import { Bill } from "../models/types";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { firestore, storage } from "../../../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const BillsList: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState<Bill | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [newBillNotes, setNewBillNotes] = useState("");
  const [editBillNotes, setEditBillNotes] = useState("");

  // Load bills from Firestore - matching your Kotlin loadBills function
  const loadBills = async () => {
    setLoading(true);
    try {
      const billsRef = collection(firestore, "bills");
      const q = query(billsRef, orderBy("notes", "desc"));
      const querySnapshot = await getDocs(q);

      const billsList: Bill[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        billsList.push({
          id: doc.id,
          downloadUrl: data.downloadUrl,
          mimeType: data.mimeType,
          notes: data.notes,
          createdAt: data.createdAt?.toMillis() || data.createdAt || 0,
          updatedAt: data.updatedAt?.toMillis() || data.updatedAt,
        });
      });

      setBills(billsList);
    } catch (error) {
      console.error("Error loading bills:", error);
      alert("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  // Delete bill - matching your Kotlin delete function
  const handleDeleteBill = async (billId: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;

    try {
      await deleteDoc(doc(firestore, "bills", billId));
      await loadBills();
      alert("Bill deleted successfully");
    } catch (error) {
      console.error("Error deleting bill:", error);
      alert("Failed to delete bill");
    }
  };

  // Update bill notes - matching your Kotlin edit function
  const handleUpdateBillNotes = async () => {
    if (!showEditDialog) return;

    try {
      const billRef = doc(firestore, "bills", showEditDialog.id!);
      await updateDoc(billRef, {
        notes: editBillNotes.trim() || null,
        updatedAt: Timestamp.now(),
      });

      await loadBills();
      setShowEditDialog(null);
      setEditBillNotes("");
      alert("Bill notes updated successfully");
    } catch (error) {
      console.error("Error updating bill notes:", error);
      alert("Failed to update bill notes");
    }
  };

  // Upload new bill - matching your Kotlin upload function
  const handleUploadBill = async () => {
    if (!fileToUpload) {
      alert("Please select a file first");
      return;
    }

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const mimeType = fileToUpload.type || "application/octet-stream";
      const fileExtension = getFileExtension(mimeType);
      const fileName = `bills/${timestamp}.${fileExtension}`;

      // Upload to Storage
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, fileToUpload);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Create bill document in Firestore
      const billData = {
        downloadUrl: downloadURL,
        mimeType: mimeType,
        notes: newBillNotes.trim() || null,
        createdAt: Timestamp.now(),
        uploadedAt: Date.now(),
      };

      const docRef = await addDoc(collection(firestore, "bills"), billData);

      // Update with ID
      await updateDoc(docRef, { id: docRef.id });

      // Refresh list and reset form
      await loadBills();
      setShowAddDialog(false);
      setFileToUpload(null);
      setNewBillNotes("");
      alert("Bill uploaded successfully");
    } catch (error) {
      console.error("Error uploading bill:", error);
      alert("Failed to upload bill");
    }
  };

  // Helper to get file extension from MIME type
  const getFileExtension = (mimeType: string): string => {
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.startsWith("image/")) {
      return mimeType.split("/")[1] || "jpg";
    }
    return "dat";
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToUpload(file);
    }
  };

  // Open bill in new tab
  const handlePreviewBill = (bill: Bill) => {
    if (bill.downloadUrl) {
      window.open(bill.downloadUrl, "_blank");
    } else {
      alert("No preview available");
    }
  };

  // Initialize edit dialog
  const handleEditBill = (bill: Bill) => {
    setShowEditDialog(bill);
    setEditBillNotes(bill.notes || "");
  };

  useEffect(() => {
    loadBills();
  }, []);

  if (loading) {
    return (
      <div style={jewelleryStyles.container}>
        <div style={jewelleryStyles.loading}>
          <div style={jewelleryStyles.spinner}></div>
          <p>Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={jewelleryStyles.container}>
      {/* Top Navigation */}
      <div style={jewelleryStyles.topNav}>
        <button
          onClick={() => navigate("/jewellery")}
          style={jewelleryStyles.navButton}
          title="Back to Jewellery"
        >
          ←
        </button>
        <div style={jewelleryStyles.navTitle}>Bills & Documents</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setShowAddDialog(true)}
            style={jewelleryStyles.navButton}
            title="Add Bill"
          >
            +
          </button>
        </div>
      </div>

      {/* Bills List */}
      <div style={{ padding: "15px" }}>
        {bills.length === 0 ? (
          <div style={jewelleryStyles.emptyState}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📄</div>
            <div>No bills found</div>
            <div style={{ fontSize: "0.9rem", marginTop: "5px" }}>
              Tap "+" to add your first bill
            </div>
          </div>
        ) : (
          <div style={jewelleryStyles.tableContainer}>
            {/* Table Header */}
            <div style={jewelleryStyles.tableHeader}>
              <div style={jewelleryStyles.tableCell(4)}>Notes</div>
              <div style={jewelleryStyles.tableCell(2)}>Type</div>
              <div style={jewelleryStyles.tableCell(2, "center")}>Actions</div>
            </div>

            {/* Bills List - Matching Kotlin layout */}
            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {bills.map((bill, index) => (
                <div
                  key={bill.id}
                  style={jewelleryStyles.tableRow(index, true)}
                >
                  {/* Notes */}
                  <div style={jewelleryStyles.tableCell(4)}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        marginBottom: "2px",
                      }}
                    >
                      {bill.notes || "(No notes)"}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* File Type */}
                  <div style={jewelleryStyles.tableCell(2)}>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#374151",
                        padding: "4px 8px",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "4px",
                        display: "inline-block",
                      }}
                    >
                      {bill.mimeType?.split("/")[1]?.toUpperCase() || "FILE"}
                    </div>
                  </div>

                  {/* Actions - Matching Kotlin buttons */}
                  <div
                    style={{
                      ...jewelleryStyles.tableCell(2, "center"),
                      display: "flex",
                      gap: "8px",
                      justifyContent: "center",
                    }}
                  >
                    {/* Preview Button */}
                    <button
                      onClick={() => handlePreviewBill(bill)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#3b82f6",
                        border: "none",
                        borderRadius: "6px",
                        color: "#ffffff",
                        fontSize: "12px",
                        fontWeight: "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Preview"
                    >
                      👁️ Preview
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleEditBill(bill)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        color: "#374151",
                        fontSize: "12px",
                        fontWeight: "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Edit"
                    >
                      ✏️ Edit
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteBill(bill.id!)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#fee2e2",
                        border: "1px solid #fecaca",
                        borderRadius: "6px",
                        color: "#dc2626",
                        fontSize: "12px",
                        fontWeight: "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Stats */}
            <div
              style={{
                padding: "12px 15px",
                backgroundColor: "#f3f4f6",
                borderTop: "2px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                {bills.length} document{bills.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Bill Dialog - Matching Kotlin Add Dialog */}
      {showAddDialog && (
        <div style={jewelleryStyles.dialogOverlay}>
          <div style={jewelleryStyles.dialog}>
            <h3 style={jewelleryStyles.dialogTitle}>Upload Bill</h3>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ marginBottom: "12px" }}>
                <label style={jewelleryStyles.label}>
                  Bill Notes (optional)
                </label>
                <input
                  type="text"
                  value={newBillNotes}
                  onChange={(e) => setNewBillNotes(e.target.value)}
                  style={jewelleryStyles.input}
                  placeholder="Enter bill notes"
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <button
                  onClick={() =>
                    document.getElementById("billFileInput")?.click()
                  }
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#3b82f6",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  {fileToUpload ? "Change File" : "Pick File"}
                </button>
                <input
                  id="billFileInput"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
              </div>

              {fileToUpload && (
                <div
                  style={{
                    fontSize: "14px",
                    color: "#374151",
                    padding: "8px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "6px",
                  }}
                >
                  File selected: {fileToUpload.name} ({fileToUpload.type})
                </div>
              )}
            </div>

            <div style={jewelleryStyles.dialogButtons}>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setFileToUpload(null);
                  setNewBillNotes("");
                }}
                style={jewelleryStyles.dialogButton(true)}
              >
                Cancel
              </button>
              <button
                onClick={handleUploadBill}
                disabled={!fileToUpload}
                style={{
                  ...jewelleryStyles.dialogButton(false),
                  opacity: fileToUpload ? 1 : 0.6,
                  cursor: fileToUpload ? "pointer" : "not-allowed",
                }}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bill Dialog - Matching Kotlin Edit Dialog */}
      {showEditDialog && (
        <div style={jewelleryStyles.dialogOverlay}>
          <div style={jewelleryStyles.dialog}>
            <h3 style={jewelleryStyles.dialogTitle}>Edit Bill Notes</h3>

            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                value={editBillNotes}
                onChange={(e) => setEditBillNotes(e.target.value)}
                style={jewelleryStyles.input}
                placeholder="Enter bill notes"
                autoFocus
              />
            </div>

            <div style={jewelleryStyles.dialogButtons}>
              <button
                onClick={() => {
                  setShowEditDialog(null);
                  setEditBillNotes("");
                }}
                style={jewelleryStyles.dialogButton(true)}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateBillNotes}
                style={jewelleryStyles.dialogButton(false)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Component */}
      <JewelleryNavigation />
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

// Import missing Firestore functions
import { addDoc } from "firebase/firestore";

export default BillsList;
