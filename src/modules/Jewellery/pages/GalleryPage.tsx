import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
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

  // Get unique filter options
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
      {/* Compact Top Bar - All in one row */}
      <div className={styles.compactTopBar}>
        {/* Back Button */}
        <button
          onClick={() => navigate("/jewellery")}
          className={styles.backButton}
          title="Back to Jewellery"
        >
          ←
        </button>

        {/* Search Field - Takes priority */}
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.compactSearch}
        />

        {/* Location Filter - Compact */}
        <div className={styles.filterContainer}>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className={styles.compactSelect}
            title="Location"
          >
            {locationOptions.map((location) => (
              <option key={location} value={location}>
                {location === "All" ? "📍 All" : `📍 ${location}`}
              </option>
            ))}
          </select>
        </div>

        {/* Bought For Filter - Compact */}
        <div className={styles.filterContainer}>
          <select
            value={boughtForFilter}
            onChange={(e) => setBoughtForFilter(e.target.value)}
            className={styles.compactSelect}
            title="Bought For"
          >
            {boughtForOptions.map((boughtFor) => (
              <option key={boughtFor} value={boughtFor}>
                {boughtFor === "All" ? "👤 All" : `👤 ${boughtFor}`}
              </option>
            ))}
          </select>
        </div>

        {/* Settings Icon */}
        <button
          onClick={() => navigate("/settings")}
          className={styles.settingsButton}
          title="Settings"
        >
          ⚙️
        </button>

        {/* Show Inactive Toggle (very small) */}
        <label className={styles.inactiveToggle} title="Show Inactive">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className={styles.inactiveCheckbox}
          />
          <span className={styles.toggleLabel}>In</span>
        </label>
      </div>

      {/* Gallery Grid - Starts immediately below top bar */}
      <div className={styles.galleryContainer}>
        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🖼️</div>
            <p className={styles.emptyMessage}>
              {searchTerm ||
              locationFilter !== "All" ||
              boughtForFilter !== "All"
                ? "No items match your filters"
                : "No jewellery items found"}
            </p>
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
                              className={`${styles.overlayStatus} ${
                                item.verificationStatus ===
                                VerificationStatus.MISSING
                                  ? styles.missing
                                  : styles.notVerified
                              }`}
                            >
                              {item.verificationStatus ===
                              VerificationStatus.MISSING
                                ? "MISSING"
                                : "NOT VERIFIED"}
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
                            className={`${styles.placeholderStatus} ${
                              item.verificationStatus ===
                              VerificationStatus.MISSING
                                ? styles.missing
                                : styles.notVerified
                            }`}
                          >
                            {item.verificationStatus ===
                            VerificationStatus.MISSING
                              ? "MISSING"
                              : "NOT VERIFIED"}
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

      {/* Simple counter at bottom */}
      <div className={styles.counter}>
        {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default GalleryPage;
