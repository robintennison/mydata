import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

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
      <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-gray-700 m-0 p-0">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p>Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-2.5 px-4 bg-white border-b border-gray-200 mb-2.5 shrink-0">
        <button
          onClick={() => navigate("/jewellery")}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-base cursor-pointer min-w-10 flex items-center justify-center text-gray-800"
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
      <div className="flex-1 flex flex-col w-full overflow-hidden min-h-0">
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
                  className={`bg-white p-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                    bill.hasLinkedJewellery
                      ? "border-l-4 border-blue-500"
                      : "border-l-4 border-transparent"
                  }`}
                  onClick={() =>
                    bill.hasLinkedJewellery &&
                    handleViewLinkedJewellery(bill.id)
                  }
                >
                  {/* Single Row Layout */}
                  <div className="flex items-center justify-between min-w-0">
                    {/* Left side: Notes and item count */}
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-3">
                        {/* Notes */}
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {bill.notes || "No notes"}
                        </div>

                        {/* Item count badge (only if has items) */}
                        {bill.hasLinkedJewellery && (
                          <div className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex-shrink-0">
                            <span>🔗</span>
                            <span>
                              {bill.jewelleryCount} item
                              {bill.jewelleryCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side: Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Edit Icon */}
                      <button
                        onClick={(e) => handleEditBill(e, bill.id)}
                        className="bg-transparent border-none text-base cursor-pointer p-1.5 rounded-lg transition-colors hover:bg-gray-100 text-blue-500"
                        title="Edit Bill"
                      >
                        ✏️
                      </button>

                      {/* Delete Icon */}
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
                        className={`bg-transparent border-none text-base cursor-pointer p-1.5 rounded-lg transition-colors hover:bg-gray-100 ${
                          bill.hasLinkedJewellery
                            ? "text-yellow-500"
                            : "text-red-500"
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
            <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Summary:</span>{" "}
                  {bills.filter((b) => b.hasLinkedJewellery).length} bills with
                  jewellery, {bills.filter((b) => !b.hasLinkedJewellery).length}{" "}
                  without
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Has jewellery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
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
