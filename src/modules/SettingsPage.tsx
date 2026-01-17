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

  if (loading) {
    return (
      <div style={settingsStyles.loadingContainer}>
        <div style={settingsStyles.loadingSpinner}></div>
        <p style={settingsStyles.loadingText}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div style={settingsStyles.container}>
      {/* Compact Header - Single row */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "12px 16px",
          borderBottom: "1px solid #e9ecef",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#495057",
              padding: "0",
              lineHeight: "1",
            }}
            title="Go Back"
          >
            ←
          </button>
          <h1
            style={{
              margin: "0",
              fontSize: "1.2rem",
              fontWeight: "600",
              color: "#333",
            }}
          >
            Settings
          </h1>
        </div>
        <button
          onClick={() => navigate("/banking")}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.2rem",
            cursor: "pointer",
            color: "#495057",
            padding: "6px",
            lineHeight: "1",
          }}
          title="Home"
        >
          🏠
        </button>
      </div>

      <div
        style={{
          ...settingsStyles.content,
          maxWidth: "600px", // Changed from 500px to 600px
          margin: "0 auto",
          padding: "16px",
        }}
      >
        {/* Display Settings at TOP - Compact */}
        <div
          style={{
            ...settingsStyles.section,
            padding: "12px 0",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              ...settingsStyles.sectionTitle,
              fontSize: "1rem",
              marginBottom: "16px",
              color: "#333",
              fontWeight: "600",
            }}
          >
            Display Settings
          </h3>

          {/* Show Inactive Items - Single row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
              padding: "8px 0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  color: "#495057",
                }}
              >
                Show Inactive Items
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#6b7280",
                  marginTop: "2px",
                }}
              >
                Show inactive jewellery in lists and gallery
              </div>
            </div>
            <div
              onClick={() =>
                handleToggle("showInactive", !settings?.showInactive)
              }
              style={{
                position: "relative",
                width: "44px",
                height: "24px",
                backgroundColor: settings?.showInactive ? "#10b981" : "#d1d5db",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: settings?.showInactive ? "22px" : "2px",
                  width: "20px",
                  height: "20px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  transition: "left 0.2s",
                }}
              />
            </div>
          </div>

          {/* Show Delete Action - Single row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  color: "#495057",
                }}
              >
                Show Delete Action
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#6b7280",
                  marginTop: "2px",
                }}
              >
                Display the delete control on Edit screen
              </div>
            </div>
            <div
              onClick={() => handleToggle("showDelete", !settings?.showDelete)}
              style={{
                position: "relative",
                width: "44px",
                height: "24px",
                backgroundColor: settings?.showDelete ? "#10b981" : "#d1d5db",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: settings?.showDelete ? "22px" : "2px",
                  width: "20px",
                  height: "20px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  transition: "left 0.2s",
                }}
              />
            </div>
          </div>
        </div>

        {/* Financial Settings - Compact */}
        <div
          style={{
            ...settingsStyles.section,
            padding: "12px 0",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              ...settingsStyles.sectionTitle,
              fontSize: "1rem",
              marginBottom: "16px",
              color: "#333",
              fontWeight: "600",
            }}
          >
            Financial Settings
          </h3>

          {/* Gold Rate - Single row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
              padding: "8px 0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: "500",
                color: "#495057",
              }}
            >
              Gold Rate per gram
            </div>
            {editingField === "goldRate" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      padding: "6px 0 6px 8px",
                      backgroundColor: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      borderRight: "none",
                      borderTopLeftRadius: "4px",
                      borderBottomLeftRadius: "4px",
                      fontSize: "0.95rem",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => handleEditValueChange(e.target.value)}
                    style={{
                      width: "70px",
                      padding: "6px 8px",
                      border: "1px solid #d1d5db",
                      borderLeft: "none",
                      borderTopRightRadius: "4px",
                      borderBottomRightRadius: "4px",
                      fontSize: "0.95rem",
                      textAlign: "right",
                    }}
                    autoFocus
                    onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                  />
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={handleSaveEdit}
                    style={{
                      background: "#10b981",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      padding: "6px 8px",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                    }}
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      background: "#ef4444",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      padding: "6px 8px",
                      fontSize: "0.9rem",
                      cursor: "pointer",
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
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  ₹{formatNumber(financialSettings.goldRate)}
                </div>
                <button
                  onClick={() =>
                    handleStartEdit("goldRate", financialSettings.goldRate)
                  }
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1rem",
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

          {/* Making Tax - Single row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
              padding: "8px 0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: "500",
                color: "#495057",
              }}
            >
              Making Tax
            </div>
            {editingField === "makingTax" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => handleEditValueChange(e.target.value)}
                  style={{
                    width: "70px",
                    padding: "6px 8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "0.95rem",
                    textAlign: "right",
                  }}
                  autoFocus
                  onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                />
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={handleSaveEdit}
                    style={{
                      background: "#10b981",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      padding: "6px 8px",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                    }}
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      background: "#ef4444",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      padding: "6px 8px",
                      fontSize: "0.9rem",
                      cursor: "pointer",
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
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  {formatNumber(financialSettings.makingTax)}%
                </div>
                <button
                  onClick={() =>
                    handleStartEdit("makingTax", financialSettings.makingTax)
                  }
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1rem",
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

          {/* Resale Discount - Single row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
              padding: "8px 0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: "500",
                color: "#495057",
              }}
            >
              Resale Discount
            </div>
            {editingField === "resaleDiscount" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => handleEditValueChange(e.target.value)}
                  style={{
                    width: "70px",
                    padding: "6px 8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "0.95rem",
                    textAlign: "right",
                  }}
                  autoFocus
                  onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                />
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={handleSaveEdit}
                    style={{
                      background: "#10b981",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      padding: "6px 8px",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                    }}
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      background: "#ef4444",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      padding: "6px 8px",
                      fontSize: "0.9rem",
                      cursor: "pointer",
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
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  {formatNumber(financialSettings.resaleDiscount)}%
                </div>
                <button
                  onClick={() =>
                    handleStartEdit(
                      "resaleDiscount",
                      financialSettings.resaleDiscount
                    )
                  }
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1rem",
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

          {/* Liabilities - Single row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: "500",
                color: "#495057",
              }}
            >
              Liabilities
            </div>
            {editingField === "liabilities" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      padding: "6px 0 6px 8px",
                      backgroundColor: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      borderRight: "none",
                      borderTopLeftRadius: "4px",
                      borderBottomLeftRadius: "4px",
                      fontSize: "0.95rem",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => handleEditValueChange(e.target.value)}
                    style={{
                      width: "70px",
                      padding: "6px 8px",
                      border: "1px solid #d1d5db",
                      borderLeft: "none",
                      borderTopRightRadius: "4px",
                      borderBottomRightRadius: "4px",
                      fontSize: "0.95rem",
                      textAlign: "right",
                    }}
                    autoFocus
                    onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                  />
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={handleSaveEdit}
                    style={{
                      background: "#10b981",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      padding: "6px 8px",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                    }}
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      background: "#ef4444",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      padding: "6px 8px",
                      fontSize: "0.9rem",
                      cursor: "pointer",
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
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  ₹{formatNumber(financialSettings.liabilities)}
                </div>
                <button
                  onClick={() =>
                    handleStartEdit(
                      "liabilities",
                      financialSettings.liabilities
                    )
                  }
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1rem",
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

        {/* Locations Management - Compact */}
        <div
          style={{
            ...settingsStyles.section,
            padding: "12px 0",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: locExpanded ? "12px" : "0",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                color: "#333",
                fontWeight: "600",
                margin: "0",
              }}
            >
              Locations ({settings?.locations?.length || 0})
            </h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowAddLoc(true)}
                style={{
                  background: "#e0e7ff",
                  border: "none",
                  borderRadius: "4px",
                  color: "#4f46e5",
                  padding: "6px 12px",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Add
              </button>
              <button
                onClick={() => setLocExpanded(!locExpanded)}
                style={{
                  background: "#e0e7ff",
                  border: "none",
                  borderRadius: "4px",
                  color: "#4f46e5",
                  padding: "6px 12px",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                {locExpanded ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {locExpanded && (
            <div
              style={{
                border: "1px solid #e9ecef",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {!settings?.locations || settings.locations.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "#6b7280",
                    fontSize: "0.95rem",
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
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      backgroundColor: index % 2 === 0 ? "white" : "#f9fafb",
                      borderBottom:
                        index < (settings.locations?.length || 0) - 1
                          ? "1px solid #f0f0f0"
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.95rem",
                        color: "#333",
                      }}
                    >
                      {location}
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleEditListItem("location", location)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "1rem",
                          cursor: "pointer",
                          color: "#6b7280",
                          padding: "4px",
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete("location", location)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "1rem",
                          cursor: "pointer",
                          color: "#ef4444",
                          padding: "4px",
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

        {/* Bought For Management - Compact */}
        <div
          style={{
            ...settingsStyles.section,
            padding: "12px 0",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: bfExpanded ? "12px" : "0",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                color: "#333",
                fontWeight: "600",
                margin: "0",
              }}
            >
              Bought For ({settings?.boughtFor?.length || 0})
            </h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowAddBf(true)}
                style={{
                  background: "#e0e7ff",
                  border: "none",
                  borderRadius: "4px",
                  color: "#4f46e5",
                  padding: "6px 12px",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Add
              </button>
              <button
                onClick={() => setBfExpanded(!bfExpanded)}
                style={{
                  background: "#e0e7ff",
                  border: "none",
                  borderRadius: "4px",
                  color: "#4f46e5",
                  padding: "6px 12px",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                {bfExpanded ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {bfExpanded && (
            <div
              style={{
                border: "1px solid #e9ecef",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {!settings?.boughtFor || settings.boughtFor.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "#6b7280",
                    fontSize: "0.95rem",
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
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      backgroundColor: index % 2 === 0 ? "white" : "#f9fafb",
                      borderBottom:
                        index < (settings.boughtFor?.length || 0) - 1
                          ? "1px solid #f0f0f0"
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.95rem",
                        color: "#333",
                      }}
                    >
                      {boughtFor}
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() =>
                          handleEditListItem("boughtFor", boughtFor)
                        }
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "1rem",
                          cursor: "pointer",
                          color: "#6b7280",
                          padding: "4px",
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete("boughtFor", boughtFor)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "1rem",
                          cursor: "pointer",
                          color: "#ef4444",
                          padding: "4px",
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

        {/* EMW Settings at BOTTOM - Compact */}
        <div
          style={{
            ...settingsStyles.section,
            padding: "12px 0",
            paddingBottom: "80px", // Extra padding at bottom for navigation
          }}
        >
          <h3
            style={{
              ...settingsStyles.sectionTitle,
              fontSize: "1rem",
              marginBottom: "16px",
              color: "#333",
              fontWeight: "600",
            }}
          >
            EMW (Equated Monthly Withdrawal) Settings
          </h3>

          {/* EMW Interest Rate - Single row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
              padding: "8px 0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: "500",
                color: "#495057",
              }}
            >
              EMW Interest Rate
            </div>
            {editingField === "emwInterest" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => handleEditValueChange(e.target.value)}
                  style={{
                    width: "70px",
                    padding: "6px 8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "0.95rem",
                    textAlign: "right",
                  }}
                  autoFocus
                  onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                />
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={handleSaveEdit}
                    style={{
                      background: "#10b981",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      padding: "6px 8px",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                    }}
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      background: "#ef4444",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      padding: "6px 8px",
                      fontSize: "0.9rem",
                      cursor: "pointer",
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
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  {formatNumber(financialSettings.emwInterest)}%
                </div>
                <button
                  onClick={() =>
                    handleStartEdit(
                      "emwInterest",
                      financialSettings.emwInterest
                    )
                  }
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1rem",
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

          {/* EMW Target Date - Single row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: "500",
                color: "#495057",
              }}
            >
              EMW Target Date
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
                    padding: "6px 8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "0.95rem",
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
                      background: "#10b981",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      padding: "6px 8px",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                    }}
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelEmwDateEdit}
                    style={{
                      background: "#ef4444",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      padding: "6px 8px",
                      fontSize: "0.9rem",
                      cursor: "pointer",
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
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color: "#333",
                    textAlign: "right",
                  }}
                >
                  <div>{formatEmwDate(emwDate)}</div>
                  <div
                    style={{
                      fontSize: "0.8rem",
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
                    fontSize: "1rem",
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
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                fontSize: "1.1rem",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Add Location
            </h3>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Enter location name"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
                marginBottom: "20px",
              }}
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && handleAddLocation()}
            />
            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setShowAddLoc(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                  borderRadius: "8px",
                  color: "#495057",
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
                  flex: 1,
                  padding: "12px",
                  backgroundColor: !newLocation.trim() ? "#9ca3af" : "#2563eb",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: "500",
                  cursor: !newLocation.trim() ? "not-allowed" : "pointer",
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
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                fontSize: "1.1rem",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Add "Bought For"
            </h3>
            <input
              type="text"
              value={newBoughtFor}
              onChange={(e) => setNewBoughtFor(e.target.value)}
              placeholder="Enter purpose"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
                marginBottom: "20px",
              }}
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && handleAddBoughtFor()}
            />
            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setShowAddBf(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                  borderRadius: "8px",
                  color: "#495057",
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
                  flex: 1,
                  padding: "12px",
                  backgroundColor: !newBoughtFor.trim() ? "#9ca3af" : "#2563eb",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: "500",
                  cursor: !newBoughtFor.trim() ? "not-allowed" : "pointer",
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
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                fontSize: "1.1rem",
                fontWeight: "600",
                color: "#333",
              }}
            >
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
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
                marginBottom: "20px",
              }}
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && handleSaveListItemEdit()}
            />
            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                onClick={() => {
                  setRenameDialog(null);
                  setRenameValue("");
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                  borderRadius: "8px",
                  color: "#495057",
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
                  flex: 1,
                  padding: "12px",
                  backgroundColor: !renameValue.trim() ? "#9ca3af" : "#2563eb",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: "500",
                  cursor: !renameValue.trim() ? "not-allowed" : "pointer",
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
