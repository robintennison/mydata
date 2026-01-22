import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { jewelleryStyles } from "../styles/jewelleryStyles";
import JewelleryNavigation from "../components/JewelleryNavigation";

interface Bill {
  id: string;
  notes?: string;
}

const BillsList: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const db = getFirestore();
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

        setBills(billsList);
      } catch (error: any) {
        console.error("Error fetching bills:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
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
              {bills.length} bills
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  style={{
                    backgroundColor: "white",
                    padding: "12px",
                    borderBottom: "1px solid #e5e7eb",
                    cursor: "pointer",
                  }}
                  onClick={() => handleViewLinkedJewellery(bill.id)}
                >
                  {/* Single Row Layout */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {/* Bill Notes */}
                    <div
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#111827",
                        flex: 1,
                        minWidth: 0,
                        paddingRight: "10px",
                      }}
                    >
                      {bill.notes || "No notes"}
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

                      {/* Delete Icon */}
                      <button
                        onClick={(e) => handleDeleteBill(e, bill.id)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "16px",
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Delete Bill"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <JewelleryNavigation />
      <div style={{ height: "5px" }}></div>
    </div>
  );
};

export default BillsList;
