import React, { useEffect, useState } from "react";
import type { DepositsTabProps, Deposit } from "../../../types/banking.types";
import { tableStyles, formStyles } from "../../../styles/components";
import "./TableStyles.css"; // Import the shared table styles

const DepositsTab: React.FC<DepositsTabProps> = ({
  deposits,
  accounts,
  editingDeposit,
  setEditingDeposit,
  onSaveDeposit,
  onDeleteDeposit,
  enableEditDelete,
  formatCurrency,
  formatDate,
}) => {
  const [formData, setFormData] = useState<Deposit>({
    id: "",
    accountId: "",
    amount: 0,
    startDate: Date.now(),
    endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    comments: "",
    active: true,
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
    if (editingDeposit) {
      setFormData(editingDeposit);
    } else {
      setFormData({
        id: "",
        accountId: accounts[0]?.id || "",
        amount: 0,
        startDate: Date.now(),
        endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        comments: "",
        active: true,
      });
    }
  }, [editingDeposit, accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveDeposit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "amount") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === "startDate" || name === "endDate") {
      setFormData((prev) => ({ ...prev, [name]: new Date(value).getTime() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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

  // Get account name for display
  const getAccountDisplay = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account
      ? `${account.acctCode} - ${account.acctDetails}`
      : "Unknown Account";
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
          Deposits
        </h3>
        <button
          onClick={() => setEditingDeposit(null)}
          style={{
            ...formStyles.addButton,
            width: isMobile ? "100%" : "auto",
            padding: isMobile ? "10px 16px" : "8px 16px",
            fontSize: isMobile ? "0.9rem" : "0.85rem",
          }}
        >
          + Add New Deposit
        </button>
      </div>

      {/* Deposit Form */}
      {(editingDeposit === null || editingDeposit.id) && (
        <form
          onSubmit={handleSubmit}
          style={{
            ...formStyles.form,
            padding: isMobile ? "12px" : "16px",
            marginBottom: isMobile ? "16px" : "20px",
          }}
        >
          <div style={responsiveFormGrid}>
            <div style={responsiveFormGroup}>
              <label
                style={{
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                  marginBottom: "6px",
                  display: "block",
                  fontWeight: "500",
                }}
              >
                Account *
              </label>
              <select
                name="accountId"
                value={formData.accountId}
                onChange={handleChange}
                required
                style={{
                  ...formStyles.input,
                  width: "100%",
                  padding: isMobile ? "10px 12px" : "12px 16px",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                }}
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.acctCode} - {account.acctDetails.substring(0, 30)}
                    {account.acctDetails.length > 30 ? "..." : ""}
                  </option>
                ))}
              </select>
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
                Amount (₹) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                style={{
                  ...formStyles.input,
                  width: "100%",
                  padding: isMobile ? "10px 12px" : "12px 16px",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                }}
                placeholder="5000"
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
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={new Date(formData.startDate).toISOString().split("T")[0]}
                onChange={handleChange}
                style={{
                  ...formStyles.input,
                  width: "100%",
                  padding: isMobile ? "10px 12px" : "12px 16px",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                }}
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
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={new Date(formData.endDate).toISOString().split("T")[0]}
                onChange={handleChange}
                style={{
                  ...formStyles.input,
                  width: "100%",
                  padding: isMobile ? "10px 12px" : "12px 16px",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                }}
              />
            </div>

            <div style={{ ...responsiveFormGroup, ...fullWidthFormGroup }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  style={{
                    marginRight: "8px",
                    width: isMobile ? "18px" : "16px",
                    height: isMobile ? "18px" : "16px",
                  }}
                />
                Active Deposit
              </label>
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
                Comments
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                style={{
                  ...formStyles.textarea,
                  width: "100%",
                  padding: isMobile ? "10px 12px" : "12px 16px",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  minHeight: isMobile ? "60px" : "70px",
                }}
                placeholder="Any notes about this deposit..."
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
              {editingDeposit ? "Update Deposit" : "Create Deposit"}
            </button>

            {editingDeposit && (
              <button
                type="button"
                onClick={() => setEditingDeposit(null)}
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
                <th>Account</th>
                <th>Amount</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Comments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((deposit) => {
                const account = accounts.find(
                  (a) => a.id === deposit.accountId
                );
                return (
                  <tr key={deposit.id}>
                    <td style={{ maxWidth: "200px", wordBreak: "break-word" }}>
                      {account
                        ? `${
                            account.acctCode
                          } - ${account.acctDetails.substring(0, 30)}${
                            account.acctDetails.length > 30 ? "..." : ""
                          }`
                        : "Unknown"}
                    </td>
                    <td>{formatCurrency(deposit.amount)}</td>
                    <td>{formatDate(deposit.startDate)}</td>
                    <td>{formatDate(deposit.endDate)}</td>
                    <td>
                      <span
                        style={{
                          color: deposit.active ? "#28a745" : "#dc3545",
                          fontWeight: "bold",
                          fontSize: "0.85rem",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          backgroundColor: deposit.active
                            ? "#e8f5e9"
                            : "#ffeaea",
                        }}
                      >
                        {deposit.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ maxWidth: "200px", wordBreak: "break-word" }}>
                      {deposit.comments || "-"}
                    </td>
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
                            onClick={() => setEditingDeposit(deposit)}
                            style={{
                              ...formStyles.smallButton,
                              padding: isMobile ? "6px 10px" : "6px 12px",
                              fontSize: isMobile ? "0.8rem" : "0.85rem",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteDeposit(deposit.id)}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="mobile-card-view">
        {deposits.length === 0 ? (
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
            No deposits found. Click "Add New Deposit" to create one.
          </div>
        ) : (
          deposits.map((deposit) => {
            const account = accounts.find((a) => a.id === deposit.accountId);
            return (
              <div key={deposit.id} className="mobile-card">
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Account:</span>
                  <span className="mobile-card-value">
                    {account ? account.acctCode : "Unknown"}
                  </span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Amount:</span>
                  <span className="mobile-card-value">
                    {formatCurrency(deposit.amount)}
                  </span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Start Date:</span>
                  <span className="mobile-card-value">
                    {formatDate(deposit.startDate)}
                  </span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">End Date:</span>
                  <span className="mobile-card-value">
                    {formatDate(deposit.endDate)}
                  </span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Status:</span>
                  <span
                    className="mobile-card-value"
                    style={{
                      color: deposit.active ? "#28a745" : "#dc3545",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                    }}
                  >
                    {deposit.active ? "✅ Active" : "❌ Inactive"}
                  </span>
                </div>
                {deposit.comments && (
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Comments:</span>
                    <span
                      className="mobile-card-value"
                      style={{ fontStyle: "italic" }}
                    >
                      {deposit.comments}
                    </span>
                  </div>
                )}

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
                        onClick={() => setEditingDeposit(deposit)}
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
                        onClick={() => onDeleteDeposit(deposit.id)}
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
            );
          })
        )}
      </div>

      {/* Mobile Summary */}
      {isMobile && deposits.length > 0 && (
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
          📱 Showing {deposits.length} deposit{deposits.length !== 1 ? "s" : ""}
          {deposits.length > 3 && " - Scroll down to see more"}
          <div
            style={{ marginTop: "4px", fontSize: "0.8rem", color: "#4285f4" }}
          >
            {deposits.filter((d) => d.active).length} active •{" "}
            {deposits.filter((d) => !d.active).length} inactive
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {!isMobile && deposits.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "20px",
            padding: "12px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.9rem",
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#28a745",
              }}
            ></span>
            <span>Active: {deposits.filter((d) => d.active).length}</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.9rem",
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#dc3545",
              }}
            ></span>
            <span>Inactive: {deposits.filter((d) => !d.active).length}</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.9rem",
              marginLeft: "auto",
            }}
          >
            <span>Total Amount:</span>
            <span style={{ fontWeight: "600" }}>
              {formatCurrency(deposits.reduce((sum, d) => sum + d.amount, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositsTab;
