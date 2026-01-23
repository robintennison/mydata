import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { OnlineItem, Category } from "../types/online.types";
import styles from "./Online.module.css";

const OnlineListPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<OnlineItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
          category: data.category || "",
          image1: data.image1 || "",
          image2: data.image2 || "",
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });

      // Fetch categories for display
      const categoriesRef = collection(db, "categories");
      const categoriesSnapshot = await getDocs(categoriesRef);

      const categoriesList: Category[] = [];
      categoriesSnapshot.forEach((doc) => {
        const data = doc.data();
        categoriesList.push({
          id: doc.id,
          name: data.name || "",
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });

      // Sort items by name
      itemsList.sort((a, b) => a.name.localeCompare(b.name));
      setItems(itemsList);
      setCategories(categoriesList);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Uncategorized";
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
      item.detail.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading items...</p>
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
            <h1 className={styles.title}>Online Items</h1>
            <p className={styles.subtitle}>
              Manage your online purchases and items
            </p>
          </div>
          <div className={styles.headerRight}>
            <button
              className={styles.addButton}
              onClick={() => navigate("/online/items/add")}
            >
              + Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <span className={styles.searchIcon}>🔍</span>
      </div>

      {/* Items List */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            Items ({filteredItems.length})
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🛒</div>
            <div className={styles.emptyText}>No items found</div>
            <div className={styles.emptySubtext}>
              {searchTerm
                ? "Try a different search term"
                : "Add your first item"}
            </div>
          </div>
        ) : (
          <div className={styles.tableResponsiveContainer}>
            <table className={styles.responsiveTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Details</th>
                  <th style={{ width: "150px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{getCategoryName(item.category)}</td>
                    <td>
                      <div className={styles.truncateText} title={item.detail}>
                        {item.detail.length > 50
                          ? `${item.detail.substring(0, 50)}...`
                          : item.detail}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.viewButton}
                          onClick={() =>
                            navigate(`/online/items/view/${item.id}`)
                          }
                        >
                          View
                        </button>
                        <button
                          className={styles.editButton}
                          onClick={() =>
                            navigate(`/online/items/edit/${item.id}`)
                          }
                        >
                          Edit
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDelete(item.id, item.name)}
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

export default OnlineListPage;
