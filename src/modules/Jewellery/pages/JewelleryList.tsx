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
import { tw } from "../../../utils/tailwindMapping";
import { useJewellerySettings } from "../hooks/useSettingsData";

// Interface for Bill data
interface Bill {
  id: string;
  billNumber: string;
  purchaseDate: number;
  shopName: string;
  // Add other bill fields as needed
}

const JewelleryList: React.FC = () => {
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
    navigate(`/jewellery/edit/${itemId}`);
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
      <div className={tw.container}>
        <div className={tw.loading}>
          <div className={tw.spinner}></div>
          <p>Loading jewellery items and bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={tw.container}>
      {/* Top Navigation with Search */}
      <div className={`${tw.topNav} flex items-center p-2 gap-2`}>
        {/* Back Button */}
        <button
          onClick={() => navigate("/jewellery")}
          className={`${tw.navButton} p-1.5 text-base w-9 h-9 flex-shrink-0 flex items-center justify-center`}
          title="Back to Jewellery"
        >
          ←
        </button>

        {/* Search Box */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-full border border-gray-200 text-sm bg-white text-gray-700"
          />
        </div>

        {/* Button Group */}
        <div className="flex gap-1 flex-shrink-0">
          {/* Location Filter */}
          <button
            ref={locationButtonRef}
            onClick={() => {
              setShowBoughtForFilter(false);
              setShowLocationFilter(!showLocationFilter);
            }}
            className={`${tw.navButton} p-1.25 text-sm w-8 h-8 flex items-center justify-center ${selectedLocation ? "bg-blue-50" : ""}`}
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
            className={`${tw.navButton} p-1.25 text-sm w-8 h-8 flex items-center justify-center ${selectedBoughtFor ? "bg-blue-50" : ""}`}
            title={`Filter by purpose${selectedBoughtFor ? `: ${selectedBoughtFor}` : ""}`}
          >
            🎁
          </button>

          {/* Batch Edit Button */}
          <button
            onClick={() => navigate("/jewellery/batch-edit")}
            className={`${tw.navButton} p-1.25 text-sm w-8 h-8 flex items-center justify-center bg-blue-50`}
            title="Batch Edit Locations"
          >
            🔄
          </button>

          {/* Add Button */}
          <button
            onClick={() => navigate("/jewellery/add")}
            className={`${tw.navButton} p-1.25 text-sm w-8 h-8 flex items-center justify-center`}
            title="Add New"
          >
            ➕
          </button>

          {/* Settings Button */}
          <button
            onClick={() => navigate("/settings")}
            className={`${tw.navButton} p-1.25 text-sm w-8 h-8 flex items-center justify-center`}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Inactive Items Toggle */}
      {showInactiveSetting && (
        <div className="px-3 py-2 bg-slate-50 border-b border-gray-200 text-xs flex items-center gap-2">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Show inactive items</span>
          </label>
          <span className="text-[11px] text-gray-500">
            ({showInactive ? "Showing all" : "Active only"})
          </span>
        </div>
      )}

      {/* Dropdowns */}
      {showLocationFilter && (
        <div
          className="location-dropdown bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[180px] max-h-[300px] overflow-y-auto"
          style={{
            position: "fixed",
            top: getDropdownPosition(locationButtonRef).top + "px",
            right: getDropdownPosition(locationButtonRef).right + "px",
            zIndex: 1000,
          }}
        >
          <div className="text-sm font-semibold mb-2 text-gray-700">
            Filter by Location
          </div>
          <button
            onClick={() => {
              setSelectedLocation("");
              setShowLocationFilter(false);
            }}
            className={`w-full px-2.5 py-2 text-sm text-left rounded-md mb-1 flex items-center gap-2 text-gray-700 ${!selectedLocation ? "bg-gray-100" : ""}`}
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
              className={`w-full px-2.5 py-2 text-sm text-left rounded-md mb-0.5 flex items-center gap-2 text-gray-700 ${selectedLocation === location ? "bg-blue-50" : ""}`}
            >
              <span>📍</span>
              <span>{location}</span>
            </button>
          ))}
        </div>
      )}

      {showBoughtForFilter && (
        <div
          className="boughtfor-dropdown bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[180px] max-h-[300px] overflow-y-auto"
          style={{
            position: "fixed",
            top: getDropdownPosition(boughtForButtonRef).top + "px",
            right: getDropdownPosition(boughtForButtonRef).right + "px",
            zIndex: 1000,
          }}
        >
          <div className="text-sm font-semibold mb-2 text-gray-700">
            Filter by Purpose
          </div>
          <button
            onClick={() => {
              setSelectedBoughtFor("");
              setShowBoughtForFilter(false);
            }}
            className={`w-full px-2.5 py-2 text-sm text-left rounded-md mb-1 flex items-center gap-2 text-gray-700 ${!selectedBoughtFor ? "bg-gray-100" : ""}`}
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
              className={`w-full px-2.5 py-2 text-sm text-left rounded-md mb-0.5 flex items-center gap-2 text-gray-700 ${selectedBoughtFor === boughtFor ? "bg-blue-50" : ""}`}
            >
              <span>🎁</span>
              <span>{boughtFor}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filter Indicators */}
      {(searchTerm || selectedLocation || selectedBoughtFor) && (
        <div className="px-3 py-1.5 bg-slate-50 border-b border-gray-200 text-[11px] text-gray-500 flex items-center gap-2.5">
          <div className="flex-1">
            {searchTerm && <span>Search: "{searchTerm}"</span>}
            {selectedLocation && <span> • Location: {selectedLocation}</span>}
            {selectedBoughtFor && <span> • Purpose: {selectedBoughtFor}</span>}
          </div>
          <button
            onClick={clearFilters}
            className="bg-red-50 text-red-500 cursor-pointer text-[11px] px-1.5 py-0.5 rounded"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* ALL CONTENT INSIDE SCROLLABLE WRAPPER */}
      <div className={tw.contentWrapper}>
        {/* Error Display */}
        {error && (
          <div className="my-2.5 p-2.5 bg-amber-50 border border-amber-500 rounded text-amber-800 text-xs">
            <div className="flex items-center gap-1.5">
              <span>⚠️</span>
              <strong>Index Required</strong>
            </div>
            <div className="my-1.5">
              Create Firestore index for: jewellery, active, code
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setShowInactive(true);
                  setError("Showing all items without sorting.");
                }}
                className="px-2 py-1 bg-amber-500 text-white rounded cursor-pointer text-[11px]"
              >
                Show All
              </button>
              <button
                onClick={handleRefresh}
                className="px-2 py-1 bg-blue-600 text-white rounded cursor-pointer text-[11px]"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Items Count */}
        {!error && filteredItems.length > 0 && (
          <div className="text-[11px] text-gray-500 px-3 pt-1.5 pb-0.5 text-right">
            {filteredItems.length} items
            {filteredItems.length !== jewelleryItems.length &&
              ` (of ${jewelleryItems.length})`}
            {showInactive &&
              ` • Showing ${showInactive ? "all" : "active only"}`}
          </div>
        )}

        {/* Items List */}
        <div className="pb-1.25">
          {filteredItems.length === 0 ? (
            <div className="text-center p-5 text-gray-400 text-sm m-2.5">
              <div className="text-2xl mb-2">📦</div>
              <p>
                {jewelleryItems.length === 0
                  ? "No jewellery items found."
                  : "No items match your search/filters."}
              </p>
              {(searchTerm || selectedLocation || selectedBoughtFor) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded cursor-pointer text-sm mt-2"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredItems.map((item, index) => {
                // Get bill details for this item
                const billDetails = getBillDetails(item.billId);
                const purchaseDate =
                  billDetails?.purchaseDate || item.purchaseDate;
                const formattedDate = formatDate(purchaseDate);

                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/jewellery/detail/${item.id}`)}
                    className={`bg-white px-2.5 py-1.5 min-h-[50px] cursor-pointer flex items-center gap-2 relative ${index < filteredItems.length - 1 ? "border-b border-gray-200" : ""} ${item.active ? "" : "opacity-70"}`}
                  >
                    {/* Item Image */}
                    <div
                      className={`w-10 h-10 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center overflow-hidden ${!item.active ? "border border-dashed border-gray-400" : ""}`}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.code}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-base text-gray-400">💎</div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div
                      className={`flex-1 min-w-0 ${showDeleteSetting ? "pr-9" : ""}`}
                    >
                      {/* ROW 1: Code + Description + Weight */}
                      <div className="flex items-baseline justify-between mb-0.5 gap-1.5">
                        <div className="flex items-baseline gap-1 min-w-0 flex-1">
                          <div
                            className={`font-semibold text-sm whitespace-nowrap ${item.active ? "text-gray-900" : "text-gray-500"}`}
                          >
                            {item.code}
                          </div>
                          {!item.active && (
                            <span className="text-[9px] bg-gray-400 text-white px-1 py-0.25 rounded-full whitespace-nowrap">
                              Inactive
                            </span>
                          )}
                          <div className="text-[11px] text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0">
                            {item.description}
                          </div>
                        </div>
                        <div className="text-xs text-gray-700 font-medium whitespace-nowrap flex-shrink-0">
                          {item.weight}g
                        </div>
                      </div>

                      {/* ROW 2: Location • Bought For • Purchase Date */}
                      <div className="flex items-center text-[10px] text-gray-400 gap-1 flex-wrap">
                        {item.location && (
                          <>
                            <span>{item.location}</span>
                            {(item.boughtFor || formattedDate) && (
                              <span>•</span>
                            )}
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
                        {!item.location &&
                          !item.boughtFor &&
                          !formattedDate && (
                            <span className="italic">No details</span>
                          )}
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${showDeleteSetting ? "mr-9" : ""} ${
                        item.verificationStatus === "Verified"
                          ? "bg-emerald-500"
                          : item.verificationStatus === "Missing"
                            ? "bg-red-500"
                            : "bg-gray-300"
                      }`}
                      title={item.verificationStatus}
                    />

                    {/* Edit Button */}
                    {showDeleteSetting && (
                      <button
                        onClick={(e) => handleEditClick(e, item.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent text-blue-600 cursor-pointer p-1 rounded flex items-center justify-center w-7 h-7 z-10 hover:bg-blue-50"
                        title="Edit"
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

        {/* Minimal bottom spacing */}
        <div className="h-1.25"></div>
      </div>
    </div>
  );
};

export default JewelleryList;
