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

type TabType = "all" | "with-jewellery" | "without-jewellery";

interface BillsTabProps {
  compact?: boolean; // Prop to control if it should show in compact mode
}

const BillsTab: React.FC<BillsTabProps> = ({ compact = false }) => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");

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
        setFilteredBills(billsWithLinkStatus);
      } catch (error: any) {
        console.error("Error fetching bills:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillsAndCheckLinks();
  }, []);

  // Filter bills based on active tab
  useEffect(() => {
    if (activeTab === "with-jewellery") {
      setFilteredBills(bills.filter((bill) => bill.hasLinkedJewellery));
    } else if (activeTab === "without-jewellery") {
      setFilteredBills(bills.filter((bill) => !bill.hasLinkedJewellery));
    } else {
      setFilteredBills(bills);
    }
  }, [activeTab, bills]);

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

  const getTabStats = () => {
    const withJewellery = bills.filter((b) => b.hasLinkedJewellery).length;
    const withoutJewellery = bills.filter((b) => !b.hasLinkedJewellery).length;

    return {
      all: bills.length,
      withJewellery,
      withoutJewellery,
    };
  };

  const stats = getTabStats();

  if (loading) {
    return (
      <div className="text-center p-10 text-gray-400">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p>Loading bills...</p>
        <style>
          {`
            .border-3 {
              border-width: 3px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-3.75">
        <div className="text-base font-semibold text-gray-800 mb-3.75 flex justify-between items-center">
          <span>Bills Summary</span>
          <span className="text-xs text-gray-500 font-normal">
            {stats.all} bills
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-3.75">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-blue-600 mb-1">
              {stats.all}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-blue-800 mb-1">
              {stats.withJewellery}
            </div>
            <div className="text-xs text-blue-800">With Items</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-gray-500 mb-1">
              {stats.withoutJewellery}
            </div>
            <div className="text-xs text-gray-500">Without</div>
          </div>
        </div>

        <button
          onClick={() => navigate("/jewellery/bills")}
          className="w-full py-2.5 bg-blue-600 text-white border-none rounded-lg cursor-pointer text-sm font-medium flex items-center justify-center gap-2"
        >
          View All Bills
          <span>→</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 px-4 py-3 border-none text-sm cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "all"
              ? "bg-gray-100 text-gray-900 font-semibold border-b-2 border-blue-500"
              : "bg-transparent text-gray-500 font-normal"
          }`}
        >
          All Bills
          <span
            className={`text-xs px-2 py-0.5 rounded-full min-w-6 ${
              activeTab === "all"
                ? "bg-gray-300 text-gray-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {stats.all}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("with-jewellery")}
          className={`flex-1 px-4 py-3 border-none text-sm cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "with-jewellery"
              ? "bg-gray-100 text-gray-900 font-semibold border-b-2 border-blue-500"
              : "bg-transparent text-gray-500 font-normal"
          }`}
        >
          With Jewellery
          <span
            className={`text-xs px-2 py-0.5 rounded-full min-w-6 ${
              activeTab === "with-jewellery"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {stats.withJewellery}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("without-jewellery")}
          className={`flex-1 px-4 py-3 border-none text-sm cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "without-jewellery"
              ? "bg-gray-100 text-gray-900 font-semibold border-b-2 border-blue-500"
              : "bg-transparent text-gray-500 font-normal"
          }`}
        >
          Without Jewellery
          <span
            className={`text-xs px-2 py-0.5 rounded-full min-w-6 ${
              activeTab === "without-jewellery"
                ? "bg-gray-100 text-gray-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {stats.withoutJewellery}
          </span>
        </button>
      </div>

      {/* Bills List */}
      <div className="bg-gray-50 min-h-[400px]">
        {filteredBills.length === 0 ? (
          <div className="text-center p-10 text-gray-400">
            <div className="text-5xl mb-4">
              {activeTab === "all"
                ? "📄"
                : activeTab === "with-jewellery"
                  ? "🔗"
                  : "❌"}
            </div>
            <p className="mb-4">
              {activeTab === "all"
                ? "No bills found."
                : activeTab === "with-jewellery"
                  ? "No bills with linked jewellery."
                  : "All bills have linked jewellery."}
            </p>
          </div>
        ) : (
          <>
            <div className="text-xs text-gray-500 px-3 pt-1.5 pb-0.5 text-right">
              Showing {filteredBills.length}{" "}
              {activeTab === "all"
                ? "bills"
                : activeTab === "with-jewellery"
                  ? "bills with jewellery"
                  : "bills without jewellery"}
            </div>
            <div className="flex flex-col">
              {filteredBills.map((bill) => (
                <div
                  key={bill.id}
                  className={`bg-white p-3 border-b border-gray-200 ${
                    bill.hasLinkedJewellery
                      ? "cursor-pointer"
                      : "cursor-default"
                  } ${bill.hasLinkedJewellery ? "border-l-4 border-blue-500" : "border-l-4 border-transparent"}`}
                  onClick={() =>
                    bill.hasLinkedJewellery &&
                    handleViewLinkedJewellery(bill.id)
                  }
                >
                  {/* Single Row Layout */}
                  <div className="flex items-center justify-between">
                    {/* Bill Info */}
                    <div className="flex-1 min-w-0 pr-2.5">
                      <div className="font-medium text-sm text-gray-900 mb-1">
                        {bill.notes || "No notes"}
                      </div>

                      {/* Link Status Indicator */}
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full ${
                            bill.hasLinkedJewellery
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-500"
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
                        <div className="text-xs text-gray-400 font-mono">
                          {bill.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* View Linked Jewellery Button (only if has links) */}
                      {bill.hasLinkedJewellery && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewLinkedJewellery(bill.id);
                          }}
                          className="bg-transparent border-none text-sm text-blue-500 cursor-pointer p-1.5 rounded flex items-center flex-col"
                          title={`View ${bill.jewelleryCount} linked item${bill.jewelleryCount !== 1 ? "s" : ""}`}
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
                        className="bg-transparent border-none text-base text-blue-500 cursor-pointer p-1.5 rounded flex items-center"
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
                                `This bill is linked to ${bill.jewelleryCount} jewellery item${bill.jewelleryCount !== 1 ? "s" : ""}. ` +
                                  `Deleting it will remove the link from those items. Are you sure you want to delete?`,
                              )
                            ) {
                              handleDeleteBill(e, bill.id);
                            }
                          } else {
                            handleDeleteBill(e, bill.id);
                          }
                        }}
                        className={`bg-transparent border-none text-base cursor-pointer p-1.5 rounded flex items-center ${
                          bill.hasLinkedJewellery
                            ? "text-amber-500"
                            : "text-red-500"
                        }`}
                        title={
                          bill.hasLinkedJewellery
                            ? `Delete bill (linked to ${bill.jewelleryCount} item${bill.jewelleryCount !== 1 ? "s" : ""})`
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
            <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 flex justify-between items-center">
              <div>
                <span className="font-medium">Summary:</span>{" "}
                {stats.withJewellery} bills with jewellery,{" "}
                {stats.withoutJewellery} without
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Has jewellery</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span>No jewellery</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BillsTab;
