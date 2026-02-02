// src/modules/banking/AddEditDepositPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBankingData } from "../hooks/useBankingData";
import { useBankingOperations } from "../hooks/useBankingOperations";
import { Deposit, DepositFormData } from "../../../types/banking.types";
import { formatDate } from "../../../utils/formatters";
import { tw, cls } from "../../../utils/tailwindMapping";

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
      days.push(<div key={`empty-${i}`} className="py-2.5"></div>);
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
          className={cls(
            "py-2.5 bg-transparent border-none rounded text-sm transition-all",
            isSelected
              ? "bg-blue-500 text-white font-semibold"
              : "text-gray-800 hover:bg-gray-100",
            isTodayDate && !isSelected ? "border-2 border-blue-500" : "",
          )}
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
          className={cls(
            "py-2.5 border-none rounded text-sm transition-all",
            year === currentYear
              ? "bg-blue-500 text-white font-semibold"
              : "bg-transparent text-gray-800 hover:bg-gray-100",
          )}
        >
          {year}
        </button>,
      );
    }

    return (
      <div className="max-h-72 overflow-y-auto p-2.5 grid grid-cols-4 gap-2">
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
      <div className="flex flex-col items-center justify-center h-screen">
        <div className={tw.bankingSpinner}></div>
        <p className="mt-4 text-gray-600">Loading deposit details...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50">
      {/* Top Navigation - Simplified with only back button */}
      <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
        <button
          onClick={handleCancel}
          className="bg-transparent border-none text-xl cursor-pointer p-2 text-blue-500 flex items-center justify-center w-10 h-10 hover:bg-blue-50 transition-colors rounded-lg"
          title="Back"
          disabled={saving || deleting}
        >
          ←
        </button>
        <div className="text-base font-semibold text-gray-800 flex-1 text-center">
          Banking / {isEdit ? "Edit Deposit" : "Add Deposit"}
        </div>
        <div className="w-11"></div> {/* Spacer for alignment */}
      </div>

      {/* Form */}
      <div className="p-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-start gap-2">
            <div className="text-lg">⚠️</div>
            <div className="flex-1 text-sm">{error}</div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Account Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account *
            </label>
            <div className="relative">
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
                className={cls(
                  tw.bankingInput,
                  "pr-10 w-full",
                  localAccounts.length > 0
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-70",
                )}
                style={{
                  borderColor:
                    error && !formData.accountId ? "#dc2626" : undefined,
                }}
                disabled={localAccounts.length === 0}
              />
              {localAccounts.length > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  ▼
                </div>
              )}
            </div>

            {/* Account Dropdown */}
            {showAccountDropdown && localAccounts.length > 0 && (
              <div
                ref={dropdownRef}
                className="fixed left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-[calc(100%-30px)] max-w-2xl max-h-[60vh] overflow-hidden mt-1"
                style={{
                  top: inputRef.current
                    ? `${
                        inputRef.current.getBoundingClientRect().bottom +
                        window.scrollY +
                        4
                      }px`
                    : "200px",
                }}
              >
                <div className="p-3 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-700 sticky top-0 z-10 flex justify-between items-center">
                  <span>Select Account ({localAccounts.length} available)</span>
                  <button
                    onClick={() => setShowAccountDropdown(false)}
                    className="text-gray-500 text-lg hover:text-gray-700 p-1"
                    title="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="max-h-[calc(60vh-60px)] overflow-y-auto py-1">
                  {localAccounts
                    .sort((a, b) => a.acctCode.localeCompare(b.acctCode))
                    .map((account) => (
                      <button
                        key={account.id}
                        onClick={() =>
                          handleAccountSelect(account.id, account.acctCode)
                        }
                        className={cls(
                          "w-full px-4 py-3 text-left text-sm border-b border-gray-100 flex justify-between items-start transition-colors",
                          formData.accountId === account.id
                            ? "bg-blue-50"
                            : "bg-transparent hover:bg-gray-50",
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {account.acctCode}
                          </div>
                          {account.acctDetails && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate">
                              {account.acctDetails.split("\n")[0]}
                            </div>
                          )}
                        </div>
                        <div
                          className={cls(
                            "text-xs font-semibold whitespace-nowrap ml-3 text-right min-w-20",
                            account.savingsAmount >= 0
                              ? "text-green-600"
                              : "text-red-600",
                          )}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                handleInputChange("amount", parseFloat(e.target.value) || 0)
              }
              placeholder="Enter amount"
              className={cls(
                tw.bankingInput,
                "w-full",
                error && formData.amount <= 0 ? "border-red-300" : "",
              )}
              min="0"
              step="1000"
            />
          </div>

          {/* Start Date with Calendar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="relative">
              <input
                type="text"
                value={formatDate(formData.startDate, "en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                readOnly
                onClick={() => openCalendar("start")}
                className="date-input cursor-pointer pr-10 w-full"
              />
              <button
                onClick={() => openCalendar("start")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 p-1"
                title="Pick start date"
                type="button"
              >
                📅
              </button>
            </div>
          </div>

          {/* End Date with Calendar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <div className="relative">
              <input
                type="text"
                value={formatDate(formData.endDate, "en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                readOnly
                onClick={() => openCalendar("end")}
                className="date-input cursor-pointer pr-10 w-full"
              />
              <button
                onClick={() => openCalendar("end")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 p-1"
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-xl shadow-2xl z-[10001] p-5 w-[90%] max-w-sm max-h-[80vh] overflow-hidden"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => navigateYear("prev")}
                    className="px-2.5 py-1.5 border border-gray-300 rounded text-sm text-gray-700 min-w-10 hover:bg-gray-50"
                    title="Previous Year"
                    type="button"
                  >
                    &lt;&lt;
                  </button>
                  <button
                    onClick={() => navigateMonth("prev")}
                    className="px-2.5 py-1.5 border border-gray-300 rounded text-sm text-gray-700 min-w-10 hover:bg-gray-50"
                    title="Previous Month"
                    type="button"
                  >
                    &lt;
                  </button>
                </div>

                <button
                  onClick={() => setShowYearSelector(!showYearSelector)}
                  className="px-2 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-100 rounded"
                  title="Select Year"
                  type="button"
                >
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigateMonth("next")}
                    className="px-2.5 py-1.5 border border-gray-300 rounded text-sm text-gray-700 min-w-10 hover:bg-gray-50"
                    title="Next Month"
                    type="button"
                  >
                    &gt;
                  </button>
                  <button
                    onClick={() => navigateYear("next")}
                    className="px-2.5 py-1.5 border border-gray-300 rounded text-sm text-gray-700 min-w-10 hover:bg-gray-50"
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
                  <div className="grid grid-cols-7 mb-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs text-gray-500 font-medium py-1"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                  </div>
                </>
              )}

              <div className="flex justify-center gap-2.5 mt-4">
                <button
                  onClick={() => {
                    const today = new Date();
                    selectDate(today, showCalendar!);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                  type="button"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    setShowCalendar(null);
                    setShowYearSelector(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comments
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => handleInputChange("comments", e.target.value)}
              placeholder="Enter comments (optional)"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white resize-y min-h-20 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {formData.comments.length}/500
            </div>
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => handleInputChange("active", e.target.checked)}
              id="active-checkbox"
              className="w-5 h-5 cursor-pointer"
            />
            <label
              htmlFor="active-checkbox"
              className="text-sm text-gray-700 cursor-pointer font-medium"
            >
              Active
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3">
          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            disabled={saving || deleting}
            className={cls(
              "flex-1 py-3.5 border border-gray-300 rounded-lg text-gray-600 font-semibold text-sm transition-colors",
              saving || deleting
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-gray-50",
            )}
          >
            Cancel
          </button>

          {/* Delete Button - Only show in edit mode */}
          {isEdit && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
              className={cls(
                "flex-1 py-3.5 bg-red-500 text-white font-semibold text-sm rounded-lg transition-colors",
                saving || deleting
                  ? "opacity-70 cursor-not-allowed bg-gray-400"
                  : "hover:bg-red-600",
              )}
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
            className={cls(
              "flex-1 py-3.5 text-white font-semibold text-sm rounded-lg transition-colors",
              saving || deleting
                ? "bg-gray-400 cursor-not-allowed opacity-70"
                : !formData.accountId || formData.amount <= 0
                  ? "bg-gray-400 cursor-not-allowed opacity-70"
                  : "bg-green-500 hover:bg-green-600",
            )}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Required Fields Note */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          * Required fields
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-[10000]">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Delete Deposit
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed text-sm">
              Are you sure you want to delete this deposit? This action cannot
              be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 text-gray-600 font-medium text-sm rounded-lg hover:bg-gray-50 disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={cls(
                  "px-4 py-2 text-white font-medium text-sm rounded-lg",
                  deleting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600",
                )}
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
