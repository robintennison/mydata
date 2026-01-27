import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage"; // Added import
import { Jewellery, VerificationStatus } from "../models/types";
import { jewelleryStyles } from "../styles/jewelleryStyles";

interface Bill {
  id: string;
  downloadUrl: string;
  mimeType: string;
  notes: string | null;
  createdAt: number;
  uploadedAt: number;
}

const JewelleryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Jewellery | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [billLoading, setBillLoading] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [storage] = useState(getStorage()); // Initialize Firebase Storage

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        console.error("No ID provided");
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore();

        const docRef = doc(db, "jewellery", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          const jewellery: Jewellery = {
            id: docSnap.id,
            code: data.code || "",
            description: data.description || "",
            weight: data.weight || 0,
            location: data.location || "",
            boughtFor: data.boughtFor || "",
            purchaseDate: data.purchaseDate || 0,
            imageUrl: data.imageUrl || "",
            active: data.active !== false,
            billId: data.billId,
            lastVerified: data.lastVerified || 0,
            verificationStatus:
              data.verificationStatus || VerificationStatus.NOT_VERIFIED,
            verificationNotes: data.verificationNotes || "",
          };
          setItem(jewellery);

          if (data.billId) {
            await fetchBill(data.billId);
          }
        } else {
          setItem(null);
        }
      } catch (error) {
        console.error("Error fetching jewellery:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const fetchBill = async (billId: string) => {
    try {
      setBillLoading(true);
      setBillError(null);
      const db = getFirestore();
      const billRef = doc(db, "bills", billId);
      const billSnap = await getDoc(billRef);

      if (billSnap.exists()) {
        const data = billSnap.data();

        const billData: Bill = {
          id: billSnap.id,
          downloadUrl: data.downloadUrl || "",
          mimeType: data.mimeType || "",
          notes: data.notes || null,
          createdAt: data.createdAt || 0,
          uploadedAt: data.uploadedAt || 0,
        };

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

        if (billData.downloadUrl) {
          setBill(billData);
        } else {
          setBillError("Bill has no downloadable content");
          setBill(billData);
        }
      } else {
        setBillError("Bill document not found");
        setBill(null);
      }
    } catch (error) {
      console.error("Error fetching bill:", error);
      setBillError(`Failed to load bill: ${error}`);
      setBill(null);
    } finally {
      setBillLoading(false);
    }
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

  const handleDownloadImage = async () => {
    if (!item?.imageUrl) {
      alert("No image available to download.");
      return;
    }

    setDownloadingImage(true);
    try {
      // Method 1: Try using Firebase Storage SDK to get a download URL
      // Extract the storage path from the imageUrl if it's a Firebase Storage URL
      let downloadUrl = item.imageUrl;

      // Check if it's a Firebase Storage URL
      if (item.imageUrl.includes("firebasestorage.googleapis.com")) {
        try {
          // Try to get a download URL using the Firebase Storage SDK
          // This bypasses CORS restrictions
          const storageRef = ref(storage, extractPathFromUrl(item.imageUrl));
          downloadUrl = await getDownloadURL(storageRef);
        } catch (storageError) {
          console.log(
            "Could not get download URL via SDK, using original URL",
            storageError,
          );
        }
      }

      // Method 2: Create a download link that works with CORS
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank"; // Open in new tab to avoid CORS issues

      // Generate filename
      const filename = generateImageFilename(item);
      link.download = filename;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    } catch (error) {
      console.error("Error downloading image:", error);

      // Fallback method: Open the image in a new tab for manual download
      alert(
        `Could not automatically download the image. Opening in a new tab instead.\n\nYou can right-click the image and select "Save image as..." to download it.`,
      );
      window.open(item.imageUrl, "_blank");
    } finally {
      setDownloadingImage(false);
    }
  };

  // Helper function to extract path from Firebase Storage URL
  const extractPathFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Firebase Storage URLs have format: /v0/b/{bucket}/o/{path}?alt=media&token={token}
      const match = pathname.match(/\/o\/(.+)/);
      if (match) {
        // Decode the path (it's URL encoded)
        const encodedPath = match[1];
        return decodeURIComponent(encodedPath);
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  // Helper function to generate appropriate filename
  const generateImageFilename = (jewelleryItem: Jewellery): string => {
    let filename = jewelleryItem.code || "Jewellery_Image";

    // Clean filename (remove special characters)
    filename = filename.replace(/[^a-zA-Z0-9_-]/g, "_");

    // Try to get extension from URL
    const url = jewelleryItem.imageUrl;
    const extensionMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    if (extensionMatch) {
      const ext = extensionMatch[1].toLowerCase();
      if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) {
        return `${filename}.${ext}`;
      }
    }

    // Default to .jpg if no valid extension found
    return `${filename}.jpg`;
  };

  const handleViewBill = () => {
    if (!bill) return;

    if (bill.downloadUrl) {
      window.open(bill.downloadUrl, "_blank");
    } else {
      alert(`Bill Details:\n
Bill Notes: ${bill.notes || "No notes"}\n
File Type: ${bill.mimeType || "Unknown"}\n
Uploaded: ${formatDate(bill.uploadedAt)}\n
\nNo bill document URL available.`);
    }
  };

  const handleDownloadBill = () => {
    if (!bill || !bill.downloadUrl) {
      alert("No bill document available for download.");
      return;
    }

    const link = document.createElement("a");
    link.href = bill.downloadUrl;

    let filename = `Bill_${item?.code || "Document"}`;

    try {
      const urlObj = new URL(bill.downloadUrl);
      const pathParts = urlObj.pathname.split("/");
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.includes(".")) {
        filename = lastPart;
      }
    } catch (e) {
      console.log("Could not parse URL for filename");
    }

    if (bill.mimeType) {
      if (
        bill.mimeType.includes("pdf") &&
        !filename.toLowerCase().endsWith(".pdf")
      ) {
        filename += ".pdf";
      } else if (
        bill.mimeType.includes("image") &&
        !filename.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)
      ) {
        if (bill.mimeType.includes("jpeg")) {
          filename += ".jpg";
        } else if (bill.mimeType.includes("png")) {
          filename += ".png";
        } else if (bill.mimeType.includes("gif")) {
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

  if (loading) {
    return (
      <div style={jewelleryStyles.container}>
        <div style={jewelleryStyles.loading}>
          <div style={jewelleryStyles.spinner}></div>
          <p>Loading jewellery details...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={jewelleryStyles.container}>
        <div style={jewelleryStyles.topNav}>
          <button
            onClick={() => navigate("/jewellery/list")}
            style={jewelleryStyles.navButton}
            title="Back to Jewellery"
          >
            ←
          </button>
          <div style={jewelleryStyles.navTitle}>Jewellery Not Found</div>
          <div style={{ width: "40px" }}></div>
        </div>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>The requested jewellery item was not found.</p>
          <button
            onClick={() => navigate("/jewellery/list")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Back to Jewellery List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={jewelleryStyles.container}>
      {/* Top Navigation */}
      <div style={jewelleryStyles.topNav}>
        <button
          onClick={() => navigate("/jewellery/list")}
          style={jewelleryStyles.navButton}
          title="Back to Jewellery"
        >
          ←
        </button>
        <div style={jewelleryStyles.navTitle}>Jewellery Details</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate(`/jewellery/edit/${item.id}`)}
            style={{
              ...jewelleryStyles.navButton,
              padding: "6px 12px",
              fontSize: "14px",
            }}
            title="Edit"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "15px" }}>
        <div style={jewelleryStyles.statsCard}>
          <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>{item.code}</h3>

          {item.imageUrl && (
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  maxWidth: "100%",
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.code}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "300px",
                    borderRadius: "8px",
                  }}
                />

                {/* Image Download Button */}
                <button
                  onClick={handleDownloadImage}
                  disabled={downloadingImage}
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    cursor: downloadingImage ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s",
                    opacity: downloadingImage ? 0.7 : 1,
                  }}
                  title="Download Image"
                  onMouseEnter={(e) => {
                    if (!downloadingImage) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(0, 0, 0, 0.9)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!downloadingImage) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(0, 0, 0, 0.7)";
                    }
                  }}
                >
                  {downloadingImage ? (
                    <>
                      <span>⏳</span>
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <span>📥</span>
                      <span>Download</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div>
              <strong>Code:</strong> {item.code}
            </div>
            <div>
              <strong>Description:</strong> {item.description}
            </div>
            <div>
              <strong>Weight:</strong> {item.weight}g
            </div>
            <div>
              <strong>Location:</strong> {item.location}
            </div>
            <div>
              <strong>Bought For:</strong> {item.boughtFor}
            </div>
            <div>
              <strong>Purchase Date:</strong>{" "}
              {item.purchaseDate
                ? new Date(item.purchaseDate).toLocaleDateString()
                : "Not specified"}
            </div>

            {/* Bill Information Section */}
            {item.billId && (
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "15px",
                  borderRadius: "8px",
                  marginTop: "10px",
                  border: "1px solid #e5e7eb",
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
                  <strong style={{ fontSize: "16px" }}>Attached Bill</strong>
                  {billLoading && (
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      Loading bill...
                    </span>
                  )}
                  {billError && (
                    <span style={{ fontSize: "12px", color: "#ef4444" }}>
                      {billError}
                    </span>
                  )}
                </div>

                {bill ? (
                  <>
                    <div style={{ marginBottom: "10px" }}>
                      <div>
                        <strong>Notes:</strong> {bill.notes || "No notes"}
                      </div>
                      <div>
                        <strong>File Type:</strong> {bill.mimeType || "Unknown"}
                      </div>
                      <div>
                        <strong>Uploaded:</strong> {formatDate(bill.uploadedAt)}
                      </div>
                      <div>
                        <strong>Status:</strong>{" "}
                        {bill.downloadUrl ? (
                          <span style={{ color: "#10b981" }}>Available</span>
                        ) : (
                          <span style={{ color: "#ef4444" }}>
                            No download URL
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bill Action Buttons */}
                    {bill.downloadUrl && (
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "15px",
                        }}
                      >
                        <button
                          onClick={handleViewBill}
                          style={{
                            flex: 1,
                            padding: "10px",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                          title="View Bill"
                        >
                          <span>{getFileTypeIcon(bill.mimeType)}</span>
                          <span>View Bill</span>
                        </button>

                        <button
                          onClick={handleDownloadBill}
                          style={{
                            flex: 1,
                            padding: "10px",
                            backgroundColor: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                          title="Download Bill"
                        >
                          <span>📥</span>
                          <span>Download</span>
                        </button>
                      </div>
                    )}

                    {!bill.downloadUrl && (
                      <div
                        style={{
                          padding: "10px",
                          backgroundColor: "#fef3c7",
                          borderRadius: "6px",
                          color: "#92400e",
                          fontSize: "14px",
                        }}
                      >
                        ⚠️ Bill document exists but no download URL is
                        available.
                      </div>
                    )}
                  </>
                ) : !billLoading && !billError ? (
                  <div
                    style={{
                      color: "#6b7280",
                      textAlign: "center",
                      padding: "10px",
                    }}
                  >
                    Bill information not loaded
                  </div>
                ) : null}
              </div>
            )}

            <div>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  backgroundColor:
                    item.verificationStatus === VerificationStatus.VERIFIED
                      ? "#10b981"
                      : item.verificationStatus === VerificationStatus.MISSING
                        ? "#ef4444"
                        : "#6b7280",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              >
                {item.verificationStatus}
              </span>
            </div>
            {item.verificationNotes && (
              <div>
                <strong>Verification Notes:</strong> {item.verificationNotes}
              </div>
            )}
            {item.lastVerified > 0 && (
              <div>
                <strong>Last Verified:</strong>{" "}
                {new Date(item.lastVerified).toLocaleDateString()}
              </div>
            )}
            <div>
              <strong>Active:</strong> {item.active ? "Yes" : "No"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JewelleryDetail;
