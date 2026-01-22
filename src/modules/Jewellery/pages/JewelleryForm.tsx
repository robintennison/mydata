import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { Jewellery, VerificationStatus } from "../models/types";

interface JewelleryFormProps {
  initialData?: Partial<Jewellery>;
  onSubmit: (data: Partial<Jewellery>) => void;
  isEditing?: boolean;
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
}) => {
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
    ...initialData,
  });

  const [bills, setBills] = useState<Bill[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [assignedBill, setAssignedBill] = useState<Bill | null>(null);
  const [loadingAssignedBill, setLoadingAssignedBill] = useState(false);
  const [showBillDropdown, setShowBillDropdown] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);

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
            setBillError("Bill has no downloadable content");
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
    } else if (name === "purchaseDate") {
      const date = e.target.value
        ? new Date(e.target.value).getTime()
        : Date.now();
      setFormData({ ...formData, [name]: date });
    } else {
      setFormData({ ...formData, [name]: value });
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
      alert(`Bill Details:\n
Bill Notes: ${assignedBill.notes || "No notes"}\n
File Type: ${assignedBill.mimeType || "Unknown"}\n
Uploaded: ${formatDate(assignedBill.uploadedAt)}\n
\nNo bill document URL available.`);
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

  const getFileTypeIcon = (mimeType: string): string => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("image")) return "🖼️";
    if (mimeType.includes("text")) return "📝";
    return "📎";
  };

  const formatDate = (timestamp: number): string => {
    if (!timestamp || timestamp === 0) return "N/A";

    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
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

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: "600px", margin: "0 auto" }}
    >
      <h2 style={{ marginBottom: "20px", color: "#374151" }}>
        {isEditing ? "Edit Jewellery Item" : "Add Jewellery Item"}
      </h2>

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

      {/* Bill Section */}
      <div style={{ marginBottom: "15px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "5px",
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          Bill
        </label>

        {/* Show assigned bill details when available */}
        {!showBillDropdown && assignedBill && !loadingAssignedBill && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {/* Bill details card */}
            <div
              style={{
                padding: "15px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#1e293b",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>
                    {getFileTypeIcon(assignedBill.mimeType)}
                  </span>
                  <span style={{ fontWeight: "500", fontSize: "15px" }}>
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  fontSize: "13px",
                  color: "#475569",
                }}
              >
                <div>
                  <span style={{ color: "#64748b" }}>File Type:</span>{" "}
                  {assignedBill.mimeType || "Unknown"}
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Uploaded:</span>{" "}
                  {formatDate(assignedBill.uploadedAt)}
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Status:</span>{" "}
                  {assignedBill.downloadUrl ? (
                    <span style={{ color: "#10b981" }}>Available</span>
                  ) : (
                    <span style={{ color: "#ef4444" }}>No download URL</span>
                  )}
                </div>
              </div>

              {/* Bill Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "15px",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1, display: "flex", gap: "10px" }}>
                  {assignedBill.downloadUrl && (
                    <>
                      <button
                        type="button"
                        onClick={handleViewBill}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                        title="View Bill"
                      >
                        <span>{getFileTypeIcon(assignedBill.mimeType)}</span>
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadBill}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                        title="Download Bill"
                      >
                        <span>📥</span>
                        <span>Download</span>
                      </button>
                    </>
                  )}

                  {!assignedBill.downloadUrl && (
                    <div
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: "#fef3c7",
                        borderRadius: "6px",
                        color: "#92400e",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>⚠️</span>
                      <span>No download URL available</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleChangeBillClick}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    whiteSpace: "nowrap",
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

      {/* Location and Bought For in same row */}
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
          <input
            type="text"
            name="location"
            value={formData.location || ""}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
            placeholder="Location"
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
            Bought For
          </label>
          <input
            type="text"
            name="boughtFor"
            value={formData.boughtFor || ""}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
            placeholder="Purpose"
          />
        </div>
      </div>

      {/* Purchase Date and Active checkbox in same row */}
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
          <input
            type="date"
            name="purchaseDate"
            value={
              formData.purchaseDate
                ? new Date(formData.purchaseDate).toISOString().split("T")[0]
                : ""
            }
            onChange={handleChange}
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

      {/* Submit Button */}
      <div style={{ textAlign: "center" }}>
        <button
          type="submit"
          style={{
            padding: "10px 30px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          {isEditing ? "Update" : "Add Item"}
        </button>
      </div>
    </form>
  );
};

export default JewelleryForm;
