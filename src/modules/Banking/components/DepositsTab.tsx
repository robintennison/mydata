import React, { useEffect, useState } from "react";
import type { DepositsTabProps, Deposit } from "../../../types/banking.types";
import { tableStyles, formStyles } from "../../../styles/components";

const DepositsTab: React.FC<DepositsTabProps> = ({
  deposits,
  accounts,
  editingDeposit,
  setEditingDeposit,
  onSaveDeposit,
  onDeleteDeposit,
  enableEditDelete,
  formatCurrency, // Add this - from props
  formatDate, // Add this - from props
}) => {
  const [formData, setFormData] = useState<Deposit>({
    id: "",
    accountId: "",
    amount: 0,
    startDate: Date.now(),
    endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    comments: "",
    active: true,
    // Optional properties can be omitted or set to undefined
  });

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

  return (
    <div>
      <div style={formStyles.sectionHeader}>
        <h3>Deposits</h3>
        <button
          onClick={() => setEditingDeposit(null)}
          style={formStyles.addButton}
        >
          + Add New Deposit
        </button>
      </div>

      {/* Deposit Form */}
      {(editingDeposit === null || editingDeposit.id) && (
        <form onSubmit={handleSubmit} style={formStyles.form}>
          <div style={formStyles.formGrid}>
            <div style={formStyles.formGroup}>
              <label>Account *</label>
              <select
                name="accountId"
                value={formData.accountId}
                onChange={handleChange}
                required
                style={formStyles.input}
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.acctCode} - {account.acctDetails}
                  </option>
                ))}
              </select>
            </div>
            <div style={formStyles.formGroup}>
              <label>Amount (₹) *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                style={formStyles.input}
                placeholder="5000"
              />
            </div>
            <div style={formStyles.formGroup}>
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={new Date(formData.startDate).toISOString().split("T")[0]}
                onChange={handleChange}
                style={formStyles.input}
              />
            </div>
            <div style={formStyles.formGroup}>
              <label>End Date</label>
              <input
                type="date"
                name="endDate"
                value={new Date(formData.endDate).toISOString().split("T")[0]}
                onChange={handleChange}
                style={formStyles.input}
              />
            </div>
            <div style={{ ...formStyles.formGroup, gridColumn: "1 / span 2" }}>
              <label>
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  style={{ marginRight: "8px" }}
                />
                Active Deposit
              </label>
            </div>
            <div style={{ ...formStyles.formGroup, gridColumn: "1 / span 2" }}>
              <label>Comments</label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                style={formStyles.textarea}
                placeholder="Any notes about this deposit..."
                rows={2}
              />
            </div>
          </div>
          <div style={formStyles.formActions}>
            <button type="submit" style={formStyles.saveButton}>
              {editingDeposit ? "Update Deposit" : "Create Deposit"}
            </button>
            {editingDeposit && (
              <button
                type="button"
                onClick={() => setEditingDeposit(null)}
                style={formStyles.cancelButton}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Deposits List */}
      <div style={tableStyles.container}>
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={tableStyles.th}>Account</th>
              <th style={tableStyles.th}>Amount</th>
              <th style={tableStyles.th}>Start Date</th>
              <th style={tableStyles.th}>End Date</th>
              <th style={tableStyles.th}>Status</th>
              <th style={tableStyles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map((deposit) => {
              const account = accounts.find((a) => a.id === deposit.accountId);
              return (
                <tr key={deposit.id} style={tableStyles.tr}>
                  <td style={tableStyles.td}>
                    {account ? account.acctCode : "Unknown"}
                  </td>
                  <td style={tableStyles.td}>
                    {formatCurrency(deposit.amount)} {/* Using prop */}
                  </td>
                  <td style={tableStyles.td}>
                    {formatDate(deposit.startDate)} {/* Using prop */}
                  </td>
                  <td style={tableStyles.td}>
                    {formatDate(deposit.endDate)} {/* Using prop */}
                  </td>
                  <td style={tableStyles.td}>
                    <span
                      style={{
                        color: deposit.active ? "#28a745" : "#dc3545",
                        fontWeight: "bold",
                      }}
                    >
                      {deposit.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={tableStyles.td}>
                    {enableEditDelete && (
                      <>
                        <button
                          onClick={() => setEditingDeposit(deposit)}
                          style={formStyles.smallButton}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteDeposit(deposit.id)}
                          style={{
                            ...formStyles.smallButton,
                            ...formStyles.deleteButton,
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepositsTab;
