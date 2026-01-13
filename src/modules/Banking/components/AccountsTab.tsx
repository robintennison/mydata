import React, { useEffect, useState } from "react";
import type {
  AccountsTabProps,
  BankAccount,
} from "../../../types/banking.types";
import { formStyles } from "../../../styles/components";
import "./TableStyles.css"; // Import the shared table styles

const AccountsTab: React.FC<AccountsTabProps> = ({
  accounts,
  editingAccount,
  setEditingAccount,
  onSaveAccount,
  onDeleteAccount,
  enableEditDelete,
  formatCurrency,
}) => {
  const [formData, setFormData] = useState<BankAccount>({
    id: "",
    acctCode: "",
    savingsAmount: 0,
    acctDetails: "",
    mpin: "",
  });

  // Mobile state for better UX
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (editingAccount) {
      setFormData(editingAccount);
    } else {
      setFormData({
        id: "",
        acctCode: "",
        savingsAmount: 0,
        acctDetails: "",
        mpin: "",
      });
    }
  }, [editingAccount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAccount(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "savingsAmount" ? parseFloat(value) || 0 : value,
    }));
  };

  // Responsive form styles
  const responsiveFormGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: isMobile ? "12px" : "16px",
    width: "100%",
    marginBottom: "16px",
  };

  const responsiveFormGroup = {
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const fullWidthFormGroup = {
    gridColumn: isMobile ? "1" : "1 / span 2",
  };

  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      <div
        style={{
          ...formStyles.sectionHeader,
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "12px" : "0",
          alignItems: isMobile ? "flex-start" : "center",
        }}
      >
        <h3
          style={{
            fontSize: isMobile ? "1.1rem" : "1.25rem",
            margin: 0,
          }}
        >
          Bank Accounts
        </h3>
        <button
          onClick={() => setEditingAccount(null)}
          style={{
            ...formStyles.addButton,
            width: isMobile ? "100%" : "auto",
            padding: isMobile ? "10px 16px" : "8px 16px",
            fontSize: isMobile ? "0.9rem" : "0.85rem",
          }}
        >
          + Add New Account
        </button>
      </div>

      {/* Account Form */}
      {(editingAccount === null || editingAccount.id) && (
        <form
          onSubmit={handleSubmit}
          style={{
            ...formStyles.form,
            padding: isMobile ? "12px" : "16px",
            marginBottom: isMobile ? "16px" : "20px",
          }}
        >
          <div style={responsiveFormGrid}>
            <div style={{ ...responsiveFormGroup, ...fullWidthFormGroup }}>
              <label
                style={{
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                  marginBottom: "6px",
                  display: "block",
                  fontWeight: "500",
                }}
              >
                Account Code *
              </label>
              <input
                type="text"
                name="acctCode"
                value={formData.acctCode}
                onChange={handleChange}
                required
                style={{
                  ...formStyles.input,
                  width: "100%",
                  padding: isMobile ? "10px 12px" : "12px 16px",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                }}
                placeholder="ACC001"
              />
            </div>

            <div style={responsiveFormGroup}>
              <label
                style={{
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                  marginBottom: "6px",
                  display: "block",
                  fontWeight: "500",
                }}
              >
                Savings Amount (₹)
              </label>
              <input
                type="number"
                name="savingsAmount"
                value={formData.savingsAmount}
                onChange={handleChange}
                style={{
                  ...formStyles.input,
                  width: "100%",
                  padding: isMobile ? "10px 12px" : "12px 16px",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                }}
                placeholder="0"
              />
            </div>

            <div style={responsiveFormGroup}>
              <label
                style={{
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                  marginBottom: "6px",
                  display: "block",
                  fontWeight: "500",
                }}
              >
                MPIN
              </label>
              <input
                type="password"
                name="mpin"
                value={formData.mpin}
                onChange={handleChange}
                style={{
                  ...formStyles.input,
                  width: "100%",
                  padding: isMobile ? "10px 12px" : "12px 16px",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                }}
                placeholder="4-digit PIN"
                maxLength={4}
              />
            </div>

            <div style={{ ...responsiveFormGroup, ...fullWidthFormGroup }}>
              <label
                style={{
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                  marginBottom: "6px",
                  display: "block",
                  fontWeight: "500",
                }}
              >
                Account Details
              </label>
              <textarea
                name="acctDetails"
                value={formData.acctDetails}
                onChange={handleChange}
                style={{
                  ...formStyles.textarea,
                  width: "100%",
                  padding: isMobile ? "10px 12px" : "12px 16px",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  minHeight: isMobile ? "60px" : "70px",
                }}
                placeholder="Account holder name, bank name, branch, etc."
                rows={isMobile ? 2 : 3}
              />
            </div>
          </div>

          <div
            style={{
              ...formStyles.formActions,
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? "8px" : "12px",
            }}
          >
            <button
              type="submit"
              style={{
                ...formStyles.saveButton,
                width: isMobile ? "100%" : "auto",
                padding: isMobile ? "12px 16px" : "10px 24px",
                fontSize: isMobile ? "0.95rem" : "0.9rem",
              }}
            >
              {editingAccount ? "Update Account" : "Create Account"}
            </button>

            {editingAccount && (
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                style={{
                  ...formStyles.cancelButton,
                  width: isMobile ? "100%" : "auto",
                  padding: isMobile ? "12px 16px" : "10px 24px",
                  fontSize: isMobile ? "0.95rem" : "0.9rem",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Desktop Table View */}
      <div className="desktop-table-view">
        <div className="table-responsive-container">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Account Code</th>
                <th>Savings Amount</th>
                <th>Account Details</th>
                <th>MPIN</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.acctCode}</td>
                  <td>{formatCurrency(account.savingsAmount)}</td>
                  <td style={{ maxWidth: "250px", wordBreak: "break-word" }}>
                    {account.acctDetails}
                  </td>
                  <td>••••</td>
                  <td>
                    {enableEditDelete && (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: isMobile ? "wrap" : "nowrap",
                        }}
                      >
                        <button
                          onClick={() => setEditingAccount(account)}
                          style={{
                            ...formStyles.smallButton,
                            padding: isMobile ? "6px 10px" : "6px 12px",
                            fontSize: isMobile ? "0.8rem" : "0.85rem",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteAccount(account.id)}
                          style={{
                            ...formStyles.smallButton,
                            ...formStyles.deleteButton,
                            padding: isMobile ? "6px 10px" : "6px 12px",
                            fontSize: isMobile ? "0.8rem" : "0.85rem",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="mobile-card-view">
        {accounts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "#666",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              border: "1px dashed #dee2e6",
            }}
          >
            No accounts found. Click "Add New Account" to create one.
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">Account Code:</span>
                <span className="mobile-card-value">{account.acctCode}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Savings:</span>
                <span className="mobile-card-value">
                  {formatCurrency(account.savingsAmount)}
                </span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Account Details:</span>
                <span className="mobile-card-value">{account.acctDetails}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">MPIN:</span>
                <span className="mobile-card-value">••••</span>
              </div>

              {enableEditDelete && (
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Actions:</span>
                  <div
                    className="mobile-card-value"
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "flex-end",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => setEditingAccount(account)}
                      style={{
                        ...formStyles.smallButton,
                        padding: "8px 12px",
                        fontSize: "0.85rem",
                        minWidth: "70px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteAccount(account.id)}
                      style={{
                        ...formStyles.smallButton,
                        ...formStyles.deleteButton,
                        padding: "8px 12px",
                        fontSize: "0.85rem",
                        minWidth: "70px",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Mobile Summary */}
      {isMobile && accounts.length > 0 && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "#f0f7ff",
            borderRadius: "8px",
            border: "1px solid #d1e7ff",
            fontSize: "0.85rem",
            color: "#666",
            textAlign: "center",
          }}
        >
          📱 Showing {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          {accounts.length > 3 && " - Scroll down to see more"}
        </div>
      )}
    </div>
  );
};

export default AccountsTab;
