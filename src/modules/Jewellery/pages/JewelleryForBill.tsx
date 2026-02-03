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
import { tw } from "../../../utils/tailwindMapping";

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
        return tw.linkedStatusVerified;
      case "Missing":
        return tw.linkedStatusMissing;
      default:
        return tw.linkedStatusDefault;
    }
  };

  if (loading) {
    return (
      <div className={tw.container}>
        <div className={tw.loading}>
          <div className={tw.spinner}></div>
          <p>Loading jewellery items for bill...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={tw.container}>
      {/* Top Navigation */}
      <div className={tw.topNav}>
        <button
          onClick={() => navigate("/jewellery/bills")}
          className={tw.navButton}
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
        <div className={tw.billHeader}>
          <div className={tw.billHeaderContent}>
            <span className={tw.billIcon}>{getFileIcon(bill.mimeType)}</span>
            <div className={tw.billInfo}>
              <div className={tw.billType}>
                {bill.mimeType.includes("pdf")
                  ? "PDF Bill"
                  : bill.mimeType.includes("image")
                    ? "Image Bill"
                    : "Bill Document"}
              </div>
              <div className={tw.billDate}>
                Uploaded: {formatDate(bill.uploadedAt)}
              </div>
            </div>
            <button
              onClick={() => window.open(bill.downloadUrl, "_blank")}
              className={tw.openBillButton}
            >
              Open Bill
            </button>
          </div>

          {bill.notes && (
            <div className="text-sm mb-2">
              <strong>Notes:</strong> {bill.notes}
            </div>
          )}
          <div className={tw.billId}>
            Bill ID: <code className={tw.billCode}>{bill.id}</code>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={tw.contentWrapper}>
        {/* Items Count */}
        {jewelleryItems.length > 0 && (
          <div className={tw.linkedHeader}>
            {jewelleryItems.length} items linked to this bill
          </div>
        )}

        {/* Items List */}
        <div className="pb-1">
          {jewelleryItems.length === 0 ? (
            <div className={tw.emptyStateContainer}>
              <div className={tw.emptyIcon}>💎</div>
              <div className={tw.emptyTitle}>
                No jewellery items linked to this bill.
              </div>
              <div className={tw.emptySubtitle}>
                Link jewellery items by setting their Bill ID to: <br />
                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono mt-1 inline-block">
                  {bill?.id}
                </code>
              </div>

              {/* Quick Instructions */}
              <div className={tw.instructionsBox}>
                <div className={tw.instructionsTitle}>
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
              <div className={tw.actionButtons}>
                <button
                  onClick={() => navigate("/jewellery/list")}
                  className={`${tw.actionButton} ${tw.listButton}`}
                >
                  📋 Go to Jewellery List
                </button>
                <button
                  onClick={() => navigate("/jewellery/add")}
                  className={`${tw.actionButton} ${tw.addButton}`}
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
                    className={tw.linkedItem}
                    onClick={() => navigate(`/jewellery/detail/${item.id}`)}
                  >
                    {/* Item Image */}
                    <div
                      className={`${tw.linkedImage} ${
                        !item.active ? tw.linkedImageInactive : ""
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
                    <div className={tw.linkedDetails}>
                      {/* ROW 1: Code + Description + Weight */}
                      <div className={tw.linkedRow1}>
                        <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
                          <div
                            className={`${tw.linkedCode} ${
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
                          <div className={tw.linkedDescription}>
                            {item.description}
                          </div>
                        </div>
                        <div className={tw.linkedWeight}>{item.weight}g</div>
                      </div>

                      {/* ROW 2: Location • Bought For • Purchase Date */}
                      <div className={tw.linkedRow2}>
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
                      className={`${tw.linkedStatus} ${getStatusClass(
                        item.verificationStatus,
                      )}`}
                      title={item.verificationStatus}
                    />

                    {/* Edit Button */}
                    <button
                      onClick={(e) => handleEditClick(e, item.id)}
                      className={tw.editButtonSmall}
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
