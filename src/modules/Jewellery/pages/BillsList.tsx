import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { tw } from "../../../utils/tailwindMapping";

interface Bill {
  id: string;
  notes?: string;
  hasLinkedJewellery?: boolean;
  jewelleryCount?: number;
}

const BillsList: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBillsAndCheckLinks = async () => {
      try {
        const db = getFirestore();

        // Fetch all bills
        const billsRef = collection(db, "bills");
        const snapshot = await getDocs(billsRef);

        const billsList: Bill[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          billsList.push({
            id: doc.id,
            notes: data.notes || "",
          });
        });

        // Sort bills by notes (alphabetically)
        billsList.sort((a, b) => {
          const noteA = (a.notes || "").toLowerCase();
          const noteB = (b.notes || "").toLowerCase();
          return noteA.localeCompare(noteB);
        });

        // Check each bill for linked jewellery items
        const billsWithLinkStatus = await Promise.all(
          billsList.map(async (bill) => {
            try {
              // Query jewellery items that have this billId
              const jewelleryRef = collection(db, "jewellery");
              const q = query(jewelleryRef, where("billId", "==", bill.id));
              const jewellerySnapshot = await getDocs(q);

              const jewelleryCount = jewellerySnapshot.size;

              return {
                ...bill,
                hasLinkedJewellery: jewelleryCount > 0,
                jewelleryCount: jewelleryCount,
              };
            } catch (error) {
              console.error(
                `Error checking jewellery for bill ${bill.id}:`,
                error,
              );
              return {
                ...bill,
                hasLinkedJewellery: false,
                jewelleryCount: 0,
              };
            }
          }),
        );

        setBills(billsWithLinkStatus);
      } catch (error: any) {
        console.error("Error fetching bills:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillsAndCheckLinks();
  }, []);

  const handleViewLinkedJewellery = (billId: string) => {
    navigate(`/jewellery/bills/${billId}/linked-jewellery`);
  };

  const handleEditBill = (e: React.MouseEvent, billId: string) => {
    e.stopPropagation();
    navigate(`/jewellery/bills/edit/${billId}`);
  };

  const handleDeleteBill = (e: React.MouseEvent, billId: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this bill?")) {
      // TODO: Implement delete
      console.log("Delete bill:", billId);
    }
  };

  if (loading) {
    return (
      <div className={tw.container}>
        <div className={tw.loading}>
          <div className={tw.spinner}></div>
          <p>Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={tw.container}>
      {/* Top Navigation */}
      <div className={tw.topNav}>
        <button
          onClick={() => navigate("/jewellery")}
          className={tw.navButton}
          title="Back to Jewellery"
        >
          ←
        </button>
        <div className="text-lg font-semibold text-gray-900 flex-1 text-center">
          Bills
        </div>
        <button
          onClick={() => navigate("/jewellery/bills/add")}
          className="px-3 py-1.5 bg-blue-500 text-white border-none rounded-lg cursor-pointer text-sm font-medium hover:bg-blue-600 transition-colors"
          title="Add New Bill"
        >
          + Add
        </button>
      </div>

      {/* Bills List */}
      <div className={tw.contentWrapper}>
        {bills.length === 0 ? (
          <div className="text-center py-12 px-4 text-gray-500">
            <div className="text-5xl mb-4 opacity-50">📄</div>
            <p className="mb-4">No bills found.</p>
            <button
              onClick={() => navigate("/jewellery/bills/add")}
              className="px-5 py-2.5 bg-blue-500 text-white border-none rounded-lg cursor-pointer text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Add your first bill
            </button>
          </div>
        ) : (
          <>
            <div className="text-xs text-gray-600 px-3 pt-3 pb-1 text-right">
              {bills.length} bills •{" "}
              {bills.filter((b) => b.hasLinkedJewellery).length} with jewellery
            </div>
            <div className="flex flex-col">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className={`${tw.billListItem} ${
                    bill.hasLinkedJewellery
                      ? tw.billListItemLinked
                      : tw.billListItemUnlinked
                  }`}
                  onClick={() =>
                    bill.hasLinkedJewellery &&
                    handleViewLinkedJewellery(bill.id)
                  }
                >
                  {/* Single Row Layout */}
                  <div className={tw.billItemContent}>
                    {/* Bill Info */}
                    <div className={tw.billInfo}>
                      <div className={tw.billTitle}>
                        {bill.notes || "No notes"}
                      </div>

                      {/* Link Status Indicator */}
                      <div className={tw.billMetaRow}>
                        <div
                          className={`${tw.linkedBadge} ${
                            bill.hasLinkedJewellery
                              ? tw.linkedBadgeWithItems
                              : tw.linkedBadgeNoItems
                          }`}
                        >
                          {bill.hasLinkedJewellery ? (
                            <>
                              <span>🔗</span>
                              <span>
                                {bill.jewelleryCount} item
                                {bill.jewelleryCount !== 1 ? "s" : ""}
                              </span>
                            </>
                          ) : (
                            <>
                              <span>❌</span>
                              <span>No jewellery</span>
                            </>
                          )}
                        </div>

                        {/* Bill ID (truncated) */}
                        <div className={tw.billId}>
                          {bill.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>

                    {/* Action Icons */}
                    <div className={tw.actionIcons}>
                      {/* View Linked Jewellery Button (only if has links) */}
                      {bill.hasLinkedJewellery && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewLinkedJewellery(bill.id);
                          }}
                          className={`${tw.actionIcon} ${tw.viewIcon}`}
                          title={`View ${bill.jewelleryCount} linked item${
                            bill.jewelleryCount !== 1 ? "s" : ""
                          }`}
                        >
                          <span>🔍</span>
                          <span className="text-[9px] mt-0.5">
                            {bill.jewelleryCount}
                          </span>
                        </button>
                      )}

                      {/* Edit Icon */}
                      <button
                        onClick={(e) => handleEditBill(e, bill.id)}
                        className={`${tw.actionIcon} ${tw.editIcon}`}
                        title="Edit Bill"
                      >
                        ✏️
                      </button>

                      {/* Delete Icon - Show warning if bill has linked jewellery */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (bill.hasLinkedJewellery) {
                            if (
                              window.confirm(
                                `This bill is linked to ${bill.jewelleryCount} jewellery item${
                                  bill.jewelleryCount !== 1 ? "s" : ""
                                }. ` +
                                  `Deleting it will remove the link from those items. Are you sure you want to delete?`,
                              )
                            ) {
                              handleDeleteBill(e, bill.id);
                            }
                          } else {
                            handleDeleteBill(e, bill.id);
                          }
                        }}
                        className={`${tw.actionIcon} ${
                          bill.hasLinkedJewellery
                            ? tw.deleteIconLinked
                            : tw.deleteIconUnlinked
                        }`}
                        title={
                          bill.hasLinkedJewellery
                            ? `Delete bill (linked to ${bill.jewelleryCount} item${
                                bill.jewelleryCount !== 1 ? "s" : ""
                              })`
                            : "Delete bill"
                        }
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Section */}
            <div className={tw.summarySection}>
              <div className={tw.summaryContent}>
                <div>
                  <span className="font-medium">Summary:</span>{" "}
                  {bills.filter((b) => b.hasLinkedJewellery).length} bills with
                  jewellery, {bills.filter((b) => !b.hasLinkedJewellery).length}{" "}
                  without
                </div>
                <div className={tw.legend}>
                  <div className={tw.legendItem}>
                    <div
                      className={`${tw.legendDot} ${tw.legendDotLinked}`}
                    ></div>
                    <span>Has jewellery</span>
                  </div>
                  <div className={tw.legendItem}>
                    <div
                      className={`${tw.legendDot} ${tw.legendDotUnlinked}`}
                    ></div>
                    <span>No jewellery</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="h-1"></div>
    </div>
  );
};

export default BillsList;
