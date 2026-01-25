import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { Jewellery, VerificationStatusType } from "../models/types";

// Define VerificationStatus locally
const VerificationStatus = {
  VERIFIED: "Verified",
  MISSING: "Missing",
  NOT_VERIFIED: "Not Verified",
} as const;

interface VerificationTabProps {
  compact?: boolean;
}

const VerificationTab: React.FC<VerificationTabProps> = ({
  compact = false,
}) => {
  const navigate = useNavigate();
  const [jewelleryItems, setJewelleryItems] = useState<Jewellery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeUpdate, setActiveUpdate] = useState<string | null>(null);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState<Record<string, string>>({});

  // Fetch jewellery items
  useEffect(() => {
    const fetchJewellery = async () => {
      try {
        const db = getFirestore();
        const jewelleryRef = collection(db, "jewellery");
        const snapshot = await getDocs(jewelleryRef);

        const items: Jewellery[] = [];
        snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          const item: Jewellery = {
            id: doc.id,
            code: data.code || "",
            description: data.description || "",
            weight: data.weight || 0,
            location: data.location || "",
            boughtFor: data.boughtFor || "",
            purchaseDate: data.purchaseDate || 0,
            imageUrl: data.imageUrl || "",
            active: data.active !== false,
            billId: data.billId,
            lastVerified: data.lastVerified || 0,
            verificationStatus:
              data.verificationStatus || VerificationStatus.NOT_VERIFIED,
            verificationNotes: data.verificationNotes || "",
          };

          items.push(item);
        });

        setJewelleryItems(items);
      } catch (error) {
        console.error("Error fetching jewellery:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJewellery();
  }, []);

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

  // Filter to only show active items that need verification
  const itemsNeedingVerification = filteredItems.filter(
    (item) =>
      item.active && item.verificationStatus !== VerificationStatus.VERIFIED,
  );

  // Statistics
  const stats = {
    totalItems: filteredItems.length,
    verified: filteredItems.filter(
      (item) =>
        item.verificationStatus === VerificationStatus.VERIFIED && item.active,
    ).length,
    missing: filteredItems.filter(
      (item) =>
        item.verificationStatus === VerificationStatus.MISSING && item.active,
    ).length,
    notVerified: itemsNeedingVerification.length,
    totalWeight: filteredItems.reduce(
      (sum, item) => sum + (item.weight || 0),
      0,
    ),
  };

  // Handle verification update
  const handleUpdateVerification = async (
    id: string,
    status: VerificationStatusType,
    notes?: string,
  ) => {
    setActiveUpdate(id);
    try {
      const db = getFirestore();
      const itemRef = doc(db, "jewellery", id);
      const updateData: any = {
        verificationStatus: status,
        lastVerified: Date.now(),
      };

      if (notes !== undefined) {
        updateData.verificationNotes = notes;
      }

      await updateDoc(itemRef, updateData);

      // Update local state
      setJewelleryItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id
            ? {
                ...item,
                verificationStatus: status,
                verificationNotes:
                  notes !== undefined ? notes : item.verificationNotes,
                lastVerified: Date.now(),
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("Error updating verification:", error);
    } finally {
      setActiveUpdate(null);
      if (expandedNotesId === id) {
        setExpandedNotesId(null);
      }
    }
  };

  // Handle bulk update for location
  const handleBulkUpdate = async (
    location: string,
    status: VerificationStatusType,
  ) => {
    try {
      const db = getFirestore();
      const itemsToUpdate = jewelleryItems.filter(
        (item) => item.location === location && item.active,
      );

      // Update each item
      for (const item of itemsToUpdate) {
        const itemRef = doc(db, "jewellery", item.id);
        await updateDoc(itemRef, {
          verificationStatus: status,
          lastVerified: Date.now(),
        });
      }

      // Update local state
      setJewelleryItems((prevItems) =>
        prevItems.map((item) =>
          item.location === location && item.active
            ? {
                ...item,
                verificationStatus: status,
                lastVerified: Date.now(),
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("Error in bulk update:", error);
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
        return "#f59e0b";
      default:
        return "#9ca3af";
    }
  };

  // Toggle notes expansion
  const toggleNotes = (item: Jewellery) => {
    if (expandedNotesId === item.id) {
      setExpandedNotesId(null);
    } else {
      setExpandedNotesId(item.id);
      setNotesText((prev) => ({
        ...prev,
        [item.id]: item.verificationNotes || "",
      }));
    }
  };

  // Save notes
  const saveNotes = async (id: string) => {
    if (notesText[id] !== undefined) {
      await handleUpdateVerification(
        id,
        jewelleryItems.find((item) => item.id === id)?.verificationStatus ||
          VerificationStatus.NOT_VERIFIED,
        notesText[id],
      );
    }
  };

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
        <p>Loading verification data...</p>
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
          <span>Verification Summary</span>
          <span
            style={{
              fontSize: "12px",
              color: "#6b7280",
              fontWeight: "normal",
            }}
          >
            {stats.notVerified} to verify
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
                color: "#10b981",
                marginBottom: "4px",
              }}
            >
              {stats.verified}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#10b981",
              }}
            >
              Verified
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#fef3c7",
              borderRadius: "8px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#f59e0b",
                marginBottom: "4px",
              }}
            >
              {stats.notVerified}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#f59e0b",
              }}
            >
              To Verify
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#fef2f2",
              borderRadius: "8px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#ef4444",
                marginBottom: "4px",
              }}
            >
              {stats.missing}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#ef4444",
              }}
            >
              Missing
            </div>
          </div>
        </div>

        <div
          style={{
            marginBottom: "15px",
            display: "flex",
            gap: "8px",
          }}
        >
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={{
              flex: 1,
              padding: "8px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "12px",
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

          {selectedLocation && (
            <button
              onClick={() =>
                handleBulkUpdate(selectedLocation, VerificationStatus.VERIFIED)
              }
              style={{
                padding: "8px 12px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              ✓ All
            </button>
          )}
        </div>

        <button
          onClick={() => navigate("/jewellery/verification")}
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
          Start Verification
          <span>→</span>
        </button>
      </div>
    );
  }

  // Full mode - Optimized for minimal vertical space
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        overflow: "hidden",
        marginBottom: "15px",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "15px",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#f8fafc",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#333",
            marginBottom: "10px",
          }}
        >
          Quick Verification
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "8px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              Total
            </div>
            <div style={{ fontSize: "16px", fontWeight: "600" }}>
              {stats.totalItems}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#10b981",
                marginBottom: "4px",
              }}
            >
              Verified
            </div>
            <div
              style={{ fontSize: "16px", fontWeight: "600", color: "#10b981" }}
            >
              {stats.verified}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#f59e0b",
                marginBottom: "4px",
              }}
            >
              To Verify
            </div>
            <div
              style={{ fontSize: "16px", fontWeight: "600", color: "#f59e0b" }}
            >
              {stats.notVerified}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#ef4444",
                marginBottom: "4px",
              }}
            >
              Missing
            </div>
            <div
              style={{ fontSize: "16px", fontWeight: "600", color: "#ef4444" }}
            >
              {stats.missing}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          padding: "12px 15px",
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "14px",
              minWidth: "120px",
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

        {selectedLocation && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() =>
                handleBulkUpdate(selectedLocation, VerificationStatus.VERIFIED)
              }
              style={{
                padding: "6px 12px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
                flex: 1,
              }}
            >
              ✓ Mark All Verified
            </button>
            <button
              onClick={() =>
                handleBulkUpdate(
                  selectedLocation,
                  VerificationStatus.NOT_VERIFIED,
                )
              }
              style={{
                padding: "6px 12px",
                backgroundColor: "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
                flex: 1,
              }}
            >
              ⟲ Reset All
            </button>
          </div>
        )}
      </div>

      {/* Items List - Optimized for minimal vertical space */}
      <div
        style={{
          maxHeight: "500px",
          overflowY: "auto",
          padding: "0 15px",
        }}
      >
        {itemsNeedingVerification.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "30px 20px",
              color: "#9ca3af",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
            <p>All items are verified!</p>
            <button
              onClick={() => navigate("/jewellery/verification")}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                marginTop: "12px",
              }}
            >
              View All Items
            </button>
          </div>
        ) : (
          itemsNeedingVerification.slice(0, 5).map((item) => {
            const isUpdating = activeUpdate === item.id;
            const isExpanded = expandedNotesId === item.id;
            const hasNotes =
              item.verificationNotes &&
              item.verificationNotes.trim().length > 0;

            return (
              <div
                key={item.id}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                {/* Main Row - Compact layout */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    minHeight: "40px",
                  }}
                >
                  {/* Status Indicator (small circle) */}
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: getStatusColor(item.verificationStatus),
                      flexShrink: 0,
                    }}
                  />

                  {/* Item Code and Weight */}
                  <div
                    style={{
                      minWidth: "100px",
                      maxWidth: "120px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "13px",
                        color: "#111827",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.code}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                      }}
                    >
                      {item.weight}g
                    </div>
                  </div>

                  {/* Description (truncated) */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.description || "No description"}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "2px",
                      }}
                    >
                      <span>{item.location || "No location"}</span>
                      {item.boughtFor && <span>•</span>}
                      {item.boughtFor && <span>{item.boughtFor}</span>}
                    </div>
                  </div>

                  {/* Action Buttons - Horizontal and compact */}
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {/* Status Icons - All three in one row */}
                    <button
                      onClick={() =>
                        handleUpdateVerification(
                          item.id,
                          VerificationStatus.VERIFIED,
                        )
                      }
                      disabled={isUpdating}
                      title="Mark as Verified"
                      style={{
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          item.verificationStatus ===
                          VerificationStatus.VERIFIED
                            ? "#10b981"
                            : "#f0fdf4",
                        color:
                          item.verificationStatus ===
                          VerificationStatus.VERIFIED
                            ? "white"
                            : "#10b981",
                        border: `1px solid ${item.verificationStatus === VerificationStatus.VERIFIED ? "#10b981" : "#d1fae5"}`,
                        borderRadius: "4px",
                        cursor: isUpdating ? "not-allowed" : "pointer",
                        fontSize: "12px",
                        opacity: isUpdating ? 0.7 : 1,
                      }}
                    >
                      ✅
                    </button>

                    <button
                      onClick={() =>
                        handleUpdateVerification(
                          item.id,
                          VerificationStatus.NOT_VERIFIED,
                        )
                      }
                      disabled={isUpdating}
                      title="Mark as Not Verified"
                      style={{
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          item.verificationStatus ===
                          VerificationStatus.NOT_VERIFIED
                            ? "#f59e0b"
                            : "#fffbeb",
                        color:
                          item.verificationStatus ===
                          VerificationStatus.NOT_VERIFIED
                            ? "white"
                            : "#f59e0b",
                        border: `1px solid ${item.verificationStatus === VerificationStatus.NOT_VERIFIED ? "#f59e0b" : "#fef3c7"}`,
                        borderRadius: "4px",
                        cursor: isUpdating ? "not-allowed" : "pointer",
                        fontSize: "12px",
                        opacity: isUpdating ? 0.7 : 1,
                      }}
                    >
                      ⚠️
                    </button>

                    <button
                      onClick={() =>
                        handleUpdateVerification(
                          item.id,
                          VerificationStatus.MISSING,
                        )
                      }
                      disabled={isUpdating}
                      title="Mark as Missing"
                      style={{
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          item.verificationStatus === VerificationStatus.MISSING
                            ? "#ef4444"
                            : "#fef2f2",
                        color:
                          item.verificationStatus === VerificationStatus.MISSING
                            ? "white"
                            : "#ef4444",
                        border: `1px solid ${item.verificationStatus === VerificationStatus.MISSING ? "#ef4444" : "#fee2e2"}`,
                        borderRadius: "4px",
                        cursor: isUpdating ? "not-allowed" : "pointer",
                        fontSize: "12px",
                        opacity: isUpdating ? 0.7 : 1,
                      }}
                    >
                      ❌
                    </button>

                    {/* Notes Toggle Button */}
                    <button
                      onClick={() => toggleNotes(item)}
                      title={hasNotes ? "View notes" : "Add notes"}
                      style={{
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: hasNotes ? "#dbeafe" : "transparent",
                        color: hasNotes ? "#1d4ed8" : "#6b7280",
                        border: `1px solid ${hasNotes ? "#93c5fd" : "#e5e7eb"}`,
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        transform: isExpanded
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      ↓
                    </button>
                  </div>
                </div>

                {/* Expanded Notes Section (only when toggled) */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "8px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "4px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "500",
                        color: "#4b5563",
                        marginBottom: "6px",
                      }}
                    >
                      Verification Notes:
                    </div>
                    <textarea
                      value={notesText[item.id] || ""}
                      onChange={(e) =>
                        setNotesText((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      placeholder="Add verification notes..."
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontFamily: "inherit",
                        resize: "vertical",
                        minHeight: "40px",
                        marginBottom: "8px",
                      }}
                      disabled={isUpdating}
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => saveNotes(item.id)}
                        style={{
                          padding: "4px 10px",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: isUpdating ? "not-allowed" : "pointer",
                          fontSize: "11px",
                          fontWeight: "500",
                          opacity: isUpdating ? 0.7 : 1,
                        }}
                        disabled={isUpdating}
                      >
                        {isUpdating ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setExpandedNotesId(null)}
                        style={{
                          padding: "4px 10px",
                          backgroundColor: "#f3f4f6",
                          color: "#4b5563",
                          border: "none",
                          borderRadius: "4px",
                          cursor: isUpdating ? "not-allowed" : "pointer",
                          fontSize: "11px",
                          fontWeight: "500",
                          opacity: isUpdating ? 0.7 : 1,
                        }}
                        disabled={isUpdating}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {itemsNeedingVerification.length > 5 && (
          <div
            style={{
              textAlign: "center",
              padding: "12px 0",
              borderTop: "1px solid #f3f4f6",
            }}
          >
            <button
              onClick={() => navigate("/jewellery/verification")}
              style={{
                padding: "8px 16px",
                backgroundColor: "transparent",
                color: "#3b82f6",
                border: "1px solid #3b82f6",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              View {itemsNeedingVerification.length - 5} more items
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationTab;
