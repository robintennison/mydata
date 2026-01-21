import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jewelleryStyles } from "../styles/jewelleryStyles";
import JewelleryNavigation from "../components/JewelleryNavigation";
import { Jewellery, VerificationStatus } from "../models/types";

const VerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Jewellery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch jewellery items that need verification
    setTimeout(() => {
      const mockItems: Jewellery[] = [
        // Mock data - replace with actual data
      ];
      setItems(mockItems);
      setLoading(false);
    }, 1000);
  }, []);

  const handleVerify = (itemId: string, status: VerificationStatus) => {
    // TODO: Update verification status in Firebase
    setItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              verificationStatus: status,
              lastVerified: Date.now(),
            }
          : item,
      ),
    );
  };

  if (loading) {
    return (
      <div style={jewelleryStyles.container}>
        <div style={jewelleryStyles.loading}>
          <div style={jewelleryStyles.spinner}></div>
          <p>Loading verification list...</p>
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
        <div style={jewelleryStyles.navTitle}>Stock Verification</div>
        <div style={{ width: "40px" }}></div>
      </div>

      {/* Verification List */}
      <div style={{ padding: "15px" }}>
        {items.length === 0 ? (
          <div style={jewelleryStyles.emptyState}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>✅</div>
            <div>All items are verified!</div>
            <div style={{ fontSize: "0.9rem", marginTop: "5px" }}>
              No items need verification at this time.
            </div>
          </div>
        ) : (
          <div style={jewelleryStyles.tableContainer}>
            {/* Table Header */}
            <div style={jewelleryStyles.tableHeader}>
              <div style={jewelleryStyles.tableCell(4)}>Item</div>
              <div style={jewelleryStyles.tableCell(2)}>Status</div>
              <div style={jewelleryStyles.tableCell(2, "center")}>Actions</div>
            </div>

            {/* Table Rows */}
            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  style={jewelleryStyles.tableRow(index, item.active)}
                >
                  <div style={jewelleryStyles.tableCell(4)}>
                    <div
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        marginBottom: "2px",
                      }}
                    >
                      {item.code}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      {item.description}
                    </div>
                  </div>
                  <div style={jewelleryStyles.tableCell(2)}>
                    <div
                      style={jewelleryStyles.statusBadge(
                        item.verificationStatus,
                      )}
                    >
                      {item.verificationStatus}
                    </div>
                  </div>
                  <div
                    style={{
                      ...jewelleryStyles.tableCell(2, "center"),
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <button
                      onClick={() =>
                        handleVerify(item.id!, VerificationStatus.VERIFIED)
                      }
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#10b981",
                        border: "none",
                        borderRadius: "6px",
                        color: "#ffffff",
                        fontSize: "12px",
                        fontWeight: "500",
                        cursor: "pointer",
                      }}
                    >
                      Verify
                    </button>
                    <button
                      onClick={() =>
                        handleVerify(item.id!, VerificationStatus.MISSING)
                      }
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#ef4444",
                        border: "none",
                        borderRadius: "6px",
                        color: "#ffffff",
                        fontSize: "12px",
                        fontWeight: "500",
                        cursor: "pointer",
                      }}
                    >
                      Missing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <JewelleryNavigation />
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default VerificationPage;
