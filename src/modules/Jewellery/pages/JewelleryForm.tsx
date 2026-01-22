import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import {
  Jewellery,
  VerificationStatus,
  VerificationStatusType,
} from "../models/types";

interface JewelleryFormProps {
  initialData?: Partial<Jewellery>;
  onSubmit: (data: Partial<Jewellery>) => void;
  isEditing?: boolean;
}

interface Bill {
  id: string;
  notes?: string;
  uploadedAt: number;
  downloadUrl: string;
  mimeType: string;
  // Add other bill fields as needed
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
    imageUrl: "",
    active: true,
    verificationStatus: VerificationStatus.NOT_VERIFIED,
    verificationNotes: "",
    lastVerified: 0,
    billId: "",
    ...initialData,
  });

  const [bills, setBills] = useState<Bill[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [billsError, setBillsError] = useState<string | null>(null);

  // Fetch bills from Firestore
  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoadingBills(true);
        setBillsError(null);

        const db = getFirestore();
        const billsRef = collection(db, "bills");

        // Query bills sorted by uploadedAt (newest first) or notes if available
        const billsQuery = query(billsRef, orderBy("uploadedAt", "desc"));
        const snapshot = await getDocs(billsQuery);

        const billsList: Bill[] = [];
        snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          const bill: Bill = {
            id: doc.id,
            notes: data.notes || "",
            uploadedAt: data.uploadedAt?.toMillis?.() || data.uploadedAt || 0,
            downloadUrl: data.downloadUrl || "",
            mimeType: data.mimeType || "",
          };
          billsList.push(bill);
        });

        // Sort bills by notes for the dropdown (case-insensitive)
        billsList.sort((a, b) => {
          const noteA = (a.notes || "").toLowerCase();
          const noteB = (b.notes || "").toLowerCase();
          return noteA.localeCompare(noteB);
        });

        setBills(billsList);
      } catch (error: any) {
        console.error("Error fetching bills:", error);
        setBillsError(`Failed to load bills: ${error.message}`);
      } finally {
        setLoadingBills(false);
      }
    };

    fetchBills();
  }, []);

  // Derive status options from VerificationStatus object VALUES
  const statusOptions = Object.values(VerificationStatus).map((value) => ({
    value,
    label: value,
  }));

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
    } else if (name === "verificationStatus") {
      const validValues = Object.values(VerificationStatus);
      if (validValues.includes(value as VerificationStatusType)) {
        setFormData({ ...formData, [name]: value as VerificationStatusType });

        if (
          value === VerificationStatus.VERIFIED ||
          value === VerificationStatus.MISSING
        ) {
          setFormData((prev) => ({
            ...prev,
            [name]: value as VerificationStatusType,
            lastVerified: Date.now(),
          }));
        }
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure lastVerified is set for verified/missing items
    const finalData = { ...formData };
    if (
      finalData.verificationStatus === VerificationStatus.VERIFIED ||
      finalData.verificationStatus === VerificationStatus.MISSING
    ) {
      finalData.lastVerified = finalData.lastVerified || Date.now();
    }

    onSubmit(finalData);
  };

  // Update verification status with notes
  const updateVerification = (
    status: VerificationStatusType,
    notes?: string,
  ) => {
    setFormData({
      ...formData,
      verificationStatus: status,
      verificationNotes: notes || "",
      lastVerified: status === VerificationStatus.NOT_VERIFIED ? 0 : Date.now(),
    });
  };

  // Format date for display
  const formatDate = (timestamp: number): string => {
    if (!timestamp) return "";
    try {
      return new Date(timestamp).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "";
    }
  };

  // Get file icon for bill type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("image")) return "🖼️";
    return "📎";
  };

  // Get selected bill details
  const selectedBill = bills.find((bill) => bill.id === formData.billId);

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: "600px", margin: "0 auto" }}
    >
      <h2>{isEditing ? "Edit Jewellery Item" : "Add New Jewellery Item"}</h2>

      {/* Basic Information Section */}
      <div
        style={{
          backgroundColor: "#f8fafc",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#374151" }}>
          Basic Information
        </h3>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "500",
              color: "#374151",
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
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "500",
              color: "#374151",
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
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
            placeholder="Description of the jewellery item"
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "500",
              color: "#374151",
            }}
          >
            Weight (grams) *
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
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Bill Information Section */}
      <div
        style={{
          backgroundColor: "#f0f9ff",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#374151" }}>
          Bill Information
        </h3>

        {loadingBills ? (
          <div
            style={{ padding: "10px", textAlign: "center", color: "#6b7280" }}
          >
            Loading bills...
          </div>
        ) : billsError ? (
          <div
            style={{
              padding: "10px",
              backgroundColor: "#fee2e2",
              border: "1px solid #ef4444",
              borderRadius: "6px",
              color: "#991b1b",
              marginBottom: "15px",
            }}
          >
            {billsError}
          </div>
        ) : bills.length === 0 ? (
          <div
            style={{
              padding: "15px",
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              color: "#6b7280",
              marginBottom: "15px",
              textAlign: "center",
            }}
          >
            <p style={{ marginBottom: "10px" }}>
              No bills found in the system.
            </p>
            <a
              href="/jewellery/bills/add"
              style={{
                color: "#3b82f6",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              Add your first bill
            </a>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "500",
                  color: "#374151",
                }}
              >
                Select Bill *
              </label>
              <select
                name="billId"
                value={formData.billId || ""}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  backgroundColor: "white",
                  boxSizing: "border-box",
                }}
              >
                <option value="">-- Select a bill --</option>
                {bills.map((bill) => (
                  <option key={bill.id} value={bill.id}>
                    {bill.notes || `Bill ${bill.id.substring(0, 8)}...`}
                    {bill.uploadedAt && ` (${formatDate(bill.uploadedAt)})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Display selected bill details */}
            {selectedBill && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "white",
                  border: "1px solid #bae6fd",
                  borderRadius: "6px",
                  marginTop: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>
                    {getFileIcon(selectedBill.mimeType)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "500", fontSize: "14px" }}>
                      {selectedBill.notes || "No notes"}
                    </div>
                    {selectedBill.uploadedAt && (
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        Uploaded: {formatDate(selectedBill.uploadedAt)}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      window.open(selectedBill.downloadUrl, "_blank")
                    }
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    View Bill
                  </button>
                </div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>
                  Bill ID:{" "}
                  <code
                    style={{
                      backgroundColor: "#f3f4f6",
                      padding: "1px 4px",
                      borderRadius: "3px",
                    }}
                  >
                    {selectedBill.id}
                  </code>
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "10px" }}>
          <p>
            Can't find the right bill?{" "}
            <a href="/jewellery/bills/add" style={{ color: "#3b82f6" }}>
              Add a new bill
            </a>
          </p>
        </div>
      </div>

      {/* Additional Details Section */}
      <div
        style={{
          backgroundColor: "#f8fafc",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#374151" }}>
          Additional Details
        </h3>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "500",
              color: "#374151",
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
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
            placeholder="e.g., Bank Locker, Home Safe"
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "500",
              color: "#374151",
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
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
            placeholder="e.g., Personal Use, Gift, Investment"
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "500",
              color: "#374151",
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
            onChange={(e) => {
              const date = e.target.value
                ? new Date(e.target.value).getTime()
                : Date.now();
              setFormData({ ...formData, purchaseDate: date });
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "500",
              color: "#374151",
            }}
          >
            Image URL
          </label>
          <input
            type="text"
            name="imageUrl"
            value={formData.imageUrl || ""}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
            placeholder="URL of jewellery image"
          />
        </div>
      </div>

      {/* Verification Section */}
      <div
        style={{
          backgroundColor: "#fef3c7",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#92400e" }}>
          Verification
        </h3>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "500",
              color: "#92400e",
            }}
          >
            Verification Status
          </label>
          <select
            name="verificationStatus"
            value={
              formData.verificationStatus || VerificationStatus.NOT_VERIFIED
            }
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              backgroundColor: "white",
              boxSizing: "border-box",
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {formData.verificationStatus !== VerificationStatus.NOT_VERIFIED && (
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "500",
                color: "#92400e",
              }}
            >
              Verification Notes
            </label>
            <textarea
              name="verificationNotes"
              value={formData.verificationNotes || ""}
              onChange={handleChange}
              placeholder="Add notes about verification..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
                minHeight: "80px",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
          </div>
        )}

        {/* Quick verification buttons */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "15px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() =>
              updateVerification(
                VerificationStatus.VERIFIED,
                formData.verificationNotes,
              )
            }
            style={{
              padding: "8px 16px",
              backgroundColor:
                formData.verificationStatus === VerificationStatus.VERIFIED
                  ? "#10b981"
                  : "#e5e7eb",
              color:
                formData.verificationStatus === VerificationStatus.VERIFIED
                  ? "white"
                  : "#374151",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              flex: 1,
              minWidth: "140px",
            }}
          >
            Mark as Verified
          </button>

          <button
            type="button"
            onClick={() =>
              updateVerification(
                VerificationStatus.MISSING,
                "Marked as missing",
              )
            }
            style={{
              padding: "8px 16px",
              backgroundColor:
                formData.verificationStatus === VerificationStatus.MISSING
                  ? "#ef4444"
                  : "#e5e7eb",
              color:
                formData.verificationStatus === VerificationStatus.MISSING
                  ? "white"
                  : "#374151",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              flex: 1,
              minWidth: "140px",
            }}
          >
            Mark as Missing
          </button>

          <button
            type="button"
            onClick={() =>
              updateVerification(VerificationStatus.NOT_VERIFIED, "")
            }
            style={{
              padding: "8px 16px",
              backgroundColor:
                formData.verificationStatus === VerificationStatus.NOT_VERIFIED
                  ? "#6b7280"
                  : "#e5e7eb",
              color:
                formData.verificationStatus === VerificationStatus.NOT_VERIFIED
                  ? "white"
                  : "#374151",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              flex: 1,
              minWidth: "140px",
            }}
          >
            Reset to Not Verified
          </button>
        </div>
      </div>

      {/* Status Section */}
      <div
        style={{
          backgroundColor: "#f3f4f6",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <input
            type="checkbox"
            name="active"
            id="active"
            checked={formData.active !== false}
            onChange={handleChange}
            style={{ width: "18px", height: "18px" }}
          />
          <label
            htmlFor="active"
            style={{ fontWeight: "500", color: "#374151" }}
          >
            Active Item
          </label>
        </div>
        <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
          Uncheck this if the item is no longer in your possession or is
          inactive.
        </p>
      </div>

      {/* Submit Button */}
      <div style={{ textAlign: "center" }}>
        <button
          type="submit"
          style={{
            padding: "12px 30px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
            minWidth: "200px",
          }}
        >
          {isEditing ? "Update Jewellery Item" : "Add Jewellery Item"}
        </button>
      </div>
    </form>
  );
};

export default JewelleryForm;
