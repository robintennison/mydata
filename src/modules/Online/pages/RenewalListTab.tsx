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

const RenewalListTab: React.FC = () => {
  const navigate = useNavigate();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

        const convertToTimestamp = (field: any): number => {
          if (!field) return Date.now();
          if (field && typeof field === "object" && "toDate" in field) {
            return field.toDate().getTime();
          }
          if (typeof field === "number") return field;
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

      renewalsList.sort((a, b) => a.endDate - b.endDate);
      setRenewals(renewalsList);
    } catch (error) {
      console.error("Error fetching renewals:", error);
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
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "-";
    }
  };

  const filteredRenewals = renewals.filter(
    (renewal) =>
      renewal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (renewal.comments &&
        renewal.comments.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (loading) {
    return (
      <div style={onlineStyles.loading}>
        <div style={onlineStyles.spinner}></div>
        <p>Loading renewals...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%" }}>
      <div
        style={{
          padding: "8px",
          backgroundColor: "white",
          borderBottom: "1px solid #e9ecef",
          flexShrink: 0, // Prevent this from shrinking
        }}
      >
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search renewals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...onlineStyles.searchInput,
              padding: "10px 35px 10px 12px",
              fontSize: "0.9rem",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#a0aec0",
            }}
          >
            🔍
          </span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {filteredRenewals.length === 0 ? (
          <div style={onlineStyles.emptyState}>
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
            {/* Results Info */}
            <div
              style={{
                padding: "4px 0",
                fontSize: "0.8rem",
                color: "#6b7280",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <span>
                {filteredRenewals.length} renewal
                {filteredRenewals.length !== 1 ? "s" : ""}
              </span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#3b82f6",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: "#f0f9ff",
                  }}
                >
                  Clear search
                </button>
              )}
            </div>

            {filteredRenewals.map((renewal) => {
              const now = Date.now();
              const endDate = renewal.endDate;
              const daysUntilExpiry = Math.ceil(
                (endDate - now) / (1000 * 60 * 60 * 24),
              );

              // Determine status
              let statusStyle = {};
              let statusText = "";

              if (endDate < now) {
                statusStyle = { backgroundColor: "#fee2e2", color: "#dc2626" };
                statusText = "Expired";
              } else if (daysUntilExpiry <= 7) {
                statusStyle = { backgroundColor: "#fef3c7", color: "#d97706" };
                statusText = `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""} left`;
              } else if (daysUntilExpiry <= 30) {
                statusStyle = { backgroundColor: "#dbeafe", color: "#1d4ed8" };
                statusText = `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""} left`;
              } else {
                statusStyle = { backgroundColor: "#dcfce7", color: "#166534" };
                statusText = "Active";
              }

              return (
                <div
                  key={renewal.id}
                  style={{
                    backgroundColor: "white",
                    marginBottom: "8px",
                    borderRadius: "8px",
                    border: "1px solid #e9ecef",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() =>
                    navigate(`/online/renewals/edit/${renewal.id}`)
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(59, 130, 246, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e9ecef";
                    e.currentTarget.style.boxShadow = "none";
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: "600",
                            color: "#111827",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {renewal.name}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: "600",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            ...statusStyle,
                          }}
                        >
                          {statusText}
                        </span>
                      </div>

                      {renewal.comments && (
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#666",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: "1.4",
                          }}
                        >
                          {renewal.comments}
                        </div>
                      )}

                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#9ca3af",
                          marginTop: "4px",
                        }}
                      >
                        Expires: {formatDate(renewal.endDate)}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginLeft: "8px",
                      }}
                    >
                      <button
                        style={{
                          ...onlineStyles.editButton,
                          padding: "6px 8px",
                          fontSize: "12px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/online/renewals/edit/${renewal.id}`);
                        }}
                        title="Edit"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        style={{
                          ...onlineStyles.deleteButton,
                          padding: "6px 8px",
                          fontSize: "12px",
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RenewalListTab;
