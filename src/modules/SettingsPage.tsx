// src/modules/SettingsPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";
import { settingsStyles } from "./SettingsPageStyles";

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
    emwInterest: 5, // Default EMW interest rate
  });

  const [emwDate, setEmwDate] = useState("2044-10"); // Default EMW date (Nov 2044)

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingEmwDate, setEditingEmwDate] = useState(false);
  const [emwDateValue, setEmwDateValue] = useState("");

  useEffect(() => {
    if (settings) {
      setFinancialSettings({
        goldRate: settings.goldRatePerGram || 0,
        makingTax: settings.makingTaxPercent || 0,
        resaleDiscount: settings.resaleDiscountPercent || 0,
        liabilities: settings.liabilities || 0,
        // Use correct field names with fallback defaults
        emwInterest:
          settings.EMW_interest !== undefined ? settings.EMW_interest : 5,
      });

      // Set EMW date from settings or default
      if (settings.EMW_Date) {
        setEmwDate(settings.EMW_Date);
      }
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
      case "emwInterest":
        settingsField = "EMW_Interest"; // Capital 'I' for Firebase
        break;
    }

    if (settingsField) {
      updateSettings({ [settingsField]: numValue } as any);
    }

    setEditingField(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleStartEmwDateEdit = () => {
    setEditingEmwDate(true);
    setEmwDateValue(emwDate);
  };

  const handleSaveEmwDateEdit = () => {
    if (!emwDateValue.trim()) return;

    // Validate date format (YYYY-MM)
    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!dateRegex.test(emwDateValue)) {
      alert("Please enter date in YYYY-MM format (e.g., 2039-10)");
      return;
    }

    // Update local state and Firebase
    setEmwDate(emwDateValue);
    updateSettings({ EMW_Date: emwDateValue } as any);
    setEditingEmwDate(false);
  };

  const handleCancelEmwDateEdit = () => {
    setEditingEmwDate(false);
    setEmwDateValue("");
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
    updateSettings({ [field]: value } as any);
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

  const formatEmwDate = (dateStr: string) => {
    try {
      const [year, month] = dateStr.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div style={settingsStyles.loadingContainer}>
        <div style={settingsStyles.loadingSpinner}></div>
        <p style={settingsStyles.loadingText}>Loading settings...</p>
      </div>
    );
  }

  // Simplified helper functions that don't cause TypeScript errors
  const getToggleSwitchStyle = (isOn: boolean): React.CSSProperties => ({
    ...settingsStyles.toggleSwitch,
    backgroundColor: isOn ? "#2563eb" : "#ccc",
  });

  const getToggleKnobStyle = (isOn: boolean): React.CSSProperties => ({
    ...settingsStyles.toggleKnob,
    left: isOn ? "27px" : "3px",
  });

  const getListItemStyle = (index: number): React.CSSProperties => ({
    ...settingsStyles.listItem,
    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
  });

  return (
    <div style={settingsStyles.container}>
      {/* Header */}
      <div style={settingsStyles.header}>
        <h1 style={settingsStyles.headerTitle}>⚙️ Settings</h1>
        <div style={settingsStyles.headerSubtitle}>
          Configure app preferences and defaults
        </div>
      </div>

      {/* Top Navigation */}
      <div style={settingsStyles.topNav}>
        <button
          onClick={() => navigate(-1)}
          style={settingsStyles.navButton}
          title="Go Back"
        >
          ←
        </button>
        <div style={settingsStyles.navTitle}>Settings</div>
        <div style={{ width: "40px" }}></div>
      </div>

      <div
        style={{
          ...settingsStyles.content,
          maxWidth: "500px",
          margin: "0 auto",
        }}
      >
        {/* EMW Settings */}
        <div style={settingsStyles.section}>
          <h3 style={settingsStyles.sectionTitle}>
            EMW (Equated Monthly Withdrawal) Settings
            <span
              style={{ fontSize: "0.9rem", color: "#666", marginLeft: "10px" }}
            >
              Used in Banking calculations
            </span>
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* EMW Interest Rate */}
            <div style={settingsStyles.fieldContainer}>
              <label style={settingsStyles.label}>EMW Interest Rate (%)</label>
              {editingField === "emwInterest" ? (
                <div style={settingsStyles.editControls}>
                  <div style={settingsStyles.editInputContainer}>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => handleEditValueChange(e.target.value)}
                      style={{
                        ...settingsStyles.input,
                        flex: 1,
                      }}
                      autoFocus
                      onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                    />
                    <span
                      style={{
                        ...settingsStyles.currencyPrefix,
                        backgroundColor: "#f3f4f6",
                        borderLeft: "1px solid #d1d5db",
                      }}
                    >
                      %
                    </span>
                  </div>
                  <div style={settingsStyles.buttonGroup}>
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        ...settingsStyles.iconButton,
                        ...settingsStyles.saveButton,
                      }}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        ...settingsStyles.iconButton,
                        ...settingsStyles.cancelButton,
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
                      "emwInterest",
                      financialSettings.emwInterest
                    )
                  }
                  style={settingsStyles.editableField}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                  }}
                >
                  <span style={{ fontSize: "16px", color: "#333" }}>
                    {formatNumber(financialSettings.emwInterest)}%
                  </span>
                  <span style={settingsStyles.editHint}>✏️ Click to edit</span>
                </div>
              )}
            </div>

            {/* EMW Target Date */}
            <div style={settingsStyles.fieldContainer}>
              <label style={settingsStyles.label}>EMW Target Date</label>
              {editingEmwDate ? (
                <div style={settingsStyles.editControls}>
                  <input
                    type="text"
                    value={emwDateValue}
                    onChange={(e) => setEmwDateValue(e.target.value)}
                    placeholder="YYYY-MM (e.g., 2039-10)"
                    style={{ ...settingsStyles.input, flex: 1 }}
                    autoFocus
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSaveEmwDateEdit()
                    }
                  />
                  <div style={settingsStyles.buttonGroup}>
                    <button
                      onClick={handleSaveEmwDateEdit}
                      style={{
                        ...settingsStyles.iconButton,
                        ...settingsStyles.saveButton,
                      }}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEmwDateEdit}
                      style={{
                        ...settingsStyles.iconButton,
                        ...settingsStyles.cancelButton,
                      }}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={handleStartEmwDateEdit}
                  style={settingsStyles.editableField}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "16px",
                        color: "#333",
                        fontWeight: "500",
                      }}
                    >
                      {formatEmwDate(emwDate)}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginTop: "2px",
                      }}
                    >
                      ({emwDate})
                    </div>
                  </div>
                  <span style={settingsStyles.editHint}>✏️ Click to edit</span>
                </div>
              )}
              <div
                style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}
              >
                Format: YYYY-MM (Year-Month)
              </div>
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div style={settingsStyles.section}>
          <h3 style={settingsStyles.sectionTitle}>
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
            <div style={settingsStyles.fieldContainer}>
              <label style={settingsStyles.label}>Gold Rate (₹/gram)</label>
              {editingField === "goldRate" ? (
                <div style={settingsStyles.editControls}>
                  <div style={settingsStyles.editInputContainer}>
                    <span style={settingsStyles.currencyPrefix}>₹</span>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => handleEditValueChange(e.target.value)}
                      style={{
                        ...settingsStyles.input,
                        ...settingsStyles.inputWithPrefix,
                      }}
                      autoFocus
                      onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                    />
                  </div>
                  <div style={settingsStyles.buttonGroup}>
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        ...settingsStyles.iconButton,
                        ...settingsStyles.saveButton,
                      }}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        ...settingsStyles.iconButton,
                        ...settingsStyles.cancelButton,
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
                  style={settingsStyles.editableField}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                  }}
                >
                  <div style={settingsStyles.editableValue}>
                    <span style={settingsStyles.currencySymbol}>₹</span>
                    <span>{formatNumber(financialSettings.goldRate)}</span>
                  </div>
                  <span style={settingsStyles.editHint}>✏️ Click to edit</span>
                </div>
              )}
            </div>

            {/* Making Tax */}
            <div style={settingsStyles.fieldContainer}>
              <label style={settingsStyles.label}>Making Tax (%)</label>
              {editingField === "makingTax" ? (
                <div style={settingsStyles.editControls}>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => handleEditValueChange(e.target.value)}
                    style={{ ...settingsStyles.input, flex: 1 }}
                    autoFocus
                    onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                  />
                  <div style={settingsStyles.buttonGroup}>
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        ...settingsStyles.iconButton,
                        ...settingsStyles.saveButton,
                      }}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        ...settingsStyles.iconButton,
                        ...settingsStyles.cancelButton,
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
                  style={settingsStyles.editableField}
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
                  <span style={settingsStyles.editHint}>✏️ Click to edit</span>
                </div>
              )}
            </div>

            {/* Resale Discount */}
            <div style={settingsStyles.fieldContainer}>
              <label style={settingsStyles.label}>Resale Discount (%)</label>
              {editingField === "resaleDiscount" ? (
                <div style={settingsStyles.editControls}>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => handleEditValueChange(e.target.value)}
                    style={{ ...settingsStyles.input, flex: 1 }}
                    autoFocus
                    onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                  />
                  <div style={settingsStyles.buttonGroup}>
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        ...settingsStyles.iconButton,
                        ...settingsStyles.saveButton,
                      }}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        ...settingsStyles.iconButton,
                        ...settingsStyles.cancelButton,
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
                  style={settingsStyles.editableField}
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
                  <span style={settingsStyles.editHint}>✏️ Click to edit</span>
                </div>
              )}
            </div>

            {/* Liabilities */}
            <div style={settingsStyles.fieldContainer}>
              <label style={settingsStyles.label}>Liabilities (₹)</label>
              {editingField === "liabilities" ? (
                <div style={settingsStyles.editControls}>
                  <div style={settingsStyles.editInputContainer}>
                    <span style={settingsStyles.currencyPrefix}>₹</span>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => handleEditValueChange(e.target.value)}
                      style={{
                        ...settingsStyles.input,
                        ...settingsStyles.inputWithPrefix,
                      }}
                      autoFocus
                      onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                    />
                  </div>
                  <div style={settingsStyles.buttonGroup}>
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        ...settingsStyles.iconButton,
                        ...settingsStyles.saveButton,
                      }}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        ...settingsStyles.iconButton,
                        ...settingsStyles.cancelButton,
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
                  style={settingsStyles.editableField}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                  }}
                >
                  <div style={settingsStyles.editableValue}>
                    <span style={settingsStyles.currencySymbol}>₹</span>
                    <span>{formatNumber(financialSettings.liabilities)}</span>
                  </div>
                  <span style={settingsStyles.editHint}>✏️ Click to edit</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toggle Settings */}
        <div style={settingsStyles.section}>
          <h3 style={settingsStyles.sectionTitle}>Display Settings</h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {/* Show Inactive */}
            <div style={settingsStyles.toggleContainer}>
              <div style={settingsStyles.toggleLabel}>
                <div style={settingsStyles.toggleTitle}>
                  Show Inactive Items
                </div>
                <div style={settingsStyles.toggleDescription}>
                  Show inactive jewellery in lists and gallery
                </div>
              </div>
              <div
                onClick={() =>
                  handleToggle("showInactive", !settings?.showInactive)
                }
                style={getToggleSwitchStyle(settings?.showInactive || false)}
              >
                <div
                  style={getToggleKnobStyle(settings?.showInactive || false)}
                />
              </div>
            </div>

            {/* Show Delete */}
            <div style={settingsStyles.toggleContainer}>
              <div style={settingsStyles.toggleLabel}>
                <div style={settingsStyles.toggleTitle}>Show Delete Action</div>
                <div style={settingsStyles.toggleDescription}>
                  Display the delete control on Edit screen
                </div>
              </div>
              <div
                onClick={() =>
                  handleToggle("showDelete", !settings?.showDelete)
                }
                style={getToggleSwitchStyle(settings?.showDelete || false)}
              >
                <div
                  style={getToggleKnobStyle(settings?.showDelete || false)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Locations Management */}
        <div style={settingsStyles.listSection}>
          <div style={settingsStyles.listHeader}>
            <div style={settingsStyles.listTitleContainer}>
              <h3 style={settingsStyles.listTitle}>Locations</h3>
              <div style={settingsStyles.listCount}>
                {settings?.locations?.length || 0} item
                {settings?.locations?.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div style={settingsStyles.listActions}>
              <button
                onClick={() => setShowAddLoc(true)}
                style={settingsStyles.listButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#c7d2fe";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#e0e7ff";
                }}
              >
                Add
              </button>
              <button
                onClick={() => setLocExpanded(!locExpanded)}
                style={settingsStyles.expandButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#c7d2fe";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#e0e7ff";
                }}
              >
                {locExpanded ? "↑" : "↓"}
              </button>
            </div>
          </div>

          {locExpanded && (
            <div style={settingsStyles.listContainer}>
              {!settings?.locations || settings.locations.length === 0 ? (
                <div style={settingsStyles.emptyList}>No locations yet.</div>
              ) : (
                settings.locations.map((location, index) => (
                  <div key={index} style={getListItemStyle(index)}>
                    <span style={settingsStyles.listItemText}>{location}</span>
                    <div style={settingsStyles.listItemActions}>
                      <button
                        onClick={() => handleEditListItem("location", location)}
                        style={{
                          ...settingsStyles.iconActionButton,
                          ...settingsStyles.editButton,
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete("location", location)}
                        style={{
                          ...settingsStyles.iconActionButton,
                          ...settingsStyles.deleteButton,
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
        <div style={settingsStyles.listSection}>
          <div style={settingsStyles.listHeader}>
            <div style={settingsStyles.listTitleContainer}>
              <h3 style={settingsStyles.listTitle}>Bought For</h3>
              <div style={settingsStyles.listCount}>
                {settings?.boughtFor?.length || 0} item
                {settings?.boughtFor?.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div style={settingsStyles.listActions}>
              <button
                onClick={() => setShowAddBf(true)}
                style={settingsStyles.listButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#c7d2fe";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#e0e7ff";
                }}
              >
                Add
              </button>
              <button
                onClick={() => setBfExpanded(!bfExpanded)}
                style={settingsStyles.expandButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#c7d2fe";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#e0e7ff";
                }}
              >
                {bfExpanded ? "↑" : "↓"}
              </button>
            </div>
          </div>

          {bfExpanded && (
            <div style={settingsStyles.listContainer}>
              {!settings?.boughtFor || settings.boughtFor.length === 0 ? (
                <div style={settingsStyles.emptyList}>No entries yet.</div>
              ) : (
                settings.boughtFor.map((boughtFor, index) => (
                  <div key={index} style={getListItemStyle(index)}>
                    <span style={settingsStyles.listItemText}>{boughtFor}</span>
                    <div style={settingsStyles.listItemActions}>
                      <button
                        onClick={() =>
                          handleEditListItem("boughtFor", boughtFor)
                        }
                        style={{
                          ...settingsStyles.iconActionButton,
                          ...settingsStyles.editButton,
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete("boughtFor", boughtFor)}
                        style={{
                          ...settingsStyles.iconActionButton,
                          ...settingsStyles.deleteButton,
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
        <div style={settingsStyles.dialogOverlay}>
          <div style={settingsStyles.dialog}>
            <h3 style={settingsStyles.dialogTitle}>Add Location</h3>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Enter location name"
              style={settingsStyles.input}
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && handleAddLocation()}
            />
            <div style={settingsStyles.dialogActions}>
              <button
                onClick={() => setShowAddLoc(false)}
                style={{
                  ...settingsStyles.dialogButton,
                  ...settingsStyles.cancelDialogButton,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddLocation}
                disabled={!newLocation.trim()}
                style={{
                  ...settingsStyles.dialogButton,
                  ...settingsStyles.confirmDialogButton,
                  ...(!newLocation.trim() && {
                    backgroundColor: "#9ca3af",
                    cursor: "not-allowed",
                  }),
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
        <div style={settingsStyles.dialogOverlay}>
          <div style={settingsStyles.dialog}>
            <h3 style={settingsStyles.dialogTitle}>Add "Bought For"</h3>
            <input
              type="text"
              value={newBoughtFor}
              onChange={(e) => setNewBoughtFor(e.target.value)}
              placeholder="Enter purpose"
              style={settingsStyles.input}
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && handleAddBoughtFor()}
            />
            <div style={settingsStyles.dialogActions}>
              <button
                onClick={() => setShowAddBf(false)}
                style={{
                  ...settingsStyles.dialogButton,
                  ...settingsStyles.cancelDialogButton,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddBoughtFor}
                disabled={!newBoughtFor.trim()}
                style={{
                  ...settingsStyles.dialogButton,
                  ...settingsStyles.confirmDialogButton,
                  ...(!newBoughtFor.trim() && {
                    backgroundColor: "#9ca3af",
                    cursor: "not-allowed",
                  }),
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
        <div style={settingsStyles.dialogOverlay}>
          <div style={settingsStyles.dialog}>
            <h3 style={settingsStyles.dialogTitle}>
              {renameDialog.type === "location"
                ? "Rename Location"
                : 'Rename "Bought For"'}
            </h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Enter new value"
              style={settingsStyles.input}
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && handleSaveListItemEdit()}
            />
            <div style={settingsStyles.dialogActions}>
              <button
                onClick={() => {
                  setRenameDialog(null);
                  setRenameValue("");
                }}
                style={{
                  ...settingsStyles.dialogButton,
                  ...settingsStyles.cancelDialogButton,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveListItemEdit}
                disabled={!renameValue.trim()}
                style={{
                  ...settingsStyles.dialogButton,
                  ...settingsStyles.confirmDialogButton,
                  ...(!renameValue.trim() && {
                    backgroundColor: "#9ca3af",
                    cursor: "not-allowed",
                  }),
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
