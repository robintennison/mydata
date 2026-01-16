// src/modules/SettingsPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";
import { bankingStyles } from "./Banking/styles/BankingStyles";

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    settings,
    loading,
    updateSettings,
    addLocation,
    removeLocation,
    addBoughtFor,
    removeBoughtFor,
  } = useSettings();

  const [locExpanded, setLocExpanded] = useState(false);
  const [bfExpanded, setBfExpanded] = useState(false);

  const [showAddLoc, setShowAddLoc] = useState(false);
  const [showAddBf, setShowAddBf] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{
    type: "location" | "boughtFor";
    oldValue: string;
  } | null>(null);

  const [newLocation, setNewLocation] = useState("");
  const [newBoughtFor, setNewBoughtFor] = useState("");
  const [renameValue, setRenameValue] = useState("");

  const [financialSettings, setFinancialSettings] = useState({
    goldRate: 0,
    makingTax: 0,
    resaleDiscount: 0,
    liabilities: 0,
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (settings) {
      setFinancialSettings({
        goldRate: settings.goldRatePerGram || 0,
        makingTax: settings.makingTaxPercent || 0,
        resaleDiscount: settings.resaleDiscountPercent || 0,
        liabilities: settings.liabilities || 0,
      });
    }
  }, [settings]);

  const handleStartEdit = (field: string, value: number) => {
    setEditingField(field);
    setEditValue(value.toString());
  };

  const handleSaveEdit = () => {
    if (!editingField) return;

    const numValue = parseFloat(editValue) || 0;

    setFinancialSettings((prev) => ({
      ...prev,
      [editingField]: numValue,
    }));

    let settingsField = "";
    switch (editingField) {
      case "goldRate":
        settingsField = "goldRatePerGram";
        break;
      case "makingTax":
        settingsField = "makingTaxPercent";
        break;
      case "resaleDiscount":
        settingsField = "resaleDiscountPercent";
        break;
      case "liabilities":
        settingsField = "liabilities";
        break;
    }

    if (settingsField) {
      updateSettings({ [settingsField]: numValue });
    }

    setEditingField(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleEditValueChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setEditValue(value);
    }
  };

  const handleToggle = (
    field: "showInactive" | "showDelete",
    value: boolean
  ) => {
    updateSettings({ [field]: value });
  };

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      addLocation(newLocation.trim());
      setNewLocation("");
      setShowAddLoc(false);
    }
  };

  const handleAddBoughtFor = () => {
    if (newBoughtFor.trim()) {
      addBoughtFor(newBoughtFor.trim());
      setNewBoughtFor("");
      setShowAddBf(false);
    }
  };

  const handleEditListItem = (
    type: "location" | "boughtFor",
    oldValue: string
  ) => {
    setRenameDialog({ type, oldValue });
    setRenameValue(oldValue);
  };

  const handleSaveListItemEdit = () => {
    if (!renameDialog || !renameValue.trim()) return;

    if (renameDialog.type === "location") {
      removeLocation(renameDialog.oldValue);
      addLocation(renameValue.trim());
    } else {
      removeBoughtFor(renameDialog.oldValue);
      addBoughtFor(renameValue.trim());
    }

    setRenameDialog(null);
    setRenameValue("");
  };

  const handleDelete = (type: "location" | "boughtFor", value: string) => {
    if (type === "location") {
      removeLocation(value);
    } else {
      removeBoughtFor(value);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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

      <div style={{ padding: "15px", maxWidth: "500px", margin: "0 auto" }}>
        {/* Financial Settings */}
        <div style={{ marginBottom: "25px" }}>
          <h3 style={bankingStyles.sectionTitle}>
            Financial Settings
            <span
              style={{ fontSize: "0.9rem", color: "#666", marginLeft: "10px" }}
            >
              Click value to edit
            </span>
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* Gold Rate */}
            <div>
              <label style={bankingStyles.label}>Gold Rate (₹/gram)</label>
              {editingField === "goldRate" ? (
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <div style={{ position: "relative", flex: 1 }}>
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
                      type="text"
                      value={editValue}
                      onChange={(e) => handleEditValueChange(e.target.value)}
                      style={{
                        ...bankingStyles.input,
                        paddingLeft: "35px",
                      }}
                      autoFocus
                      onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() =>
                    handleStartEdit("goldRate", financialSettings.goldRate)
                  }
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 15px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #e9ecef",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ color: "#666", fontWeight: "500" }}>₹</span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {formatNumber(financialSettings.goldRate)}
                    </span>
                  </div>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>
                    ✏️ Click to edit
                  </span>
                </div>
              )}
            </div>

            {/* Making Tax */}
            <div>
              <label style={bankingStyles.label}>Making Tax (%)</label>
              {editingField === "makingTax" ? (
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => handleEditValueChange(e.target.value)}
                    style={{ ...bankingStyles.input, flex: 1 }}
                    autoFocus
                    onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                  />
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() =>
                    handleStartEdit("makingTax", financialSettings.makingTax)
                  }
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 15px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #e9ecef",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                  }}
                >
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {formatNumber(financialSettings.makingTax)}%
                  </span>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>
                    ✏️ Click to edit
                  </span>
                </div>
              )}
            </div>

            {/* Resale Discount */}
            <div>
              <label style={bankingStyles.label}>Resale Discount (%)</label>
              {editingField === "resaleDiscount" ? (
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => handleEditValueChange(e.target.value)}
                    style={{ ...bankingStyles.input, flex: 1 }}
                    autoFocus
                    onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                  />
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() =>
                    handleStartEdit(
                      "resaleDiscount",
                      financialSettings.resaleDiscount
                    )
                  }
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 15px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #e9ecef",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                  }}
                >
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {formatNumber(financialSettings.resaleDiscount)}%
                  </span>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>
                    ✏️ Click to edit
                  </span>
                </div>
              )}
            </div>

            {/* Liabilities */}
            <div>
              <label style={bankingStyles.label}>Liabilities (₹)</label>
              {editingField === "liabilities" ? (
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <div style={{ position: "relative", flex: 1 }}>
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
                      type="text"
                      value={editValue}
                      onChange={(e) => handleEditValueChange(e.target.value)}
                      style={{
                        ...bankingStyles.input,
                        paddingLeft: "35px",
                      }}
                      autoFocus
                      onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() =>
                    handleStartEdit(
                      "liabilities",
                      financialSettings.liabilities
                    )
                  }
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 15px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #e9ecef",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ color: "#666", fontWeight: "500" }}>₹</span>
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {formatNumber(financialSettings.liabilities)}
                    </span>
                  </div>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>
                    ✏️ Click to edit
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toggle Settings */}
        <div style={{ marginBottom: "25px" }}>
          <h3 style={bankingStyles.sectionTitle}>Display Settings</h3>

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
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: "500",
                    color: "#333",
                    marginBottom: "4px",
                  }}
                >
                  Show Inactive Items
                </div>
                <div style={{ fontSize: "0.9rem", color: "#666" }}>
                  Show inactive jewellery in lists and gallery
                </div>
              </div>
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
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: "500",
                    color: "#333",
                    marginBottom: "4px",
                  }}
                >
                  Show Delete Action
                </div>
                <div style={{ fontSize: "0.9rem", color: "#666" }}>
                  Display the delete control on Edit screen
                </div>
              </div>
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
        <div style={{ marginBottom: "25px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <div style={{ flex: 1 }}>
              <h3 style={bankingStyles.sectionTitle}>Locations</h3>
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                {settings?.locations?.length || 0} item
                {settings?.locations?.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowAddLoc(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#e0e7ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: "6px",
                  color: "#4f46e5",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Add
              </button>
              <button
                onClick={() => setLocExpanded(!locExpanded)}
                style={{
                  padding: "8px",
                  backgroundColor: "#e0e7ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: "6px",
                  color: "#4f46e5",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                }}
              >
                {locExpanded ? "↑" : "↓"}
              </button>
            </div>
          </div>

          {locExpanded && (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {!settings?.locations || settings.locations.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  No locations yet.
                </div>
              ) : (
                settings.locations.map((location, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 15px",
                      borderBottom:
                        index < settings.locations.length - 1
                          ? "1px solid #f3f4f6"
                          : "none",
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                    }}
                  >
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {location}
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleEditListItem("location", location)}
                        style={{
                          padding: "6px",
                          backgroundColor: "#f0f9ff",
                          border: "1px solid #bae6fd",
                          borderRadius: "4px",
                          color: "#0369a1",
                          cursor: "pointer",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete("location", location)}
                        style={{
                          padding: "6px",
                          backgroundColor: "#fef2f2",
                          border: "1px solid #fecaca",
                          borderRadius: "4px",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Bought For Management */}
        <div style={{ marginBottom: "25px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <div style={{ flex: 1 }}>
              <h3 style={bankingStyles.sectionTitle}>Bought For</h3>
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                {settings?.boughtFor?.length || 0} item
                {settings?.boughtFor?.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowAddBf(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#e0e7ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: "6px",
                  color: "#4f46e5",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Add
              </button>
              <button
                onClick={() => setBfExpanded(!bfExpanded)}
                style={{
                  padding: "8px",
                  backgroundColor: "#e0e7ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: "6px",
                  color: "#4f46e5",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                }}
              >
                {bfExpanded ? "↑" : "↓"}
              </button>
            </div>
          </div>

          {bfExpanded && (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {!settings?.boughtFor || settings.boughtFor.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  No entries yet.
                </div>
              ) : (
                settings.boughtFor.map((boughtFor, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 15px",
                      borderBottom:
                        index < settings.boughtFor.length - 1
                          ? "1px solid #f3f4f6"
                          : "none",
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                    }}
                  >
                    <span style={{ fontSize: "16px", color: "#333" }}>
                      {boughtFor}
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() =>
                          handleEditListItem("boughtFor", boughtFor)
                        }
                        style={{
                          padding: "6px",
                          backgroundColor: "#f0f9ff",
                          border: "1px solid #bae6fd",
                          borderRadius: "4px",
                          color: "#0369a1",
                          cursor: "pointer",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete("boughtFor", boughtFor)}
                        style={{
                          padding: "6px",
                          backgroundColor: "#fef2f2",
                          border: "1px solid #fecaca",
                          borderRadius: "4px",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Location Dialog */}
      {showAddLoc && (
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
              Add Location
            </h3>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Enter location name"
              style={{
                ...bankingStyles.input,
                width: "100%",
                marginBottom: "20px",
              }}
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && handleAddLocation()}
            />
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowAddLoc(false)}
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
                onClick={handleAddLocation}
                disabled={!newLocation.trim()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: newLocation.trim() ? "#10b981" : "#9ca3af",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                  fontWeight: "500",
                  cursor: newLocation.trim() ? "pointer" : "not-allowed",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bought For Dialog */}
      {showAddBf && (
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
              Add "Bought For"
            </h3>
            <input
              type="text"
              value={newBoughtFor}
              onChange={(e) => setNewBoughtFor(e.target.value)}
              placeholder="Enter purpose"
              style={{
                ...bankingStyles.input,
                width: "100%",
                marginBottom: "20px",
              }}
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && handleAddBoughtFor()}
            />
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowAddBf(false)}
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
                onClick={handleAddBoughtFor}
                disabled={!newBoughtFor.trim()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: newBoughtFor.trim() ? "#10b981" : "#9ca3af",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                  fontWeight: "500",
                  cursor: newBoughtFor.trim() ? "pointer" : "not-allowed",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Dialog */}
      {renameDialog && (
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
              {renameDialog.type === "location"
                ? "Rename Location"
                : 'Rename "Bought For"'}
            </h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Enter new value"
              style={{
                ...bankingStyles.input,
                width: "100%",
                marginBottom: "20px",
              }}
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && handleSaveListItemEdit()}
            />
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setRenameDialog(null);
                  setRenameValue("");
                }}
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
                onClick={handleSaveListItemEdit}
                disabled={!renameValue.trim()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: renameValue.trim() ? "#10b981" : "#9ca3af",
                  border: "none",
                  borderRadius: "6px",
                  color: "white",
                  fontWeight: "500",
                  cursor: renameValue.trim() ? "pointer" : "not-allowed",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
