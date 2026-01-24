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
      <div
        style={{
          textAlign: "center",
          padding: "40px 20px",
          color: "#9ca3af",
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            border: "3px solid #f3f4f6",
            borderTop: "3px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px auto",
          }}
        ></div>
        <p>Loading bills...</p>
        <style>
          {`
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
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "10px",
          padding: "15px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: "15px",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#333",
            marginBottom: "15px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Bills Summary</span>
          <span
            style={{
              fontSize: "12px",
              color: "#6b7280",
              fontWeight: "normal",
            }}
          >
            {stats.all} bills
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <div
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#3b82f6",
                marginBottom: "4px",
              }}
            >
              {stats.all}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#6b7280",
              }}
            >
              Total
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#eff6ff",
              borderRadius: "8px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1e40af",
                marginBottom: "4px",
              }}
            >
              {stats.withJewellery}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#1e40af",
              }}
            >
              With Items
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              {stats.withoutJewellery}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#6b7280",
              }}
            >
              Without
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/jewellery/bills")}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          View All Bills
          <span>→</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "white",
        }}
      >
        <button
          onClick={() => setActiveTab("all")}
          style={{
            flex: 1,
            padding: "12px 16px",
            border: "none",
            backgroundColor: activeTab === "all" ? "#f3f4f6" : "transparent",
            color: activeTab === "all" ? "#111827" : "#6b7280",
            fontSize: "14px",
            fontWeight: activeTab === "all" ? "600" : "400",
            borderBottom: activeTab === "all" ? "2px solid #3b82f6" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          All Bills
          <span
            style={{
              fontSize: "12px",
              backgroundColor: activeTab === "all" ? "#d1d5db" : "#f3f4f6",
              color: activeTab === "all" ? "#374151" : "#9ca3af",
              padding: "2px 8px",
              borderRadius: "12px",
              minWidth: "24px",
            }}
          >
            {stats.all}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("with-jewellery")}
          style={{
            flex: 1,
            padding: "12px 16px",
            border: "none",
            backgroundColor:
              activeTab === "with-jewellery" ? "#f3f4f6" : "transparent",
            color: activeTab === "with-jewellery" ? "#111827" : "#6b7280",
            fontSize: "14px",
            fontWeight: activeTab === "with-jewellery" ? "600" : "400",
            borderBottom:
              activeTab === "with-jewellery" ? "2px solid #3b82f6" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          With Jewellery
          <span
            style={{
              fontSize: "12px",
              backgroundColor:
                activeTab === "with-jewellery" ? "#dbeafe" : "#f3f4f6",
              color: activeTab === "with-jewellery" ? "#1e40af" : "#9ca3af",
              padding: "2px 8px",
              borderRadius: "12px",
              minWidth: "24px",
            }}
          >
            {stats.withJewellery}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("without-jewellery")}
          style={{
            flex: 1,
            padding: "12px 16px",
            border: "none",
            backgroundColor:
              activeTab === "without-jewellery" ? "#f3f4f6" : "transparent",
            color: activeTab === "without-jewellery" ? "#111827" : "#6b7280",
            fontSize: "14px",
            fontWeight: activeTab === "without-jewellery" ? "600" : "400",
            borderBottom:
              activeTab === "without-jewellery" ? "2px solid #3b82f6" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          Without Jewellery
          <span
            style={{
              fontSize: "12px",
              backgroundColor:
                activeTab === "without-jewellery" ? "#f3f4f6" : "#f3f4f6",
              color: activeTab === "without-jewellery" ? "#374151" : "#9ca3af",
              padding: "2px 8px",
              borderRadius: "12px",
              minWidth: "24px",
            }}
          >
            {stats.withoutJewellery}
          </span>
        </button>
      </div>

      {/* Bills List */}
      <div style={{ backgroundColor: "#f9fafb", minHeight: "400px" }}>
        {filteredBills.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#9ca3af",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>
              {activeTab === "all"
                ? "📄"
                : activeTab === "with-jewellery"
                  ? "🔗"
                  : "❌"}
            </div>
            <p style={{ marginBottom: "16px" }}>
              {activeTab === "all"
                ? "No bills found."
                : activeTab === "with-jewellery"
                  ? "No bills with linked jewellery."
                  : "All bills have linked jewellery."}
            </p>
            {activeTab === "all" && (
              <button
                onClick={() => navigate("/jewellery/bills/add")}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Add your first bill
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: "11px",
                color: "#6b7280",
                padding: "6px 12px 2px",
                textAlign: "right",
              }}
            >
              Showing {filteredBills.length}{" "}
              {activeTab === "all"
                ? "bills"
                : activeTab === "with-jewellery"
                  ? "bills with jewellery"
                  : "bills without jewellery"}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {filteredBills.map((bill) => (
                <div
                  key={bill.id}
                  style={{
                    backgroundColor: "white",
                    padding: "12px",
                    borderBottom: "1px solid #e5e7eb",
                    cursor: bill.hasLinkedJewellery ? "pointer" : "default",
                    borderLeft: bill.hasLinkedJewellery
                      ? "4px solid #3b82f6"
                      : "4px solid transparent",
                  }}
                  onClick={() =>
                    bill.hasLinkedJewellery &&
                    handleViewLinkedJewellery(bill.id)
                  }
                >
                  {/* Single Row Layout */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {/* Bill Info */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: "10px" }}>
                      <div
                        style={{
                          fontWeight: "500",
                          fontSize: "14px",
                          color: "#111827",
                          marginBottom: "4px",
                        }}
                      >
                        {bill.notes || "No notes"}
                      </div>

                      {/* Link Status Indicator */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "2px",
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "12px",
                            backgroundColor: bill.hasLinkedJewellery
                              ? "#dbeafe"
                              : "#f3f4f6",
                            color: bill.hasLinkedJewellery
                              ? "#1e40af"
                              : "#6b7280",
                          }}
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
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#9ca3af",
                            fontFamily: "monospace",
                          }}
                        >
                          {bill.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>

                    {/* Action Icons */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexShrink: 0,
                      }}
                    >
                      {/* View Linked Jewellery Button (only if has links) */}
                      {bill.hasLinkedJewellery && (
                        <button
                          onClick={() => handleViewLinkedJewellery(bill.id)}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "14px",
                            color: "#3b82f6",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            flexDirection: "column",
                          }}
                          title={`View ${bill.jewelleryCount} linked item${bill.jewelleryCount !== 1 ? "s" : ""}`}
                        >
                          <span>🔍</span>
                          <span style={{ fontSize: "9px", marginTop: "2px" }}>
                            {bill.jewelleryCount}
                          </span>
                        </button>
                      )}

                      {/* Edit Icon */}
                      <button
                        onClick={(e) => handleEditBill(e, bill.id)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "16px",
                          color: "#3b82f6",
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Edit Bill"
                      >
                        ✏️
                      </button>

                      {/* Delete Icon - Show warning if bill has linked jewellery */}
                      <button
                        onClick={(e) => {
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
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "16px",
                          color: bill.hasLinkedJewellery
                            ? "#f59e0b"
                            : "#ef4444",
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                        }}
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
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f8fafc",
                borderTop: "1px solid #e5e7eb",
                fontSize: "12px",
                color: "#64748b",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ fontWeight: "500" }}>Summary:</span>{" "}
                {stats.withJewellery} bills with jewellery,{" "}
                {stats.withoutJewellery} without
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      backgroundColor: "#3b82f6",
                      borderRadius: "50%",
                    }}
                  ></div>
                  <span>Has jewellery</span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      backgroundColor: "#d1d5db",
                      borderRadius: "50%",
                    }}
                  ></div>
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
