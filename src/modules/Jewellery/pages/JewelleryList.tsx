import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jewelleryStyles } from "../styles/jewelleryStyles";
import JewelleryNavigation from "../components/JewelleryNavigation";
import { Jewellery } from "../models/types";
import { useJewellerySettings } from "../hooks/useSettingsData";

const JewelleryList: React.FC = () => {
  const navigate = useNavigate();
  const { showInactive, showDelete } = useJewellerySettings();
  const [jewelleryItems, setJewelleryItems] = useState<Jewellery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Jewellery | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with actual Firebase data
  useEffect(() => {
    setTimeout(() => {
      const mockData: Jewellery[] = [
        {
          id: "1",
          code: "G001",
          description: "Gold Chain",
          weight: 25.5,
          location: "Locker",
          boughtFor: "Robin",
          purchaseDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
          imageUrl: "",
          active: true,
          lastVerified: Date.now(),
          verificationStatus: "Verified",
          verificationNotes: "Verified on 15th Dec",
        },
        {
          id: "2",
          code: "G002",
          description: "Diamond Ring",
          weight: 8.2,
          location: "Home",
          boughtFor: "Sheela",
          purchaseDate: Date.now() - 60 * 24 * 60 * 60 * 1000,
          imageUrl: "",
          active: true,
          lastVerified: Date.now() - 7 * 24 * 60 * 60 * 1000,
          verificationStatus: "Missing",
          verificationNotes: "Not found in locker",
        },
        {
          id: "3",
          code: "S001",
          description: "Silver Bracelet",
          weight: 45.0,
          location: "Bank",
          boughtFor: "Family",
          purchaseDate: Date.now() - 90 * 24 * 60 * 60 * 1000,
          imageUrl: "",
          active: true,
          lastVerified: 0,
          verificationStatus: "Not Verified",
          verificationNotes: "",
        },
        {
          id: "4",
          code: "G003",
          description: "Old Gold Necklace",
          weight: 15.0,
          location: "Locker",
          boughtFor: "Robin",
          purchaseDate: Date.now() - 120 * 24 * 60 * 60 * 1000,
          imageUrl: "",
          active: false, // Inactive item
          lastVerified: Date.now(),
          verificationStatus: "Verified",
          verificationNotes: "Sold but kept record",
        },
      ];
      setJewelleryItems(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter items based on search and showInactive setting
  const filteredItems = jewelleryItems.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());

    // If showInactive is false, hide inactive items
    if (!showInactive && !item.active) {
      return false;
    }

    return matchesSearch;
  });

  // Sort by active status (active first), then by code
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    return a.code.localeCompare(b.code);
  });

  const handleDelete = (id: string) => {
    // TODO: Implement Firebase delete
    setJewelleryItems(jewelleryItems.filter((item) => item.id !== id));
    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleDateString();
  };

  const calculateTotalWeight = () => {
    return filteredItems
      .filter((item) => item.active) // Only count active items for total weight
      .reduce((total, item) => total + item.weight, 0)
      .toFixed(1);
  };

  const calculateEstimatedValue = (weight: number): string => {
    // TODO: Use actual gold rate from settings
    const goldRatePerGram = 6000; // Replace with settings.goldRate
    const estimatedValue = weight * goldRatePerGram;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(estimatedValue);
  };

  // Count stats
  const activeCount = jewelleryItems.filter((item) => item.active).length;
  const inactiveCount = jewelleryItems.filter((item) => !item.active).length;
  const verifiedCount = jewelleryItems.filter(
    (item) => item.verificationStatus === "Verified",
  ).length;

  if (loading) {
    return (
      <div style={jewelleryStyles.container}>
        <div style={jewelleryStyles.loading}>
          <div style={jewelleryStyles.spinner}></div>
          <p>Loading jewellery items...</p>
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
        <div style={jewelleryStyles.navTitle}>Jewellery Items</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate("/settings")}
            style={{
              ...jewelleryStyles.navButton,
              padding: "6px 10px",
              fontSize: "1.2rem",
            }}
            title="Settings"
          >
            ⚙️
          </button>
          <button
            onClick={() => navigate("/jewellery/add")}
            style={jewelleryStyles.navButton}
            title="Add Jewellery"
          >
            +
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div
        style={{
          display: "flex",
          padding: "10px 15px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e9ecef",
          fontSize: "12px",
          color: "#6b7280",
          justifyContent: "space-between",
        }}
      >
        <div>
          Active:{" "}
          <span style={{ fontWeight: "600", color: "#10b981" }}>
            {activeCount}
          </span>
        </div>
        <div>
          Verified:{" "}
          <span style={{ fontWeight: "600", color: "#3b82f6" }}>
            {verifiedCount}
          </span>
        </div>
        <div>
          Inactive:{" "}
          <span style={{ fontWeight: "600", color: "#ef4444" }}>
            {inactiveCount}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ padding: "15px" }}>
        <input
          type="text"
          placeholder="Search by code, description or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            ...jewelleryStyles.input,
            padding: "12px 40px 12px 12px",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "12px center",
            backgroundSize: "16px",
          }}
        />
      </div>

      {/* Jewellery List */}
      <div style={{ padding: "0 15px" }}>
        {sortedItems.length === 0 ? (
          <div style={jewelleryStyles.emptyState}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>💎</div>
            <div>No jewellery items found</div>
            <div style={{ fontSize: "0.9rem", marginTop: "5px" }}>
              {searchTerm ? "Try a different search" : 'Tap "+" to add an item'}
            </div>
            {!showInactive && inactiveCount > 0 && (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#9ca3af",
                  marginTop: "10px",
                }}
              >
                {inactiveCount} inactive items hidden. Enable in Settings.
              </div>
            )}
          </div>
        ) : (
          <div style={jewelleryStyles.tableContainer}>
            {/* Table Header */}
            <div style={jewelleryStyles.tableHeader}>
              <div style={jewelleryStyles.tableCell(3)}>Item</div>
              <div style={jewelleryStyles.tableCell(2, "right")}>Weight</div>
              <div style={jewelleryStyles.tableCell(2)}>Status</div>
              <div style={jewelleryStyles.tableCell(1, "center")}>Actions</div>
            </div>

            {/* Table Rows */}
            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {sortedItems.map((item, index) => (
                <div
                  key={item.id}
                  style={jewelleryStyles.tableRow(index, item.active)}
                >
                  <div style={jewelleryStyles.tableCell(3)}>
                    <div style={{ display: "flex", alignItems: "flex-start" }}>
                      {!item.active && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#ef4444",
                            backgroundColor: "#fef2f2",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            marginRight: "8px",
                            marginTop: "2px",
                          }}
                        >
                          INACTIVE
                        </div>
                      )}
                      <div>
                        <div
                          style={{
                            fontWeight: "500",
                            color: item.active ? "#1e293b" : "#6c757d",
                            fontSize: "14px",
                            marginBottom: "2px",
                            textDecoration: !item.active
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {item.code}
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
                          {item.description}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#9ca3af",
                            marginTop: "2px",
                          }}
                        >
                          {item.location} • {item.boughtFor}
                        </div>
                        {item.active && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#10b981",
                              marginTop: "2px",
                              fontWeight: "500",
                            }}
                          >
                            {calculateEstimatedValue(item.weight)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={jewelleryStyles.tableCell(2, "right")}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: item.active ? "#4285f4" : "#6c757d",
                      }}
                    >
                      {item.weight}g
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
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        marginTop: "2px",
                      }}
                    >
                      {formatDate(item.lastVerified)}
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
                      onClick={() => navigate(`/jewellery/edit/${item.id}`)}
                      style={{
                        ...jewelleryStyles.actionButton,
                        ...jewelleryStyles.editButton,
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    {showDelete && (
                      <button
                        onClick={() => {
                          setItemToDelete(item);
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
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Stats */}
            <div
              style={{
                padding: "12px 15px",
                backgroundColor: "#f3f4f6",
                borderTop: "2px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  {sortedItems.length} items shown
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    marginTop: "1px",
                  }}
                >
                  ({activeCount} active, {inactiveCount} inactive)
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#64748b",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Total Weight
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#4285f4",
                  }}
                >
                  {calculateTotalWeight()}g
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && itemToDelete && showDelete && (
        <div style={jewelleryStyles.dialogOverlay}>
          <div style={jewelleryStyles.dialog}>
            <h3 style={jewelleryStyles.dialogTitle}>Delete Jewellery Item?</h3>
            <p style={jewelleryStyles.dialogMessage}>
              Are you sure you want to delete{" "}
              <span style={{ fontWeight: "600" }}>{itemToDelete.code}</span> -{" "}
              {itemToDelete.description}? This action cannot be undone.
            </p>
            <div style={jewelleryStyles.dialogButtons}>
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setItemToDelete(null);
                }}
                style={jewelleryStyles.dialogButton(true)}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(itemToDelete.id!)}
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

export default JewelleryList;
