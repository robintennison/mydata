import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { Jewellery, VerificationStatus } from "../models/types";

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
      <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-gray-700 m-0 p-0">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p>Loading jewellery details...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
        <div className="flex items-center justify-between p-2.5 px-4 bg-white border-b border-gray-200 mb-2.5 shrink-0">
          <button
            onClick={() => navigate("/jewellery/list")}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-base cursor-pointer min-w-10 flex items-center justify-center text-gray-800"
            title="Back to Jewellery"
          >
            ←
          </button>
          <div className="text-lg font-semibold text-gray-900 flex-1 text-center">
            Jewellery Not Found
          </div>
          <div className="w-10"></div>
        </div>
        <div className="p-5 text-center">
          <p className="mb-4">The requested jewellery item was not found.</p>
          <button
            onClick={() => navigate("/jewellery/list")}
            className="px-5 py-2.5 bg-blue-500 text-white border-none rounded-lg cursor-pointer text-sm hover:bg-blue-600 transition-colors"
          >
            Back to Jewellery List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-2.5 px-4 bg-white border-b border-gray-200 mb-2.5 shrink-0">
        <button
          onClick={() => navigate("/jewellery/list")}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-base cursor-pointer min-w-10 flex items-center justify-center text-gray-800"
          title="Back to Jewellery"
        >
          ←
        </button>
        <div className="text-lg font-semibold text-gray-900 flex-1 text-center">
          Jewellery Details
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/jewellery/edit/${item.id}`)}
            className="px-3 py-1.5 bg-blue-500 text-white border-none rounded-lg cursor-pointer text-sm font-medium hover:bg-blue-600 transition-colors"
            title="Edit"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {item.code}
          </h3>

          {item.imageUrl && (
            <div className="mb-5 text-center relative">
              <img
                src={item.imageUrl}
                alt={item.code}
                className="max-w-full max-h-[300px] rounded-lg"
              />
              <button
                onClick={handleDownloadImage}
                disabled={downloadingImage}
                className="absolute bottom-3 right-3 bg-black/70 text-white border-none rounded-lg px-3 py-2 cursor-pointer text-sm flex items-center gap-1.5 hover:bg-black/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                title="Download Image"
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
          )}

          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700 mb-0.5">Code:</span>
              <span className="text-gray-900">{item.code}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700 mb-0.5">
                Description:
              </span>
              <span className="text-gray-900">{item.description}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700 mb-0.5">
                Weight:
              </span>
              <span className="text-gray-900">{item.weight}g</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700 mb-0.5">
                Location:
              </span>
              <span className="text-gray-900">{item.location}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700 mb-0.5">
                Bought For:
              </span>
              <span className="text-gray-900">{item.boughtFor}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700 mb-0.5">
                Purchase Date:
              </span>
              <span className="text-gray-900">
                {item.purchaseDate
                  ? new Date(item.purchaseDate).toLocaleDateString()
                  : "Not specified"}
              </span>
            </div>

            {/* Bill Information Section */}
            {item.billId && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-3">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-base font-semibold text-gray-900">
                    Attached Bill
                  </div>
                  {billLoading && (
                    <span className="text-xs px-2 py-1 rounded-full text-gray-600">
                      Loading bill...
                    </span>
                  )}
                  {billError && (
                    <span className="text-xs px-2 py-1 rounded-full text-red-600">
                      {billError}
                    </span>
                  )}
                </div>

                {bill ? (
                  <>
                    <div className="mb-3 space-y-1.5">
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
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            bill.downloadUrl
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {bill.downloadUrl ? "Available" : "No download URL"}
                        </span>
                      </div>
                    </div>

                    {/* Bill Action Buttons */}
                    {bill.downloadUrl && (
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleViewBill}
                          className="flex-1 py-2.5 bg-blue-500 text-white border-none rounded-lg cursor-pointer flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
                          title="View Bill"
                        >
                          <span className="text-base">
                            {getFileTypeIcon(bill.mimeType)}
                          </span>
                          <span>View Bill</span>
                        </button>
                        <button
                          onClick={handleDownloadBill}
                          className="flex-1 py-2.5 bg-green-500 text-white border-none rounded-lg cursor-pointer flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                          title="Download Bill"
                        >
                          <span>📥</span>
                          <span>Download</span>
                        </button>
                      </div>
                    )}

                    {!bill.downloadUrl && (
                      <div className="p-3 bg-yellow-100 rounded-lg text-yellow-800 text-sm">
                        ⚠️ Bill document exists but no download URL is
                        available.
                      </div>
                    )}
                  </>
                ) : !billLoading && !billError ? (
                  <div className="text-gray-500 text-center p-3">
                    Bill information not loaded
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex flex-col">
              <span className="font-semibold text-gray-700 mb-0.5">
                Status:
              </span>
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${
                  item.verificationStatus === VerificationStatus.VERIFIED
                    ? "bg-green-500"
                    : item.verificationStatus === VerificationStatus.MISSING
                      ? "bg-red-500"
                      : "bg-gray-500"
                }`}
              >
                {item.verificationStatus}
              </span>
            </div>
            {item.verificationNotes && (
              <div className="flex flex-col">
                <span className="font-semibold text-gray-700 mb-0.5">
                  Verification Notes:
                </span>
                <span className="text-gray-900">{item.verificationNotes}</span>
              </div>
            )}
            {item.lastVerified > 0 && (
              <div className="flex flex-col">
                <span className="font-semibold text-gray-700 mb-0.5">
                  Last Verified:
                </span>
                <span className="text-gray-900">
                  {new Date(item.lastVerified).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700 mb-0.5">
                Active:
              </span>
              <span className="text-gray-900">
                {item.active ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JewelleryDetail;
