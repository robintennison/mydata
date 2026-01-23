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

const CategoryListPage: React.FC = () => {
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
      alert("Failed to load categories");
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

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div style={onlineStyles.container}>
        <div style={onlineStyles.loading}>
          <div style={onlineStyles.spinner}></div>
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={onlineStyles.container}>
      {/* Top Navigation */}
      <div style={onlineStyles.topNav}>
        <button
          onClick={() => navigate("/online")}
          style={onlineStyles.navButton}
          title="Back"
        >
          ←
        </button>
        <div style={onlineStyles.headerLeft}>
          <div style={onlineStyles.navTitle}>Categories</div>
          <div style={onlineStyles.navSubtitle}>
            Manage your item categories
          </div>
        </div>
        <div style={onlineStyles.headerRight}>
          <button
            style={onlineStyles.addButton}
            onClick={() => navigate("/online/categories/add")}
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={onlineStyles.searchContainer}>
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={onlineStyles.searchInput}
        />
        <span style={onlineStyles.searchIcon}>🔍</span>
      </div>

      {/* Categories List */}
      <div style={onlineStyles.section}>
        <div style={onlineStyles.sectionHeader}>
          <div style={onlineStyles.sectionTitle}>
            Categories ({filteredCategories.length})
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div style={onlineStyles.emptyState}>
            <div style={onlineStyles.emptyIcon}>📁</div>
            <div style={onlineStyles.emptyText}>No categories found</div>
            <div style={onlineStyles.emptySubtext}>
              {searchTerm
                ? "Try a different search term"
                : "Add your first category"}
            </div>
          </div>
        ) : (
          <div style={onlineStyles.tableResponsiveContainer}>
            <table style={onlineStyles.responsiveTable}>
              <thead>
                <tr>
                  <th style={onlineStyles.tableHeader}>Name</th>
                  <th style={{ ...onlineStyles.tableHeader, width: "100px" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id} style={onlineStyles.tableRow}>
                    <td style={onlineStyles.tableCell}>{category.name}</td>
                    <td style={onlineStyles.tableCell}>
                      <div style={onlineStyles.actionButtons}>
                        <button
                          style={onlineStyles.editButton}
                          onClick={() =>
                            navigate(`/online/categories/edit/${category.id}`)
                          }
                        >
                          Edit
                        </button>
                        <button
                          style={onlineStyles.deleteButton}
                          onClick={() =>
                            handleDelete(category.id, category.name)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryListPage;
