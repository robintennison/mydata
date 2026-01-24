import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Renewal } from "../types/online.types";
import { onlineStyles } from "../styles/onlineStyles";

// Sort options as const object instead of enum
const RenewalSortOption = {
  NAME_ASC: "Name (A-Z)",
  NAME_DESC: "Name (Z-A)",
  DATE_ASC: "Date (Soonest)",
  DATE_DESC: "Date (Latest)",
} as const;

type RenewalSortOptionType = keyof typeof RenewalSortOption;

const RenewalListPage: React.FC = () => {
  const navigate = useNavigate();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] =
    useState<RenewalSortOptionType>("DATE_ASC");
  const [sortExpanded, setSortExpanded] = useState(false);

  useEffect(() => {
    fetchRenewals();
  }, []);

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const renewalsRef = collection(db, "renewals");
      const snapshot = await getDocs(renewalsRef);

      const renewalsList: Renewal[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();

        // Handle Firebase Timestamp conversion
        const convertToTimestamp = (field: any): number => {
          if (!field) return Date.now();

          // If it's a Firebase Timestamp object
          if (field && typeof field === "object" && "toDate" in field) {
            return field.toDate().getTime();
          }

          // If it's already a number
          if (typeof field === "number") {
            return field;
          }

          // If it's a string, try to parse it
          if (typeof field === "string") {
            const parsed = Date.parse(field);
            return isNaN(parsed) ? Date.now() : parsed;
          }

          return Date.now();
        };

        renewalsList.push({
          id: doc.id,
          name: data.name || "",
          startDate: convertToTimestamp(data.startDate),
          endDate: convertToTimestamp(data.endDate),
          comments: data.comments || "",
          createdAt: convertToTimestamp(data.createdAt),
          updatedAt: convertToTimestamp(data.updatedAt),
        });
      });

      // Debug: log first renewal to see what we got
      if (renewalsList.length > 0) {
        console.log("First renewal data:", renewalsList[0]);
        console.log("End date as number:", renewalsList[0].endDate);
        console.log(
          "Formatted date:",
          new Date(renewalsList[0].endDate).toString(),
        );
      }

      // Initial sort by end date (soonest first)
      renewalsList.sort((a, b) => a.endDate - b.endDate);
      setRenewals(renewalsList);
    } catch (error) {
      console.error("Error fetching renewals:", error);
      alert("Failed to load renewals");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete renewal "${name}"?`)) {
      try {
        const db = getFirestore();
        await deleteDoc(doc(db, "renewals", id));
        setRenewals(renewals.filter((renewal) => renewal.id !== id));
      } catch (error) {
        console.error("Error deleting renewal:", error);
        alert("Failed to delete renewal");
      }
    }
  };

  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date for timestamp:", timestamp);
        return "-";
      }

      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error, "timestamp:", timestamp);
      return "-";
    }
  };

  // Sort renewals based on selected option
  const sortedRenewals = () => {
    switch (sortOption) {
      case "NAME_ASC":
        return [...renewals].sort((a, b) => a.name.localeCompare(b.name));
      case "NAME_DESC":
        return [...renewals].sort((a, b) => b.name.localeCompare(a.name));
      case "DATE_ASC":
        return [...renewals].sort((a, b) => a.endDate - b.endDate);
      case "DATE_DESC":
        return [...renewals].sort((a, b) => b.endDate - a.endDate);
      default:
        return renewals;
    }
  };

  // Filter renewals based on search
  const filteredRenewals = sortedRenewals().filter(
    (renewal) =>
      renewal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (renewal.comments &&
        renewal.comments.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (loading) {
    return (
      <div style={onlineStyles.container}>
        <div style={onlineStyles.loading}>
          <div style={onlineStyles.spinner}></div>
          <p>Loading renewals...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={onlineStyles.container}>
      {/* Top Navigation - Matching Kotlin Design */}
      <div
        style={{
          ...onlineStyles.topNav,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0",
          height: "56px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e9ecef",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Left: Home and Back buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          <button
            onClick={() => navigate("/online")}
            style={{
              ...onlineStyles.navButton,
              border: "none",
              backgroundColor: "transparent",
              borderRadius: "0",
              width: "48px",
              height: "100%",
            }}
            title="Home"
          >
            🏠
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              ...onlineStyles.navButton,
              border: "none",
              backgroundColor: "transparent",
              borderRadius: "0",
              width: "48px",
              height: "100%",
            }}
            title="Back"
          >
            ←
          </button>
        </div>

        {/* Center: Search bar integrated in top nav */}
        <div
          style={{
            flex: 1,
            position: "relative",
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              height: "100%",
              padding: "0 40px 0 16px",
              border: "none",
              fontSize: "0.9rem",
              backgroundColor: "transparent",
              outline: "none",
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                position: "absolute",
                right: "32px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#a0aec0",
                cursor: "pointer",
                fontSize: "0.8rem",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Sort, Add, and Settings buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          {/* Add button - PLUS icon */}
          <button
            onClick={() => navigate("/online/renewals/add")}
            style={{
              ...onlineStyles.navButton,
              border: "none",
              backgroundColor: "transparent",
              borderRadius: "0",
              width: "48px",
              height: "100%",
              fontSize: "1.2rem",
              color: "#667eea",
            }}
            title="Add Renewal"
          >
            +
          </button>

          {/* Sort Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setSortExpanded(!sortExpanded)}
              style={{
                ...onlineStyles.navButton,
                border: "none",
                backgroundColor: "transparent",
                borderRadius: "0",
                width: "48px",
                height: "100%",
                color: "#667eea",
              }}
              title="Sort options"
            >
              ↓
            </button>

            {sortExpanded && (
              <>
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 99,
                  }}
                  onClick={() => setSortExpanded(false)}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    backgroundColor: "white",
                    border: "1px solid #e9ecef",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 100,
                    width: "200px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      color: "#718096",
                      borderBottom: "1px solid #e9ecef",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    Sort by:
                  </div>
                  {Object.entries(RenewalSortOption).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSortOption(key as RenewalSortOptionType);
                        setSortExpanded(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        backgroundColor:
                          key === sortOption ? "#f0f4ff" : "white",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        color: key === sortOption ? "#667eea" : "#333",
                        textAlign: "left",
                      }}
                    >
                      {key === sortOption && <span>✓</span>}
                      {value}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Settings button */}
          <button
            onClick={() => navigate("/settings")}
            style={{
              ...onlineStyles.navButton,
              border: "none",
              backgroundColor: "transparent",
              borderRadius: "0",
              width: "48px",
              height: "100%",
            }}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Compact Renewals List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
        {filteredRenewals.length === 0 ? (
          <div
            style={{
              ...onlineStyles.emptyState,
              padding: "60px 20px",
            }}
          >
            <div style={onlineStyles.emptyIcon}>🔄</div>
            <div style={onlineStyles.emptyText}>
              {searchTerm ? "No matching renewals found" : "No renewals yet"}
            </div>
            <div style={onlineStyles.emptySubtext}>
              {!searchTerm && "Add your first renewal"}
            </div>
          </div>
        ) : (
          <div style={{ padding: "8px" }}>
            {filteredRenewals.map((renewal) => (
              <div
                key={renewal.id}
                style={{
                  backgroundColor: "#f8f9fa",
                  margin: "0 8px 8px 8px",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() => navigate(`/online/renewals/view/${renewal.id}`)}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#ebf8ff";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8f9fa";
                }}
              >
                <div
                  style={{
                    padding: "12px",
                    display: "flex",
                    alignItems: "center",
                    minHeight: "48px",
                  }}
                >
                  {/* Left side - Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: "500",
                        color: "#333",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: "4px",
                      }}
                    >
                      {renewal.name}
                    </div>

                    {renewal.comments && (
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#718096",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {renewal.comments}
                      </div>
                    )}
                  </div>

                  {/* Center - End Date */}
                  <div
                    style={{
                      marginLeft: "8px",
                      fontSize: "0.85rem",
                      color: "#666",
                      whiteSpace: "nowrap",
                      padding: "0 12px",
                    }}
                  >
                    {formatDate(renewal.endDate)}
                  </div>

                  {/* Right side - Action buttons */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <button
                      style={{
                        padding: "8px",
                        backgroundColor: "#4299e1",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/online/renewals/edit/${renewal.id}`);
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>

                    <button
                      style={{
                        padding: "8px",
                        backgroundColor: "#f56565",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(renewal.id, renewal.name);
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        button:hover {
          opacity: 0.8;
        }
        
        input:focus {
          outline: none;
        }
        
        /* Hide scrollbar for cleaner look */
        ::-webkit-scrollbar {
          width: 4px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 2px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default RenewalListPage;
