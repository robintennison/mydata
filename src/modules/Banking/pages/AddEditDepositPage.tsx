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

  // Refs for dropdown positioning
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowAccountDropdown(false);
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
  };

  const handleAccountSelect = (accountId: string, accountCode: string) => {
    setFormData((prev) => ({
      ...prev,
      accountId,
    }));
    setSelectedAccountCode(accountCode);
    setShowAccountDropdown(false);
  };

  const showDatePicker = (field: "startDate" | "endDate") => {
    const currentDate =
      field === "startDate" ? formData.startDate : formData.endDate;
    const defaultDate = new Date(currentDate).toISOString().split("T")[0];

    const dateStr = prompt(
      `Enter ${field === "startDate" ? "start" : "end"} date (YYYY-MM-DD):`,
      defaultDate
    );

    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        handleInputChange(field, date.getTime());
      }
    }
  };

  const handleSave = async () => {
    if (!formData.accountId || formData.amount <= 0) {
      alert("Please fill in all required fields with valid values");
      return;
    }

    if (formData.startDate > formData.endDate) {
      alert("Start date cannot be after end date");
      return;
    }

    setSaving(true);

    try {
      const depositToSave: Deposit = {
        ...formData,
        id: isEdit && depositId ? depositId : `deposit_${Date.now()}`,
      };

      await handleSaveDeposit(depositToSave);
      navigate("/banking/deposits");
    } catch (error) {
      console.error("Error saving deposit:", error);
      alert("Failed to save deposit. Please try again.");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!depositId) return;

    setDeleting(true);
    try {
      await handleDeleteDeposit(depositId);
      navigate("/banking/deposits");
    } catch (error) {
      console.error("Error deleting deposit:", error);
      alert("Failed to delete deposit. Please try again.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
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
      {/* Header */}
      <div style={bankingStyles.header}>
        <h1 style={bankingStyles.headerTitle}>
          💰 {isEdit ? "Edit" : "Add"} Deposit
        </h1>
        <div style={bankingStyles.headerSubtitle}>
          {isEdit ? "Update deposit details" : "Create new deposit"}
        </div>
      </div>

      {/* Top Navigation */}
      <div style={bankingStyles.topNav}>
        <button
          onClick={() => navigate(-1)}
          style={bankingStyles.navButton}
          title="Back"
          disabled={saving || deleting}
        >
          ←
        </button>
        <div style={bankingStyles.navTitle}>
          {isEdit ? "Edit Deposit" : "Add Deposit"}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {isEdit && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
              style={{
                ...bankingStyles.navButton,
                backgroundColor: "#dc2626",
                color: "#fff",
                border: "none",
                opacity: saving || deleting ? 0.7 : 1,
              }}
              title="Delete"
            >
              🗑️
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || deleting}
            style={{
              ...bankingStyles.navButton,
              backgroundColor: saving || deleting ? "#94a3b8" : "#10b981",
              color: "#fff",
              border: "none",
              opacity: saving || deleting ? 0.7 : 1,
            }}
            title="Save"
          >
            {saving ? "⏳" : "✓"}
          </button>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: "15px", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Account Dropdown - FIXED WIDTH to match container */}
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

            {/* DROPDOWN - FIXED WIDTH to match container */}
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
                  width: "calc(100% - 30px)", // Match container padding
                  maxWidth: "600px", // Match your container max-width
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
                            textAlign: "right",
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
              }}
              min="0"
              step="1000"
            />
          </div>

          {/* Start Date */}
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
                onClick={() => showDatePicker("startDate")}
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
                onClick={() => showDatePicker("startDate")}
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

          {/* End Date */}
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
                onClick={() => showDatePicker("endDate")}
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
                onClick={() => showDatePicker("endDate")}
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
                textAlign: "right",
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

        {/* Save Button */}
        <div style={{ marginTop: "24px" }}>
          <button
            onClick={handleSave}
            disabled={
              saving || deleting || !formData.accountId || formData.amount <= 0
            }
            style={{
              ...bankingStyles.actionButton,
              backgroundColor:
                saving || deleting
                  ? "#94a3b8"
                  : !formData.accountId || formData.amount <= 0
                  ? "#cbd5e1"
                  : "#10b981",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 600,
              opacity:
                saving ||
                deleting ||
                !formData.accountId ||
                formData.amount <= 0
                  ? 0.7
                  : 1,
              cursor:
                saving ||
                deleting ||
                !formData.accountId ||
                formData.amount <= 0
                  ? "not-allowed"
                  : "pointer",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {saving ? (
              <>
                <span style={{ marginRight: "8px" }}>⏳</span>
                Saving...
              </>
            ) : (
              `Save ${isEdit ? "Changes" : "Deposit"}`
            )}
          </button>
        </div>

        {/* Delete Button - Only show in edit mode */}
        {isEdit && (
          <div style={{ marginTop: "16px" }}>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
              style={{
                ...bankingStyles.actionButton,
                backgroundColor: saving || deleting ? "#9ca3af" : "#dc2626",
                color: "#fff",
                fontSize: "1rem",
                fontWeight: 600,
                opacity: saving || deleting ? 0.7 : 1,
                cursor: saving || deleting ? "not-allowed" : "pointer",
                width: "100%",
                boxSizing: "border-box",
                border: "none",
              }}
            >
              🗑️ Delete Deposit
            </button>
          </div>
        )}

        {/* Required Fields Note */}
        <div
          style={{
            marginTop: "12px",
            fontSize: "0.85rem",
            color: "#6c757d",
            textAlign: "center",
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
