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
import { jewelleryStyles } from "../styles/jewelleryStyles";
import JewelleryNavigation from "../components/JewelleryNavigation";

const JewelleryList: React.FC = () => {
  const navigate = useNavigate();
  const [jewelleryItems, setJewelleryItems] = useState<Jewellery[]>([]);
  const [filteredItems, setFilteredItems] = useState<Jewellery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
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
    const fetchJewellery = async () => {
      try {
        console.log("Starting to fetch jewellery...");
        setError(null);

        const db = getFirestore();

        let q = query(collection(db, "jewellery"));

        if (!showInactive) {
          q = query(q, where("active", "==", true));
        }

        q = query(q, orderBy("code", "desc"));

        const snapshot = await getDocs(q);
        console.log(`Query returned ${snapshot.size} items`);

        const items: Jewellery[] = [];
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
            verificationStatus: data.verificationStatus || "Not Verified",
            verificationNotes: data.verificationNotes || "",
          };
          items.push(item);
        });

        console.log(`Parsed ${items.length} items`);
        setJewelleryItems(items);
        setFilteredItems(items); // Initialize filtered items
      } catch (error: any) {
        console.error("Error fetching jewellery:", error);

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

    fetchJewellery();
  }, [showInactive]);

  // Apply filters whenever search term or filters change
  useEffect(() => {
    if (jewelleryItems.length === 0) return;

    let result = jewelleryItems;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.code.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term),
      );
    }

    // Apply location filter
    if (selectedLocation) {
      result = result.filter((item) => item.location === selectedLocation);
    }

    // Apply boughtFor filter
    if (selectedBoughtFor) {
      result = result.filter((item) => item.boughtFor === selectedBoughtFor);
    }

    console.log(
      `Filtered ${result.length} items from ${jewelleryItems.length} total`,
    );
    setFilteredItems(result);
  }, [jewelleryItems, searchTerm, selectedLocation, selectedBoughtFor]);

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
    setError(null);
    setSearchTerm("");
    setSelectedLocation("");
    setSelectedBoughtFor("");

    setTimeout(() => {
      fetchJewellery();
    }, 100);
  };

  const fetchJewellery = async () => {
    try {
      const db = getFirestore();

      let q = query(collection(db, "jewellery"));

      if (!showInactive) {
        q = query(q, where("active", "==", true));
      }

      q = query(q, orderBy("code", "desc"));

      const snapshot = await getDocs(q);

      const items: Jewellery[] = [];
      snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
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

      setJewelleryItems(items);
      setFilteredItems(items);
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
    return { top: 60, right: 20 }; // Default position
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Close location filter if clicking outside
      if (
        showLocationFilter &&
        locationButtonRef.current &&
        !locationButtonRef.current.contains(target) &&
        !target.closest(".location-dropdown")
      ) {
        setShowLocationFilter(false);
      }

      // Close boughtFor filter if clicking outside
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
      <div style={jewelleryStyles.container}>
        <div style={jewelleryStyles.loading}>
          <div style={jewelleryStyles.spinner}></div>
          <p>Loading jewellery items...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={jewelleryStyles.container}>
      {/* Top Navigation with Search - SIMPLIFIED LAYOUT */}
      <div
        style={{
          ...jewelleryStyles.topNav,
          display: "flex",
          alignItems: "center",
          padding: "8px 10px",
          gap: "8px",
        }}
      >
        {/* Back Button - Fixed width */}
        <button
          onClick={() => navigate("/jewellery")}
          style={{
            ...jewelleryStyles.navButton,
            padding: "6px",
            fontSize: "16px",
            width: "36px",
            height: "36px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Back to Jewellery"
        >
          ←
        </button>

        {/* Search Box - Flexible width */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: "20px",
              border: "1px solid #e5e7eb",
              fontSize: "13px",
              backgroundColor: "white",
              color: "#374151",
            }}
          />
        </div>

        {/* Button Group - Auto width with small buttons */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            flexShrink: 0,
          }}
        >
          {/* Location Filter */}
          <button
            ref={locationButtonRef}
            onClick={() => {
              setShowBoughtForFilter(false);
              setShowLocationFilter(!showLocationFilter);
            }}
            style={{
              ...jewelleryStyles.navButton,
              padding: "5px",
              fontSize: "14px",
              width: "32px",
              height: "32px",
              backgroundColor: selectedLocation ? "#e0f2fe" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={`Filter by location${selectedLocation ? `: ${selectedLocation}` : ""}`}
          >
            📍
          </button>

          {/* Bought For Filter */}
          <button
            ref={boughtForButtonRef}
            onClick={() => {
              setShowLocationFilter(false);
              setShowBoughtForFilter(!showBoughtForFilter);
            }}
            style={{
              ...jewelleryStyles.navButton,
              padding: "5px",
              fontSize: "14px",
              width: "32px",
              height: "32px",
              backgroundColor: selectedBoughtFor ? "#e0f2fe" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={`Filter by purpose${selectedBoughtFor ? `: ${selectedBoughtFor}` : ""}`}
          >
            🎁
          </button>

          {/* Add Button */}
          <button
            onClick={() => navigate("/jewellery/add")}
            style={{
              ...jewelleryStyles.navButton,
              padding: "5px",
              fontSize: "14px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Add New"
          >
            ➕
          </button>

          {/* Settings Button - MUST BE VISIBLE */}
          <button
            onClick={() => navigate("/settings")}
            style={{
              ...jewelleryStyles.navButton,
              padding: "5px",
              fontSize: "14px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Dropdowns - RENDERED OUTSIDE THE TOP NAV */}
      {showLocationFilter && (
        <div
          className="location-dropdown"
          style={{
            position: "fixed",
            top: getDropdownPosition(locationButtonRef).top + "px",
            right: getDropdownPosition(locationButtonRef).right + "px",
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            padding: "8px",
            zIndex: 1000,
            minWidth: "180px",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#374151",
            }}
          >
            Filter by Location
          </div>
          <button
            onClick={() => {
              setSelectedLocation("");
              setShowLocationFilter(false);
            }}
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: "13px",
              textAlign: "left",
              backgroundColor: !selectedLocation ? "#f3f4f6" : "transparent",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#374151",
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
                width: "100%",
                padding: "8px 10px",
                fontSize: "13px",
                textAlign: "left",
                backgroundColor:
                  selectedLocation === location ? "#e0f2fe" : "transparent",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                marginBottom: "2px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#374151",
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
          style={{
            position: "fixed",
            top: getDropdownPosition(boughtForButtonRef).top + "px",
            right: getDropdownPosition(boughtForButtonRef).right + "px",
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            padding: "8px",
            zIndex: 1000,
            minWidth: "180px",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#374151",
            }}
          >
            Filter by Purpose
          </div>
          <button
            onClick={() => {
              setSelectedBoughtFor("");
              setShowBoughtForFilter(false);
            }}
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: "13px",
              textAlign: "left",
              backgroundColor: !selectedBoughtFor ? "#f3f4f6" : "transparent",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#374151",
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
                width: "100%",
                padding: "8px 10px",
                fontSize: "13px",
                textAlign: "left",
                backgroundColor:
                  selectedBoughtFor === boughtFor ? "#e0f2fe" : "transparent",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                marginBottom: "2px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#374151",
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
        <div
          style={{
            padding: "6px 12px",
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e5e7eb",
            fontSize: "11px",
            color: "#6b7280",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div style={{ flex: 1 }}>
            {searchTerm && <span>Search: "{searchTerm}"</span>}
            {selectedLocation && <span> • Location: {selectedLocation}</span>}
            {selectedBoughtFor && <span> • Purpose: {selectedBoughtFor}</span>}
          </div>
          <button
            onClick={clearFilters}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: "11px",
              padding: "2px 6px",
              borderRadius: "4px",
              backgroundColor: "#fee2e2",
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* ALL CONTENT INSIDE SCROLLABLE WRAPPER */}
      <div style={jewelleryStyles.contentWrapper}>
        {/* Error Display */}
        {error && (
          <div
            style={{
              margin: "10px 0",
              padding: "10px",
              backgroundColor: "#fef3c7",
              border: "1px solid #f59e0b",
              borderRadius: "6px",
              color: "#92400e",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>⚠️</span>
              <strong>Index Required</strong>
            </div>
            <div style={{ margin: "6px 0" }}>
              Create Firestore index for: jewellery, active, code
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => {
                  setShowInactive(true);
                  setError("Showing all items without sorting.");
                }}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
              >
                Show All
              </button>
              <button
                onClick={handleRefresh}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Items Count - Compact */}
        {!error && filteredItems.length > 0 && (
          <div
            style={{
              fontSize: "11px",
              color: "#6b7280",
              padding: "6px 12px 2px",
              textAlign: "right",
            }}
          >
            {filteredItems.length} items
            {filteredItems.length !== jewelleryItems.length &&
              ` (of ${jewelleryItems.length})`}
          </div>
        )}

        {/* Items List - Compact 2-Line Design */}
        <div style={{ padding: "0 0 5px 0" }}>
          {filteredItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#9ca3af",
                fontSize: "13px",
                margin: "10px",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>📦</div>
              <p>
                {jewelleryItems.length === 0
                  ? "No jewellery items found."
                  : "No items match your search/filters."}
              </p>
              {(searchTerm || selectedLocation || selectedBoughtFor) && (
                <button
                  onClick={clearFilters}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    marginTop: "8px",
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "white",
                    padding: "6px 10px",
                    minHeight: "50px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderBottom:
                      index < filteredItems.length - 1
                        ? "1px solid #e5e7eb"
                        : "none",
                  }}
                  onClick={() => navigate(`/jewellery/detail/${item.id}`)}
                >
                  {/* Item Image */}
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      flexShrink: 0,
                      backgroundColor: "#f3f4f6",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.code}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: "16px", color: "#9ca3af" }}>
                        💎
                      </div>
                    )}
                  </div>

                  {/* Item Details - EXACTLY 2 ROWS */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* ROW 1: Code + Description + Weight */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "6px",
                        marginBottom: "2px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "600",
                          fontSize: "13px",
                          color: "#111827",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.code}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          flex: 1,
                        }}
                      >
                        {item.description}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#374151",
                          fontWeight: "500",
                          whiteSpace: "nowrap",
                          marginLeft: "4px",
                        }}
                      >
                        {item.weight}g
                      </div>
                    </div>

                    {/* ROW 2: Location • Bought For */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: "10px",
                        color: "#9ca3af",
                        gap: "4px",
                      }}
                    >
                      {item.location && (
                        <>
                          <span>{item.location}</span>
                          {item.boughtFor && <span>•</span>}
                        </>
                      )}
                      {item.boughtFor && <span>{item.boughtFor}</span>}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor:
                        item.verificationStatus === "Verified"
                          ? "#10b981"
                          : item.verificationStatus === "Missing"
                            ? "#ef4444"
                            : "#d1d5db",
                      flexShrink: 0,
                    }}
                    title={item.verificationStatus}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Jewellery Navigation */}
        <JewelleryNavigation />

        {/* Minimal bottom spacing */}
        <div style={{ height: "5px" }}></div>
      </div>
    </div>
  );
};

export default JewelleryList;
