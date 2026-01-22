import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Jewellery,
  VerificationStatus,
  VerificationStatusType,
} from "../models/types";
import { jewelleryStyles } from "../styles/jewelleryStyles";
import JewelleryNavigation from "../components/JewelleryNavigation";

interface VerificationPageProps {
  jewelleryItems: Jewellery[];
  onUpdateVerification: (
    id: string,
    status: VerificationStatusType,
    notes?: string,
  ) => void;
  onBulkUpdate: (location: string, status: VerificationStatusType) => void;
}

const VerificationPage: React.FC<VerificationPageProps> = ({
  jewelleryItems,
  onUpdateVerification,
  onBulkUpdate,
}) => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Get unique locations
  const locations = Array.from(
    new Set(jewelleryItems.map((item) => item.location).filter(Boolean)),
  );

  // Get items for selected location
  const locationItems = selectedLocation
    ? jewelleryItems.filter((item) => item.location === selectedLocation)
    : jewelleryItems;

  // Filter by search term
  const filteredItems = searchTerm
    ? locationItems.filter(
        (item) =>
          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : locationItems;

  // Calculate total weight of filtered items
  const totalWeight = filteredItems.reduce(
    (sum, item) => sum + (item.weight || 0),
    0,
  );

  // Statistics
  const stats = {
    total: filteredItems.length,
    verified: filteredItems.filter(
      (item) => item.verificationStatus === VerificationStatus.VERIFIED,
    ).length,
    missing: filteredItems.filter(
      (item) => item.verificationStatus === VerificationStatus.MISSING,
    ).length,
    notVerified: filteredItems.filter(
      (item) => item.verificationStatus === VerificationStatus.NOT_VERIFIED,
    ).length,
  };

  // Handle quick status update
  const handleQuickUpdate = (id: string, status: VerificationStatusType) => {
    const itemNotes = notes[id] || "";
    onUpdateVerification(id, status, itemNotes);
    setNotes((prev) => ({ ...prev, [id]: "" }));
    setExpandedItem(null); // Collapse after update
  };

  // Handle bulk action for location
  const handleBulkAction = (status: VerificationStatusType) => {
    if (selectedLocation) {
      onBulkUpdate(selectedLocation, status);
    }
  };

  // Get status color
  const getStatusColor = (status: VerificationStatusType) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return "#10b981";
      case VerificationStatus.MISSING:
        return "#ef4444";
      case VerificationStatus.NOT_VERIFIED:
        return "#6b7280";
      default:
        return "#9ca3af";
    }
  };

  // Toggle item expansion
  const toggleExpand = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  // Compact status badge
  const StatusBadge = ({ status }: { status: VerificationStatusType }) => (
    <div
      style={{
        backgroundColor: getStatusColor(status),
        color: "white",
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "10px",
        fontWeight: "600",
        minWidth: "60px",
        textAlign: "center",
      }}
    >
      {status === VerificationStatus.VERIFIED
        ? "✓"
        : status === VerificationStatus.MISSING
          ? "✗"
          : "⟲"}{" "}
      {status.split(" ")[0]}
    </div>
  );

  // Quick action button
  const QuickActionButton = ({
    itemId,
    status,
    currentStatus,
  }: {
    itemId: string;
    status: VerificationStatusType;
    currentStatus: VerificationStatusType;
  }) => {
    const isActive = currentStatus === status;
    const config = {
      [VerificationStatus.VERIFIED]: {
        bg: isActive ? "#10b981" : "#d1fae5",
        color: isActive ? "white" : "#065f46",
        symbol: "✓",
      },
      [VerificationStatus.MISSING]: {
        bg: isActive ? "#ef4444" : "#fee2e2",
        color: isActive ? "white" : "#991b1b",
        symbol: "✗",
      },
      [VerificationStatus.NOT_VERIFIED]: {
        bg: isActive ? "#6b7280" : "#f3f4f6",
        color: isActive ? "white" : "#374151",
        symbol: "⟲",
      },
    }[status];

    return (
      <button
        onClick={() => handleQuickUpdate(itemId, status)}
        style={{
          padding: "6px 8px",
          backgroundColor: config.bg,
          color: config.color,
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: "600",
          flex: 1,
          minWidth: "60px",
        }}
        title={status}
      >
        {config.symbol}
      </button>
    );
  };

  return (
    <div style={jewelleryStyles.container}>
      {/* Header with back button */}
      <div style={jewelleryStyles.topNav}>
        <button
          onClick={() => navigate("/jewellery")}
          style={jewelleryStyles.navButton}
          title="Back to Jewellery"
        >
          ←
        </button>
        <div style={jewelleryStyles.navTitle}>Verification</div>
        <div style={{ width: "40px" }}></div>
      </div>

      {/* ALL CONTENT INSIDE SCROLLABLE WRAPPER */}
      <div style={jewelleryStyles.contentWrapper}>
        <div style={{ padding: "10px 0" }}>
          {/* Compact Stats Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "11px", color: "#6b7280" }}>Total</div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginTop: "4px",
                }}
              >
                {stats.total}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "11px", color: "#6b7280" }}>Verified</div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#10b981",
                  marginTop: "4px",
                }}
              >
                {stats.verified}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "11px", color: "#6b7280" }}>Missing</div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#ef4444",
                  marginTop: "4px",
                }}
              >
                {stats.missing}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "11px", color: "#6b7280" }}>Weight</div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#3b82f6",
                  marginTop: "4px",
                }}
              >
                {totalWeight.toFixed(1)}g
              </div>
            </div>
          </div>

          {/* Search and Filter Row */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "14px",
              }}
            />

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                backgroundColor: "white",
                fontSize: "14px",
                minWidth: "120px",
              }}
            >
              <option value="">All</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location.length > 10
                    ? location.substring(0, 8) + "..."
                    : location}
                </option>
              ))}
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedLocation && (
            <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
              <button
                onClick={() => handleBulkAction(VerificationStatus.VERIFIED)}
                style={{
                  flex: 1,
                  padding: "8px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                ✓ All Verified
              </button>
              <button
                onClick={() =>
                  handleBulkAction(VerificationStatus.NOT_VERIFIED)
                }
                style={{
                  flex: 1,
                  padding: "8px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                ⟲ Reset All
              </button>
            </div>
          )}

          {/* Items Count */}
          <div
            style={{
              marginBottom: "8px",
              color: "#6b7280",
              fontSize: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
              {selectedLocation && ` in ${selectedLocation}`}
            </span>
            <span style={{ fontWeight: "500" }}>
              {totalWeight.toFixed(1)}g total
            </span>
          </div>

          {/* Compact Items List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {filteredItems.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px",
                  color: "#9ca3af",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                No items found{searchTerm ? " matching your search" : ""}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "10px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  {/* Compact Header Row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "600",
                            fontSize: "14px",
                            color: "#111827",
                          }}
                        >
                          {item.code}
                        </div>
                        <StatusBadge status={item.verificationStatus} />
                      </div>

                      <div
                        style={{
                          color: "#6b7280",
                          fontSize: "12px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.description}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          marginTop: "4px",
                          fontSize: "11px",
                          color: "#9ca3af",
                        }}
                      >
                        <span>{item.weight}g</span>
                        {item.location && (
                          <span
                            style={{
                              backgroundColor: "#f3f4f6",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {item.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        color: "#9ca3af",
                        fontSize: "16px",
                        marginLeft: "8px",
                      }}
                    >
                      {expandedItem === item.id ? "▲" : "▼"}
                    </div>
                  </div>

                  {/* Expandable Content */}
                  {expandedItem === item.id && (
                    <div
                      style={{
                        marginTop: "10px",
                        borderTop: "1px solid #f3f4f6",
                        paddingTop: "10px",
                      }}
                    >
                      {/* Quick Actions */}
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          marginBottom: "10px",
                        }}
                      >
                        <QuickActionButton
                          itemId={item.id}
                          status={VerificationStatus.VERIFIED}
                          currentStatus={item.verificationStatus}
                        />
                        <QuickActionButton
                          itemId={item.id}
                          status={VerificationStatus.MISSING}
                          currentStatus={item.verificationStatus}
                        />
                        <QuickActionButton
                          itemId={item.id}
                          status={VerificationStatus.NOT_VERIFIED}
                          currentStatus={item.verificationStatus}
                        />
                      </div>

                      {/* Notes Input */}
                      <textarea
                        placeholder="Add notes..."
                        value={notes[item.id] || ""}
                        onChange={(e) =>
                          setNotes((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid #e5e7eb",
                          fontSize: "12px",
                          minHeight: "50px",
                          resize: "vertical",
                          marginBottom: "8px",
                        }}
                      />

                      {/* Last verified info */}
                      {item.lastVerified > 0 && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#9ca3af",
                            textAlign: "right",
                          }}
                        >
                          Verified:{" "}
                          {new Date(item.lastVerified).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Jewellery Navigation */}
        <JewelleryNavigation />

        {/* Bottom spacing */}
        <div style={{ height: "80px" }}></div>
      </div>
    </div>
  );
};

export default VerificationPage;
