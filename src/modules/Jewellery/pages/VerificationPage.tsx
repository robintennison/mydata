import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Jewellery,
  VerificationStatus,
  VerificationStatusType,
} from "../models/types";
import { jewelleryStyles } from "../styles/jewelleryStyles";

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
    setExpandedItem(null);
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

  // Toggle item expansion for notes
  const toggleExpand = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  // Small verification button
  const SmallVerificationButton = ({
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
        text: "✓",
      },
      [VerificationStatus.MISSING]: {
        bg: isActive ? "#ef4444" : "#fee2e2",
        color: isActive ? "white" : "#991b1b",
        text: "✗",
      },
      [VerificationStatus.NOT_VERIFIED]: {
        bg: isActive ? "#6b7280" : "#f3f4f6",
        color: isActive ? "white" : "#374151",
        text: "⟲",
      },
    }[status];

    return (
      <button
        onClick={() => handleQuickUpdate(itemId, status)}
        style={{
          padding: "4px 6px",
          backgroundColor: config.bg,
          color: config.color,
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "10px",
          fontWeight: "600",
          minWidth: "28px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title={status}
      >
        {config.text}
      </button>
    );
  };

  // Format boughtFor name (truncate if too long)
  const formatBoughtFor = (boughtFor?: string) => {
    if (!boughtFor) return "N/A";
    if (boughtFor.length > 10) {
      return boughtFor.substring(0, 8) + "...";
    }
    return boughtFor;
  };

  // Format status text for display
  const formatStatusText = (status: VerificationStatusType) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return "✓";
      case VerificationStatus.MISSING:
        return "✗";
      case VerificationStatus.NOT_VERIFIED:
        return "⟲";
      default:
        return "?";
    }
  };

  // Truncate description to 25 characters
  const truncateDescription = (description: string) => {
    if (description.length > 25) {
      return description.substring(0, 23) + "...";
    }
    return description;
  };

  return (
    <div style={jewelleryStyles.container}>
      {/* Header */}
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

      {/* Content */}
      <div style={jewelleryStyles.contentWrapper}>
        <div style={{ padding: "10px 0" }}>
          {/* Stats Grid */}
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

          {/* Search and Location in Single Row */}
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
                width: "140px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                backgroundColor: "white",
                fontSize: "14px",
              }}
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location.length > 12
                    ? location.substring(0, 10) + "..."
                    : location}
                </option>
              ))}
            </select>
          </div>

          {/* Bulk Actions - Only show when location is selected */}
          {selectedLocation && (
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginBottom: "12px",
              }}
            >
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
                ✓ Mark All as Verified
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

          {/* Items List - Ultra compact layout */}
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
                    padding: "6px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* Single Row Layout - Ultra compact */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    {/* Image - Even smaller */}
                    <div
                      style={{
                        width: "45px",
                        height: "45px",
                        flexShrink: 0,
                        backgroundColor: "#f3f4f6",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.code}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            color: "#9ca3af",
                            fontSize: "9px",
                            textAlign: "center",
                            padding: "2px",
                          }}
                        >
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Content - Ultra compact two lines */}
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minWidth: 0,
                        gap: "4px",
                      }}
                    >
                      {/* First Line: Code, Weight, Description (truncated) */}
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            marginBottom: "2px",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "600",
                              fontSize: "12px",
                              color: "#111827",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "70px",
                            }}
                          >
                            {item.code}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#6b7280",
                              fontWeight: "500",
                              whiteSpace: "nowrap",
                              backgroundColor: "#f3f4f6",
                              padding: "1px 4px",
                              borderRadius: "3px",
                            }}
                          >
                            {item.weight}g
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#6b7280",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              flex: 1,
                              maxWidth: "120px",
                            }}
                            title={item.description}
                          >
                            {truncateDescription(item.description)}
                          </div>
                        </div>
                      </div>

                      {/* Second Line: Location, Bought For, Status, Verification Buttons, Notes Arrow */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "9px",
                        }}
                      >
                        {/* Location */}
                        <div
                          style={{
                            backgroundColor: "#f3f4f6",
                            padding: "2px 5px",
                            borderRadius: "3px",
                            color: "#4b5563",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "50px",
                          }}
                          title={item.location || "No Location"}
                        >
                          {item.location
                            ? item.location.length > 6
                              ? item.location.substring(0, 5) + ".."
                              : item.location
                            : "No Loc"}
                        </div>

                        {/* Bought For */}
                        <div
                          style={{
                            backgroundColor: "#e0f2fe",
                            padding: "2px 5px",
                            borderRadius: "3px",
                            color: "#0369a1",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "50px",
                          }}
                          title={item.boughtFor || "N/A"}
                        >
                          {formatBoughtFor(item.boughtFor)}
                        </div>

                        {/* Current Status - Just icon */}
                        <div
                          style={{
                            backgroundColor: getStatusColor(
                              item.verificationStatus,
                            ),
                            color: "white",
                            padding: "2px 4px",
                            borderRadius: "3px",
                            fontSize: "8px",
                            fontWeight: "600",
                            whiteSpace: "nowrap",
                          }}
                          title={item.verificationStatus}
                        >
                          {formatStatusText(item.verificationStatus)}
                        </div>

                        {/* Verification Buttons - Extra compact */}
                        <div
                          style={{
                            display: "flex",
                            gap: "2px",
                            marginLeft: "auto",
                          }}
                        >
                          <SmallVerificationButton
                            itemId={item.id}
                            status={VerificationStatus.VERIFIED}
                            currentStatus={item.verificationStatus}
                          />
                          <SmallVerificationButton
                            itemId={item.id}
                            status={VerificationStatus.MISSING}
                            currentStatus={item.verificationStatus}
                          />
                          <SmallVerificationButton
                            itemId={item.id}
                            status={VerificationStatus.NOT_VERIFIED}
                            currentStatus={item.verificationStatus}
                          />
                        </div>

                        {/* Notes Arrow - Smaller */}
                        <button
                          onClick={() => toggleExpand(item.id)}
                          style={{
                            backgroundColor: "#f3f4f6",
                            color: "#6b7280",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontSize: "9px",
                            fontWeight: "600",
                            width: "18px",
                            height: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            flexShrink: 0,
                          }}
                          title="Add verification notes"
                        >
                          {expandedItem === item.id ? "▲" : "▼"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section (expanded) */}
                  {expandedItem === item.id && (
                    <div
                      style={{
                        marginTop: "6px",
                        borderTop: "1px solid #f3f4f6",
                        paddingTop: "6px",
                      }}
                    >
                      <textarea
                        placeholder="Add verification notes..."
                        value={notes[item.id] || ""}
                        onChange={(e) =>
                          setNotes((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "6px",
                          borderRadius: "4px",
                          border: "1px solid #e5e7eb",
                          fontSize: "11px",
                          minHeight: "40px",
                          resize: "vertical",
                          marginBottom: "6px",
                        }}
                      />

                      <div
                        style={{ display: "flex", justifyContent: "flex-end" }}
                      >
                        <button
                          onClick={() => {
                            onUpdateVerification(
                              item.id,
                              item.verificationStatus,
                              notes[item.id] || "",
                            );
                            setExpandedItem(null);
                          }}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: "500",
                          }}
                        >
                          Save Notes
                        </button>
                      </div>

                      {/* Last verified info */}
                      {item.lastVerified > 0 && (
                        <div
                          style={{
                            fontSize: "9px",
                            color: "#9ca3af",
                            textAlign: "right",
                            marginTop: "4px",
                          }}
                        >
                          Last verified:{" "}
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

        <div style={{ height: "80px" }}></div>
      </div>
    </div>
  );
};

export default VerificationPage;
