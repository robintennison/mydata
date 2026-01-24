import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  QueryDocumentSnapshot,
  DocumentData,
  getDoc,
  doc,
} from "firebase/firestore";
import { Jewellery } from "../models/types";
import { jewelleryStyles } from "../styles/jewelleryStyles";

// Interface for Bill data
interface Bill {
  id: string;
  billNumber: string;
  purchaseDate: number;
  shopName: string;
  downloadUrl: string;
  mimeType: string;
  notes?: string;
  uploadedAt: number;
}

const JewelleryForBill: React.FC = () => {
  const navigate = useNavigate();
  const { billId } = useParams<{ billId: string }>();

  const [jewelleryItems, setJewelleryItems] = useState<Jewellery[]>([]);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!billId) {
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore();

        // Fetch bill details
        const billDoc = await getDoc(doc(db, "bills", billId));
        if (!billDoc.exists()) {
          setLoading(false);
          return;
        }

        const billData = billDoc.data();
        const billDetails: Bill = {
          id: billDoc.id,
          billNumber: billData.billNumber || "",
          purchaseDate: billData.purchaseDate || 0,
          shopName: billData.shopName || "",
          downloadUrl: billData.downloadUrl || "",
          mimeType: billData.mimeType || "",
          notes: billData.notes || "",
          uploadedAt:
            billData.uploadedAt?.toMillis?.() || billData.uploadedAt || 0,
        };
        setBill(billDetails);

        // Fetch jewellery items linked to this bill
        const jewelleryQuery = query(
          collection(db, "jewellery"),
          where("billId", "==", billId),
        );

        const jewellerySnapshot = await getDocs(jewelleryQuery);

        const foundItems: Jewellery[] = [];
        jewellerySnapshot.forEach(
          (doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            const item: Jewellery = {
              id: doc.id,
              code: data.code || "",
              description: data.description || "",
              weight: data.weight || 0,
              location: data.location || "",
              boughtFor: data.boughtFor || "",
              purchaseDate: data.purchaseDate || 0,
              imageUrl: data.imageUrl || "",
              active: data.active !== false,
              billId: data.billId || "",
              lastVerified: data.lastVerified || 0,
              verificationStatus: data.verificationStatus || "Not Verified",
              verificationNotes: data.verificationNotes || "",
            };
            foundItems.push(item);
          },
        );

        setJewelleryItems(foundItems);
      } catch (error) {
        console.error(`Error: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [billId]);

  // Format date for display
  const formatDate = (timestamp: number): string => {
    if (!timestamp || timestamp === 0) return "";

    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Handle edit button click
  const handleEditClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    navigate(`/jewellery/edit/${itemId}`);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("image")) return "🖼️";
    return "📎";
  };

  if (loading) {
    return (
      <div style={jewelleryStyles.container}>
        <div style={jewelleryStyles.loading}>
          <div style={jewelleryStyles.spinner}></div>
          <p>Loading jewellery items for bill...</p>
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
        <div style={jewelleryStyles.navTitle}>Linked Jewellery Items</div>
        <button
          onClick={handleRefresh}
          style={{
            ...jewelleryStyles.navButton,
            fontSize: "12px",
            padding: "4px 8px",
          }}
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {/* Bill Header Information */}
      {bill && (
        <div
          style={{
            padding: "12px 15px",
            backgroundColor: "#f0f9ff",
            borderBottom: "1px solid #bae6fd",
            marginBottom: "8px",
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
            <span style={{ fontSize: "24px" }}>
              {getFileIcon(bill.mimeType)}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "600", fontSize: "16px" }}>
                {bill.mimeType.includes("pdf")
                  ? "PDF Bill"
                  : bill.mimeType.includes("image")
                    ? "Image Bill"
                    : "Bill Document"}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Uploaded: {formatDate(bill.uploadedAt)}
              </div>
            </div>
            <button
              onClick={() => window.open(bill.downloadUrl, "_blank")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Open Bill
            </button>
          </div>

          {bill.notes && (
            <div style={{ fontSize: "13px", marginBottom: "4px" }}>
              <strong>Notes:</strong> {bill.notes}
            </div>
          )}
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            Bill ID:{" "}
            <code
              style={{
                backgroundColor: "#e5e7eb",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              {bill.id}
            </code>
          </div>
        </div>
      )}

      {/* ALL CONTENT INSIDE SCROLLABLE WRAPPER */}
      <div style={jewelleryStyles.contentWrapper}>
        {/* Items Count */}
        {jewelleryItems.length > 0 && (
          <div
            style={{
              fontSize: "11px",
              color: "#6b7280",
              padding: "6px 15px 2px",
              textAlign: "right",
            }}
          >
            {jewelleryItems.length} items linked to this bill
          </div>
        )}

        {/* Items List */}
        <div style={{ padding: "0 0 5px 0" }}>
          {jewelleryItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#9ca3af",
                fontSize: "13px",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>💎</div>
              <p style={{ marginBottom: "8px", fontSize: "16px" }}>
                No jewellery items linked to this bill.
              </p>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginBottom: "20px",
                }}
              >
                Link jewellery items by setting their Bill ID to: <br />
                <code
                  style={{
                    backgroundColor: "#e5e7eb",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    marginTop: "4px",
                    display: "inline-block",
                  }}
                >
                  {bill?.id}
                </code>
              </p>

              {/* Quick Instructions */}
              <div
                style={{
                  backgroundColor: "#fef3c7",
                  padding: "15px",
                  borderRadius: "8px",
                  margin: "20px auto",
                  maxWidth: "500px",
                  fontSize: "12px",
                  color: "#92400e",
                }}
              >
                <div
                  style={{
                    fontWeight: "600",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>💡</span>
                  <span>How to link items:</span>
                </div>
                <ol style={{ paddingLeft: "20px", marginBottom: "0" }}>
                  <li>
                    Go to <strong>Jewellery List</strong>
                  </li>
                  <li>Find items purchased with this bill</li>
                  <li>
                    Click <strong>✏️ Edit</strong> on each item
                  </li>
                  <li>
                    Set <strong>Bill ID</strong> field to the code above
                  </li>
                  <li>Save and return here</li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: "20px",
                }}
              >
                <button
                  onClick={() => navigate("/jewellery/list")}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  📋 Go to Jewellery List
                </button>
                <button
                  onClick={() => navigate("/jewellery/add")}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  ➕ Add New Jewellery
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {jewelleryItems.map((item, index) => {
                const formattedDate = formatDate(item.purchaseDate);

                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "white",
                      padding: "12px 15px",
                      minHeight: "60px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      borderBottom:
                        index < jewelleryItems.length - 1
                          ? "1px solid #e5e7eb"
                          : "none",
                      opacity: item.active ? 1 : 0.7,
                      position: "relative",
                    }}
                    onClick={() => navigate(`/jewellery/detail/${item.id}`)}
                  >
                    {/* Item Image */}
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        flexShrink: 0,
                        backgroundColor: "#f3f4f6",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        border: !item.active ? "1px dashed #9ca3af" : "none",
                      }}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.code}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: "20px", color: "#9ca3af" }}>
                          💎
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* ROW 1: Code + Description + Weight */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: "6px",
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "600",
                              fontSize: "15px",
                              color: item.active ? "#111827" : "#6b7280",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.code}
                          </div>
                          {!item.active && (
                            <span
                              style={{
                                fontSize: "10px",
                                backgroundColor: "#9ca3af",
                                color: "white",
                                padding: "2px 6px",
                                borderRadius: "8px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Inactive
                            </span>
                          )}
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#6b7280",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {item.description}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#374151",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {item.weight}g
                        </div>
                      </div>

                      {/* ROW 2: Location • Bought For • Purchase Date */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          fontSize: "11px",
                          color: "#9ca3af",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {item.location && (
                          <>
                            <span>{item.location}</span>
                            {(item.boughtFor || formattedDate) && (
                              <span>•</span>
                            )}
                          </>
                        )}
                        {item.boughtFor && (
                          <>
                            <span>{item.boughtFor}</span>
                            {formattedDate && <span>•</span>}
                          </>
                        )}
                        {formattedDate && (
                          <span title={`Purchase Date: ${formattedDate}`}>
                            📅 {formattedDate}
                          </span>
                        )}
                        {!item.location &&
                          !item.boughtFor &&
                          !formattedDate && (
                            <span style={{ fontStyle: "italic" }}>
                              No details
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor:
                          item.verificationStatus === "Verified"
                            ? "#10b981"
                            : item.verificationStatus === "Missing"
                              ? "#ef4444"
                              : "#d1d5db",
                        flexShrink: 0,
                        marginRight: "8px",
                      }}
                      title={item.verificationStatus}
                    />

                    {/* Edit Button */}
                    <button
                      onClick={(e) => handleEditClick(e, item.id)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        fontSize: "16px",
                        color: "#3b82f6",
                        cursor: "pointer",
                        padding: "6px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        flexShrink: 0,
                      }}
                      title="Edit"
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#e0f2fe";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      ✏️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Minimal bottom spacing */}
        <div style={{ height: "5px" }}></div>
      </div>
    </div>
  );
};

export default JewelleryForBill;
