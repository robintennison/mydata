import React, { useEffect, useState } from "react";
import type {
  AccountsTabProps,
  BankAccount,
} from "../../../types/banking.types";
import { tableStyles, formStyles } from "../../../styles/components";

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

  return (
    <div>
      <div style={formStyles.sectionHeader}>
        <h3>Bank Accounts</h3>
        <button
          onClick={() => setEditingAccount(null)}
          style={formStyles.addButton}
        >
          + Add New Account
        </button>
      </div>

      {/* Account Form */}
      {(editingAccount === null || editingAccount.id) && (
        <form onSubmit={handleSubmit} style={formStyles.form}>
          <div style={formStyles.formGrid}>
            <div style={formStyles.formGroup}>
              <label>Account Code *</label>
              <input
                type="text"
                name="acctCode"
                value={formData.acctCode}
                onChange={handleChange}
                required
                style={formStyles.input}
                placeholder="ACC001"
              />
            </div>
            <div style={formStyles.formGroup}>
              <label>Savings Amount (₹)</label>
              <input
                type="number"
                name="savingsAmount"
                value={formData.savingsAmount}
                onChange={handleChange}
                style={formStyles.input}
                placeholder="0"
              />
            </div>
            <div style={formStyles.formGroup}>
              <label>MPIN</label>
              <input
                type="password"
                name="mpin"
                value={formData.mpin}
                onChange={handleChange}
                style={formStyles.input}
                placeholder="4-digit PIN"
                maxLength={4}
              />
            </div>
            <div style={{ ...formStyles.formGroup, gridColumn: "1 / span 2" }}>
              <label>Account Details</label>
              <textarea
                name="acctDetails"
                value={formData.acctDetails}
                onChange={handleChange}
                style={formStyles.textarea}
                placeholder="Account holder name, bank name, branch, etc."
                rows={2}
              />
            </div>
          </div>
          <div style={formStyles.formActions}>
            <button type="submit" style={formStyles.saveButton}>
              {editingAccount ? "Update Account" : "Create Account"}
            </button>
            {editingAccount && (
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                style={formStyles.cancelButton}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Accounts List */}
      <div style={tableStyles.container}>
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={tableStyles.th}>Account Code</th>
              <th style={tableStyles.th}>Savings</th>
              <th style={tableStyles.th}>Details</th>
              <th style={tableStyles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} style={tableStyles.tr}>
                <td style={tableStyles.td}>{account.acctCode}</td>
                <td style={tableStyles.td}>
                  {formatCurrency(account.savingsAmount)}
                </td>
                <td style={tableStyles.td}>{account.acctDetails}</td>
                <td style={tableStyles.td}>
                  {enableEditDelete && (
                    <>
                      <button
                        onClick={() => setEditingAccount(account)}
                        style={formStyles.smallButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteAccount(account.id)}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountsTab;
