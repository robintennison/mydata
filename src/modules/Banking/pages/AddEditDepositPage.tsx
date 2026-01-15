import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Deposit,
  BankAccount,
  DepositFormData,
} from "../../../types/banking.types";
import { formatDate } from "../../../utils/formatters";
import { bankingStyles } from "../styles";

// Mock data
const mockAccounts: BankAccount[] = [
  {
    id: "acc1",
    acctCode: "SB1234",
    savingsAmount: 1000000,
    acctDetails: "Savings Account",
    mpin: "1234",
    isActive: true,
  },
  {
    id: "acc2",
    acctCode: "CB5678",
    savingsAmount: 2000000,
    acctDetails: "Current Account",
    mpin: "5678",
    isActive: true,
  },
];

const mockDeposits: Deposit[] = [
  {
    id: "1",
    accountId: "acc1",
    amount: 500000,
    startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 60 * 24 * 60 * 60 * 1000,
    comments: "Fixed Deposit for future planning",
    active: true,
  },
];

interface AddEditDepositPageProps {
  isEdit?: boolean;
}

const AddEditDepositPage: React.FC<AddEditDepositPageProps> = ({
  isEdit = false,
}) => {
  const { depositId } = useParams();
  const navigate = useNavigate();

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
  const [loading, setLoading] = useState(false);

  // Load deposit data if editing
  useEffect(() => {
    if (isEdit && depositId) {
      const deposit = mockDeposits.find((d) => d.id === depositId);
      if (deposit) {
        const account = mockAccounts.find(
          (acc) => acc.id === deposit.accountId
        );
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
  }, [isEdit, depositId]);

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

    setLoading(true);

    try {
      const depositToSave: Deposit = {
        ...formData,
        id: isEdit && depositId ? depositId : Date.now().toString(),
      };

      console.log("Saving deposit:", depositToSave);
      // TODO: Replace with actual API call
      // await yourApi.saveDeposit(depositToSave);

      setTimeout(() => {
        setLoading(false);
        navigate("/banking/deposits/list");
      }, 500);
    } catch (error) {
      console.error("Error saving deposit:", error);
      alert("Failed to save deposit. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={bankingStyles.container}>
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
          disabled={loading}
        >
          ←
        </button>
        <div style={bankingStyles.navTitle}>
          {isEdit ? "Edit Deposit" : "Add Deposit"}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              ...bankingStyles.navButton,
              backgroundColor: loading ? "#94a3b8" : "#10b981",
              color: "#fff",
              border: "none",
              opacity: loading ? 0.7 : 1,
            }}
            title="Save"
          >
            {loading ? "⏳" : "✓"}
          </button>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: "15px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Account Dropdown */}
          <div style={{ position: "relative" }}>
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
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={selectedAccountCode}
                readOnly
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                placeholder="Select account"
                style={{
                  ...bankingStyles.input,
                  cursor: "pointer",
                  paddingRight: "40px",
                  backgroundColor: "#fff",
                }}
              />
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
            </div>

            {showAccountDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#fff",
                  border: "1px solid #e9ecef",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 100,
                  maxHeight: "200px",
                  overflowY: "auto",
                  marginTop: "4px",
                }}
              >
                {mockAccounts
                  .filter((acc) => acc.isActive !== false)
                  .sort((a, b) => a.acctCode.localeCompare(b.acctCode))
                  .map((account) => (
                    <button
                      key={account.id}
                      onClick={() =>
                        handleAccountSelect(account.id, account.acctCode)
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.95rem",
                        color: "#333",
                        borderBottom: "1px solid #f1f3f4",
                        backgroundColor:
                          formData.accountId === account.id
                            ? "#f0f7ff"
                            : "transparent",
                      }}
                    >
                      {account.acctCode}
                    </button>
                  ))}
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
              style={bankingStyles.input}
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
            disabled={loading || !formData.accountId || formData.amount <= 0}
            style={{
              ...bankingStyles.actionButton,
              backgroundColor: loading
                ? "#94a3b8"
                : !formData.accountId || formData.amount <= 0
                ? "#cbd5e1"
                : "#10b981",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 600,
              opacity:
                loading || !formData.accountId || formData.amount <= 0
                  ? 0.7
                  : 1,
              cursor:
                loading || !formData.accountId || formData.amount <= 0
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading ? (
              <>
                <span style={{ marginRight: "8px" }}>⏳</span>
                Saving...
              </>
            ) : (
              `Save ${isEdit ? "Changes" : "Deposit"}`
            )}
          </button>
        </div>

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
    </div>
  );
};

export default AddEditDepositPage;
