// src/modules/SettingsPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";

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
    emwInterest: 0,
  });

  // EMW state - start with empty values
  const [emwDate, setEmwDate] = useState<string>("");
  const [targetAge, setTargetAge] = useState<number | null>(null);
  const [useAgeMode, setUseAgeMode] = useState(false); // Toggle between Age and Date mode

  // Editing states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingTargetDate, setEditingTargetDate] = useState(false);
  const [editingTargetAge, setEditingTargetAge] = useState(false);
  const [targetDateValue, setTargetDateValue] = useState("");
  const [targetAgeValue, setTargetAgeValue] = useState("");

  // Date of birth (Oct 17, 1959)
  const DOB = new Date(1959, 9, 17); // Month is 0-indexed, so 9 = October

  useEffect(() => {
    // Update local state whenever settings change from context
    if (settings) {
      console.log("Settings updated:", settings);

      setFinancialSettings({
        goldRate: settings.goldRatePerGram ?? 0,
        makingTax: settings.makingTaxPercent ?? 0,
        resaleDiscount: settings.resaleDiscountPercent ?? 0,
        liabilities: settings.liabilities ?? 0,
        emwInterest: settings.EMW_interest ?? 0,
      });

      // Only set EMW date and calculate age if we have a valid date
      if (settings.EMW_Date) {
        setEmwDate(settings.EMW_Date);
        const calculatedAge = calculateAgeFromDate(settings.EMW_Date);
        setTargetAge(calculatedAge);
      } else {
        // If no date in settings, use default
        setEmwDate("2044-10");
        setTargetAge(85);
      }
    }
  }, [settings]);

  // Calculate age from date string (YYYY-MM)
  const calculateAgeFromDate = (dateStr: string): number => {
    if (!dateStr) return 85; // Return default age if no date

    try {
      const [year, month] = dateStr.split("-").map(Number);
      const targetDate = new Date(year, month - 1, 1);

      let age = targetDate.getFullYear() - DOB.getFullYear();
      const monthDiff = targetDate.getMonth() - DOB.getMonth();

      // Adjust age if birthday hasn't occurred yet in the target month
      if (monthDiff < 0) {
        age--;
      }

      return age;
    } catch (e) {
      return 85; // Return default age on error
    }
  };

  // Calculate target date from age
  const calculateDateFromAge = (age: number): string => {
    const targetYear = DOB.getFullYear() + age;
    // Use the same month as DOB (October)
    return `${targetYear}-10`; // October
  };

  const toggleMode = () => {
    setUseAgeMode(!useAgeMode);
    // Cancel any ongoing edits when switching modes
    setEditingTargetDate(false);
    setEditingTargetAge(false);
  };

  const handleStartTargetDateEdit = () => {
    setEditingTargetDate(true);
    setTargetDateValue(emwDate);
  };

  const handleStartTargetAgeEdit = () => {
    setEditingTargetAge(true);
    setTargetAgeValue(targetAge?.toString() || "");
  };

  const handleSaveTargetDateEdit = () => {
    if (!targetDateValue.trim()) return;

    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!dateRegex.test(targetDateValue)) {
      alert("Please enter date in YYYY-MM format (e.g., 2039-10)");
      return;
    }

    setEmwDate(targetDateValue);
    const newAge = calculateAgeFromDate(targetDateValue);
    setTargetAge(newAge);
    updateSettings({ EMW_Date: targetDateValue } as any);
    setEditingTargetDate(false);
  };

  const handleSaveTargetAgeEdit = () => {
    if (!targetAgeValue.trim()) return;

    const age = parseInt(targetAgeValue);
    if (isNaN(age) || age < 0 || age > 150) {
      alert("Please enter a valid age (0-150)");
      return;
    }

    const newDate = calculateDateFromAge(age);
    setEmwDate(newDate);
    setTargetAge(age);
    updateSettings({ EMW_Date: newDate } as any);
    setEditingTargetAge(false);
  };

  const handleCancelTargetDateEdit = () => {
    setEditingTargetDate(false);
    setTargetDateValue("");
  };

  const handleCancelTargetAgeEdit = () => {
    setEditingTargetAge(false);
    setTargetAgeValue("");
  };

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
        settingsField = "EMW_interest";
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

  const handleEditValueChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setEditValue(value);
    }
  };

  const handleToggle = (
    field: "showInactive" | "showDelete",
    value: boolean,
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
    oldValue: string,
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
    if (!dateStr) return "Loading...";

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
    showEditIcon: boolean = true,
  ) => {
    const isEditing = editingField === field;

    return (
      <div className="flex justify-between items-center py-3 border-b border-gray-100">
        <div className="flex-1 pr-4">
          <div className="font-medium text-gray-900 mb-1 text-sm">{label}</div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              {prefix && (
                <span className="text-gray-700 font-medium text-sm">
                  {prefix}
                </span>
              )}
              <input
                type="text"
                value={editValue}
                onChange={(e) => handleEditValueChange(e.target.value)}
                className="w-20 p-2 text-sm border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
              />
              {suffix && (
                <span className="text-gray-700 text-sm">{suffix}</span>
              )}
              <div className="flex gap-1">
                <button
                  onClick={handleSaveEdit}
                  className="p-1.5 border-none rounded cursor-pointer text-sm flex items-center justify-center min-w-8 h-8 transition-all bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  title="Save"
                >
                  ✓
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 border-none rounded cursor-pointer text-sm flex items-center justify-center min-w-8 h-8 transition-all bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                {prefix && <span>{prefix}</span>}
                {formatNumber(value)}
                {suffix && <span>{suffix}</span>}
              </div>
              {showEditIcon && (
                <button
                  onClick={() => handleStartEdit(field, value)}
                  className="bg-transparent border-none text-base cursor-pointer text-gray-500 p-0.5 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
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
    value: boolean,
  ) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-100">
      <div className="flex-1 pr-4">
        <div className="font-medium text-gray-900 mb-1 text-sm">{label}</div>
        <div className="text-xs text-gray-500 leading-snug">{description}</div>
      </div>
      <button
        onClick={() => handleToggle(field, !value)}
        className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors duration-200 ease-in-out flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 ${value ? "bg-blue-600" : "bg-gray-300"}`}
      >
        <div
          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-200 ease-in-out ${value ? "translate-x-6" : ""}`}
        />
      </button>
    </div>
  );

  const renderListSection = (
    title: string,
    count: number,
    isExpanded: boolean,
    setIsExpanded: (val: boolean) => void,
    setShowAdd: (val: boolean) => void,
    items: string[],
    type: "location" | "boughtFor",
  ) => (
    <div className="mb-6 px-1.5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <h3 className="m-0 mb-1 text-lg font-semibold text-gray-900">
            {title}
          </h3>
          <div className="text-xs text-gray-500">{count} items</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-indigo-100 border border-indigo-200 rounded text-indigo-600 font-medium cursor-pointer text-sm transition-all hover:bg-indigo-200 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[60px]"
          >
            Add
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 bg-indigo-100 border border-indigo-200 rounded text-indigo-600 cursor-pointer text-sm flex items-center justify-center w-10 h-10 transition-all hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isExpanded ? "bg-indigo-200" : ""}`}
          >
            {isExpanded ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border border-gray-200 rounded overflow-hidden mt-2.5">
          {items.length === 0 ? (
            <div className="p-5 text-center text-gray-500 italic">
              No {title.toLowerCase()} yet.
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-3 border-b border-gray-100 transition-colors ${index % 2 !== 0 ? "bg-gray-50" : "bg-white"}`}
              >
                <span className="text-sm text-gray-900 flex-1 pr-2.5">
                  {item}
                </span>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEditListItem(type, item)}
                    className="p-1.5 border rounded cursor-pointer text-sm flex items-center justify-center w-8 h-8 transition-all bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(type, item)}
                    className="p-1.5 border rounded cursor-pointer text-sm flex items-center justify-center w-8 h-8 transition-all bg-red-50 border-red-200 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
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
    placeholder: string,
  ) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
        <h3 className="m-0 mb-4 text-lg font-semibold text-gray-900">
          {title}
        </h3>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 border border-gray-300 rounded text-sm text-gray-900 bg-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autoFocus
          onKeyPress={(e) => e.key === "Enter" && onSave()}
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded font-medium cursor-pointer text-sm transition-all min-w-[80px] bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!value.trim()}
            className={`px-5 py-2.5 rounded font-medium cursor-pointer text-sm transition-all min-w-[80px] bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${!value.trim() ? "bg-gray-400 cursor-not-allowed opacity-60" : ""}`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 text-sm font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto shadow-lg">
      {/* Compact Header - Single row */}
      <div className="flex items-center justify-between p-3 px-5 bg-white border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-900 text-2xl cursor-pointer transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Go Back"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          System / Settings
        </h1>
        <button
          onClick={() => navigate("/banking")}
          className="w-10 h-10 text-2xl border-none bg-transparent hover:bg-transparent flex items-center justify-center text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          title="Home"
        >
          🏠
        </button>
      </div>

      <div className="p-0 bg-white min-h-[calc(100vh-160px)]">
        {/* Display Settings at TOP - Compact */}
        <div className="mb-6 px-1.5">
          <h3 className="m-0 mb-4 text-lg font-semibold text-gray-900 flex items-center justify-between">
            Display Settings
          </h3>
          {renderToggleField(
            "Show Inactive Items",
            "Show inactive jewellery in lists and gallery",
            "showInactive",
            settings?.showInactive ?? false,
          )}
          {renderToggleField(
            "Show Delete Action",
            "Display the edit and delete control on Edit screen",
            "showDelete",
            settings?.showDelete ?? false,
          )}
        </div>

        {/* Financial Settings - Compact */}
        <div className="mb-6 px-1.5">
          <h3 className="m-0 mb-4 text-lg font-semibold text-gray-900 flex items-center justify-between">
            Financial Settings
          </h3>
          {renderEditableField(
            "Ice Rate",
            "goldRate",
            financialSettings.goldRate,
            "",
          )}
          {renderEditableField(
            "Making Tax",
            "makingTax",
            financialSettings.makingTax,
            "%",
          )}
          {renderEditableField(
            "Resale Discount",
            "resaleDiscount",
            financialSettings.resaleDiscount,
            "%",
          )}
          {renderEditableField(
            "Liabilities",
            "liabilities",
            financialSettings.liabilities,
            "",
            "₹",
          )}
        </div>

        {/* Locations Management - Compact */}
        {renderListSection(
          "Locations",
          settings?.locations?.length ?? 0,
          locExpanded,
          setLocExpanded,
          setShowAddLoc,
          settings?.locations ?? [],
          "location",
        )}

        {/* Bought For Management - Compact */}
        {renderListSection(
          "Bought For",
          settings?.boughtFor?.length ?? 0,
          bfExpanded,
          setBfExpanded,
          setShowAddBf,
          settings?.boughtFor ?? [],
          "boughtFor",
        )}

        {/* EMW Settings at BOTTOM - Compact */}
        <div className="mb-6 px-1.5 pb-20">
          <h3 className="m-0 mb-4 text-lg font-semibold text-gray-900 flex items-center justify-between">
            EMW (Equated Monthly Withdrawal) Settings
          </h3>

          {renderEditableField(
            "EMW Interest Rate",
            "emwInterest",
            financialSettings.emwInterest,
            "%",
          )}

          {/* Toggle between Age and Date mode */}
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleMode}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Switch to {useAgeMode ? "Date" : "Age"} Mode
            </button>
          </div>

          {/* Target Date Input */}
          {!useAgeMode && (
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex-1 pr-4">
                <div className="font-medium text-gray-900 mb-1 text-sm">
                  Target Date
                </div>
              </div>
              {editingTargetDate ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={targetDateValue}
                    onChange={(e) => setTargetDateValue(e.target.value)}
                    placeholder="YYYY-MM"
                    className="w-24 p-2 text-sm border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSaveTargetDateEdit()
                    }
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={handleSaveTargetDateEdit}
                      className="p-1.5 border-none rounded cursor-pointer text-sm flex items-center justify-center min-w-8 h-8 transition-all bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelTargetDateEdit}
                      className="p-1.5 border-none rounded cursor-pointer text-sm flex items-center justify-center min-w-8 h-8 transition-all bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-700 text-right">
                      {emwDate ? formatEmwDate(emwDate) : "Loading..."}
                    </div>
                    {emwDate && (
                      <div className="text-xs text-gray-500 font-normal">
                        ({emwDate})
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleStartTargetDateEdit}
                    className="bg-transparent border-none text-base cursor-pointer text-gray-500 p-0.5 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    title="Edit"
                    disabled={!emwDate}
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Target Age Input */}
          {useAgeMode && (
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex-1 pr-4">
                <div className="font-medium text-gray-900 mb-1 text-sm">
                  Target Age
                </div>
              </div>
              {editingTargetAge ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={targetAgeValue}
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) {
                        setTargetAgeValue(e.target.value);
                      }
                    }}
                    placeholder="Age"
                    className="w-20 p-2 text-sm border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSaveTargetAgeEdit()
                    }
                  />
                  <span className="text-gray-700 text-sm">years</span>
                  <div className="flex gap-1">
                    <button
                      onClick={handleSaveTargetAgeEdit}
                      className="p-1.5 border-none rounded cursor-pointer text-sm flex items-center justify-center min-w-8 h-8 transition-all bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelTargetAgeEdit}
                      className="p-1.5 border-none rounded cursor-pointer text-sm flex items-center justify-center min-w-8 h-8 transition-all bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-700 text-right">
                      {targetAge !== null ? `${targetAge} years` : "Loading..."}
                    </div>
                    {targetAge !== null && (
                      <div className="text-xs text-gray-500 font-normal">
                        (at age {targetAge})
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleStartTargetAgeEdit}
                    className="bg-transparent border-none text-base cursor-pointer text-gray-500 p-0.5 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    title="Edit"
                    disabled={targetAge === null}
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Show both values for reference when in either mode */}
          <div className="mt-3 text-xs text-gray-500 text-right">
            {!useAgeMode && targetAge && (
              <div>Equivalent age: {targetAge} years</div>
            )}
            {useAgeMode && emwDate && (
              <div>Target date: {formatEmwDate(emwDate)}</div>
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
          "Enter location name",
        )}

      {/* Add Bought For Dialog */}
      {showAddBf &&
        renderDialog(
          'Add "Bought For"',
          newBoughtFor,
          setNewBoughtFor,
          handleAddBoughtFor,
          () => setShowAddBf(false),
          "Enter purpose",
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
          "Enter new value",
        )}
    </div>
  );
};

export default SettingsPage;
