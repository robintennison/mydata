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
          <span>Sorted: Z → A</span>
        </div>
      </div>

      {/* Gallery Grid - Maximized Image Display */}
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
          <div className={styles.gridContainer}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleImageClick(item)}
                className={`${styles.galleryItem} ${!item.active ? styles.inactive : ""}`}
              >
                {/* Image Container with Overlay Info */}
                <div className={styles.imageContainer}>
                  {item.imageUrl ? (
                    <>
                      <img
                        src={item.imageUrl}
                        alt={item.code}
                        className={styles.image}
                      />
                      {/* Overlay for Code and Weight */}
                      <div className={styles.imageOverlay}>
                        <div className={styles.overlayContent}>
                          <div className={styles.overlayCode}>{item.code}</div>
                          <div className={styles.overlayWeight}>
                            {item.weight}g
                          </div>

                          {/* Status Badge - Only show if not VERIFIED */}
                          {item.verificationStatus !==
                            VerificationStatus.VERIFIED && (
                            <div
                              className={`${styles.overlayStatus} ${getStatusBadgeClass(item.verificationStatus)}`}
                            >
                              {item.verificationStatus ===
                              VerificationStatus.MISSING
                                ? "MISSING"
                                : "NOT VERIFIED"}
                            </div>
                          )}

                          {/* Inactive Badge */}
                          {!item.active && (
                            <div className={styles.overlayInactive}>
                              INACTIVE
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.placeholderContainer}>
                      <div className={styles.placeholder}>💎</div>
                      <div className={styles.placeholderInfo}>
                        <div className={styles.placeholderCode}>
                          {item.code}
                        </div>
                        <div className={styles.placeholderWeight}>
                          {item.weight}g
                        </div>

                        {/* Status Badge - Only show if not VERIFIED */}
                        {item.verificationStatus !==
                          VerificationStatus.VERIFIED && (
                          <div
                            className={`${styles.placeholderStatus} ${getStatusBadgeClass(item.verificationStatus)}`}
                          >
                            {item.verificationStatus ===
                            VerificationStatus.MISSING
                              ? "MISSING"
                              : "NOT VERIFIED"}
                          </div>
                        )}

                        {/* Inactive Badge */}
                        {!item.active && (
                          <div className={styles.placeholderInactive}>
                            INACTIVE
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
          Tap images to view details
        </div>
      </div>

      <JewelleryNavigation />
    </div>
  );
};

export default GalleryPage;
