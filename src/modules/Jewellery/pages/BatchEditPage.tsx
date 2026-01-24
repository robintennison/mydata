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
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f9fafb",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #e5e7eb",
              borderTopColor: "#3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          ></div>
          <p>Loading jewellery items...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f9fafb",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {/* Top Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          backgroundColor: "white",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={handleCancel}
          style={{
            background: "none",
            border: "none",
            padding: "8px",
            fontSize: "18px",
            cursor: "pointer",
            color: "#374151",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "40px",
            minHeight: "40px",
          }}
          title="Cancel"
        >
          ←
        </button>
        <div
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#111827",
            textAlign: "center",
            flex: 1,
          }}
        >
          Batch Edit Location
        </div>
        <div style={{ width: "40px" }}></div>
      </div>

      {/* Filters Section */}
      <div
        style={{
          padding: "15px",
          backgroundColor: "white",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {/* Current Location Filter */}
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Filter by Current Location
          </label>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              backgroundColor: "white",
            }}
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
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            New Location for Selected Items
          </label>
          <select
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              backgroundColor: "white",
            }}
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
        <div
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            {selectedItems.size} of {filteredItems.length} selected
          </span>
          {filteredItems.length > 0 && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              <input
                type="checkbox"
                checked={selectedItems.size === filteredItems.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                style={{ width: "16px", height: "16px" }}
              />
              Select All
            </label>
          )}
        </div>

        {/* Update Button */}
        <button
          onClick={handleUpdateLocation}
          disabled={updating || selectedItems.size === 0 || !newLocation}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor:
              selectedItems.size > 0 && newLocation ? "#3b82f6" : "#d1d5db",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor:
              selectedItems.size > 0 && newLocation ? "pointer" : "not-allowed",
            fontSize: "16px",
            fontWeight: "500",
          }}
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
            style={{
              marginTop: "10px",
              padding: "10px",
              borderRadius: "6px",
              backgroundColor: updateMessage.includes("Error")
                ? "#fee2e2"
                : "#d1fae5",
              color: updateMessage.includes("Error") ? "#991b1b" : "#065f46",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            {updateMessage}
          </div>
        )}
      </div>

      {/* Items List */}
      <div style={{ flex: 1, padding: "0" }}>
        {filteredItems.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
            <p style={{ marginBottom: "8px" }}>No items found</p>
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              {locationFilter !== "All"
                ? "No items with this location"
                : "No jewellery items in database"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "white",
                  padding: "12px 15px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />

                {/* Item Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "15px",
                        color: "#111827",
                      }}
                    >
                      {item.code}
                    </div>
                    {!item.active && (
                      <div
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          backgroundColor: "#9ca3af",
                          color: "white",
                          borderRadius: "10px",
                        }}
                      >
                        Inactive
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      marginBottom: "4px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.description || "No description"}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>📍</span>
                      <span>{item.location || "No location"}</span>
                    </div>
                    <div>{item.weight}g</div>
                  </div>
                </div>

                {/* Current location indicator (if different from filter) */}
                {locationFilter !== "All" &&
                  item.location === locationFilter && (
                    <div
                      style={{
                        fontSize: "11px",
                        padding: "2px 6px",
                        backgroundColor: "#dbeafe",
                        color: "#1e40af",
                        borderRadius: "4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Current
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div
        style={{
          marginTop: "auto",
          padding: "10px 15px",
          backgroundColor: "white",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#6b7280",
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          <div>
            <strong>Total items:</strong> {filteredItems.length}
          </div>
          <div>
            <strong>Selected:</strong> {selectedItems.size}
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

export default BatchEditPage;
