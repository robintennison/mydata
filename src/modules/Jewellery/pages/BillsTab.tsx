import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useJewellerySettings } from "../hooks/useSettingsData";

interface Bill {
  id: string;
  notes?: string;
  hasLinkedJewellery?: boolean;
  jewelleryCount?: number;
}

type TabType = "all" | "with-jewellery" | "without-jewellery";

interface BillsTabProps {
  compact?: boolean;
}

const BillsTab: React.FC<BillsTabProps> = ({ compact = false }) => {
  const navigate = useNavigate();
  const { showDelete: showDeleteSetting } = useJewellerySettings();

  console.log("🚀 BillsTab - showDeleteSetting from hook:", showDeleteSetting);

  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  useEffect(() => {
    const fetchBillsAndCheckLinks = async () => {
      try {
        console.log("📡 Fetching bills from Firestore...");
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

        console.log(`📄 Found ${billsList.length} bills`);

        // Sort bills by notes (alphabetically)
        billsList.sort((a, b) => {
          const noteA = (a.notes || "").toLowerCase();
          const noteB = (b.notes || "").toLowerCase();
          return noteA.localeCompare(noteB);
        });

        // Check each bill for linked jewellery items
        console.log("🔍 Checking for linked jewellery items...");
        const billsWithLinkStatus = await Promise.all(
          billsList.map(async (bill) => {
            try {
              // Query jewellery items that have this billId
              const jewelleryRef = collection(db, "jewellery");
              const q = query(jewelleryRef, where("billId", "==", bill.id));
              const jewellerySnapshot = await getDocs(q);

              const jewelleryCount = jewellerySnapshot.size;

              if (jewelleryCount > 0) {
                console.log(
                  `   Bill "${bill.notes?.substring(0, 30)}..." has ${jewelleryCount} linked jewellery items`,
                );
              }

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

        console.log(
          `✅ Loaded ${billsWithLinkStatus.length} bills with link status`,
        );
        console.log(
          `   - With jewellery: ${billsWithLinkStatus.filter((b) => b.hasLinkedJewellery).length}`,
        );
        console.log(
          `   - Without jewellery: ${billsWithLinkStatus.filter((b) => !b.hasLinkedJewellery).length}`,
        );

        setBills(billsWithLinkStatus);
        setFilteredBills(billsWithLinkStatus);
      } catch (error: any) {
        console.error("❌ Error fetching bills:", error);
      } finally {
        setLoading(false);
        console.log("✅ Loading complete");
      }
    };

    fetchBillsAndCheckLinks();
  }, []);

  // Filter bills based on active tab
  useEffect(() => {
    console.log(`🔄 Filtering bills for tab: ${activeTab}`);
    console.log(`   Total bills: ${bills.length}`);

    if (activeTab === "with-jewellery") {
      const withJewellery = bills.filter((bill) => bill.hasLinkedJewellery);
      console.log(`   Showing ${withJewellery.length} bills with jewellery`);
      setFilteredBills(withJewellery);
    } else if (activeTab === "without-jewellery") {
      const withoutJewellery = bills.filter((bill) => !bill.hasLinkedJewellery);
      console.log(
        `   Showing ${withoutJewellery.length} bills without jewellery`,
      );
      setFilteredBills(withoutJewellery);
    } else {
      console.log(`   Showing all ${bills.length} bills`);
      setFilteredBills(bills);
    }
  }, [activeTab, bills]);

  // FIX: Update navigation to pass activeTab state
  const handleViewLinkedJewellery = (billId: string) => {
    console.log(`👁️ Viewing linked jewellery for bill: ${billId}`);
    navigate(`/jewellery/bills/${billId}/linked-jewellery`, {
      state: {
        returnTo: "/jewellery",
        activeTab: "bills",
      },
    });
  };

  // FIX: Update navigation to pass activeTab state
  const handleEditBill = (e: React.MouseEvent, billId: string) => {
    e.stopPropagation();
    console.log(`✏️ Editing bill: ${billId}`);
    navigate(`/jewellery/bills/edit/${billId}`, {
      state: {
        returnTo: "/jewellery",
        activeTab: "bills",
      },
    });
  };

  // FIX: Navigation for "View All Bills" button
  const handleViewAllBills = () => {
    navigate("/jewellery", {
      state: { activeTab: "bills" },
    });
  };

  const getTabStats = () => {
    const withJewellery = bills.filter((b) => b.hasLinkedJewellery).length;
    const withoutJewellery = bills.filter((b) => !b.hasLinkedJewellery).length;

    console.log(
      `📊 Stats - All: ${bills.length}, With: ${withJewellery}, Without: ${withoutJewellery}`,
    );

    return {
      all: bills.length,
      withJewellery,
      withoutJewellery,
    };
  };

  const stats = getTabStats();

  if (loading) {
    console.log("⏳ BillsTab is loading...");
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
    console.log("📱 Rendering compact BillsTab view");
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
          onClick={handleViewAllBills} // FIX: Use the new handler
          className="w-full py-2.5 bg-blue-600 text-white border-none rounded-lg cursor-pointer text-sm font-medium flex items-center justify-center gap-2"
        >
          View All Bills
          <span>→</span>
        </button>
      </div>
    );
  }

  console.log(`🎨 Rendering full BillsTab view`);
  console.log(
    `   showDeleteSetting: ${showDeleteSetting} (${typeof showDeleteSetting})`,
  );
  console.log(`   filteredBills count: ${filteredBills.length}`);

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
              {filteredBills.map((bill, index) => {
                console.log(
                  `   Rendering bill ${index + 1}: "${bill.notes?.substring(0, 30)}..." - showDeleteSetting: ${showDeleteSetting}`,
                );

                return (
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
                      {/* Left side: Notes and item count */}
                      <div className="flex-1 min-w-0 pr-2.5">
                        <div className="flex items-center gap-2">
                          {/* Notes */}
                          <div className="font-medium text-sm text-gray-900 truncate">
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

                      {/* Right side: Action buttons - Show edit icon ONLY when showDeleteSetting is true */}
                      {showDeleteSetting ? (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Edit Icon */}
                          <button
                            onClick={(e) => handleEditBill(e, bill.id)}
                            className="bg-transparent border-none text-base text-blue-500 cursor-pointer p-1.5 rounded flex items-center hover:bg-blue-50"
                            title="Edit Bill"
                          >
                            ✏️
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
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
