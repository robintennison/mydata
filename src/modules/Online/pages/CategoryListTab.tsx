import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Category } from "../types/online.types";
import { onlineStyles } from "../styles/onlineStyles";

const CategoryListTab: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const categoriesRef = collection(db, "online_categories");
      const snapshot = await getDocs(categoriesRef);

      const categoriesList: Category[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        categoriesList.push({
          id: doc.id,
          name: data.name || "",
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });

      categoriesList.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(categoriesList);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      try {
        const db = getFirestore();
        await deleteDoc(doc(db, "online_categories", id));
        setCategories(categories.filter((cat) => cat.id !== id));
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("Failed to delete category");
      }
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div style={onlineStyles.loading}>
        <div style={onlineStyles.spinner}></div>
        <p>Loading categories...</p>
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
            placeholder="Search categories..."
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
        {filteredCategories.length === 0 ? (
          <div style={onlineStyles.emptyState}>
            <div style={onlineStyles.emptyIcon}>📁</div>
            <div style={onlineStyles.emptyText}>
              {searchTerm
                ? "No matching categories found"
                : "No categories yet"}
            </div>
            <div style={onlineStyles.emptySubtext}>
              {!searchTerm && "Add your first category"}
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
                {filteredCategories.length} categor
                {filteredCategories.length !== 1 ? "ies" : "y"}
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

            {filteredCategories.map((category) => (
              <div
                key={category.id}
                style={{
                  backgroundColor: "white",
                  marginBottom: "8px",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={() =>
                  navigate(`/online/categories/edit/${category.id}`)
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
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "20px",
                      backgroundColor: "#dbeafe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "12px",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: "18px", color: "#1d4ed8" }}>
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: "600",
                        color: "#111827",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: "4px",
                      }}
                    >
                      {category.name}
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
                        navigate(`/online/categories/edit/${category.id}`);
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
                        handleDelete(category.id, category.name);
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

export default CategoryListTab;
