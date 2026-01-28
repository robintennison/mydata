// src/modules/banking/AddEditDepositPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBankingData } from "../hooks/useBankingData";
import { useBankingOperations } from "../hooks/useBankingOperations";
import { Deposit, DepositFormData } from "../../../types/banking.types";
import { formatDate } from "../../../utils/formatters";
import { bankingStyles } from "../styles";

interface AddEditDepositPageProps {
  isEdit?: boolean;
}

const AddEditDepositPage: React.FC<AddEditDepositPageProps> = ({
  isEdit = false,
}) => {
  const { depositId } = useParams();
  const navigate = useNavigate();
  const { accounts, deposits, loading: dataLoading } = useBankingData();
  const { handleSaveDeposit, handleDeleteDeposit } = useBankingOperations();

  const [formData, setFormData] = useState<DepositFormData>({
    id: "",
    accountId: "",
    amount: 500000,
    startDate: Date.now(),
    endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    comments: "",
    active: true,
  });
  const [selectedAccountCode, setSelectedAccountCode] = useState("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localAccounts, setLocalAccounts] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [showCalendar, setShowCalendar] = useState<"start" | "end" | null>(
    null,
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showYearSelector, setShowYearSelector] = useState(false);

  // Refs for dropdown positioning
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Sync accounts when they load
  useEffect(() => {
    if (accounts.length > 0) {
      setLocalAccounts(accounts);
    }
  }, [accounts]);

  // Load deposit data if editing
  useEffect(() => {
    if (isEdit && depositId && deposits.length > 0) {
      const deposit = deposits.find((d) => d.id === depositId);
      if (deposit) {
        const account = accounts.find((acc) => acc.id === deposit.accountId);
        setFormData({
          id: deposit.id,
          accountId: deposit.accountId,
          amount: deposit.amount,
          startDate: deposit.startDate,
          endDate: deposit.endDate,
          comments: deposit.comments,
          active: deposit.active,
        });
        setSelectedAccountCode(account?.acctCode || "");
      }
    }
  }, [isEdit, depositId, deposits, accounts]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close account dropdown
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowAccountDropdown(false);
      }

      // Close calendar
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".date-input")
      ) {
        setShowCalendar(null);
        setShowYearSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (field: keyof DepositFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleAccountSelect = (accountId: string, accountCode: string) => {
    setFormData((prev) => ({
      ...prev,
      accountId,
    }));
    setSelectedAccountCode(accountCode);
    setShowAccountDropdown(false);
    // Clear error when account is selected
    if (error) setError("");
  };

  const openCalendar = (field: "start" | "end") => {
    setShowCalendar(field);
    setShowYearSelector(false);
    // Set current month based on the selected date
    const dateValue = field === "start" ? formData.startDate : formData.endDate;
    setCurrentMonth(new Date(dateValue));
  };

  const selectDate = (date: Date, field: "start" | "end") => {
    if (field === "start") {
      handleInputChange("startDate", date.getTime());
    } else {
      handleInputChange("endDate", date.getTime());
    }
    setShowCalendar(null);
    setShowYearSelector(false);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const navigateYear = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      newMonth.setFullYear(newMonth.getFullYear() - 1);
    } else {
      newMonth.setFullYear(newMonth.getFullYear() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const selectYear = (year: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(year);
    setCurrentMonth(newMonth);
    setShowYearSelector(false);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDate = (date: Date, field: "start" | "end") => {
    const selectedDate =
      field === "start" ? formData.startDate : formData.endDate;
    const compareDate = new Date(selectedDate);
    return (
      date.getDate() === compareDate.getDate() &&
      date.getMonth() === compareDate.getMonth() &&
      date.getFullYear() === compareDate.getFullYear()
    );
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{ padding: "10px 0" }}></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isTodayDate = isToday(date);
      const isSelectedStart = isSelectedDate(date, "start");
      const isSelectedEnd = isSelectedDate(date, "end");
      const isSelected =
        showCalendar === "start" ? isSelectedStart : isSelectedEnd;

      days.push(
        <button
          key={day}
          onClick={() => selectDate(date, showCalendar!)}
          style={{
            padding: "10px 0",
            background: "none",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.9rem",
            color: "#333",
            transition: "all 0.2s",
            ...(isSelected
              ? {
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  fontWeight: 600,
                }
              : {}),
            ...(isTodayDate
              ? {
                  border: "2px solid #3b82f6",
                }
              : {}),
          }}
        >
          {day}
        </button>,
      );
    }

    return days;
  };

  const renderYearSelector = () => {
    const currentYear = currentMonth.getFullYear();
    const startYear = currentYear - 6;
    const years = [];

    for (let year = startYear; year <= startYear + 12; year++) {
      years.push(
        <button
          key={year}
          onClick={() => selectYear(year)}
          style={{
            padding: "10px 0",
            background: year === currentYear ? "#3b82f6" : "none",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.9rem",
            color: year === currentYear ? "#fff" : "#333",
            fontWeight: year === currentYear ? 600 : 400,
            transition: "all 0.2s",
          }}
        >
          {year}
        </button>,
      );
    }

    return (
      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          padding: "10px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
        }}
      >
        {years}
      </div>
    );
  };

  const handleSave = async () => {
    // Clear previous errors
    setError("");

    // Validation
    if (!formData.accountId) {
      setError("Please select an account");
      return;
    }

    if (formData.amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (formData.startDate > formData.endDate) {
      setError("Start date cannot be after end date");
      return;
    }

    setSaving(true);

    try {
      // For editing: use existing ID
      // For new deposits: use empty string - let Firebase generate the ID
      const depositToSave: Deposit = {
        ...formData,
        // Keep the ID if editing, otherwise empty string for new deposits
        id: isEdit && depositId ? depositId : "",
      };

      console.log("DEBUG: Saving deposit:", depositToSave);

      // Call the save function
      const success = await handleSaveDeposit(depositToSave);

      if (success) {
        console.log("DEBUG: Save completed successfully, navigating...");
        navigate("/banking?tab=deposits", { replace: true });
      } else {
        console.log("DEBUG: Save operation was cancelled");
        setSaving(false);
      }
    } catch (error: any) {
      console.error("DEBUG: Error saving deposit:", error);
      // Provide more specific error messages
      let errorMessage = "Failed to save deposit. Please try again.";

      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to save deposits.";
      } else if (error.code === "unavailable") {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message) {
        errorMessage = `Failed to save deposit: ${error.message}`;
      }

      setError(errorMessage);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!depositId) return;

    setDeleting(true);
    try {
      // Call delete function and wait for it to complete
      const success = await handleDeleteDeposit(depositId);

      if (success) {
        console.log("DEBUG: Delete completed successfully, navigating...");
        navigate("/banking?tab=deposits", { replace: true });
      } else {
        // If handleDeleteDeposit returns false (e.g., user cancelled confirmation)
        console.log("DEBUG: Delete operation was cancelled");
        setDeleting(false);
        setShowDeleteConfirm(false);
      }
    } catch (error: any) {
      console.error("DEBUG: Error deleting deposit:", error);
      let errorMessage = "Failed to delete deposit. Please try again.";

      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to delete deposits.";
      } else if (error.message) {
        errorMessage = `Failed to delete deposit: ${error.message}`;
      }

      setError(errorMessage);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to banking with deposits tab active
    navigate("/banking?tab=deposits", { replace: true });
  };

  if (dataLoading && isEdit) {
    return (
      <div style={bankingStyles.container}>
        <div style={bankingStyles.loading}>
          <div style={bankingStyles.spinner}></div>
          <p>Loading deposit details...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={bankingStyles.container}>
      {/* Top Navigation - Simplified with only back button */}
      <div style={bankingStyles.topNav}>
        <button
          onClick={handleCancel}
          style={bankingStyles.navButton}
          title="Back"
          disabled={saving || deleting}
        >
          ←
        </button>
        <div style={bankingStyles.navTitle}>
          Banking / {isEdit ? "Edit Deposit" : "Add Deposit"}
        </div>
        <div style={{ width: "44px" }}></div> {/* Spacer for alignment */}
      </div>

      {/* Form */}
      <div style={{ padding: "15px 0", position: "relative" }}>
        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #ef4444",
              color: "#dc2626",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <div style={{ fontSize: "1.2rem" }}>⚠️</div>
            <div>{error}</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Account Dropdown */}
          <div style={{ position: "relative", width: "100%" }}>
            <label
              style={{
                fontSize: "0.9rem",
                color: "#495057",
                marginBottom: "4px",
                display: "block",
                fontWeight: 500,
              }}
            >
              Account *
            </label>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                ref={inputRef}
                type="text"
                value={selectedAccountCode}
                readOnly
                onClick={() => {
                  if (localAccounts.length > 0) {
                    setShowAccountDropdown(!showAccountDropdown);
                  } else {
                    alert("Accounts are still loading. Please wait a moment.");
                  }
                }}
                placeholder={
                  dataLoading
                    ? "Loading accounts..."
                    : localAccounts.length > 0
                      ? "Select account"
                      : "No accounts available"
                }
                style={{
                  ...bankingStyles.input,
                  cursor: localAccounts.length > 0 ? "pointer" : "not-allowed",
                  paddingRight: "40px",
                  backgroundColor: "#fff",
                  opacity: localAccounts.length > 0 ? 1 : 0.7,
                  width: "100%",
                  boxSizing: "border-box",
                  borderColor:
                    error && !formData.accountId ? "#dc2626" : "#e0e0e0",
                }}
                disabled={localAccounts.length === 0}
              />
              {localAccounts.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6c757d",
                    pointerEvents: "none",
                  }}
                >
                  ▼
                </div>
              )}
            </div>

            {/* Account Dropdown */}
            {showAccountDropdown && localAccounts.length > 0 && (
              <div
                ref={dropdownRef}
                style={{
                  position: "fixed",
                  top: inputRef.current
                    ? inputRef.current.getBoundingClientRect().bottom +
                      window.scrollY +
                      4
                    : "200px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "calc(100% - 30px)",
                  maxWidth: "600px",
                  backgroundColor: "#fff",
                  border: "1px solid #e9ecef",
                  borderRadius: "8px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  zIndex: 9999,
                  maxHeight: "60vh",
                  overflow: "hidden",
                  marginTop: "4px",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f0f0f0",
                    backgroundColor: "#f8f9fa",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    color: "#495057",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  Select Account ({localAccounts.length} available)
                  <button
                    onClick={() => setShowAccountDropdown(false)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      color: "#666",
                      padding: "4px",
                    }}
                    title="Close"
                  >
                    ×
                  </button>
                </div>

                <div
                  style={{
                    maxHeight: "calc(60vh - 60px)",
                    overflowY: "auto",
                    padding: "4px 0",
                  }}
                >
                  {localAccounts
                    .sort((a, b) => a.acctCode.localeCompare(b.acctCode))
                    .map((account) => (
                      <button
                        key={account.id}
                        onClick={() =>
                          handleAccountSelect(account.id, account.acctCode)
                        }
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          textAlign: "left",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.95rem",
                          color: "#333",
                          borderBottom: "1px solid #f5f5f5",
                          backgroundColor:
                            formData.accountId === account.id
                              ? "#e8f0fe"
                              : "transparent",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (formData.accountId !== account.id) {
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (formData.accountId !== account.id) {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 500,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {account.acctCode}
                          </div>
                          {account.acctDetails && (
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "#666",
                                marginTop: "2px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {account.acctDetails.split("\n")[0]}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color:
                              account.savingsAmount >= 0
                                ? "#10b981"
                                : "#dc2626",
                            whiteSpace: "nowrap",
                            marginLeft: "12px",
                            textAlign: "right" as const,
                            minWidth: "80px",
                          }}
                        >
                          ₹
                          {(account.savingsAmount || 0).toLocaleString("en-IN")}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label
              style={{
                fontSize: "0.9rem",
                color: "#495057",
                marginBottom: "4px",
                display: "block",
                fontWeight: 500,
              }}
            >
              Amount (₹) *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                handleInputChange("amount", parseFloat(e.target.value) || 0)
              }
              placeholder="Enter amount"
              style={{
                ...bankingStyles.input,
                width: "100%",
                boxSizing: "border-box",
                borderColor:
                  error && formData.amount <= 0 ? "#dc2626" : "#e0e0e0",
              }}
              min="0"
              step="1000"
            />
          </div>

          {/* Start Date with Calendar */}
          <div>
            <label
              style={{
                fontSize: "0.9rem",
                color: "#495057",
                marginBottom: "4px",
                display: "block",
                fontWeight: 500,
              }}
            >
              Start Date
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={formatDate(formData.startDate, "en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                readOnly
                onClick={() => openCalendar("start")}
                className="date-input"
                style={{
                  ...bankingStyles.input,
                  cursor: "pointer",
                  paddingRight: "40px",
                  backgroundColor: "#fff",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={() => openCalendar("start")}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6c757d",
                  fontSize: "1.2rem",
                  padding: "4px",
                }}
                title="Pick start date"
                type="button"
              >
                📅
              </button>
            </div>
          </div>

          {/* End Date with Calendar */}
          <div>
            <label
              style={{
                fontSize: "0.9rem",
                color: "#495057",
                marginBottom: "4px",
                display: "block",
                fontWeight: 500,
              }}
            >
              End Date
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={formatDate(formData.endDate, "en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                readOnly
                onClick={() => openCalendar("end")}
                className="date-input"
                style={{
                  ...bankingStyles.input,
                  cursor: "pointer",
                  paddingRight: "40px",
                  backgroundColor: "#fff",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={() => openCalendar("end")}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6c757d",
                  fontSize: "1.2rem",
                  padding: "4px",
                }}
                title="Pick end date"
                type="button"
              >
                📅
              </button>
            </div>
          </div>

          {/* Calendar Popup */}
          {showCalendar && (
            <div
              ref={calendarRef}
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                zIndex: 10001,
                padding: "20px",
                minWidth: showYearSelector ? "350px" : "300px",
                maxWidth: showYearSelector ? "400px" : "350px",
                width: "90%",
                maxHeight: "80vh",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => navigateYear("prev")}
                    style={{
                      background: "none",
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      color: "#333",
                      minWidth: "40px",
                    }}
                    title="Previous Year"
                    type="button"
                  >
                    &lt;&lt;
                  </button>
                  <button
                    onClick={() => navigateMonth("prev")}
                    style={{
                      background: "none",
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      color: "#333",
                      minWidth: "40px",
                    }}
                    title="Previous Month"
                    type="button"
                  >
                    &lt;
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <button
                    onClick={() => setShowYearSelector(!showYearSelector)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      color: "#333",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    title="Select Year"
                    type="button"
                  >
                    {currentMonth.toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </button>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => navigateMonth("next")}
                    style={{
                      background: "none",
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      color: "#333",
                      minWidth: "40px",
                    }}
                    title="Next Month"
                    type="button"
                  >
                    &gt;
                  </button>
                  <button
                    onClick={() => navigateYear("next")}
                    style={{
                      background: "none",
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      color: "#333",
                      minWidth: "40px",
                    }}
                    title="Next Year"
                    type="button"
                  >
                    &gt;&gt;
                  </button>
                </div>
              </div>

              {showYearSelector ? (
                renderYearSelector()
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      marginBottom: "8px",
                    }}
                  >
                    {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                      <div
                        key={day}
                        style={{
                          textAlign: "center" as const,
                          fontSize: "0.85rem",
                          color: "#666",
                          fontWeight: 500,
                          padding: "4px 0",
                        }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: "4px",
                    }}
                  >
                    {renderCalendar()}
                  </div>
                </>
              )}

              <div
                style={{
                  marginTop: "15px",
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() => {
                    // Set to today
                    const today = new Date();
                    selectDate(today, showCalendar!);
                  }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#3b82f6",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    color: "#fff",
                  }}
                  type="button"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    setShowCalendar(null);
                    setShowYearSelector(false);
                  }}
                  style={{
                    padding: "8px 20px",
                    backgroundColor: "#f0f0f0",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <label
              style={{
                fontSize: "0.9rem",
                color: "#495057",
                marginBottom: "4px",
                display: "block",
                fontWeight: 500,
              }}
            >
              Comments
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => handleInputChange("comments", e.target.value)}
              placeholder="Enter comments (optional)"
              style={{
                ...bankingStyles.input,
                minHeight: "80px",
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: "1.5",
                width: "100%",
                boxSizing: "border-box",
              }}
              maxLength={500}
            />
            <div
              style={{
                fontSize: "0.8rem",
                color: "#6c757d",
                textAlign: "right" as const,
                marginTop: "4px",
              }}
            >
              {formData.comments.length}/500
            </div>
          </div>

          {/* Active Checkbox */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => handleInputChange("active", e.target.checked)}
              id="active-checkbox"
              style={{
                width: "20px",
                height: "20px",
                cursor: "pointer",
              }}
            />
            <label
              htmlFor="active-checkbox"
              style={{
                fontSize: "0.95rem",
                color: "#495057",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Active
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: "32px", display: "flex", gap: "12px" }}>
          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            disabled={saving || deleting}
            style={{
              flex: 1,
              padding: "14px 20px",
              backgroundColor: "transparent",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              color: "#666",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: saving || deleting ? "not-allowed" : "pointer",
              opacity: saving || deleting ? 0.7 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!saving && !deleting) {
                e.currentTarget.style.backgroundColor = "#f8f9fa";
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && !deleting) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            Cancel
          </button>

          {/* Delete Button - Only show in edit mode */}
          {isEdit && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
              style={{
                flex: 1,
                padding: "14px 20px",
                backgroundColor: saving || deleting ? "#9ca3af" : "#dc2626",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: saving || deleting ? "not-allowed" : "pointer",
                opacity: saving || deleting ? 0.7 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!saving && !deleting) {
                  e.currentTarget.style.backgroundColor = "#b91c1c";
                }
              }}
              onMouseLeave={(e) => {
                if (!saving && !deleting) {
                  e.currentTarget.style.backgroundColor = "#dc2626";
                }
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={
              saving || deleting || !formData.accountId || formData.amount <= 0
            }
            style={{
              flex: 1,
              padding: "14px 20px",
              backgroundColor:
                saving || deleting
                  ? "#94a3b8"
                  : !formData.accountId || formData.amount <= 0
                    ? "#cbd5e1"
                    : "#10b981",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontWeight: 600,
              fontSize: "1rem",
              cursor:
                saving ||
                deleting ||
                !formData.accountId ||
                formData.amount <= 0
                  ? "not-allowed"
                  : "pointer",
              opacity:
                saving ||
                deleting ||
                !formData.accountId ||
                formData.amount <= 0
                  ? 0.7
                  : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (
                !saving &&
                !deleting &&
                formData.accountId &&
                formData.amount > 0
              ) {
                e.currentTarget.style.backgroundColor = "#059669";
              }
            }}
            onMouseLeave={(e) => {
              if (
                !saving &&
                !deleting &&
                formData.accountId &&
                formData.amount > 0
              ) {
                e.currentTarget.style.backgroundColor = "#10b981";
              }
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Required Fields Note */}
        <div
          style={{
            marginTop: "12px",
            fontSize: "0.85rem",
            color: "#6c757d",
            textAlign: "center" as const,
          }}
        >
          * Required fields
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
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
            zIndex: 10000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#333",
              }}
            >
              Delete Deposit
            </h3>
            <p
              style={{
                margin: "0 0 24px 0",
                color: "#666",
                lineHeight: "1.5",
                fontSize: "0.95rem",
              }}
            >
              Are you sure you want to delete this deposit? This action cannot
              be undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "transparent",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  color: "#666",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  minWidth: "80px",
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "10px 20px",
                  backgroundColor: deleting ? "#9ca3af" : "#dc2626",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontWeight: 500,
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontSize: "0.95rem",
                  minWidth: "80px",
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEditDepositPage;
