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

interface GalleryTabProps {
  compact?: boolean; // Prop to control if it should show in compact mode
}

const GalleryTab: React.FC<GalleryTabProps> = ({ compact = false }) => {
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
        // Only show items with images initially
        setFilteredItems(
          sortedItems.filter((item) => item.active && item.imageUrl),
        );
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

    // CRITICAL FIX: Only show items with images
    result = result.filter((item) => item.imageUrl);

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
      <div className="text-center py-10 px-5 text-gray-400 flex flex-col items-center">
        <div className="w-7.5 h-7.5 border-3 border-gray-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p>Loading gallery...</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white rounded-lg p-3.75 shadow-sm mb-3.75">
        <div className="text-base font-semibold text-gray-800 mb-3.75 flex justify-between items-center">
          <span>Gallery Summary</span>
          <span className="text-xs text-gray-500 font-normal">
            {filteredItems.length} items
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-3.75">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-blue-500 mb-1">
              {
                jewelleryItems.filter((item) => item.active && item.imageUrl)
                  .length
              }
            </div>
            <div className="text-xs text-gray-500">With Images</div>
          </div>

          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-amber-600 mb-1">
              {
                jewelleryItems.filter(
                  (item) =>
                    item.verificationStatus !== VerificationStatus.VERIFIED &&
                    item.active &&
                    item.imageUrl,
                ).length
              }
            </div>
            <div className="text-xs text-amber-600">To Verify</div>
          </div>

          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-red-600 mb-1">
              {
                jewelleryItems.filter(
                  (item) =>
                    item.verificationStatus === VerificationStatus.MISSING &&
                    item.active &&
                    item.imageUrl,
                ).length
              }
            </div>
            <div className="text-xs text-red-600">Missing</div>
          </div>
        </div>

        <div className="mb-3.75 flex gap-2">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 py-2 px-3 border border-gray-200 rounded-md text-sm"
          />
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="p-2 border border-gray-200 rounded-md text-xs min-w-15"
            title="Location"
          >
            {locationOptions.slice(0, 1).map((location) => (
              <option key={location} value={location}>
                {location === "All" ? "📍 All" : `📍 ${location}`}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => navigate("/jewellery/gallery")}
          className="w-full py-2.5 bg-blue-500 text-white border-none rounded-lg cursor-pointer text-sm font-medium flex items-center justify-center gap-2"
        >
          View Full Gallery
          <span>→</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 max-w-[600px] mx-auto p-0 w-full">
      {/* Compact Search Bar - DIRECTLY below tabs with no gap */}
      <div className="flex items-center gap-0.5 px-1 py-1 bg-white border-b border-gray-200 flex-nowrap overflow-x-auto min-h-10 m-0 w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate("/jewellery")}
          className="bg-transparent border-none p-1 text-sm cursor-pointer text-gray-700 rounded flex items-center justify-center min-w-7 min-h-7 shrink-0 hover:bg-gray-100"
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
          className="flex-1 min-w-0 py-1 px-1.5 rounded border border-gray-300 text-xs bg-white text-gray-900 shrink max-w-30 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400 placeholder:text-xs"
        />

        {/* Location Filter - Compact */}
        <div className="flex shrink-0 min-w-0">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="py-1 px-1.5 pr-5 rounded border border-gray-300 text-xs bg-white text-gray-700 cursor-pointer min-w-0 max-w-20 shrink whitespace-nowrap overflow-hidden text-ellipsis appearance-none focus:outline-none focus:border-blue-500 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_4px_center] bg-[length:12px]"
            title="Location"
          >
            {locationOptions.map((location) => (
              <option
                key={location}
                value={location}
                className="bg-white text-gray-900 p-2 text-xs"
              >
                {location === "All" ? "📍 All" : `📍 ${location}`}
              </option>
            ))}
          </select>
        </div>

        {/* Bought For Filter - Compact */}
        <div className="flex shrink-0 min-w-0">
          <select
            value={boughtForFilter}
            onChange={(e) => setBoughtForFilter(e.target.value)}
            className="py-1 px-1.5 pr-5 rounded border border-gray-300 text-xs bg-white text-gray-700 cursor-pointer min-w-0 max-w-20 shrink whitespace-nowrap overflow-hidden text-ellipsis appearance-none focus:outline-none focus:border-blue-500 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_4px_center] bg-[length:12px]"
            title="Bought For"
          >
            {boughtForOptions.map((boughtFor) => (
              <option
                key={boughtFor}
                value={boughtFor}
                className="bg-white text-gray-900 p-2 text-xs"
              >
                {boughtFor === "All" ? "👤 All" : `👤 ${boughtFor}`}
              </option>
            ))}
          </select>
        </div>

        {/* Show Inactive Toggle (very small) */}
        <label
          className="flex items-center gap-0.5 text-xs text-gray-500 cursor-pointer whitespace-nowrap shrink-0 p-0.5 rounded bg-gray-100 min-w-8.5 hover:bg-gray-200"
          title="Show Inactive"
        >
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="m-0 cursor-pointer w-3 h-3"
          />
          <span className="cursor-pointer text-[9px]">In</span>
        </label>
      </div>

      {/* Gallery Grid */}
      <div className="flex-1 bg-slate-50 m-0 w-full p-0">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-5 text-gray-500 m-0">
            <div className="text-5xl mb-3 opacity-50">🖼️</div>
            <p className="text-sm text-gray-500 text-center">
              {searchTerm ||
              locationFilter !== "All" ||
              boughtForFilter !== "All"
                ? "No images match your filters"
                : "No images found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-px m-0 w-full p-0">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleImageClick(item)}
                className={`relative cursor-pointer overflow-hidden aspect-square w-full bg-white border border-gray-200 rounded-none m-0 ${!item.active ? "opacity-50" : ""}`}
              >
                {/* Image Container with Overlay Info */}
                <div className="w-full h-full relative bg-gray-50 m-0 p-0">
                  {item.imageUrl && (
                    <>
                      <img
                        src={item.imageUrl}
                        alt={item.code}
                        className="w-full h-full object-cover block m-0 p-0"
                      />
                      {/* Overlay for Code and Weight */}
                      <div className="absolute bottom-0 left-0 right-0 bg-transparent p-1.5 px-1 text-white m-0">
                        <div className="flex flex-col items-start gap-px m-0">
                          <div className="text-xs font-semibold text-white m-0 drop-shadow-lg">
                            {item.code}
                          </div>
                          <div className="text-[10px] text-white m-0 drop-shadow-lg">
                            {item.weight}g
                          </div>

                          {/* Status Badge - Only show if not VERIFIED */}
                          {item.verificationStatus !==
                            VerificationStatus.VERIFIED && (
                            <div
                              className={`text-[8px] px-1 py-0.5 rounded font-semibold tracking-wide uppercase mt-0.5 bg-white/90 text-gray-900 ${
                                item.verificationStatus ===
                                VerificationStatus.MISSING
                                  ? "bg-red-100 text-red-600"
                                  : "bg-gray-100 text-gray-500"
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
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simple counter at bottom */}
      <div className="p-2 bg-white text-gray-500 text-xs text-center border-t border-gray-200 m-0">
        {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default GalleryTab;
