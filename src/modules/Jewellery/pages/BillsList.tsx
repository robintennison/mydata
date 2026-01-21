import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jewelleryStyles } from "../styles/jewelleryStyles";
import JewelleryNavigation from "../components/JewelleryNavigation";
import { Bill } from "../models/types";

const BillsList: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);

  useEffect(() => {
    setTimeout(() => {
      const mockBills: Bill[] = [
        {
          id: "1",
          downloadUrl: "https://example.com/bill1.pdf",
          mimeType: "application/pdf",
          createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
          notes: "Gold chain purchase",
        },
        {
          id: "2",
          downloadUrl: "https://example.com/bill2.jpg",
          mimeType: "image/jpeg",
          createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
          notes: "Diamond ring invoice",
        },
        {
          id: "3",
          downloadUrl: "https://example.com/bill3.pdf",
          mimeType: "application/pdf",
          createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
          notes: "Silver bracelet",
        },
      ];
      setBills(mockBills);
      setLoading(false);
    }, 1000);
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/pdf") return "📄";
    if (mimeType.startsWith("image/")) return "🖼️";
    return "📎";
  };

  const handleDelete = (id: string) => {
    // TODO: Implement Firebase delete
    setBills(bills.filter((bill) => bill.id !== id));
    setShowDeleteDialog(false);
    setBillToDelete(null);
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
        <div style={jewelleryStyles.navTitle}>Bills & Documents</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate("/jewellery/bills/add")}
            style={jewelleryStyles.navButton}
            title="Add Bill"
          >
            +
          </button>
        </div>
      </div>

      {/* Bills List */}
      <div style={{ padding: "15px" }}>
        {bills.length === 0 ? (
          <div style={jewelleryStyles.emptyState}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📄</div>
            <div>No bills found</div>
            <div style={{ fontSize: "0.9rem", marginTop: "5px" }}>
              Tap "+" to add a bill or document
            </div>
          </div>
        ) : (
          <div style={jewelleryStyles.tableContainer}>
            {/* Table Header */}
            <div style={jewelleryStyles.tableHeader}>
              <div style={jewelleryStyles.tableCell(1)}>Type</div>
              <div style={jewelleryStyles.tableCell(4)}>Notes</div>
              <div style={jewelleryStyles.tableCell(2)}>Date</div>
              <div style={jewelleryStyles.tableCell(1, "center")}>Actions</div>
            </div>

            {/* Table Rows */}
            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {bills.map((bill, index) => (
                <div
                  key={bill.id}
                  style={jewelleryStyles.tableRow(index, true)}
                >
                  <div
                    style={{
                      ...jewelleryStyles.tableCell(1),
                      fontSize: "1.5rem",
                    }}
                  >
                    {getFileIcon(bill.mimeType)}
                  </div>
                  <div style={jewelleryStyles.tableCell(4)}>
                    <div
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        marginBottom: "2px",
                      }}
                    >
                      {bill.notes || "No notes"}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {bill.mimeType}
                    </div>
                  </div>
                  <div style={jewelleryStyles.tableCell(2)}>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#374151",
                      }}
                    >
                      {formatDate(bill.createdAt)}
                    </div>
                  </div>
                  <div
                    style={{
                      ...jewelleryStyles.tableCell(1, "center"),
                      display: "flex",
                      gap: "4px",
                    }}
                  >
                    <button
                      onClick={() => window.open(bill.downloadUrl, "_blank")}
                      style={{
                        ...jewelleryStyles.actionButton,
                        color: "#10b981",
                        backgroundColor: "#f0fdf4",
                      }}
                      title="View"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/jewellery/bills/edit/${bill.id}`)
                      }
                      style={{
                        ...jewelleryStyles.actionButton,
                        ...jewelleryStyles.editButton,
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        setBillToDelete(bill);
                        setShowDeleteDialog(true);
                      }}
                      style={{
                        ...jewelleryStyles.actionButton,
                        ...jewelleryStyles.deleteButton,
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "12px 15px",
                backgroundColor: "#f3f4f6",
                borderTop: "2px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                {bills.length} document{bills.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && billToDelete && (
        <div style={jewelleryStyles.dialogOverlay}>
          <div style={jewelleryStyles.dialog}>
            <h3 style={jewelleryStyles.dialogTitle}>Delete Bill?</h3>
            <p style={jewelleryStyles.dialogMessage}>
              Are you sure you want to delete this bill?
              {billToDelete.notes && (
                <>
                  <br />
                  <span style={{ fontWeight: "600" }}>
                    {billToDelete.notes}
                  </span>
                </>
              )}
            </p>
            <div style={jewelleryStyles.dialogButtons}>
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setBillToDelete(null);
                }}
                style={jewelleryStyles.dialogButton(true)}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(billToDelete.id!)}
                style={jewelleryStyles.dialogButton(false)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <JewelleryNavigation />
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default BillsList;
