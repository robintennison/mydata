// src/modules/SettingsPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";
import { bankingStyles } from "./Banking/styles/BankingStyles";

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, loading } = useSettings();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "location" | "boughtFor";
    value: string;
  } | null>(null);
  const [editItem, setEditItem] = useState<{
    type: "location" | "boughtFor";
    oldValue: string;
    newValue: string;
  } | null>(null);

  const [newLocation, setNewLocation] = useState("");
  const [newBoughtFor, setNewBoughtFor] = useState("");

  const [goldRate, setGoldRate] = useState(settings?.goldRatePerGram || 0);
  const [makingTax, setMakingTax] = useState(settings?.makingTaxPercent || 0);
  const [resaleDiscount, setResaleDiscount] = useState(
    settings?.resaleDiscountPercent || 0
  );
  const [liabilities, setLiabilities] = useState(settings?.liabilities || 0);

  // Handle number input changes
  const handleNumberChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;

    switch (field) {
      case "goldRate":
        setGoldRate(numValue);
        updateSettings({ goldRatePerGram: numValue });
        break;
      case "makingTax":
        setMakingTax(numValue);
        updateSettings({ makingTaxPercent: numValue });
        break;
      case "resaleDiscount":
        setResaleDiscount(numValue);
        updateSettings({ resaleDiscountPercent: numValue });
        break;
      case "liabilities":
        setLiabilities(numValue);
        updateSettings({ liabilities: numValue });
        break;
    }
  };

  // Handle boolean toggles
  const handleToggle = (
    field: "showInactive" | "showDelete",
    value: boolean
  ) => {
    updateSettings({ [field]: value });
  };

  // Handle adding items
  const handleAddLocation = () => {
    if (newLocation.trim()) {
      updateSettings({
        locations: [...(settings?.locations || []), newLocation.trim()],
      });
      setNewLocation("");
    }
  };

  const handleAddBoughtFor = () => {
    if (newBoughtFor.trim()) {
      updateSettings({
        boughtFor: [...(settings?.boughtFor || []), newBoughtFor.trim()],
      });
      setNewBoughtFor("");
    }
  };

  // Handle editing items
  const handleEdit = (type: "location" | "boughtFor", oldValue: string) => {
    setEditItem({ type, oldValue, newValue: oldValue });
  };

  const handleSaveEdit = () => {
    if (!editItem || !editItem.newValue.trim()) return;

    const list =
      editItem.type === "location"
        ? settings?.locations || []
        : settings?.boughtFor || [];

    const updatedList = list.map((item) =>
      item === editItem.oldValue ? editItem.newValue.trim() : item
    );

    updateSettings({
      [editItem.type === "location" ? "locations" : "boughtFor"]: updatedList,
    });

    setEditItem(null);
  };

  // Handle delete confirmation
  const handleDelete = (type: "location" | "boughtFor", value: string) => {
    setItemToDelete({ type, value });
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    const list =
      itemToDelete.type === "location"
        ? settings?.locations || []
        : settings?.boughtFor || [];

    const updatedList = list.filter((item) => item !== itemToDelete.value);

    updateSettings({
      [itemToDelete.type === "location" ? "locations" : "boughtFor"]:
        updatedList,
    });

    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  if (loading) {
    return (
      <div style={bankingStyles.loadingContainer}>
        <div style={bankingStyles.spinner}></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div style={bankingStyles.container}>
      {/* Header */}
      <div style={bankingStyles.header}>
        <h1 style={bankingStyles.headerTitle}>⚙️ Settings</h1>
        <div style={bankingStyles.headerSubtitle}>
          Configure app preferences and defaults
        </div>
      </div>

      {/* Top Navigation */}
      <div style={bankingStyles.topNav}>
        <button
          onClick={() => navigate(-1)}
          style={bankingStyles.navButton}
          title="Go Back"
        >
          ←
        </button>
        <div style={bankingStyles.navTitle}>Settings</div>
        <div style={{ width: "40px" }}></div>
      </div>

      <div style={{ padding: "15px" }}>
        {/* Financial Settings */}
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ marginBottom: "15px", color: "#333" }}>
            Financial Settings
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {/* Gold Rate */}
            <div>
              <label style={bankingStyles.label}>Gold Rate (₹/gram)</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#666",
                    fontWeight: "500",
                    fontSize: "16px",
                    zIndex: 1,
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  value={goldRate}
                  onChange={(e) =>
                    handleNumberChange("goldRate", e.target.value)
                  }
                  style={{
                    ...bankingStyles.input,
                    paddingLeft: "35px",
                  }}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Making Tax */}
            <div>
              <label style={bankingStyles.label}>Making Tax (%)</label>
              <input
                type="number"
                value={makingTax}
                onChange={(e) =>
                  handleNumberChange("makingTax", e.target.value)
                }
                style={bankingStyles.input}
                step="0.01"
                min="0"
              />
            </div>

            {/* Resale Discount */}
            <div>
              <label style={bankingStyles.label}>Resale Discount (%)</label>
              <input
                type="number"
                value={resaleDiscount}
                onChange={(e) =>
                  handleNumberChange("resaleDiscount", e.target.value)
                }
                style={bankingStyles.input}
                step="0.01"
                min="0"
              />
            </div>

            {/* Liabilities */}
            <div>
              <label style={bankingStyles.label}>Liabilities (₹)</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#666",
                    fontWeight: "500",
                    fontSize: "16px",
                    zIndex: 1,
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  value={liabilities}
                  onChange={(e) =>
                    handleNumberChange("liabilities", e.target.value)
                  }
                  style={{
                    ...bankingStyles.input,
                    paddingLeft: "35px",
                  }}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Settings */}
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ marginBottom: "15px", color: "#333" }}>
            Display Settings
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {/* Show Inactive */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label style={bankingStyles.label}>Show Inactive Items</label>
              <div
                onClick={() =>
                  handleToggle("showInactive", !settings?.showInactive)
                }
                style={{
                  width: "50px",
                  height: "26px",
                  backgroundColor: settings?.showInactive ? "#2563eb" : "#ccc",
                  borderRadius: "13px",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "3px",
                    left: settings?.showInactive ? "27px" : "3px",
                    width: "20px",
                    height: "20px",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    transition: "left 0.3s",
                  }}
                />
              </div>
            </div>

            {/* Show Delete */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label style={bankingStyles.label}>Show Delete Buttons</label>
              <div
                onClick={() =>
                  handleToggle("showDelete", !settings?.showDelete)
                }
                style={{
                  width: "50px",
                  height: "26px",
                  backgroundColor: settings?.showDelete ? "#2563eb" : "#ccc",
                  borderRadius: "13px",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "3px",
                    left: settings?.showDelete ? "27px" : "3px",
                    width: "20px",
                    height: "20px",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    transition: "left 0.3s",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Locations Management */}
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ marginBottom: "15px", color: "#333" }}>Locations</h3>

          {/* Add Location */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <input
              type="text"
              placeholder="Add new location"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              style={bankingStyles.input}
              onKeyPress={(e) => e.key === "Enter" && handleAddLocation()}
            />
            <button
              onClick={handleAddLocation}
              style={bankingStyles.primaryButton}
            >
              Add
            </button>
          </div>

          {/* Locations List */}
          <div
            style={{
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              padding: "10px",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {settings?.locations?.length ? (
              settings.locations.sort().map((location, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    backgroundColor: "white",
                    marginBottom: "5px",
                    borderRadius: "6px",
                    border: "1px solid #e9ecef",
                  }}
                >
                  {editItem?.type === "location" &&
                  editItem.oldValue === location ? (
                    <div style={{ display: "flex", gap: "10px", flex: 1 }}>
                      <input
                        type="text"
                        value={editItem.newValue}
                        onChange={(e) =>
                          setEditItem({ ...editItem, newValue: e.target.value })
                        }
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          border: "1px solid #dee2e6",
                          borderRadius: "4px",
                          fontSize: "14px",
                        }}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSaveEdit()
                        }
                      />
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditItem(null)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span>{location}</span>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button
                          onClick={() => handleEdit("location", location)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#f3f4f6",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete("location", location)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#dc2626",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p
                style={{
                  color: "#6c757d",
                  textAlign: "center",
                  padding: "10px",
                }}
              >
                No locations added yet
              </p>
            )}
          </div>
        </div>

        {/* Bought For Management */}
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ marginBottom: "15px", color: "#333" }}>
            Bought For (Purpose)
          </h3>

          {/* Add Bought For */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <input
              type="text"
              placeholder="Add new purpose"
              value={newBoughtFor}
              onChange={(e) => setNewBoughtFor(e.target.value)}
              style={bankingStyles.input}
              onKeyPress={(e) => e.key === "Enter" && handleAddBoughtFor()}
            />
            <button
              onClick={handleAddBoughtFor}
              style={bankingStyles.primaryButton}
            >
              Add
            </button>
          </div>

          {/* Bought For List */}
          <div
            style={{
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              padding: "10px",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {settings?.boughtFor?.length ? (
              settings.boughtFor.sort().map((purpose, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    backgroundColor: "white",
                    marginBottom: "5px",
                    borderRadius: "6px",
                    border: "1px solid #e9ecef",
                  }}
                >
                  {editItem?.type === "boughtFor" &&
                  editItem.oldValue === purpose ? (
                    <div style={{ display: "flex", gap: "10px", flex: 1 }}>
                      <input
                        type="text"
                        value={editItem.newValue}
                        onChange={(e) =>
                          setEditItem({ ...editItem, newValue: e.target.value })
                        }
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          border: "1px solid #dee2e6",
                          borderRadius: "4px",
                          fontSize: "14px",
                        }}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSaveEdit()
                        }
                      />
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditItem(null)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span>{purpose}</span>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button
                          onClick={() => handleEdit("boughtFor", purpose)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#f3f4f6",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete("boughtFor", purpose)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#dc2626",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p
                style={{
                  color: "#6c757d",
                  textAlign: "center",
                  padding: "10px",
                }}
              >
                No purposes added yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && itemToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>
              Delete {itemToDelete.type === "location" ? "Location" : "Purpose"}
              ?
            </h3>
            <p style={{ margin: "0 0 24px 0", color: "#6b7280" }}>
              Are you sure you want to delete "{itemToDelete.value}"?
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowDeleteDialog(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  color: "#374151",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#dc2626",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
