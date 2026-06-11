// BillAssignment.tsx
import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";

interface Bill {
  id: string;
  downloadUrl: string;
  mimeType: string;
  notes: string | null;
  createdAt: number;
  uploadedAt: number;
}

interface BillAssignmentProps {
  billId: string;
  bills: Bill[];
  loadingBills: boolean;
  onBillChange: (billId: string) => void;
}

const BillAssignment: React.FC<BillAssignmentProps> = ({
  billId,
  bills,
  loadingBills,
  onBillChange,
}) => {
  const [assignedBill, setAssignedBill] = useState<Bill | null>(null);
  const [loadingAssignedBill, setLoadingAssignedBill] = useState(false);
  const [showBillDropdown, setShowBillDropdown] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);

  // Fetch assigned bill details based on billId
  useEffect(() => {
    const fetchAssignedBill = async () => {
      if (!billId) {
        setAssignedBill(null);
        setShowBillDropdown(false);
        setBillError(null);
        return;
      }

      try {
        setLoadingAssignedBill(true);
        setBillError(null);
        const db = getFirestore();
        const billRef = doc(db, "bills", billId);
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
            setBillError("No downloadable content available");
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
  }, [billId]);

  const handleViewBill = () => {
    if (!assignedBill) return;

    if (assignedBill.downloadUrl) {
      window.open(assignedBill.downloadUrl, "_blank");
    } else {
      alert(
        `Bill Details:\n\nBill Notes: ${assignedBill.notes || "No notes"}\n\nNo bill document available.`,
      );
    }
  };

  const handleDownloadBill = () => {
    if (!assignedBill || !assignedBill.downloadUrl) {
      alert("No bill document available for download.");
      return;
    }

    const link = document.createElement("a");
    link.href = assignedBill.downloadUrl;

    let filename = `Bill_${billId.substring(0, 8)}`;

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

  const handleChangeBillClick = () => {
    setShowBillDropdown(true);
  };

  const handleCancelChangeBill = () => {
    setShowBillDropdown(false);
  };

  const handleAddBillClick = () => {
    setShowBillDropdown(true);
  };

  const handleBillSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onBillChange(e.target.value);
  };

  return (
    <div className="mt-5 pt-4 border-t border-gray-200">
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        Bill Assignment
      </label>

      {/* Show assigned bill details when available */}
      {!showBillDropdown && assignedBill && !loadingAssignedBill && (
        <div className="flex flex-col gap-2">
          {/* Bill details card */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-500">📄</span>
                <span className="font-medium text-gray-900 text-sm">
                  {assignedBill.notes ||
                    `Bill ${assignedBill.id.substring(0, 8)}...`}
                </span>
              </div>

              {billError && (
                <span className="text-xs text-red-600">{billError}</span>
              )}
            </div>

            {/* Bill Action Buttons */}
            <div className="flex gap-2 mt-2">
              {assignedBill.downloadUrl ? (
                <>
                  <button
                    type="button"
                    onClick={handleViewBill}
                    className="px-2 py-1 bg-blue-500 text-white border-none rounded text-xs cursor-pointer flex items-center gap-1 hover:bg-blue-600"
                    title="View Bill"
                  >
                    <span>👁️</span>
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadBill}
                    className="px-2 py-1 bg-green-500 text-white border-none rounded text-xs cursor-pointer flex items-center gap-1 hover:bg-green-600"
                    title="Download Bill"
                  >
                    <span>📥</span>
                    <span>Download</span>
                  </button>
                </>
              ) : (
                <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs flex items-center gap-1">
                  <span>⚠️</span>
                  <span>No file available</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleChangeBillClick}
                className="ml-auto px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs cursor-pointer hover:bg-gray-200"
              >
                Change Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show loading state for assigned bill */}
      {!showBillDropdown && loadingAssignedBill && (
        <div className="p-3 border border-gray-300 rounded bg-gray-100 text-gray-600 text-center">
          Loading bill information...
        </div>
      )}

      {/* Show "Add Bill" when no bill is assigned */}
      {!showBillDropdown && !assignedBill && !loadingAssignedBill && billId === "" && (
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <div className="flex-1">
            <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded text-gray-600 text-center">
              No bill assigned to this jewellery item
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddBillClick}
            className="px-3 py-2 bg-green-500 text-white border-none rounded text-sm cursor-pointer flex items-center justify-center gap-1.5 hover:bg-green-600"
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
            <div className="p-3 border border-gray-300 rounded bg-gray-100 text-gray-600 text-center">
              Loading available bills...
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={billId || ""}
                onChange={handleBillSelection}
                className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white"
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
                className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded text-sm cursor-pointer hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          )}

          {assignedBill && (
            <div className="mt-2 text-xs text-gray-500 italic">
              Currently assigned:{" "}
              {assignedBill.notes ||
                `Bill ${assignedBill.id.substring(0, 12)}...`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BillAssignment;