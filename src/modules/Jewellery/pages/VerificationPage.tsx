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
  const navigate = useNavigate(); // Keep this for navigation
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");

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

  return (
    <div style={jewelleryStyles.container}>
      {/* Header with back button using navigate */}
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

      <div style={{ padding: "15px" }}>
        <div style={jewelleryStyles.statsCard}>
          <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>
            Verification Status
          </h3>
          <div style={jewelleryStyles.statsGrid}>
            <div style={jewelleryStyles.statItem}>
              <div style={jewelleryStyles.statLabel}>Verified</div>
              <div style={{ ...jewelleryStyles.statValue, color: "#10b981" }}>
                {stats.verified}
              </div>
            </div>
            <div style={jewelleryStyles.statItem}>
              <div style={jewelleryStyles.statLabel}>Missing</div>
              <div style={{ ...jewelleryStyles.statValue, color: "#ef4444" }}>
                {stats.missing}
              </div>
            </div>
            <div style={jewelleryStyles.statItem}>
              <div style={jewelleryStyles.statLabel}>Not Verified</div>
              <div style={{ ...jewelleryStyles.statValue, color: "#6b7280" }}>
                {stats.notVerified}
              </div>
            </div>
          </div>
        </div>

        {/* Location Filter */}
        <div style={{ marginTop: "15px", marginBottom: "15px" }}>
          <label
            style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}
          >
            Filter by Location:
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              backgroundColor: "white",
            }}
          >
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div style={{ marginBottom: "15px" }}>
          <input
            type="text"
            placeholder="Search by code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />
        </div>

        {/* Bulk Actions */}
        {selectedLocation && (
          <div
            style={{
              marginBottom: "15px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => handleBulkAction(VerificationStatus.VERIFIED)}
              style={{
                padding: "10px 15px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                flex: 1,
                minWidth: "200px",
              }}
            >
              Mark All in {selectedLocation} as Verified
            </button>
            <button
              onClick={() => handleBulkAction(VerificationStatus.NOT_VERIFIED)}
              style={{
                padding: "10px 15px",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                flex: 1,
                minWidth: "200px",
              }}
            >
              Reset All in {selectedLocation}
            </button>
          </div>
        )}

        {/* Items Count */}
        <div
          style={{ marginBottom: "10px", color: "#6b7280", fontSize: "14px" }}
        >
          Showing {filteredItems.length} item
          {filteredItems.length !== 1 ? "s" : ""}
          {selectedLocation && ` in ${selectedLocation}`}
        </div>

        {/* Items List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#9ca3af",
                backgroundColor: "white",
                borderRadius: "12px",
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
                  borderRadius: "12px",
                  padding: "15px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "16px" }}>
                      {item.code}
                    </div>
                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: "14px",
                        marginTop: "4px",
                      }}
                    >
                      {item.description}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "15px",
                        marginTop: "8px",
                        fontSize: "13px",
                      }}
                    >
                      <span>Weight: {item.weight}g</span>
                      {item.location && <span>Location: {item.location}</span>}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    style={{
                      backgroundColor: getStatusColor(item.verificationStatus),
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {item.verificationStatus}
                  </div>
                </div>

                {/* Verification Actions */}
                <div style={{ marginTop: "15px" }}>
                  {/* Notes Input */}
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
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      marginBottom: "10px",
                      fontSize: "14px",
                      minHeight: "60px",
                    }}
                  />

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() =>
                        handleQuickUpdate(item.id, VerificationStatus.VERIFIED)
                      }
                      style={{
                        flex: 1,
                        padding: "10px",
                        backgroundColor:
                          item.verificationStatus ===
                          VerificationStatus.VERIFIED
                            ? "#10b981"
                            : "#d1fae5",
                        color:
                          item.verificationStatus ===
                          VerificationStatus.VERIFIED
                            ? "white"
                            : "#065f46",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      ✓ Verified
                    </button>

                    <button
                      onClick={() =>
                        handleQuickUpdate(item.id, VerificationStatus.MISSING)
                      }
                      style={{
                        flex: 1,
                        padding: "10px",
                        backgroundColor:
                          item.verificationStatus === VerificationStatus.MISSING
                            ? "#ef4444"
                            : "#fee2e2",
                        color:
                          item.verificationStatus === VerificationStatus.MISSING
                            ? "white"
                            : "#991b1b",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      ✗ Missing
                    </button>

                    <button
                      onClick={() =>
                        handleQuickUpdate(
                          item.id,
                          VerificationStatus.NOT_VERIFIED,
                        )
                      }
                      style={{
                        flex: 1,
                        padding: "10px",
                        backgroundColor:
                          item.verificationStatus ===
                          VerificationStatus.NOT_VERIFIED
                            ? "#6b7280"
                            : "#f3f4f6",
                        color:
                          item.verificationStatus ===
                          VerificationStatus.NOT_VERIFIED
                            ? "white"
                            : "#374151",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      ⟲ Reset
                    </button>
                  </div>
                </div>

                {/* Last verified info */}
                {item.lastVerified > 0 && (
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "12px",
                      color: "#9ca3af",
                    }}
                  >
                    Last verified:{" "}
                    {new Date(item.lastVerified).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
