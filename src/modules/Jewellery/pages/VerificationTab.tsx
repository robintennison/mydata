import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { Jewellery, VerificationStatusType } from "../models/types";

// Define VerificationStatus locally
const VerificationStatus = {
  VERIFIED: "Verified",
  MISSING: "Missing",
  NOT_VERIFIED: "Not Verified",
} as const;

// Sort options
type SortField = "code" | "lastVerified";
type SortOrder = "asc" | "desc";

interface VerificationTabProps {
  compact?: boolean;
}

const VerificationTab: React.FC<VerificationTabProps> = ({
  compact = false,
}) => {
  const navigate = useNavigate();
  const [jewelleryItems, setJewelleryItems] = useState<Jewellery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeUpdate, setActiveUpdate] = useState<string | null>(null);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState<Record<string, string>>({});

  // Sort state
  const [sortField, setSortField] = useState<SortField>("code");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Refs for dropdown positioning
  const locationButtonRef = useRef<HTMLButtonElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch jewellery items
  useEffect(() => {
    const fetchJewellery = async () => {
      try {
        const db = getFirestore();
        const jewelleryRef = collection(db, "jewellery");
        const snapshot = await getDocs(jewelleryRef);

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
            verificationStatus:
              data.verificationStatus || VerificationStatus.NOT_VERIFIED,
            verificationNotes: data.verificationNotes || "",
          };

          items.push(item);
        });

        // Initially sort items by code ascending
        const sortedItems = items.sort((a, b) => {
          return (a.code || "").localeCompare(b.code || "");
        });

        setJewelleryItems(sortedItems);
      } catch (error) {
        console.error("Error fetching jewellery:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJewellery();
  }, []);

  // Get unique locations
  const locations = Array.from(
    new Set(jewelleryItems.map((item) => item.location).filter(Boolean)),
  );

  // Get items for selected location
  const locationItems = selectedLocation
    ? jewelleryItems.filter((item) => item.location === selectedLocation)
    : jewelleryItems;

  // Filter by search term
  const filteredItems = searchTerm
    ? locationItems.filter(
        (item) =>
          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : locationItems;

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;

    if (sortField === "code") {
      comparison = (a.code || "").localeCompare(b.code || "");
    } else if (sortField === "lastVerified") {
      // Sort by lastVerified date (0 means never verified, should go last in desc order)
      const dateA = a.lastVerified || 0;
      const dateB = b.lastVerified || 0;

      if (dateA === 0 && dateB === 0) comparison = 0;
      else if (dateA === 0)
        comparison = 1; // Never verified goes last
      else if (dateB === 0)
        comparison = -1; // Never verified goes last
      else comparison = dateA - dateB;
    }

    // Apply sort order
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Statistics - Now based on all filtered items
  const stats = {
    totalItems: filteredItems.length,
    verified: filteredItems.filter(
      (item) =>
        item.verificationStatus === VerificationStatus.VERIFIED && item.active,
    ).length,
    missing: filteredItems.filter(
      (item) =>
        item.verificationStatus === VerificationStatus.MISSING && item.active,
    ).length,
    notVerified: filteredItems.filter(
      (item) =>
        item.verificationStatus === VerificationStatus.NOT_VERIFIED &&
        item.active,
    ).length,
    totalWeight: filteredItems.reduce(
      (sum, item) => sum + (item.weight || 0),
      0,
    ),
  };

  // Format last verified date - Compact dd/mm/yy format
  const formatLastVerified = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return "Never";

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // If today, show time
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes < 1) return "Now";
        return `${diffMinutes}m`;
      }
      return `${diffHours}h`;
    }

    // If within 7 days, show days
    if (diffDays < 7) {
      return `${diffDays}d`;
    }

    // Otherwise show dd/mm/yy format
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);

    return `${day}/${month}/${year}`;
  };

  // Handle verification update
  const handleUpdateVerification = async (
    id: string,
    status: VerificationStatusType,
    notes?: string,
  ) => {
    setActiveUpdate(id);
    try {
      const db = getFirestore();
      const itemRef = doc(db, "jewellery", id);
      const updateData: any = {
        verificationStatus: status,
        lastVerified: Date.now(),
      };

      if (notes !== undefined) {
        updateData.verificationNotes = notes;
      }

      await updateDoc(itemRef, updateData);

      // Update local state
      setJewelleryItems(
        (prevItems) =>
          prevItems
            .map((item) =>
              item.id === id
                ? {
                    ...item,
                    verificationStatus: status,
                    verificationNotes:
                      notes !== undefined ? notes : item.verificationNotes,
                    lastVerified: Date.now(),
                  }
                : item,
            )
            .sort((a, b) => (a.code || "").localeCompare(b.code || "")), // Re-sort after update
      );
    } catch (error) {
      console.error("Error updating verification:", error);
    } finally {
      setActiveUpdate(null);
      if (expandedNotesId === id) {
        setExpandedNotesId(null);
      }
    }
  };

  // Handle bulk update for location
  const handleBulkUpdate = async (
    location: string,
    status: VerificationStatusType,
  ) => {
    try {
      const db = getFirestore();
      const itemsToUpdate = jewelleryItems.filter(
        (item) => item.location === location && item.active,
      );

      // Update each item
      for (const item of itemsToUpdate) {
        const itemRef = doc(db, "jewellery", item.id);
        await updateDoc(itemRef, {
          verificationStatus: status,
          lastVerified: Date.now(),
        });
      }

      // Update local state
      setJewelleryItems(
        (prevItems) =>
          prevItems
            .map((item) =>
              item.location === location && item.active
                ? {
                    ...item,
                    verificationStatus: status,
                    lastVerified: Date.now(),
                  }
                : item,
            )
            .sort((a, b) => (a.code || "").localeCompare(b.code || "")), // Re-sort after bulk update
      );
    } catch (error) {
      console.error("Error in bulk update:", error);
    }
  };

  // Get status color
  const getStatusColor = (status: VerificationStatusType) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return "#10b981";
      case VerificationStatus.MISSING:
        return "#ef4444";
      case VerificationStatus.NOT_VERIFIED:
        return "#f59e0b";
      default:
        return "#9ca3af";
    }
  };

  // Toggle notes expansion
  const toggleNotes = (item: Jewellery) => {
    if (expandedNotesId === item.id) {
      setExpandedNotesId(null);
    } else {
      setExpandedNotesId(item.id);
      setNotesText((prev) => ({
        ...prev,
        [item.id]: item.verificationNotes || "",
      }));
    }
  };

  // Save notes
  const saveNotes = async (id: string) => {
    if (notesText[id] !== undefined) {
      await handleUpdateVerification(
        id,
        jewelleryItems.find((item) => item.id === id)?.verificationStatus ||
          VerificationStatus.NOT_VERIFIED,
        notesText[id],
      );
    }
  };

  // Handle sort change
  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Change field, default to asc
      setSortField(field);
      setSortOrder("asc");
    }
    setShowSortDropdown(false);
  };

  // Handle location change
  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    setShowLocationDropdown(false);
  };

  // Get sort button label
  const getSortLabel = () => {
    if (sortField === "code") {
      return sortOrder === "asc" ? "Code ↑" : "Code ↓";
    } else {
      return sortOrder === "asc" ? "Date ↑" : "Date ↓";
    }
  };

  // Get location button label
  const getLocationLabel = () => {
    if (!selectedLocation) return "All";
    return selectedLocation.length > 8
      ? `${selectedLocation.substring(0, 8)}...`
      : selectedLocation;
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
        showLocationDropdown &&
        locationButtonRef.current &&
        !locationButtonRef.current.contains(target) &&
        !target.closest(".location-dropdown")
      ) {
        setShowLocationDropdown(false);
      }

      if (
        showSortDropdown &&
        sortButtonRef.current &&
        !sortButtonRef.current.contains(target) &&
        !target.closest(".sort-dropdown")
      ) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLocationDropdown, showSortDropdown]);

  if (loading) {
    return (
      <div className="text-center p-10 text-gray-400">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p>Loading verification data...</p>
        <style>
          {`
            .border-3 {
              border-width: 3px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-3.75">
        <div className="text-base font-semibold text-gray-800 mb-3.75 flex justify-between items-center">
          <span>Verification Summary</span>
          <span className="text-xs text-gray-500 font-normal">
            {stats.notVerified} to verify
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-3.75">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-emerald-600 mb-1">
              {stats.verified}
            </div>
            <div className="text-xs text-emerald-600">Verified</div>
          </div>

          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-amber-600 mb-1">
              {stats.notVerified}
            </div>
            <div className="text-xs text-amber-600">To Verify</div>
          </div>

          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-red-600 mb-1">
              {stats.missing}
            </div>
            <div className="text-xs text-red-600">Missing</div>
          </div>
        </div>

        <div className="mb-3.75 flex gap-2">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="flex-1 px-2 py-2 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          {selectedLocation && (
            <button
              onClick={() =>
                handleBulkUpdate(selectedLocation, VerificationStatus.VERIFIED)
              }
              className="px-3 py-2 bg-emerald-600 text-white border-none rounded cursor-pointer text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              ✓ All
            </button>
          )}
        </div>

        <button
          onClick={() => navigate("/jewellery/verification")}
          className="w-full py-2.5 px-4 bg-blue-600 text-white border-none rounded-lg cursor-pointer text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Start Verification
          <span>→</span>
        </button>
      </div>
    );
  }

  // Full mode - Exactly 2 lines per record (mobile optimized)
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3.75 overflow-hidden">
      {/* Header */}
      <div className="p-3.75 border-b border-gray-200 bg-gray-50">
        <div className="text-base font-semibold text-gray-800 mb-2.5">
          Quick Verification
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Total</div>
            <div className="text-base font-semibold">{stats.totalItems}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-emerald-600 mb-1">Verified</div>
            <div className="text-base font-semibold text-emerald-600">
              {stats.verified}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-amber-600 mb-1">To Verify</div>
            <div className="text-base font-semibold text-amber-600">
              {stats.notVerified}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-red-600 mb-1">Missing</div>
            <div className="text-base font-semibold text-red-600">
              {stats.missing}
            </div>
          </div>
        </div>
      </div>

      {/* Search, Filter, Sort in One Row */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center gap-1.5 mb-2.5">
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
              setShowSortDropdown(false);
              setShowLocationDropdown(!showLocationDropdown);
            }}
            className={`px-2.5 py-2 text-xs border border-gray-200 rounded-md cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-0.5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              selectedLocation ? "bg-sky-100 border-sky-200" : "bg-slate-50"
            }`}
            title={`Filter by location${selectedLocation ? `: ${selectedLocation}` : ""}`}
          >
            <span className="text-xs">📍</span>
            <span className="hidden xs:inline">{getLocationLabel()}</span>
          </button>

          {/* Sort Button */}
          <button
            ref={sortButtonRef}
            onClick={() => {
              setShowLocationDropdown(false);
              setShowSortDropdown(!showSortDropdown);
            }}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-gray-200 rounded-md cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-0.5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            title="Sort items"
          >
            <span className="text-xs">↕️</span>
            <span className="hidden xs:inline">{getSortLabel()}</span>
          </button>
        </div>

        {/* Bulk Action Buttons (when location selected) */}
        {selectedLocation && (
          <div className="flex gap-2">
            <button
              onClick={() =>
                handleBulkUpdate(selectedLocation, VerificationStatus.VERIFIED)
              }
              className="flex-1 px-3 py-1.5 bg-emerald-600 text-white border-none rounded cursor-pointer text-xs font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
            >
              ✓ Mark All Verified
            </button>
            <button
              onClick={() =>
                handleBulkUpdate(
                  selectedLocation,
                  VerificationStatus.NOT_VERIFIED,
                )
              }
              className="flex-1 px-3 py-1.5 bg-amber-500 text-white border-none rounded cursor-pointer text-xs font-medium hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
            >
              ⟲ Reset All
            </button>
          </div>
        )}

        {/* Location Dropdown */}
        {showLocationDropdown && (
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
              onClick={() => handleLocationChange("")}
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
                onClick={() => handleLocationChange(location)}
                className={`w-full p-2.5 text-[13px] text-left rounded-md cursor-pointer mb-0.5 flex items-center gap-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  selectedLocation === location
                    ? "bg-sky-100"
                    : "bg-transparent"
                }`}
              >
                <span>📍</span>
                <span>{location}</span>
              </button>
            ))}
          </div>
        )}

        {/* Sort Dropdown */}
        {showSortDropdown && (
          <div
            className="sort-dropdown fixed bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-[1000] min-w-[140px] max-h-[200px] overflow-y-auto"
            style={{
              top: `${getDropdownPosition(sortButtonRef).top}px`,
              right: `${getDropdownPosition(sortButtonRef).right}px`,
            }}
          >
            <div className="text-[13px] font-semibold mb-2 text-gray-700">
              Sort By
            </div>
            <button
              onClick={() => handleSortChange("code")}
              className="w-full p-2.5 text-[13px] text-left rounded-md cursor-pointer mb-0.5 flex items-center justify-between text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <span>Code</span>
              <span>
                {sortField === "code" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </span>
            </button>
            <button
              onClick={() => handleSortChange("lastVerified")}
              className="w-full p-2.5 text-[13px] text-left rounded-md cursor-pointer flex items-center justify-between text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <span>Last Verified</span>
              <span>
                {sortField === "lastVerified"
                  ? sortOrder === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Items List - Exactly 2 lines per record (mobile optimized) */}
      <div className="max-h-[500px] overflow-y-auto p-0 px-3.75">
        {sortedItems.length === 0 ? (
          <div className="text-center p-7.5 text-gray-400">
            <div className="text-5xl mb-4">📦</div>
            <p>No jewellery items found</p>
            <button
              onClick={() => navigate("/jewellery")}
              className="px-4 py-2 bg-blue-600 text-white border-none rounded cursor-pointer text-sm mt-3 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Jewellery Items
            </button>
          </div>
        ) : (
          sortedItems.slice(0, 15).map((item) => {
            const isUpdating = activeUpdate === item.id;
            const isExpanded = expandedNotesId === item.id;
            const hasNotes =
              item.verificationNotes &&
              item.verificationNotes.trim().length > 0;
            const lastVerifiedText = formatLastVerified(item.lastVerified);
            const isRecentlyVerified =
              item.verificationStatus === VerificationStatus.VERIFIED;

            return (
              <div key={item.id} className="py-2 border-b border-gray-100">
                {/* LINE 1: Image + Code + Weight + Date + Buttons (ALL ON SAME LINE) */}
                <div className="flex items-center gap-1.5 mb-1">
                  {/* Jewellery Image */}
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.code}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-base">💎</span>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: getStatusColor(item.verificationStatus),
                    }}
                  />

                  {/* Item Code and Weight - Compact on same line */}
                  <div className="flex items-baseline gap-1.5 flex-1 min-w-0 overflow-hidden">
                    <div className="font-semibold text-sm text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.code}
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {item.weight}g
                    </div>
                  </div>

                  {/* Last Verified Date - Compact */}
                  <div className="min-w-10 max-w-12.5 text-center flex-shrink-0 mr-1">
                    <div
                      className={`text-xs px-1 py-0.5 rounded whitespace-nowrap ${isRecentlyVerified ? "text-emerald-600 font-medium bg-emerald-50" : "text-gray-500"}`}
                      title={
                        item.lastVerified
                          ? new Date(item.lastVerified).toLocaleDateString()
                          : "Never verified"
                      }
                    >
                      {lastVerifiedText}
                    </div>
                  </div>

                  {/* Action Buttons - Smaller on mobile */}
                  <div className="flex gap-0.5 items-center flex-shrink-0">
                    <button
                      onClick={() =>
                        handleUpdateVerification(
                          item.id,
                          VerificationStatus.VERIFIED,
                        )
                      }
                      disabled={isUpdating}
                      title="Mark as Verified"
                      className={`w-6 h-6 flex items-center justify-center rounded text-xs flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        item.verificationStatus === VerificationStatus.VERIFIED
                          ? "bg-emerald-600 text-white border-emerald-600 focus:ring-emerald-500"
                          : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 focus:ring-emerald-300"
                      } border ${isUpdating ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      ✓
                    </button>

                    <button
                      onClick={() =>
                        handleUpdateVerification(
                          item.id,
                          VerificationStatus.NOT_VERIFIED,
                        )
                      }
                      disabled={isUpdating}
                      title="Mark as Not Verified"
                      className={`w-6 h-6 flex items-center justify-center rounded text-xs flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        item.verificationStatus ===
                        VerificationStatus.NOT_VERIFIED
                          ? "bg-amber-500 text-white border-amber-500 focus:ring-amber-500"
                          : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 focus:ring-amber-300"
                      } border ${isUpdating ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      !
                    </button>

                    <button
                      onClick={() =>
                        handleUpdateVerification(
                          item.id,
                          VerificationStatus.MISSING,
                        )
                      }
                      disabled={isUpdating}
                      title="Mark as Missing"
                      className={`w-6 h-6 flex items-center justify-center rounded text-xs flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        item.verificationStatus === VerificationStatus.MISSING
                          ? "bg-red-500 text-white border-red-500 focus:ring-red-500"
                          : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 focus:ring-red-300"
                      } border ${isUpdating ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      ✗
                    </button>

                    <button
                      onClick={() => toggleNotes(item)}
                      title={hasNotes ? "View notes" : "Add notes"}
                      className={`w-6 h-6 flex items-center justify-center rounded text-xs flex-shrink-0 cursor-pointer border focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 transition-transform duration-200 ${
                        hasNotes
                          ? "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200"
                          : "bg-transparent text-gray-500 border-gray-300 hover:bg-gray-100 hover:text-gray-700"
                      } ${isExpanded ? "rotate-180" : ""}`}
                    >
                      ↓
                    </button>
                  </div>
                </div>

                {/* LINE 2: Location + Bought For only */}
                <div className="flex items-center gap-1.5 pl-11 overflow-hidden">
                  {/* Location - Tiny badge */}
                  {item.location && (
                    <div
                      className="text-xs text-gray-700 bg-gray-100 px-1 py-0.5 rounded whitespace-nowrap overflow-hidden text-ellipsis max-w-20 flex-shrink-0"
                      title={item.location}
                    >
                      {item.location}
                    </div>
                  )}

                  {/* Bought For - Tiny badge */}
                  {item.boughtFor && (
                    <div
                      className="text-xs text-blue-800 bg-blue-100 px-1 py-0.5 rounded whitespace-nowrap overflow-hidden text-ellipsis max-w-20 flex-shrink-0"
                      title={item.boughtFor}
                    >
                      {item.boughtFor}
                    </div>
                  )}
                </div>

                {/* Expanded Notes Section (only when toggled) */}
                {isExpanded && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 ml-11">
                    <div className="text-xs font-medium text-gray-700 mb-1.5">
                      Verification Notes:
                    </div>
                    <textarea
                      value={notesText[item.id] || ""}
                      onChange={(e) =>
                        setNotesText((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      placeholder="Add verification notes..."
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-inherit resize-y min-h-10 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isUpdating}
                    />
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => saveNotes(item.id)}
                        className={`px-2.5 py-1 bg-blue-600 text-white border-none rounded cursor-pointer text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${isUpdating ? "opacity-70 cursor-not-allowed" : ""}`}
                        disabled={isUpdating}
                      >
                        {isUpdating ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setExpandedNotesId(null)}
                        className={`px-2.5 py-1 bg-gray-100 text-gray-700 border-none rounded cursor-pointer text-xs font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 ${isUpdating ? "opacity-70 cursor-not-allowed" : ""}`}
                        disabled={isUpdating}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {sortedItems.length > 15 && (
          <div className="text-center py-3 border-t border-gray-100">
            <button
              onClick={() => navigate("/jewellery/verification")}
              className="px-4 py-2 bg-transparent text-blue-600 border border-blue-600 rounded cursor-pointer text-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              View {sortedItems.length - 15} more items
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationTab;
