import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { jewelleryStyles } from "../styles/jewelleryStyles";
import JewelleryNavigation from "../components/JewelleryNavigation";

interface Bill {
  id: string;
  downloadUrl: string;
  mimeType: string;
  notes?: string;
  uploadedAt: number; // Store as timestamp number
  createdAt?: number;
}

const BillsList: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        console.log("Fetching bills...");
        setError(null);

        const db = getFirestore();
        const billsRef = collection(db, "bills");
        const snapshot = await getDocs(billsRef);

        console.log(`Found ${snapshot.size} bills`);

        const billsList: Bill[] = [];
        snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          console.log("Bill data:", data);

          // Handle timestamp conversion
          let uploadedAt = 0;
          let createdAt = 0;

          if (data.uploadedAt) {
            if (data.uploadedAt instanceof Timestamp) {
              uploadedAt = data.uploadedAt.toMillis(); // Firestore Timestamp to milliseconds
            } else if (typeof data.uploadedAt === "number") {
              uploadedAt = data.uploadedAt;
            } else if (data.uploadedAt.toDate) {
              uploadedAt = data.uploadedAt.toDate().getTime();
            } else if (data.uploadedAt.seconds) {
              // Handle Firestore Timestamp object
              uploadedAt = data.uploadedAt.seconds * 1000;
            }
          }

          if (data.createdAt) {
            if (data.createdAt instanceof Timestamp) {
              createdAt = data.createdAt.toMillis();
            } else if (typeof data.createdAt === "number") {
              createdAt = data.createdAt;
            } else if (data.createdAt.toDate) {
              createdAt = data.createdAt.toDate().getTime();
            } else if (data.createdAt.seconds) {
              createdAt = data.createdAt.seconds * 1000;
            }
          }

          const bill: Bill = {
            id: doc.id,
            downloadUrl: data.downloadUrl || "",
            mimeType: data.mimeType || "",
            notes: data.notes || "",
            uploadedAt: uploadedAt || Date.now(),
            createdAt: createdAt || uploadedAt || Date.now(),
          };

          billsList.push(bill);
        });

        // Sort by uploadedAt (newest first)
        billsList.sort((a, b) => b.uploadedAt - a.uploadedAt);

        setBills(billsList);
      } catch (error: any) {
        console.error("Error fetching bills:", error);
        setError(`Error loading bills: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Unknown date";
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("image")) return "🖼️";
    return "📎";
  };

  const handleOpenBill = (bill: Bill) => {
    if (bill.downloadUrl) {
      window.open(bill.downloadUrl, "_blank");
    } else {
      alert("No download URL available");
    }
  };

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
            onClick={() => navigate("/jewellery/bills/add")}
            style={{
              ...jewelleryStyles.navButton,
              padding: "6px 12px",
              fontSize: "14px",
            }}
            title="Add New Bill"
          >
            + Add Bill
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            margin: "15px",
            padding: "10px",
            backgroundColor: "#fee2e2",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            color: "#991b1b",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Bills List */}
      <div style={{ padding: "15px" }}>
        {bills.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#9ca3af",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
            <p style={{ marginBottom: "16px", fontSize: "16px" }}>
              No bills found.
            </p>
            <p
              style={{
                marginBottom: "24px",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Upload bills to link them to jewellery items.
            </p>
            <button
              onClick={() => navigate("/jewellery/bills/add")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Upload your first bill
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "10px",
              }}
            >
              Showing {bills.length} bills (newest first)
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "15px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ fontSize: "24px" }}>
                          {getFileIcon(bill.mimeType)}
                        </span>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "16px" }}>
                            {bill.mimeType.includes("pdf")
                              ? "PDF Document"
                              : bill.mimeType.includes("image")
                                ? "Image File"
                                : "Document"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Uploaded: {formatDate(bill.uploadedAt)}
                          </div>
                        </div>
                      </div>

                      {bill.notes && (
                        <div
                          style={{
                            marginTop: "8px",
                            padding: "8px",
                            backgroundColor: "#f3f4f6",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        >
                          <strong>Notes:</strong> {bill.notes}
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: "12px",
                          fontSize: "13px",
                          color: "#6b7280",
                        }}
                      >
                        <div>File type: {bill.mimeType}</div>
                        <div
                          style={{
                            wordBreak: "break-all",
                            fontSize: "12px",
                            marginTop: "4px",
                          }}
                        >
                          URL: {bill.downloadUrl.substring(0, 60)}...
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div
                    style={{ display: "flex", gap: "8px", marginTop: "15px" }}
                  >
                    <button
                      onClick={() => handleOpenBill(bill)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        flex: 1,
                      }}
                    >
                      Open Bill
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/jewellery/bills/edit/${bill.id}`)
                      }
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        flex: 1,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Delete this bill?")) {
                          // TODO: Implement delete
                          console.log("Delete bill:", bill.id);
                        }
                      }}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <JewelleryNavigation />
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default BillsList;
