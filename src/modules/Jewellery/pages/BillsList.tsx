import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { jewelleryStyles } from "../styles/jewelleryStyles";

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
      <div style={jewelleryStyles.container}>
        <div style={jewelleryStyles.loading}>
          <div style={jewelleryStyles.spinner}></div>
          <p>Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={jewelleryStyles.container}>
      {/* Top Navigation */}
      <div style={jewelleryStyles.topNav}>
        <button
          onClick={() => navigate("/jewellery")}
          style={jewelleryStyles.navButton}
          title="Back to Jewellery"
        >
          ←
        </button>
        <div style={jewelleryStyles.navTitle}>Bills</div>
        <button
          onClick={() => navigate("/jewellery/bills/add")}
          style={{
            ...jewelleryStyles.navButton,
            padding: "6px 12px",
            fontSize: "14px",
          }}
          title="Add New Bill"
        >
          + Add
        </button>
      </div>

      {/* Bills List */}
      <div style={jewelleryStyles.contentWrapper}>
        {bills.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#9ca3af",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
            <p style={{ marginBottom: "16px" }}>No bills found.</p>
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
              {bills.length} bills •{" "}
              {bills.filter((b) => b.hasLinkedJewellery).length} with jewellery
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {bills.map((bill) => (
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
                {bills.filter((b) => b.hasLinkedJewellery).length} bills with
                jewellery, {bills.filter((b) => !b.hasLinkedJewellery).length}{" "}
                without
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

      <div style={{ height: "5px" }}></div>
    </div>
  );
};

export default BillsList;
