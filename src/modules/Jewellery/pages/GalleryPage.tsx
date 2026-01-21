import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import JewelleryNavigation from "../components/JewelleryNavigation";
import { Jewellery, VerificationStatus } from "../models/types";
import styles from "./GalleryPage.module.css";

const GalleryPage: React.FC = () => {
  const navigate = useNavigate();
  const [jewelleryItems, setJewelleryItems] = useState<Jewellery[]>([]);
  const [filteredItems, setFilteredItems] = useState<Jewellery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("All");
  const [boughtForFilter, setBoughtForFilter] = useState<string>("All");
  const [showInactive, setShowInactive] = useState(false);

  // Unique filter options
  const [locationOptions, setLocationOptions] = useState<string[]>(["All"]);
  const [boughtForOptions, setBoughtForOptions] = useState<string[]>(["All"]);

  // Fetch jewellery items
  useEffect(() => {
    const fetchJewellery = async () => {
      try {
        const db = getFirestore();
        const jewelleryRef = collection(db, "jewellery");
        const snapshot = await getDocs(jewelleryRef);

        const items: Jewellery[] = [];
        const locations = new Set<string>(["All"]);
        const boughtFor = new Set<string>(["All"]);

        snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          const item: Jewellery = {
            id: doc.id,
            code: data.code || "",
            description: data.description || "",
            weight: data.weight || 0,
            location: data.location || "",
            boughtFor: data.boughtFor || "",
            purchaseDate: data.purchaseDate || 0,
            imageUrl: data.imageUrl || "",
            active: data.active !== false,
            billId: data.billId,
            lastVerified: data.lastVerified || 0,
            verificationStatus:
              data.verificationStatus || VerificationStatus.NOT_VERIFIED,
            verificationNotes: data.verificationNotes || "",
          };

          items.push(item);

          if (item.location) locations.add(item.location);
          if (item.boughtFor) boughtFor.add(item.boughtFor);
        });

        // Sort by code in descending order (Z → A) when loading
        const sortedItems = items.sort((a, b) => b.code.localeCompare(a.code));

        setJewelleryItems(sortedItems);
        setFilteredItems(sortedItems.filter((item) => item.active));
        setLocationOptions(Array.from(locations));
        setBoughtForOptions(Array.from(boughtFor));
      } catch (error) {
        console.error("Error fetching jewellery:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJewellery();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = jewelleryItems;

    // Apply active filter
    if (!showInactive) {
      result = result.filter((item) => item.active);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.code.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term),
      );
    }

    // Apply location filter
    if (locationFilter && locationFilter !== "All") {
      result = result.filter((item) => item.location === locationFilter);
    }

    // Apply boughtFor filter
    if (boughtForFilter && boughtForFilter !== "All") {
      result = result.filter((item) => item.boughtFor === boughtForFilter);
    }

    // Sort by code in descending order (Z → A, newest first)
    const sortedResult = result.sort((a, b) => b.code.localeCompare(a.code));

    setFilteredItems(sortedResult);
  }, [
    jewelleryItems,
    searchTerm,
    locationFilter,
    boughtForFilter,
    showInactive,
  ]);

  // Group items into rows of 3 (already sorted in descending order)
  const rows = [];
  for (let i = 0; i < filteredItems.length; i += 3) {
    rows.push(filteredItems.slice(i, i + 3));
  }

  const handleImageClick = (item: Jewellery) => {
    navigate(`/jewellery/detail/${item.id}`);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return styles.verified;
      case VerificationStatus.MISSING:
        return styles.missing;
      case VerificationStatus.NOT_VERIFIED:
      default:
        return styles.notVerified;
    }
  };

  //   // Function to extract numeric part from code for better sorting
  //   const extractNumberFromCode = (code: string): number => {
  //     const match = code.match(/\d+/);
  //     return match ? parseInt(match[0], 10) : 0;
  //   };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Top Navigation */}
      <div className={styles.nav}>
        <button
          onClick={() => navigate("/jewellery")}
          className={styles.navButton}
          title="Back to Jewellery"
        >
          ←
        </button>
        <div className={styles.navTitle}>
          Jewellery Gallery
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              fontWeight: "normal",
              marginTop: "2px",
            }}
          >
            Sorted by code (Z → A, newest first)
          </div>
        </div>
        <div className={styles.navActions}>
          <button
            onClick={() => navigate("/jewellery/list")}
            className={styles.navButton}
            title="List View"
          >
            📋 List
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search by code or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        {/* Filter Row */}
        <div className={styles.filterRow}>
          {/* Location Filter */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className={styles.filterSelect}
          >
            {locationOptions.map((location) => (
              <option key={location} value={location}>
                Location: {location}
              </option>
            ))}
          </select>

          {/* Bought For Filter */}
          <select
            value={boughtForFilter}
            onChange={(e) => setBoughtForFilter(e.target.value)}
            className={styles.filterSelect}
          >
            {boughtForOptions.map((boughtFor) => (
              <option key={boughtFor} value={boughtFor}>
                Bought For: {boughtFor}
              </option>
            ))}
          </select>

          {/* Show Inactive Toggle */}
          <div className={styles.toggleContainer}>
            <input
              type="checkbox"
              id="showInactive"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className={styles.toggleCheckbox}
            />
            <label htmlFor="showInactive" className={styles.toggleLabel}>
              Show Inactive
            </label>
          </div>
        </div>

        {/* Results Count */}
        <div className={styles.resultsInfo}>
          <span>
            Showing {filteredItems.length} item
            {filteredItems.length !== 1 ? "s" : ""}
          </span>
          <span>Sorted: Z → A • 3 per row</span>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className={styles.galleryContainer}>
        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🖼️</div>
            <p className={styles.emptyTitle}>No jewellery items found</p>
            <p className={styles.emptyMessage}>
              {searchTerm ||
              locationFilter !== "All" ||
              boughtForFilter !== "All"
                ? "Try changing your filters"
                : "Add jewellery items with images to see them here"}
            </p>
            <button
              onClick={() => navigate("/jewellery/add")}
              className={styles.addButton}
            >
              Add Jewellery
            </button>
          </div>
        ) : (
          <div className={styles.rowsContainer}>
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className={styles.row}>
                {row.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleImageClick(item)}
                    className={`${styles.galleryItem} ${!item.active ? styles.inactive : ""}`}
                  >
                    {/* Image */}
                    <div className={styles.imageContainer}>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.code}
                          className={styles.image}
                        />
                      ) : (
                        <div className={styles.placeholder}>💎</div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className={styles.itemInfo}>
                      <div className={styles.itemCode}>{item.code}</div>
                      <div className={styles.itemDescription}>
                        {item.description || "No description"}
                      </div>
                      <div className={styles.itemMeta}>
                        <span>{item.weight}g</span>
                        {item.location && <span>{item.location}</span>}
                      </div>

                      {/* Status Badge */}
                      {item.verificationStatus && (
                        <div
                          className={`${styles.statusBadge} ${getStatusBadgeClass(item.verificationStatus)}`}
                        >
                          {item.verificationStatus}
                        </div>
                      )}

                      {/* Inactive Badge */}
                      {!item.active && (
                        <div className={styles.inactiveBadge}>Inactive</div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Fill empty slots in last row */}
                {row.length < 3 &&
                  Array.from({ length: 3 - row.length }).map((_, index) => (
                    <div key={`empty-${index}`} className={styles.hidden} />
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statsContainer}>
          <div>
            <strong>Total:</strong> {filteredItems.length}
          </div>
          <div>
            <strong>With Images:</strong>{" "}
            {filteredItems.filter((item) => item.imageUrl).length}
          </div>
          <div>
            <strong>Verified:</strong>{" "}
            {
              filteredItems.filter(
                (item) =>
                  item.verificationStatus === VerificationStatus.VERIFIED,
              ).length
            }
          </div>
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#9ca3af",
            marginTop: "4px",
            textAlign: "center",
          }}
        >
          Sorted by code in descending order (Z → A)
        </div>
      </div>

      <JewelleryNavigation />
    </div>
  );
};

export default GalleryPage;
