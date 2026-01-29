import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { OnlineItem } from "../types/online.types";
import { onlineStyles } from "../styles/onlineStyles";

const OnlineListTab: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<OnlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [categories, setCategories] = useState<string[]>(["All"]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Extract unique categories from items
    const uniqueCategories = Array.from(
      new Set(items.map((item) => item.category).filter(Boolean)),
    ).sort();
    setCategories(["All", ...uniqueCategories]);
  }, [items]);

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

  const filteredItems = items.filter((item) => {
    // Filter by search term
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by category
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div style={onlineStyles.loading}>
        <div style={onlineStyles.spinner}></div>
        <p>Loading items...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%" }}>
      {/* Search and Filter Row - Removed sticky positioning to avoid conflicts */}
      <div
        style={{
          padding: "8px",
          backgroundColor: "white",
          borderBottom: "1px solid #e9ecef",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexShrink: 0, // Prevent this from shrinking
        }}
      >
        {/* Search Input */}
        <div style={{ flex: 2, minWidth: 0, position: "relative" }}>
          <input
            type="text"
            placeholder="Search items..."
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
              fontSize: "14px",
            }}
          >
            🔍
          </span>
        </div>

        {/* Category Filter Dropdown */}
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "0.9rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              backgroundColor: "white",
              color: "#374151",
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              boxSizing: "border-box",
            }}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <div
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6b7280",
              fontSize: "10px",
              pointerEvents: "none",
            }}
          >
            ▼
          </div>
        </div>
      </div>

      {/* Items List Container - This will scroll within the parent container */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {filteredItems.length === 0 ? (
          <div style={onlineStyles.emptyState}>
            <div style={onlineStyles.emptyIcon}>🛒</div>
            <div style={onlineStyles.emptyText}>
              {searchTerm || selectedCategory !== "All"
                ? "No matching items found"
                : "No items yet"}
            </div>
            <div style={onlineStyles.emptySubtext}>
              {!searchTerm &&
                selectedCategory === "All" &&
                "Add your first item using the ＋ button"}
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
                {filteredItems.length} item
                {filteredItems.length !== 1 ? "s" : ""}
                {selectedCategory !== "All" && ` in ${selectedCategory}`}
              </span>
              {(searchTerm || selectedCategory !== "All") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All");
                  }}
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
                  Clear filters
                </button>
              )}
            </div>

            {/* Items List */}
            {filteredItems.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "white",
                  marginBottom: "8px",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
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

                  {/* Edit button only */}
                  <div
                    style={{
                      marginLeft: "8px",
                    }}
                  >
                    <button
                      style={{
                        ...onlineStyles.editButton,
                        padding: "6px 12px",
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
