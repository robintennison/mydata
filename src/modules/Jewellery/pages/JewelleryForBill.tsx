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

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Verified":
        return "bg-green-500";
      case "Missing":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-gray-700 m-0 p-0">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p>Loading jewellery items for bill...</p>
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
          Linked Jewellery Items
        </div>
        <button
          onClick={handleRefresh}
          className="px-2 py-1 bg-transparent border border-gray-300 rounded-lg cursor-pointer text-xs hover:bg-gray-100 transition-colors"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {/* Bill Header Information */}
      {bill && (
        <div className="p-3 bg-blue-50 border-b border-blue-200 mb-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{getFileIcon(bill.mimeType)}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm">
                {bill.mimeType.includes("pdf")
                  ? "PDF Bill"
                  : bill.mimeType.includes("image")
                    ? "Image Bill"
                    : "Bill Document"}
              </div>
              <div className="text-xs text-gray-600">
                Uploaded: {formatDate(bill.uploadedAt)}
              </div>
            </div>
            <button
              onClick={() => window.open(bill.downloadUrl, "_blank")}
              className="px-3 py-1.5 bg-blue-500 text-white border-none rounded-lg cursor-pointer text-xs hover:bg-blue-600 transition-colors"
            >
              Open Bill
            </button>
          </div>

          {bill.notes && (
            <div className="text-sm mb-2">
              <strong>Notes:</strong> {bill.notes}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            Bill ID:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
              {bill.id}
            </code>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col w-full overflow-hidden min-h-0">
        {/* Items Count */}
        {jewelleryItems.length > 0 && (
          <div className="text-xs text-gray-600 px-3 pt-3 pb-1 text-right">
            {jewelleryItems.length} items linked to this bill
          </div>
        )}

        {/* Items List */}
        <div className="pb-1">
          {jewelleryItems.length === 0 ? (
            <div className="text-center py-10 px-4 text-gray-500">
              <div className="text-5xl mb-4 opacity-50">💎</div>
              <div className="text-base font-medium text-gray-600 mb-2">
                No jewellery items linked to this bill.
              </div>
              <div className="text-sm text-gray-500 mb-4">
                Link jewellery items by setting their Bill ID to: <br />
                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono mt-1 inline-block">
                  {bill?.id}
                </code>
              </div>

              {/* Quick Instructions */}
              <div className="bg-yellow-50 p-4 rounded-lg my-4 max-w-lg mx-auto text-xs text-yellow-800">
                <div className="font-semibold mb-2 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>How to link items:</span>
                </div>
                <ol className="pl-5 space-y-1 mb-0">
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
              <div className="flex gap-3 justify-center flex-wrap mt-5">
                <button
                  onClick={() => navigate("/jewellery")}
                  className="px-4 py-2.5 text-white border-none rounded-lg cursor-pointer text-sm font-medium transition-colors bg-blue-500 hover:bg-blue-600"
                >
                  📋 Go to Jewellery List
                </button>
                <button
                  onClick={() => navigate("/jewellery/add")}
                  className="px-4 py-2.5 text-white border-none rounded-lg cursor-pointer text-sm font-medium transition-colors bg-green-500 hover:bg-green-600"
                >
                  ➕ Add New Jewellery
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {jewelleryItems.map((item) => {
                const formattedDate = formatDate(item.purchaseDate);

                return (
                  <div
                    key={item.id}
                    className="bg-white p-3 border-b border-gray-100 cursor-pointer flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/jewellery/detail/${item.id}`)}
                  >
                    {/* Item Image */}
                    <div
                      className={`w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden ${
                        !item.active
                          ? "border border-dashed border-gray-300"
                          : ""
                      }`}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.code}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-xl text-gray-400">💎</div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      {/* ROW 1: Code + Description + Weight */}
                      <div className="flex items-baseline justify-between mb-1 gap-2">
                        <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
                          <div
                            className={`font-semibold text-gray-900 text-sm whitespace-nowrap ${
                              !item.active ? "text-gray-500" : ""
                            }`}
                          >
                            {item.code}
                          </div>
                          {!item.active && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded whitespace-nowrap">
                              Inactive
                            </span>
                          )}
                          <div className="text-sm text-gray-600 truncate min-w-0 flex-1">
                            {item.description}
                          </div>
                        </div>
                        <div className="text-sm text-gray-900 font-medium whitespace-nowrap flex-shrink-0">
                          {item.weight}g
                        </div>
                      </div>

                      {/* ROW 2: Location • Bought For • Purchase Date */}
                      <div className="flex items-center text-xs text-gray-500 gap-1.5 flex-wrap">
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
                            <span className="italic">No details</span>
                          )}
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusClass(
                        item.verificationStatus,
                      )}`}
                      title={item.verificationStatus}
                    />

                    {/* Edit Button */}
                    <button
                      onClick={(e) => handleEditClick(e, item.id)}
                      className="bg-transparent border-none text-blue-500 cursor-pointer p-1.5 rounded-lg hover:bg-blue-50 transition-colors w-8 h-8 flex items-center justify-center flex-shrink-0"
                      title="Edit"
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
        <div className="h-1"></div>
      </div>
    </div>
  );
};

export default JewelleryForBill;
