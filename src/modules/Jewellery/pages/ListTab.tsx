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

// Sorting types
type SortField = "code" | "weight";
type SortDirection = "asc" | "desc";

// Sort option interface
interface SortOption {
  field: SortField;
  direction: SortDirection;
  label: string;
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

  // New state for sorting
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>({
    field: "code",
    direction: "desc",
    label: "Code (Z→A)",
  });

  // Refs for dropdown positioning
  const locationButtonRef = useRef<HTMLButtonElement>(null);
  const boughtForButtonRef = useRef<HTMLButtonElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);

  // Available sort options - SIMPLIFIED to only code and weight
  const sortOptions: SortOption[] = [
    { field: "code", direction: "asc", label: "Code (A→Z)" },
    { field: "code", direction: "desc", label: "Code (Z→A)" },
    { field: "weight", direction: "asc", label: "Weight (Low→High)" },
    { field: "weight", direction: "desc", label: "Weight (High→Low)" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Starting to fetch jewellery and bills...");
        setError(null);

        const db = getFirestore();

        // Fetch jewellery items - Default sorting by code desc
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
        // Apply initial sort
        const sortedItems = sortItems(items, currentSort);
        setFilteredItems(sortedItems);
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

  // Sort function - Fixed TypeScript error
  const sortItems = (
    items: Jewellery[],
    sortOption: SortOption,
  ): Jewellery[] => {
    const { field, direction } = sortOption;

    return [...items].sort((a, b) => {
      // Handle different data types based on the field
      if (field === "weight") {
        const valueA = a.weight || 0;
        const valueB = b.weight || 0;
        return direction === "asc" ? valueA - valueB : valueB - valueA;
      }

      // For code sorting
      if (field === "code") {
        const strA = (a.code || "").toLowerCase();
        const strB = (b.code || "").toLowerCase();
        return direction === "asc"
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      }

      // Default fallback - should never reach here
      return 0;
    });
  };

  // Apply filters and sorting whenever dependencies change
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

    // Apply sorting
    result = sortItems(result, currentSort);

    console.log(
      `Filtered ${result.length} items from ${jewelleryItems.length} total`,
    );
    setFilteredItems(result);
  }, [
    jewelleryItems,
    searchTerm,
    selectedLocation,
    selectedBoughtFor,
    currentSort,
  ]);

  // Handle sort selection
  const handleSortSelect = (sortOption: SortOption) => {
    setCurrentSort(sortOption);
    setShowSortOptions(false);
  };

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
      // Apply current sort to fetched items
      const sortedItems = sortItems(items, currentSort);
      setFilteredItems(sortedItems);
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
    setShowSortOptions(false);
    // Reset sort to default
    setCurrentSort({
      field: "code",
      direction: "desc",
      label: "Code (Z→A)",
    });
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

      if (
        showSortOptions &&
        sortButtonRef.current &&
        !sortButtonRef.current.contains(target) &&
        !target.closest(".sort-dropdown")
      ) {
        setShowSortOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLocationFilter, showBoughtForFilter, showSortOptions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px]">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-amber-500 rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-gray-500">
          Loading jewellery items and bills...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full p-0 m-0">
      {/* Search and Filter Buttons in One Row */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5">
          {/* Search Box - Takes remaining space */}
          <div className="flex-1 min-w-0">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-3 pr-8 rounded-lg border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                🔍
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-7 top-1/2 -translate-y-1/2 bg-transparent text-gray-400 cursor-pointer text-sm p-0 hover:text-gray-600 focus:outline-none"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Location Filter Button */}
          <button
            ref={locationButtonRef}
            onClick={() => {
              setShowBoughtForFilter(false);
              setShowSortOptions(false);
              setShowLocationFilter(!showLocationFilter);
            }}
            className={`px-2.5 py-2 text-xs border border-gray-200 rounded-md cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-0.5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              selectedLocation ? "bg-sky-100 border-sky-200" : "bg-slate-50"
            }`}
            title={`Filter by location${selectedLocation ? `: ${selectedLocation}` : ""}`}
          >
            <span className="text-xs">📍</span>
            <span className="hidden xs:inline">Loc</span>
          </button>

          {/* Bought For Filter Button */}
          <button
            ref={boughtForButtonRef}
            onClick={() => {
              setShowLocationFilter(false);
              setShowSortOptions(false);
              setShowBoughtForFilter(!showBoughtForFilter);
            }}
            className={`px-2.5 py-2 text-xs border border-gray-200 rounded-md cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-0.5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              selectedBoughtFor ? "bg-sky-100 border-sky-200" : "bg-slate-50"
            }`}
            title={`Filter by purpose${selectedBoughtFor ? `: ${selectedBoughtFor}` : ""}`}
          >
            <span className="text-xs">🎁</span>
            <span className="hidden xs:inline">Purp</span>
          </button>

          {/* Sort Button */}
          <button
            ref={sortButtonRef}
            onClick={() => {
              setShowLocationFilter(false);
              setShowBoughtForFilter(false);
              setShowSortOptions(!showSortOptions);
            }}
            className={`px-2.5 py-2 text-xs border border-gray-200 rounded-md cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-0.5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              currentSort.field !== "code" || currentSort.direction !== "desc"
                ? "bg-sky-100 border-sky-200"
                : "bg-slate-50"
            }`}
            title={`Sort by: ${currentSort.label}`}
          >
            <span className="text-xs">
              {currentSort.direction === "asc" ? "↑" : "↓"}
            </span>
            <span className="hidden xs:inline">Sort</span>
          </button>

          {/* Batch Edit Button */}
          <button
            onClick={() => navigate("/jewellery/batch-edit")}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-gray-200 rounded-md cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-0.5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            title="Batch Edit Locations"
          >
            <span className="text-xs">🔄</span>
            <span className="hidden xs:inline">Batch</span>
          </button>
        </div>
      </div>

      {/* Inactive Items Toggle - MOVED to Filter Indicators row to save space */}
      {showInactiveSetting && (
        <div className="px-3 py-1.5 bg-slate-50 border border-gray-200 text-[11px] text-gray-500 flex items-center gap-2 mb-3 rounded-md">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-3.5 h-3.5 cursor-pointer text-blue-600 focus:ring-blue-500"
            />
            <span>Show inactive items</span>
          </label>
          <span className="text-[10px] text-gray-500 ml-auto">
            ({showInactive ? "Showing all" : "Active only"})
          </span>
        </div>
      )}

      {/* Dropdowns */}
      {showLocationFilter && (
        <div
          className="location-dropdown fixed bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-[1000] min-w-[160px] max-h-[300px] overflow-y-auto"
          style={{
            top: `${getDropdownPosition(locationButtonRef).top}px`,
            right: `${getDropdownPosition(locationButtonRef).right}px`,
          }}
        >
          <div className="text-[13px] font-semibold mb-2 text-gray-700">
            Filter by Location
          </div>
          <button
            onClick={() => {
              setSelectedLocation("");
              setShowLocationFilter(false);
            }}
            className={`w-full p-2.5 text-[13px] text-left rounded-md cursor-pointer mb-0.5 flex items-center gap-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              !selectedLocation ? "bg-gray-100" : "bg-transparent"
            }`}
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
              className={`w-full p-2.5 text-[13px] text-left rounded-md cursor-pointer mb-0.5 flex items-center gap-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                selectedLocation === location ? "bg-sky-100" : "bg-transparent"
              }`}
            >
              <span>📍</span>
              <span>{location}</span>
            </button>
          ))}
        </div>
      )}

      {showBoughtForFilter && (
        <div
          className="boughtfor-dropdown fixed bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-[1000] min-w-[160px] max-h-[300px] overflow-y-auto"
          style={{
            top: `${getDropdownPosition(boughtForButtonRef).top}px`,
            right: `${getDropdownPosition(boughtForButtonRef).right}px`,
          }}
        >
          <div className="text-[13px] font-semibold mb-2 text-gray-700">
            Filter by Purpose
          </div>
          <button
            onClick={() => {
              setSelectedBoughtFor("");
              setShowBoughtForFilter(false);
            }}
            className={`w-full p-2.5 text-[13px] text-left rounded-md cursor-pointer mb-0.5 flex items-center gap-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              !selectedBoughtFor ? "bg-gray-100" : "bg-transparent"
            }`}
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
              className={`w-full p-2.5 text-[13px] text-left rounded-md cursor-pointer mb-0.5 flex items-center gap-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                selectedBoughtFor === boughtFor
                  ? "bg-sky-100"
                  : "bg-transparent"
              }`}
            >
              <span>🎁</span>
              <span>{boughtFor}</span>
            </button>
          ))}
        </div>
      )}

      {showSortOptions && (
        <div
          className="sort-dropdown fixed bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-[1000] min-w-[160px] max-h-[300px] overflow-y-auto"
          style={{
            top: `${getDropdownPosition(sortButtonRef).top}px`,
            right: `${getDropdownPosition(sortButtonRef).right}px`,
          }}
        >
          <div className="text-[13px] font-semibold mb-2 text-gray-700">
            Sort By
          </div>
          {sortOptions.map((option) => (
            <button
              key={`${option.field}-${option.direction}`}
              onClick={() => handleSortSelect(option)}
              className={`w-full p-2.5 text-[13px] text-left rounded-md cursor-pointer mb-0.5 flex items-center gap-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                currentSort.field === option.field &&
                currentSort.direction === option.direction
                  ? "bg-sky-100"
                  : "bg-transparent"
              }`}
            >
              <span className="text-xs">
                {option.direction === "asc" ? "↑" : "↓"}
              </span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filter Indicators - OPTIMIZED: Combined with show inactive toggle */}
      {(searchTerm ||
        selectedLocation ||
        selectedBoughtFor ||
        currentSort.field !== "code" ||
        currentSort.direction !== "desc") && (
        <div className="px-3 py-1.5 bg-slate-50 border border-gray-200 text-[11px] text-gray-500 flex items-center gap-2.5 mb-3 rounded-md">
          <div className="flex-1 truncate flex items-center gap-1.5">
            {searchTerm && <span>Search: "{searchTerm}"</span>}
            {selectedLocation && <span>• Loc: {selectedLocation}</span>}
            {selectedBoughtFor && <span>• Purp: {selectedBoughtFor}</span>}
            {(currentSort.field !== "code" ||
              currentSort.direction !== "desc") && (
              <span>• Sort: {currentSort.label}</span>
            )}
          </div>
          <button
            onClick={clearFilters}
            className="bg-red-100 text-red-500 cursor-pointer text-[11px] px-1.5 py-0.5 rounded hover:bg-red-200 focus:outline-none focus:ring-1 focus:ring-red-500 shrink-0"
          >
            Clear
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="my-2.5 p-2.5 bg-amber-50 border border-amber-500 rounded-md text-amber-800 text-xs mb-3">
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
              className="px-2 py-1 bg-amber-500 text-white rounded cursor-pointer text-[11px] hover:bg-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-300"
            >
              Show All
            </button>
            <button
              onClick={handleRefresh}
              className="px-2 py-1 bg-blue-500 text-white rounded cursor-pointer text-[11px] hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Items Count */}
      {!error && filteredItems.length > 0 && (
        <div className="text-[11px] text-gray-500 px-3 py-1.5 pb-0.5 text-right mb-2">
          {filteredItems.length} items
          {filteredItems.length !== jewelleryItems.length &&
            ` (of ${jewelleryItems.length})`}
          {showInactive && ` • Showing ${showInactive ? "all" : "active only"}`}
          {currentSort && <span> • Sorted: {currentSort.label}</span>}
        </div>
      )}

      {/* Items List */}
      <div className="pb-1.5">
        {filteredItems.length === 0 ? (
          <div className="text-center p-5 text-gray-400 text-[13px] m-2.5">
            <div className="text-2xl mb-2">📦</div>
            <p className="m-0">
              {jewelleryItems.length === 0
                ? "No jewellery items found."
                : "No items match your search/filters."}
            </p>
            {(searchTerm || selectedLocation || selectedBoughtFor) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 bg-blue-500 text-white rounded cursor-pointer text-xs mt-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              const isLast = index === filteredItems.length - 1;

              return (
                <div
                  key={item.id}
                  className={`bg-white p-2.5 min-h-[50px] cursor-pointer flex items-center gap-2 relative rounded-md mb-1 shadow-sm hover:shadow-md hover:bg-gray-50 transition-shadow duration-200 ${
                    isLast ? "" : "border-b border-gray-100"
                  } ${item.active ? "opacity-100" : "opacity-70"}`}
                  onClick={() => handleViewDetail(item.id)}
                >
                  {/* Item Image */}
                  <div
                    className={`w-10 h-10 shrink-0 bg-gray-100 rounded flex items-center justify-center overflow-hidden ${
                      !item.active ? "border border-dashed border-gray-400" : ""
                    }`}
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
                    className={`flex-1 min-w-0 ${showDeleteSetting ? "pr-9" : "pr-0"}`}
                  >
                    {/* ROW 1: Code + Description + Weight */}
                    <div className="flex items-baseline justify-between mb-0.5 gap-1.5">
                      <div className="flex items-baseline gap-1 min-w-0 flex-1">
                        <div
                          className={`font-semibold text-[13px] whitespace-nowrap ${!item.active ? "text-gray-500" : "text-gray-900"}`}
                        >
                          {item.code}
                        </div>
                        {!item.active && (
                          <span className="text-[9px] bg-gray-400 text-white px-1 py-px rounded-lg whitespace-nowrap">
                            Inactive
                          </span>
                        )}
                        <div className="text-[11px] text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0">
                          {item.description}
                        </div>
                      </div>
                      <div className="text-xs text-gray-700 font-medium whitespace-nowrap shrink-0">
                        {item.weight}g
                      </div>
                    </div>

                    {/* ROW 2: Location • Bought For • Purchase Date */}
                    <div className="flex items-center text-[10px] text-gray-400 gap-1 flex-wrap">
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
                        <span className="italic">No details</span>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      showDeleteSetting ? "mr-9" : "mr-0"
                    } ${
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent text-blue-500 cursor-pointer p-1 rounded flex items-center justify-center w-7 h-7 z-[2] hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    </div>
  );
};

export default ListTab;
