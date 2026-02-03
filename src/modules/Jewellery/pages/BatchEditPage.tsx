import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Jewellery, VerificationStatus } from "../models/types";
import { useJewellerySettings } from "../hooks/useSettingsData";
import { tw } from "../../../utils/tailwindMapping"; // Import the tw object

interface BatchEditPageProps {}

const BatchEditPage: React.FC<BatchEditPageProps> = () => {
  const navigate = useNavigate();
  const [jewelleryItems, setJewelleryItems] = useState<Jewellery[]>([]);
  const [filteredItems, setFilteredItems] = useState<Jewellery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [locationFilter, setLocationFilter] = useState<string>("All");
  const [newLocation, setNewLocation] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string>("");

  // Get settings data for location options
  const { locations: locationOptions } = useJewellerySettings();

  // Fetch jewellery items
  useEffect(() => {
    const fetchJewellery = async () => {
      try {
        const db = getFirestore();
        const jewelleryRef = collection(db, "jewellery");
        const snapshot = await getDocs(jewelleryRef);

        const items: Jewellery[] = [];

        snapshot.forEach((doc) => {
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

        // Sort by code
        const sortedItems = items.sort((a, b) => a.code.localeCompare(b.code));
        setJewelleryItems(sortedItems);
        setFilteredItems(sortedItems);
      } catch (error) {
        console.error("Error fetching jewellery:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJewellery();
  }, []);

  // Apply location filter
  useEffect(() => {
    if (locationFilter === "All") {
      setFilteredItems(jewelleryItems);
    } else {
      const filtered = jewelleryItems.filter(
        (item) => item.location === locationFilter,
      );
      setFilteredItems(filtered);
    }
    // Clear selection when filter changes
    setSelectedItems(new Set());
  }, [locationFilter, jewelleryItems]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredItems.map((item) => item.id));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleUpdateLocation = async () => {
    if (!newLocation) {
      setUpdateMessage("Please select a new location");
      return;
    }

    if (selectedItems.size === 0) {
      setUpdateMessage("Please select at least one item");
      return;
    }

    try {
      setUpdating(true);
      setUpdateMessage("");

      const db = getFirestore();
      const updates = Array.from(selectedItems).map(async (id) => {
        const itemRef = doc(db, "jewellery", id);
        await updateDoc(itemRef, {
          location: newLocation,
          updatedAt: new Date().toISOString(),
        });
      });

      await Promise.all(updates);

      // Update local state
      const updatedItems = jewelleryItems.map((item) => {
        if (selectedItems.has(item.id)) {
          return { ...item, location: newLocation };
        }
        return item;
      });

      setJewelleryItems(updatedItems);

      // Update filtered items if needed
      if (locationFilter !== "All" && locationFilter !== newLocation) {
        const filtered = updatedItems.filter(
          (item) => item.location === locationFilter,
        );
        setFilteredItems(filtered);
      } else {
        setFilteredItems(updatedItems);
      }

      // Clear selection after update
      setSelectedItems(new Set());

      setUpdateMessage(
        `Successfully updated ${selectedItems.size} item${
          selectedItems.size !== 1 ? "s" : ""
        }`,
      );
    } catch (error: any) {
      console.error("Error updating locations:", error);
      setUpdateMessage(`Error updating: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className={tw.loading}>
        <div className={tw.spinner}></div>
        <p>Loading jewellery items...</p>
      </div>
    );
  }

  return (
    <div className={tw.container}>
      {/* Top Navigation */}
      <div className={tw.header}>
        <div className={tw.headerContent}>
          <button
            onClick={handleCancel}
            className={tw.settingsButton}
            title="Cancel"
          >
            ←
          </button>
          <div className={tw.title} style={{ margin: 0, textAlign: "center" }}>
            Batch Edit Location
          </div>
          <div style={{ width: "44px" }}></div>
        </div>
      </div>

      {/* Filters Section */}
      <div className={tw.section}>
        {/* Current Location Filter */}
        <div className="mb-4">
          <label className={tw.label}>Filter by Current Location</label>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className={tw.select}
          >
            <option value="All">All Locations</option>
            {locationOptions
              .filter((loc) => loc !== "All")
              .map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
          </select>
        </div>

        {/* New Location Selection */}
        <div className="mb-4">
          <label className={tw.label}>New Location for Selected Items</label>
          <select
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            className={tw.select}
          >
            <option value="">Select new location...</option>
            {locationOptions
              .filter((loc) => loc !== "All")
              .map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
          </select>
        </div>

        {/* Selection Info */}
        <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
          <span>
            {selectedItems.size} of {filteredItems.length} selected
          </span>
          {filteredItems.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selectedItems.size === filteredItems.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4"
              />
              Select All
            </label>
          )}
        </div>

        {/* Update Button */}
        <button
          onClick={handleUpdateLocation}
          disabled={updating || selectedItems.size === 0 || !newLocation}
          className={`w-full py-3 rounded-lg font-medium text-base ${
            selectedItems.size > 0 && newLocation
              ? "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          } transition-colors`}
        >
          {updating
            ? "Updating..."
            : `Update ${selectedItems.size} Item${
                selectedItems.size !== 1 ? "s" : ""
              }`}
        </button>

        {/* Update Message */}
        {updateMessage && (
          <div
            className={`mt-3 p-3 rounded-lg text-sm text-center ${
              updateMessage.includes("Error")
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {updateMessage}
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="flex-1">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4 text-gray-500">
            <div className="text-5xl mb-4 opacity-50">📦</div>
            <p className="font-medium mb-2">No items found</p>
            <p className="text-sm">
              {locationFilter !== "All"
                ? "No items with this location"
                : "No jewellery items in database"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 border-b border-gray-100 flex items-center gap-3 hover:bg-gray-50"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                  className="w-5 h-5 cursor-pointer"
                />

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-semibold text-gray-900 text-base truncate">
                      {item.code}
                    </div>
                    {!item.active && (
                      <div className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                        Inactive
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 truncate mb-2">
                    {item.description || "No description"}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <span>📍</span>
                      <span>{item.location || "No location"}</span>
                    </div>
                    <div>{item.weight}g</div>
                  </div>
                </div>

                {/* Current location indicator (if different from filter) */}
                {locationFilter !== "All" &&
                  item.location === locationFilter && (
                    <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded whitespace-nowrap">
                      Current
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="mt-auto p-4 bg-white border-t border-gray-200">
        <div className="text-sm text-gray-600 text-center space-y-1">
          <div>
            <strong>Total items:</strong> {filteredItems.length}
          </div>
          <div>
            <strong>Selected:</strong> {selectedItems.size}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchEditPage;
