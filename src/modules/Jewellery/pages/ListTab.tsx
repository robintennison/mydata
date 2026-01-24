// src/modules/jewellery/ListTab.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { Jewellery } from "../models/types";
import { useJewellerySettings } from "../hooks/useSettingsData";

// Interface for Bill data
interface Bill {
  id: string;
  billNumber: string;
  purchaseDate: number;
  shopName: string;
  // Add other bill fields as needed
}

const ListTab: React.FC = () => {
  const navigate = useNavigate();
  const { showInactive: showInactiveSetting, showDelete: showDeleteSetting } =
    useJewellerySettings();

  const [jewelleryItems, setJewelleryItems] = useState<Jewellery[]>([]);
  const [filteredItems, setFilteredItems] = useState<Jewellery[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(showInactiveSetting);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [showBoughtForFilter, setShowBoughtForFilter] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedBoughtFor, setSelectedBoughtFor] = useState<string>("");

  // Refs for dropdown positioning
  const locationButtonRef = useRef<HTMLButtonElement>(null);
  const boughtForButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Starting to fetch jewellery and bills...");
        setError(null);

        const db = getFirestore();

        // Fetch jewellery items
        let jewelleryQuery = query(collection(db, "jewellery"));

        if (!showInactive) {
          jewelleryQuery = query(jewelleryQuery, where("active", "==", true));
        }

        jewelleryQuery = query(jewelleryQuery, orderBy("code", "desc"));

        // Fetch bills in parallel
        const billsQuery = query(collection(db, "bills"));

        const [jewellerySnapshot, billsSnapshot] = await Promise.all([
          getDocs(jewelleryQuery),
          getDocs(billsQuery),
        ]);

        console.log(`Jewellery query returned ${jewellerySnapshot.size} items`);
        console.log(`Bills query returned ${billsSnapshot.size} items`);

        // Parse jewellery items
        const items: Jewellery[] = [];
        jewellerySnapshot.forEach(
          (doc: QueryDocumentSnapshot<DocumentData>) => {
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
              verificationStatus: data.verificationStatus || "Not Verified",
              verificationNotes: data.verificationNotes || "",
            };
            items.push(item);
          },
        );

        // Parse bills
        const billItems: Bill[] = [];
        billsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          const bill: Bill = {
            id: doc.id,
            billNumber: data.billNumber || "",
            purchaseDate: data.purchaseDate || 0,
            shopName: data.shopName || "",
          };
          billItems.push(bill);
        });

        console.log(
          `Parsed ${items.length} jewellery items and ${billItems.length} bills`,
        );
        setJewelleryItems(items);
        setFilteredItems(items);
        setBills(billItems);
      } catch (error: any) {
        console.error("Error fetching data:", error);

        if (
          error.code === "failed-precondition" &&
          error.message.includes("index")
        ) {
          setError(`Index required. Please create a Firestore composite index for:
            Collection: jewellery
            Fields: active (ascending), code (descending)
            
            Or click the link in the browser console to create it automatically.`);
        } else {
          setError(`Failed to load: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showInactive]);

  // Apply filters whenever search term or filters change
  useEffect(() => {
    if (jewelleryItems.length === 0) return;

    let result = jewelleryItems;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.code.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term),
      );
    }

    if (selectedLocation) {
      result = result.filter((item) => item.location === selectedLocation);
    }

    if (selectedBoughtFor) {
      result = result.filter((item) => item.boughtFor === selectedBoughtFor);
    }

    console.log(
      `Filtered ${result.length} items from ${jewelleryItems.length} total`,
    );
    setFilteredItems(result);
  }, [jewelleryItems, searchTerm, selectedLocation, selectedBoughtFor]);

  // Get bill details for a jewellery item
  const getBillDetails = (billId: string | undefined) => {
    if (!billId) return null;
    return bills.find((bill) => bill.id === billId);
  };

  // Format date for display
  const formatDate = (timestamp: number): string => {
    if (!timestamp || timestamp === 0) return "";

    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Get unique locations and boughtFor values for filters
  const locations = Array.from(
    new Set(jewelleryItems.map((item) => item.location).filter(Boolean)),
  ).sort();

  const boughtForOptions = Array.from(
    new Set(jewelleryItems.map((item) => item.boughtFor).filter(Boolean)),
  ).sort();

  const handleRefresh = () => {
    setLoading(true);
    setJewelleryItems([]);
    setFilteredItems([]);
    setBills([]);
    setError(null);
    setSearchTerm("");
    setSelectedLocation("");
    setSelectedBoughtFor("");

    setTimeout(() => {
      fetchData();
    }, 100);
  };

  const fetchData = async () => {
    try {
      const db = getFirestore();

      let jewelleryQuery = query(collection(db, "jewellery"));

      if (!showInactive) {
        jewelleryQuery = query(jewelleryQuery, where("active", "==", true));
      }

      jewelleryQuery = query(jewelleryQuery, orderBy("code", "desc"));

      const billsQuery = query(collection(db, "bills"));

      const [jewellerySnapshot, billsSnapshot] = await Promise.all([
        getDocs(jewelleryQuery),
        getDocs(billsQuery),
      ]);

      const items: Jewellery[] = [];
      jewellerySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        items.push({
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
          verificationStatus: data.verificationStatus || "Not Verified",
          verificationNotes: data.verificationNotes || "",
        });
      });

      const billItems: Bill[] = [];
      billsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        billItems.push({
          id: doc.id,
          billNumber: data.billNumber || "",
          purchaseDate: data.purchaseDate || 0,
          shopName: data.shopName || "",
        });
      });

      setJewelleryItems(items);
      setFilteredItems(items);
      setBills(billItems);
      setError(null);
    } catch (error: any) {
      console.error("Refresh error:", error);
      setError(`Refresh failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedLocation("");
    setSelectedBoughtFor("");
    setShowLocationFilter(false);
    setShowBoughtForFilter(false);
  };

  // Handle edit button click
  const handleEditClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    navigate(`/jewellery/edit/${itemId}`, {
      state: { returnTo: "/jewellery", activeTab: "list" },
    });
  };

  // Handle view detail
  const handleViewDetail = (itemId: string) => {
    navigate(`/jewellery/detail/${itemId}`, {
      state: { returnTo: "/jewellery", activeTab: "list" },
    });
  };

  // Get dropdown position
  const getDropdownPosition = (
    buttonRef: React.RefObject<HTMLButtonElement | null>,
  ) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      return {
        top: rect.bottom + window.scrollY + 5,
        right: window.innerWidth - rect.right,
      };
    }
    return { top: 60, right: 20 };
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (
        showLocationFilter &&
        locationButtonRef.current &&
        !locationButtonRef.current.contains(target) &&
        !target.closest(".location-dropdown")
      ) {
        setShowLocationFilter(false);
      }

      if (
        showBoughtForFilter &&
        boughtForButtonRef.current &&
        !boughtForButtonRef.current.contains(target) &&
        !target.closest(".boughtfor-dropdown")
      ) {
        setShowBoughtForFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLocationFilter, showBoughtForFilter]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading jewellery items and bills...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <div style={styles.searchInputContainer}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <div style={styles.searchIcon}>🔍</div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={styles.clearSearchButton}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Filter Buttons Row */}
      <div style={styles.filterRow}>
        <div style={styles.filterButtons}>
          {/* Location Filter */}
          <button
            ref={locationButtonRef}
            onClick={() => {
              setShowBoughtForFilter(false);
              setShowLocationFilter(!showLocationFilter);
            }}
            style={{
              ...styles.filterButton,
              backgroundColor: selectedLocation ? "#e0f2fe" : "#f8fafc",
            }}
            title={`Filter by location${selectedLocation ? `: ${selectedLocation}` : ""}`}
          >
            📍 Location
          </button>

          {/* Bought For Filter */}
          <button
            ref={boughtForButtonRef}
            onClick={() => {
              setShowLocationFilter(false);
              setShowBoughtForFilter(!showBoughtForFilter);
            }}
            style={{
              ...styles.filterButton,
              backgroundColor: selectedBoughtFor ? "#e0f2fe" : "#f8fafc",
            }}
            title={`Filter by purpose${selectedBoughtFor ? `: ${selectedBoughtFor}` : ""}`}
          >
            🎁 Purpose
          </button>

          {/* Batch Edit Button */}
          <button
            onClick={() => navigate("/jewellery/batch-edit")}
            style={styles.filterButton}
            title="Batch Edit Locations"
          >
            🔄 Batch Edit
          </button>
        </div>
      </div>

      {/* Inactive Items Toggle */}
      {showInactiveSetting && (
        <div style={styles.inactiveToggle}>
          <label style={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              style={styles.toggleCheckbox}
            />
            <span>Show inactive items</span>
          </label>
          <span style={styles.toggleStatus}>
            ({showInactive ? "Showing all" : "Active only"})
          </span>
        </div>
      )}

      {/* Dropdowns */}
      {showLocationFilter && (
        <div
          className="location-dropdown"
          style={styles.dropdown(getDropdownPosition(locationButtonRef))}
        >
          <div style={styles.dropdownTitle}>Filter by Location</div>
          <button
            onClick={() => {
              setSelectedLocation("");
              setShowLocationFilter(false);
            }}
            style={{
              ...styles.dropdownItem,
              backgroundColor: !selectedLocation ? "#f3f4f6" : "transparent",
            }}
          >
            <span>📍</span>
            <span>All Locations</span>
          </button>
          {locations.map((location) => (
            <button
              key={location}
              onClick={() => {
                setSelectedLocation(location);
                setShowLocationFilter(false);
              }}
              style={{
                ...styles.dropdownItem,
                backgroundColor:
                  selectedLocation === location ? "#e0f2fe" : "transparent",
              }}
            >
              <span>📍</span>
              <span>{location}</span>
            </button>
          ))}
        </div>
      )}

      {showBoughtForFilter && (
        <div
          className="boughtfor-dropdown"
          style={styles.dropdown(getDropdownPosition(boughtForButtonRef))}
        >
          <div style={styles.dropdownTitle}>Filter by Purpose</div>
          <button
            onClick={() => {
              setSelectedBoughtFor("");
              setShowBoughtForFilter(false);
            }}
            style={{
              ...styles.dropdownItem,
              backgroundColor: !selectedBoughtFor ? "#f3f4f6" : "transparent",
            }}
          >
            <span>🎁</span>
            <span>All Purposes</span>
          </button>
          {boughtForOptions.map((boughtFor) => (
            <button
              key={boughtFor}
              onClick={() => {
                setSelectedBoughtFor(boughtFor);
                setShowBoughtForFilter(false);
              }}
              style={{
                ...styles.dropdownItem,
                backgroundColor:
                  selectedBoughtFor === boughtFor ? "#e0f2fe" : "transparent",
              }}
            >
              <span>🎁</span>
              <span>{boughtFor}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filter Indicators */}
      {(searchTerm || selectedLocation || selectedBoughtFor) && (
        <div style={styles.filterIndicators}>
          <div style={styles.filterText}>
            {searchTerm && <span>Search: "{searchTerm}"</span>}
            {selectedLocation && <span> • Location: {selectedLocation}</span>}
            {selectedBoughtFor && <span> • Purpose: {selectedBoughtFor}</span>}
          </div>
          <button onClick={clearFilters} style={styles.clearFiltersButton}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={styles.errorContainer}>
          <div style={styles.errorHeader}>
            <span>⚠️</span>
            <strong>Index Required</strong>
          </div>
          <div style={styles.errorMessage}>
            Create Firestore index for: jewellery, active, code
          </div>
          <div style={styles.errorButtons}>
            <button
              onClick={() => {
                setShowInactive(true);
                setError("Showing all items without sorting.");
              }}
              style={styles.errorButton}
            >
              Show All
            </button>
            <button
              onClick={handleRefresh}
              style={{ ...styles.errorButton, backgroundColor: "#3b82f6" }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Items Count */}
      {!error && filteredItems.length > 0 && (
        <div style={styles.itemsCount}>
          {filteredItems.length} items
          {filteredItems.length !== jewelleryItems.length &&
            ` (of ${jewelleryItems.length})`}
          {showInactive && ` • Showing ${showInactive ? "all" : "active only"}`}
        </div>
      )}

      {/* Items List */}
      <div style={styles.listContainer}>
        {filteredItems.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📦</div>
            <p style={styles.emptyText}>
              {jewelleryItems.length === 0
                ? "No jewellery items found."
                : "No items match your search/filters."}
            </p>
            {(searchTerm || selectedLocation || selectedBoughtFor) && (
              <button onClick={clearFilters} style={styles.emptyClearButton}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div style={styles.itemsList}>
            {filteredItems.map((item, index) => {
              // Get bill details for this item
              const billDetails = getBillDetails(item.billId);
              const purchaseDate =
                billDetails?.purchaseDate || item.purchaseDate;
              const formattedDate = formatDate(purchaseDate);

              return (
                <div
                  key={item.id}
                  style={styles.itemCard(
                    index === filteredItems.length - 1,
                    item.active,
                  )}
                  onClick={() => handleViewDetail(item.id)}
                >
                  {/* Item Image */}
                  <div style={styles.itemImage(!item.active)}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.code}
                        style={styles.itemImageContent}
                      />
                    ) : (
                      <div style={styles.itemImagePlaceholder}>💎</div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div style={styles.itemDetails(!!showDeleteSetting)}>
                    {/* ROW 1: Code + Description + Weight */}
                    <div style={styles.itemRow1}>
                      <div style={styles.itemCodeSection}>
                        <div style={styles.itemCode(!item.active)}>
                          {item.code}
                        </div>
                        {!item.active && (
                          <span style={styles.inactiveBadge}>Inactive</span>
                        )}
                        <div style={styles.itemDescription}>
                          {item.description}
                        </div>
                      </div>
                      <div style={styles.itemWeight}>{item.weight}g</div>
                    </div>

                    {/* ROW 2: Location • Bought For • Purchase Date */}
                    <div style={styles.itemRow2}>
                      {item.location && (
                        <>
                          <span>{item.location}</span>
                          {(item.boughtFor || formattedDate) && <span>•</span>}
                        </>
                      )}
                      {item.boughtFor && (
                        <>
                          <span>{item.boughtFor}</span>
                          {formattedDate && <span>•</span>}
                        </>
                      )}
                      {formattedDate && (
                        <span title={`Purchase Date: ${formattedDate}`}>
                          📅 {formattedDate}
                        </span>
                      )}
                      {!item.location && !item.boughtFor && !formattedDate && (
                        <span style={{ fontStyle: "italic" }}>No details</span>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div
                    style={styles.statusIndicator(
                      item.verificationStatus,
                      !!showDeleteSetting,
                    )}
                    title={item.verificationStatus}
                  />

                  {/* Edit Button */}
                  {showDeleteSetting && (
                    <button
                      onClick={(e) => handleEditClick(e, item.id)}
                      style={styles.editButton}
                      title="Edit"
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#e0f2fe";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      ✏️
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "16px",
    maxWidth: "800px",
    margin: "0 auto",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "300px",
  },
  spinner: {
    border: "4px solid #f3f4f6",
    borderTop: "4px solid #f59e0b",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  loadingText: {
    fontSize: "14px",
    color: "#6b7280",
  },
  searchContainer: {
    marginBottom: "16px",
  },
  searchInputContainer: {
    position: "relative" as React.CSSProperties["position"],
    width: "100%",
  },
  searchInput: {
    width: "100%",
    padding: "10px 40px 10px 16px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
    backgroundColor: "white",
    color: "#374151",
    boxSizing: "border-box" as const,
  },
  searchIcon: {
    position: "absolute" as React.CSSProperties["position"],
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#6c757d",
    pointerEvents: "none" as const,
  },
  clearSearchButton: {
    position: "absolute" as React.CSSProperties["position"],
    right: "36px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: "18px",
    padding: "0",
  },
  filterRow: {
    marginBottom: "12px",
  },
  filterButtons: {
    display: "flex" as const,
    gap: "8px",
    overflowX: "auto" as const,
    paddingBottom: "4px",
  },
  filterButton: {
    padding: "8px 12px",
    fontSize: "12px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "#374151",
  },
  inactiveToggle: {
    padding: "8px 12px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    borderRadius: "6px",
  },
  toggleLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  toggleCheckbox: {
    width: "16px",
    height: "16px",
  },
  toggleStatus: {
    fontSize: "11px",
    color: "#6b7280",
  },
  dropdown: (position: { top: number; right: number }) => ({
    position: "fixed" as React.CSSProperties["position"],
    top: position.top + "px",
    right: position.right + "px",
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    padding: "8px",
    zIndex: 1000,
    minWidth: "180px",
    maxHeight: "300px",
    overflowY: "auto" as const,
  }),
  dropdownTitle: {
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#374151",
  },
  dropdownItem: {
    width: "100%",
    padding: "8px 10px",
    fontSize: "13px",
    textAlign: "left" as const,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "2px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#374151",
  },
  filterIndicators: {
    padding: "6px 12px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "11px",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
    borderRadius: "6px",
  },
  filterText: {
    flex: 1,
  },
  clearFiltersButton: {
    background: "none",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "11px",
    padding: "2px 6px",
    borderRadius: "4px",
    backgroundColor: "#fee2e2",
  },
  errorContainer: {
    margin: "10px 0",
    padding: "10px",
    backgroundColor: "#fef3c7",
    border: "1px solid #f59e0b",
    borderRadius: "6px",
    color: "#92400e",
    fontSize: "12px",
    marginBottom: "12px",
  },
  errorHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  errorMessage: {
    margin: "6px 0",
  },
  errorButtons: {
    display: "flex",
    gap: "6px",
  },
  errorButton: {
    padding: "4px 8px",
    backgroundColor: "#f59e0b",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
  },
  itemsCount: {
    fontSize: "11px",
    color: "#6b7280",
    padding: "6px 12px 2px",
    textAlign: "right" as const,
    marginBottom: "8px",
  },
  listContainer: {
    padding: "0 0 5px 0",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "20px",
    color: "#9ca3af",
    fontSize: "13px",
    margin: "10px",
  },
  emptyIcon: {
    fontSize: "24px",
    marginBottom: "8px",
  },
  emptyText: {
    margin: "0",
  },
  emptyClearButton: {
    padding: "6px 12px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    marginTop: "8px",
  },
  itemsList: {
    display: "flex",
    flexDirection: "column" as const,
  },
  itemCard: (isLast: boolean, isActive: boolean) => ({
    backgroundColor: "white",
    padding: "6px 10px",
    minHeight: "50px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderBottom: isLast ? "none" : "1px solid #e5e7eb",
    opacity: isActive ? 1 : 0.7,
    position: "relative" as React.CSSProperties["position"],
    borderRadius: "6px",
    marginBottom: "4px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  }),
  itemImage: (isInactive: boolean) => ({
    width: "40px",
    height: "40px",
    flexShrink: 0,
    backgroundColor: "#f3f4f6",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    border: isInactive ? "1px dashed #9ca3af" : "none",
  }),
  itemImageContent: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  itemImagePlaceholder: {
    fontSize: "16px",
    color: "#9ca3af",
  },
  itemDetails: (hasEditButton: boolean) => ({
    flex: 1,
    minWidth: 0,
    paddingRight: hasEditButton ? "36px" : "0",
  }),
  itemRow1: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: "2px",
    gap: "6px",
  },
  itemCodeSection: {
    display: "flex",
    alignItems: "baseline",
    gap: "4px",
    minWidth: 0,
    flex: 1,
  },
  itemCode: (isInactive: boolean) => ({
    fontWeight: "600",
    fontSize: "13px",
    color: isInactive ? "#6b7280" : "#111827",
    whiteSpace: "nowrap" as const,
  }),
  inactiveBadge: {
    fontSize: "9px",
    backgroundColor: "#9ca3af",
    color: "white",
    padding: "1px 4px",
    borderRadius: "8px",
    whiteSpace: "nowrap" as const,
  },
  itemDescription: {
    fontSize: "11px",
    color: "#6b7280",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
    minWidth: 0,
  },
  itemWeight: {
    fontSize: "12px",
    color: "#374151",
    fontWeight: "500",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
  itemRow2: {
    display: "flex",
    alignItems: "center",
    fontSize: "10px",
    color: "#9ca3af",
    gap: "4px",
    flexWrap: "wrap" as const,
  },
  statusIndicator: (verificationStatus: string, hasEditButton: boolean) => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor:
      verificationStatus === "Verified"
        ? "#10b981"
        : verificationStatus === "Missing"
          ? "#ef4444"
          : "#d1d5db",
    flexShrink: 0,
    marginRight: hasEditButton ? "36px" : "0",
  }),
  editButton: {
    position: "absolute" as React.CSSProperties["position"],
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    backgroundColor: "transparent",
    border: "none",
    fontSize: "14px",
    color: "#3b82f6",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    zIndex: 2,
  },
};

export default ListTab;
