import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { OnlineItem } from "../types/online.types";
import { onlineStyles } from "../styles/onlineStyles";

const OnlineListTab: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<OnlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const itemsRef = collection(db, "online");
      const itemsSnapshot = await getDocs(itemsRef);

      const itemsList: OnlineItem[] = [];
      itemsSnapshot.forEach((doc) => {
        const data = doc.data();
        itemsList.push({
          id: doc.id,
          name: data.name || "",
          detail: data.detail || "",
          category: data.category || "",
          image1: data.image1 || "",
          image2: data.image2 || "",
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });

      itemsList.sort((a, b) => a.name.localeCompare(b.name));
      setItems(itemsList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const db = getFirestore();
        await deleteDoc(doc(db, "online", id));
        setItems(items.filter((item) => item.id !== id));
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Failed to delete item");
      }
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()),
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
        <p>Loading items...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Search Bar */}
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
            placeholder="Search items by name, details, or category..."
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

      {/* Add Button - Fixed at top */}
      <div
        style={{
          padding: "8px 8px 0 8px",
          backgroundColor: "white",
          position: "sticky",
          top: "57px", // Height of search bar + padding
          zIndex: 9,
        }}
      >
        <button
          onClick={() => navigate("/online/items/add")}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          ＋ Add New Item
        </button>
      </div>

      {/* Items List */}
      <div style={{ flex: 1, padding: "8px 0" }}>
        {filteredItems.length === 0 ? (
          <div style={onlineStyles.emptyState}>
            <div style={onlineStyles.emptyIcon}>🛒</div>
            <div style={onlineStyles.emptyText}>
              {searchTerm ? "No matching items found" : "No items yet"}
            </div>
            <div style={onlineStyles.emptySubtext}>
              {!searchTerm && "Add your first item"}
            </div>
          </div>
        ) : (
          <div style={{ padding: "0 8px" }}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "white",
                  margin: "8px 0",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  // Remove the ":hover" pseudo-class from here
                  // Keep the base styles only
                }}
                onClick={() => navigate(`/online/items/view/${item.id}`)}
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
                  {/* Image thumbnail if available */}
                  {(item.image1 || item.image2) && (
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "6px",
                        overflow: "hidden",
                        marginRight: "12px",
                        flexShrink: 0,
                        backgroundColor: "#f9fafb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={item.image1 || item.image2}
                        alt={item.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}

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
                        {item.name}
                      </span>
                      {item.category && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: "600",
                            color: "#4299e1",
                            backgroundColor: "#ebf8ff",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "120px",
                          }}
                        >
                          {item.category}
                        </span>
                      )}
                    </div>
                    {item.detail && (
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
                        {item.detail}
                      </div>
                    )}
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
                        navigate(`/online/items/edit/${item.id}`);
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
                        handleDelete(item.id, item.name);
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

export default OnlineListTab;
