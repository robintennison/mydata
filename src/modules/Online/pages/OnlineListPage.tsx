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

const OnlineListPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<OnlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const db = getFirestore();

      // Fetch online items
      const itemsRef = collection(db, "online");
      const itemsSnapshot = await getDocs(itemsRef);

      const itemsList: OnlineItem[] = [];
      itemsSnapshot.forEach((doc) => {
        const data = doc.data();
        itemsList.push({
          id: doc.id,
          name: data.name || "",
          detail: data.detail || "",
          category: data.category || "", // This is the category NAME
          image1: data.image1 || "",
          image2: data.image2 || "",
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });

      // Sort items by name
      itemsList.sort((a, b) => a.name.localeCompare(b.name));
      setItems(itemsList);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  // Get unique category names for filter dropdown
  const categoryOptions = [
    "All",
    "Uncategorized",
    ...Array.from(
      new Set(
        items.map((item) => item.category).filter((cat) => cat.trim() !== ""),
      ),
    ),
  ];

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

  // Filter items based on search and category
  const filteredItems = items.filter((item) => {
    // Category filter
    const categoryMatch =
      selectedCategory === "All" ||
      (selectedCategory === "Uncategorized"
        ? item.category.trim() === ""
        : item.category === selectedCategory);

    // Search filter
    const searchMatch =
      searchTerm === "" ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.detail.toLowerCase().includes(searchTerm.toLowerCase());

    return categoryMatch && searchMatch;
  });

  if (loading) {
    return (
      <div style={onlineStyles.container}>
        <div style={onlineStyles.loading}>
          <div style={onlineStyles.spinner}></div>
          <p>Loading items...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={onlineStyles.container}>
      {/* Top Navigation - Compact like Kotlin */}
      <div style={onlineStyles.topNav}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => navigate("/online")}
            style={onlineStyles.navButton}
            title="Back"
          >
            ←
          </button>
          <button
            onClick={() => navigate("/settings")}
            style={onlineStyles.navButton}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={onlineStyles.navTitle}>Online Items</div>
        </div>
        <div>
          <button
            style={{
              ...onlineStyles.addButton,
              padding: "8px 12px",
              fontSize: "0.9rem",
            }}
            onClick={() => navigate("/online/items/add")}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Search and Filter Row - Compact */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          padding: "10px 15px",
          backgroundColor: "white",
          borderBottom: "1px solid #e9ecef",
        }}
      >
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...onlineStyles.searchInput,
              padding: "8px 30px 8px 12px",
              fontSize: "0.9rem",
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#a0aec0",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          )}
          <span
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#a0aec0",
            }}
          >
            {!searchTerm && "🔍"}
          </span>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            ...onlineStyles.select,
            padding: "8px 12px",
            fontSize: "0.9rem",
            minWidth: "120px",
          }}
        >
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Items Count */}
      <div
        style={{
          padding: "8px 15px",
          backgroundColor: "#f8f9fa",
          fontSize: "0.85rem",
          color: "#666",
          borderBottom: "1px solid #e9ecef",
        }}
      >
        {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
      </div>

      {/* Compact Items List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filteredItems.length === 0 ? (
          <div
            style={{
              ...onlineStyles.emptyState,
              padding: "60px 20px",
            }}
          >
            <div style={onlineStyles.emptyIcon}>🛒</div>
            <div style={onlineStyles.emptyText}>
              {searchTerm || selectedCategory !== "All"
                ? "No matching items found"
                : "No items yet"}
            </div>
            <div style={onlineStyles.emptySubtext}>
              {!searchTerm &&
                selectedCategory === "All" &&
                "Add your first item"}
            </div>
          </div>
        ) : (
          <div style={{ padding: "5px 0" }}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "white",
                  margin: "0 8px 5px 8px",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() => navigate(`/online/items/view/${item.id}`)}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8f9fa";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    minHeight: "48px",
                  }}
                >
                  {/* Left side - Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "2px",
                      }}
                    >
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
                            maxWidth: "100px",
                          }}
                        >
                          {item.category}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: "500",
                          color: "#333",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.name}
                      </span>
                    </div>

                    {item.detail && (
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#666",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginTop: "2px",
                        }}
                      >
                        {item.detail}
                      </div>
                    )}
                  </div>

                  {/* Right side - Action buttons */}
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
                        padding: "6px",
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
                        navigate(`/online/items/edit/${item.id}`);
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>

                    <button
                      style={{
                        padding: "6px",
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

      {/* Bottom Navigation */}
      <div
        style={{
          position: "sticky",
          bottom: "0",
          backgroundColor: "white",
          borderTop: "1px solid #e9ecef",
          padding: "8px 15px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => navigate("/online")}
          style={{
            padding: "8px 20px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e9ecef",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        button:hover {
          opacity: 0.9;
        }
        
        select:hover {
          border-color: #667eea;
        }
      `}</style>
    </div>
  );
};

export default OnlineListPage;
