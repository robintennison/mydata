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
import { onlineStyles } from "../styles/onlineStyles";

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
      const categoriesRef = collection(db, "online_categories");
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
          <div style={onlineStyles.navTitle}>Online Items</div>
          <div style={onlineStyles.navSubtitle}>
            Manage your online purchases and items
          </div>
        </div>
        <div style={onlineStyles.headerRight}>
          <button
            style={onlineStyles.addButton}
            onClick={() => navigate("/online/items/add")}
          >
            + Add Item
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={onlineStyles.searchContainer}>
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={onlineStyles.searchInput}
        />
        <span style={onlineStyles.searchIcon}>🔍</span>
      </div>

      {/* Items List */}
      <div style={onlineStyles.section}>
        <div style={onlineStyles.sectionHeader}>
          <div style={onlineStyles.sectionTitle}>
            Items ({filteredItems.length})
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div style={onlineStyles.emptyState}>
            <div style={onlineStyles.emptyIcon}>🛒</div>
            <div style={onlineStyles.emptyText}>No items found</div>
            <div style={onlineStyles.emptySubtext}>
              {searchTerm
                ? "Try a different search term"
                : "Add your first item"}
            </div>
          </div>
        ) : (
          <div style={onlineStyles.tableResponsiveContainer}>
            <table style={onlineStyles.responsiveTable}>
              <thead>
                <tr>
                  <th style={onlineStyles.tableHeader}>Name</th>
                  <th style={onlineStyles.tableHeader}>Category</th>
                  <th style={onlineStyles.tableHeader}>Details</th>
                  <th style={{ ...onlineStyles.tableHeader, width: "150px" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} style={onlineStyles.tableRow}>
                    <td style={onlineStyles.tableCell}>{item.name}</td>
                    <td style={onlineStyles.tableCell}>
                      {getCategoryName(item.category)}
                    </td>
                    <td style={onlineStyles.tableCell}>
                      <div
                        style={onlineStyles.truncateText}
                        title={item.detail}
                      >
                        {item.detail.length > 50
                          ? `${item.detail.substring(0, 50)}...`
                          : item.detail}
                      </div>
                    </td>
                    <td style={onlineStyles.tableCell}>
                      <div style={onlineStyles.actionButtons}>
                        <button
                          style={onlineStyles.viewButton}
                          onClick={() =>
                            navigate(`/online/items/view/${item.id}`)
                          }
                        >
                          View
                        </button>
                        <button
                          style={onlineStyles.editButton}
                          onClick={() =>
                            navigate(`/online/items/edit/${item.id}`)
                          }
                        >
                          Edit
                        </button>
                        <button
                          style={onlineStyles.deleteButton}
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
