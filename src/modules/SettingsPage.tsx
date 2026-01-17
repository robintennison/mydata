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
    emwInterest: 5,
  });

  const [emwDate, setEmwDate] = useState("2044-10");

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
        emwInterest:
          settings.EMW_interest !== undefined ? settings.EMW_interest : 5,
      });

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
        settingsField = "EMW_Interest";
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

    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!dateRegex.test(emwDateValue)) {
      alert("Please enter date in YYYY-MM format (e.g., 2039-10)");
      return;
    }

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
      minimumFractionDigits: 0,
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

  const renderEditableField = (
    label: string,
    field: string,
    value: number,
    suffix: string = "",
    prefix: string = "",
    showEditIcon: boolean = true
  ) => {
    const isEditing = editingField === field;

    return (
      <div style={settingsStyles.toggleContainer}>
        <div style={settingsStyles.toggleLabel}>
          <div style={settingsStyles.toggleTitle}>{label}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isEditing ? (
            <>
              {prefix && (
                <span
                  style={{
                    ...settingsStyles.currencySymbol,
                    position: "static",
                    transform: "none",
                    color: "#495057",
                  }}
                >
                  {prefix}
                </span>
              )}
              <input
                type="text"
                value={editValue}
                onChange={(e) => handleEditValueChange(e.target.value)}
                style={{
                  width: "80px",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  textAlign: "right",
                }}
                autoFocus
                onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
              />
              {suffix && (
                <span
                  style={{
                    fontSize: "14px",
                    color: "#495057",
                  }}
                >
                  {suffix}
                </span>
              )}
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    ...settingsStyles.iconButton,
                    ...settingsStyles.saveButton,
                    padding: "6px 8px",
                    minWidth: "30px",
                    height: "32px",
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
                    padding: "6px 8px",
                    minWidth: "30px",
                    height: "32px",
                  }}
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#333",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                {prefix && <span>{prefix}</span>}
                {formatNumber(value)}
                {suffix && <span>{suffix}</span>}
              </div>
              {showEditIcon && (
                <button
                  onClick={() => handleStartEdit(field, value)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "16px",
                    cursor: "pointer",
                    color: "#6b7280",
                    padding: "2px",
                  }}
                  title="Edit"
                >
                  ✏️
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderToggleField = (
    label: string,
    description: string,
    field: "showInactive" | "showDelete",
    value: boolean
  ) => (
    <div style={settingsStyles.toggleContainer}>
      <div style={settingsStyles.toggleLabel}>
        <div style={settingsStyles.toggleTitle}>{label}</div>
        <div style={settingsStyles.toggleDescription}>{description}</div>
      </div>
      <div
        style={{
          ...settingsStyles.toggleSwitch,
          ...(value ? settingsStyles.toggleSwitchOn : {}),
        }}
        onClick={() => handleToggle(field, !value)}
      >
        <div
          style={{
            ...settingsStyles.toggleKnob,
            ...(value ? settingsStyles.toggleKnobOn : {}),
          }}
        />
      </div>
    </div>
  );

  const renderListSection = (
    title: string,
    count: number,
    isExpanded: boolean,
    setIsExpanded: (val: boolean) => void,
    setShowAdd: (val: boolean) => void,
    items: string[],
    type: "location" | "boughtFor"
  ) => (
    <div style={settingsStyles.listSection}>
      <div style={settingsStyles.listHeader}>
        <div style={settingsStyles.listTitleContainer}>
          <h3 style={settingsStyles.listTitle}>{title}</h3>
          <div style={settingsStyles.listCount}>{count} items</div>
        </div>
        <div style={settingsStyles.listActions}>
          <button
            onClick={() => setShowAdd(true)}
            style={settingsStyles.listButton}
          >
            Add
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              ...settingsStyles.expandButton,
              ...(isExpanded ? { backgroundColor: "#c7d2fe" } : {}),
            }}
          >
            {isExpanded ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={settingsStyles.listContainer}>
          {items.length === 0 ? (
            <div style={settingsStyles.emptyList}>
              No {title.toLowerCase()} yet.
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={index}
                style={{
                  ...settingsStyles.listItem,
                  ...(index % 2 === 0 ? {} : settingsStyles.listItemEven),
                }}
              >
                <span style={settingsStyles.listItemText}>{item}</span>
                <div style={settingsStyles.listItemActions}>
                  <button
                    onClick={() => handleEditListItem(type, item)}
                    style={{
                      ...settingsStyles.iconActionButton,
                      ...settingsStyles.editButton,
                    }}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(type, item)}
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
  );

  const renderDialog = (
    title: string,
    value: string,
    setValue: (val: string) => void,
    onSave: () => void,
    onCancel: () => void,
    placeholder: string
  ) => (
    <div style={settingsStyles.dialogOverlay}>
      <div style={settingsStyles.dialog}>
        <h3 style={settingsStyles.dialogTitle}>{title}</h3>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          style={settingsStyles.input}
          autoFocus
          onKeyPress={(e) => e.key === "Enter" && onSave()}
        />
        <div style={settingsStyles.dialogActions}>
          <button
            onClick={onCancel}
            style={{
              ...settingsStyles.dialogButton,
              ...settingsStyles.cancelDialogButton,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!value.trim()}
            style={{
              ...settingsStyles.dialogButton,
              ...settingsStyles.confirmDialogButton,
              ...(!value.trim() ? settingsStyles.disabledButton : {}),
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={settingsStyles.loadingContainer}>
        <div style={settingsStyles.loadingSpinner}></div>
        <p style={settingsStyles.loadingText}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div style={{ ...settingsStyles.container, maxWidth: "600px" }}>
      {/* Compact Header - Single row */}
      <div style={settingsStyles.topNav}>
        <button
          onClick={() => navigate(-1)}
          style={settingsStyles.navButton}
          title="Go Back"
        >
          ←
        </button>
        <h1 style={settingsStyles.navTitle}>Settings</h1>
        <button
          onClick={() => navigate("/banking")}
          style={{
            ...settingsStyles.navButton,
            fontSize: "20px",
            border: "none",
            backgroundColor: "transparent",
          }}
          title="Home"
        >
          🏠
        </button>
      </div>

      <div style={settingsStyles.content}>
        {/* Display Settings at TOP - Compact */}
        <div style={settingsStyles.section}>
          <h3 style={settingsStyles.sectionTitle}>Display Settings</h3>
          {renderToggleField(
            "Show Inactive Items",
            "Show inactive jewellery in lists and gallery",
            "showInactive",
            settings?.showInactive || false
          )}
          {renderToggleField(
            "Show Delete Action",
            "Display the delete control on Edit screen",
            "showDelete",
            settings?.showDelete || false
          )}
        </div>

        {/* Financial Settings - Compact */}
        <div style={settingsStyles.section}>
          <h3 style={settingsStyles.sectionTitle}>Financial Settings</h3>
          {renderEditableField(
            "Gold Rate per gram",
            "goldRate",
            financialSettings.goldRate,
            "",
            "₹"
          )}
          {renderEditableField(
            "Making Tax",
            "makingTax",
            financialSettings.makingTax,
            "%"
          )}
          {renderEditableField(
            "Resale Discount",
            "resaleDiscount",
            financialSettings.resaleDiscount,
            "%"
          )}
          {renderEditableField(
            "Liabilities",
            "liabilities",
            financialSettings.liabilities,
            "",
            "₹"
          )}
        </div>

        {/* Locations Management - Compact */}
        {renderListSection(
          "Locations",
          settings?.locations?.length || 0,
          locExpanded,
          setLocExpanded,
          setShowAddLoc,
          settings?.locations || [],
          "location"
        )}

        {/* Bought For Management - Compact */}
        {renderListSection(
          "Bought For",
          settings?.boughtFor?.length || 0,
          bfExpanded,
          setBfExpanded,
          setShowAddBf,
          settings?.boughtFor || [],
          "boughtFor"
        )}

        {/* EMW Settings at BOTTOM - Compact */}
        <div style={{ ...settingsStyles.section, paddingBottom: "80px" }}>
          <h3 style={settingsStyles.sectionTitle}>
            EMW (Equated Monthly Withdrawal) Settings
          </h3>
          {renderEditableField(
            "EMW Interest Rate",
            "emwInterest",
            financialSettings.emwInterest,
            "%"
          )}

          {/* EMW Target Date */}
          <div style={settingsStyles.toggleContainer}>
            <div style={settingsStyles.toggleLabel}>
              <div style={settingsStyles.toggleTitle}>EMW Target Date</div>
            </div>
            {editingEmwDate ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <input
                  type="text"
                  value={emwDateValue}
                  onChange={(e) => setEmwDateValue(e.target.value)}
                  placeholder="YYYY-MM"
                  style={{
                    width: "90px",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                  autoFocus
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleSaveEmwDateEdit()
                  }
                />
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={handleSaveEmwDateEdit}
                    style={{
                      ...settingsStyles.iconButton,
                      ...settingsStyles.saveButton,
                      padding: "6px 8px",
                      minWidth: "30px",
                      height: "32px",
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
                      padding: "6px 8px",
                      minWidth: "30px",
                      height: "32px",
                    }}
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#333",
                    textAlign: "right",
                  }}
                >
                  <div>{formatEmwDate(emwDate)}</div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      fontWeight: "normal",
                    }}
                  >
                    ({emwDate})
                  </div>
                </div>
                <button
                  onClick={handleStartEmwDateEdit}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "16px",
                    cursor: "pointer",
                    color: "#6b7280",
                    padding: "2px",
                  }}
                  title="Edit"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Location Dialog */}
      {showAddLoc &&
        renderDialog(
          "Add Location",
          newLocation,
          setNewLocation,
          handleAddLocation,
          () => setShowAddLoc(false),
          "Enter location name"
        )}

      {/* Add Bought For Dialog */}
      {showAddBf &&
        renderDialog(
          'Add "Bought For"',
          newBoughtFor,
          setNewBoughtFor,
          handleAddBoughtFor,
          () => setShowAddBf(false),
          "Enter purpose"
        )}

      {/* Rename Dialog */}
      {renameDialog &&
        renderDialog(
          renameDialog.type === "location"
            ? "Rename Location"
            : 'Rename "Bought For"',
          renameValue,
          setRenameValue,
          handleSaveListItemEdit,
          () => {
            setRenameDialog(null);
            setRenameValue("");
          },
          "Enter new value"
        )}
    </div>
  );
};

export default SettingsPage;
