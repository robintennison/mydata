import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../contexts/SettingsContext";
import { useBankingData } from "./hooks/useBankingData";
import { useBankingOperations } from "./hooks/useBankingOperations";

import { bankingStyles } from "./BankingStyles";

const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { accounts, loading } = useBankingData();
  const { handleDeleteAccount } = useBankingOperations();
  const [setEditingAccount] = useState<any>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalSavings = accounts.reduce(
    (sum, account) => sum + account.savingsAmount,
    0
  );

  if (loading) {
    return (
      <div style={bankingStyles.container}>
        <div style={bankingStyles.loading}>
          <div style={bankingStyles.spinner}></div>
          <p>Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={bankingStyles.container}>
      {/* Top Navigation */}
      <div style={bankingStyles.topNav}>
        <button
          onClick={() => navigate("/banking")}
          style={bankingStyles.navButton}
          title="Back to Home"
        >
          ←
        </button>
        <div style={bankingStyles.navTitle}>Accounts</div>
        <button
          onClick={() => navigate("/settings")}
          style={bankingStyles.navButton}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Add Account Button */}
      <div style={{ padding: "15px" }}>
        <button
          onClick={() => navigate("/banking/accounts/add")}
          style={bankingStyles.actionButton}
        >
          <span>+</span>
          <span>Add New Account</span>
        </button>
      </div>

      {/* Accounts List */}
      <div style={{ padding: "0 15px" }}>
        {accounts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#6c757d",
              backgroundColor: "#f8f9fa",
              borderRadius: "10px",
              margin: "20px 0",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🏦</div>
            <div>No accounts found</div>
            <div style={{ fontSize: "0.9rem", marginTop: "5px" }}>
              Tap "Add New Account" to get started
            </div>
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} style={bankingStyles.itemCard}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "#333",
                      marginBottom: "5px",
                    }}
                  >
                    {account.acctCode}
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginBottom: "8px",
                    }}
                  >
                    {account.acctDetails}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "700",
                    color: "#4285f4",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(account.savingsAmount)}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                  MPIN: ••••
                </div>

                {settings.enableEditDelete && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setEditingAccount(account)}
                      style={bankingStyles.editButton}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(`Delete account ${account.acctCode}?`)
                        ) {
                          handleDeleteAccount(account.id);
                        }
                      }}
                      style={bankingStyles.deleteButton}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Total Savings */}
      <div style={bankingStyles.totalSection}>
        <div style={bankingStyles.totalLabel}>Total Savings:</div>
        <div style={bankingStyles.totalValue}>
          {formatCurrency(totalSavings)}
        </div>
      </div>

      {/* Bottom spacing */}
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default AccountsPage;
