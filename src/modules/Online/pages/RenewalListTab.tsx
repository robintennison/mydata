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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px",
        }}
      >
        <div style={onlineStyles.spinner}></div>
        <p>Loading renewals...</p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "8px",
          backgroundColor: "white",
          borderBottom: "1px solid #e9ecef",
          position: "sticky",
          top: 0,
          zIndex: 10,
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

      <div style={{ flex: 1, padding: "8px 0" }}>
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
          <div style={{ padding: "0" }}>
            {filteredRenewals.map((renewal) => (
              <div
                key={renewal.id}
                style={{
                  backgroundColor: "#f8f9fa",
                  margin: "0 8px 8px 8px", // Matched margin to search padding (8px)
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/online/renewals/view/${renewal.id}`)}
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

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <button
                      style={onlineStyles.editButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/online/renewals/edit/${renewal.id}`);
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      style={onlineStyles.deleteButton}
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
    </div>
  );
};

export default RenewalListTab;
