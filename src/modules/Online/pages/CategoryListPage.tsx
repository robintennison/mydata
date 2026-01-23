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
import styles from "./Online.module.css";

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
      const categoriesRef = collection(db, "online_categories"); // Corrected collection name
      console.log("Fetching from collection: online_categories");

      const snapshot = await getDocs(categoriesRef);
      console.log("Snapshot size:", snapshot.size);

      const categoriesList: Category[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Document ${doc.id}:`, data);

        categoriesList.push({
          id: doc.id,
          name: data.name || "",
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });

      console.log("Categories list:", categoriesList);
      // Sort by name
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
        await deleteDoc(doc(db, "online_categories", id)); // Corrected collection name
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
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTopRow}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Categories</h1>
            <p className={styles.subtitle}>Manage your item categories</p>
          </div>
          <div className={styles.headerRight}>
            <button
              className={styles.addButton}
              onClick={() => navigate("/online/categories/add")}
            >
              + Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <span className={styles.searchIcon}>🔍</span>
      </div>

      {/* Categories List */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            Categories ({filteredCategories.length})
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📁</div>
            <div className={styles.emptyText}>No categories found</div>
            <div className={styles.emptySubtext}>
              {searchTerm
                ? "Try a different search term"
                : "Add your first category"}
            </div>
          </div>
        ) : (
          <div className={styles.tableResponsiveContainer}>
            <table className={styles.responsiveTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th style={{ width: "100px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.editButton}
                          onClick={() =>
                            navigate(`/online/categories/edit/${category.id}`)
                          }
                        >
                          Edit
                        </button>
                        <button
                          className={styles.deleteButton}
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
