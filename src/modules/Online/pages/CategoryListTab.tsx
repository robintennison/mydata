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
        <p>Loading categories...</p>
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
            placeholder="Search categories..."
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
          <div style={{ padding: "0" }}>
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                style={{
                  backgroundColor: "white",
                  margin: "0 8px 8px 8px", // Matched margin to search padding (8px)
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate(`/online/categories/edit/${category.id}`)
                }
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
                      style={onlineStyles.editButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/online/categories/edit/${category.id}`);
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      style={onlineStyles.deleteButton}
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
