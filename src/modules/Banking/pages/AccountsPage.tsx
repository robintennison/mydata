import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { useBankingData } from "../hooks/useBankingData";
import { useBankingOperations } from "../hooks/useBankingOperations";
import { bankingStyles } from "../styles/BankingStyles";
import BankingNavigation from "./BankingNavigation";

const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { accounts, loading } = useBankingData();
  const { handleDeleteAccount } = useBankingOperations();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<any>(null);

  // Format currency without rupee symbol, in lakhs without 'L' suffix
  const formatCurrency = (amount: number): string => {
    // Convert to lakhs (divide by 100,000)
    const amountInLakhs = amount / 100000;

    // Format with Indian number grouping (lakhs and crores)
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amountInLakhs);
  };

  // Helper function to check if account is active
  const isAccountActive = (account: any): boolean => {
    // If isActive property exists, use it
    if (account.isActive !== undefined) {
      return account.isActive === true;
    }
    // Default to true if property doesn't exist (for backward compatibility)
    return true;
  };

  // Filter accounts based on showInactive setting
  const filteredAccounts = accounts.filter((account) => {
    // If showInactive is true, show all accounts (both active and inactive)
    if (settings?.showInactive) {
      return true;
    }
    // If showInactive is false or undefined, show only active accounts
    return isAccountActive(account);
  });

  // Sort accounts by acctCode in ascending order
  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    return a.acctCode.localeCompare(b.acctCode);
  });

  // Calculate total savings for filtered accounts
  const totalSavings = sortedAccounts.reduce((sum, account) => {
    return sum + account.savingsAmount;
  }, 0);

  // Count active and inactive accounts for stats
  const activeAccountsCount = accounts.filter((account) =>
    isAccountActive(account)
  ).length;
  const inactiveAccountsCount = accounts.filter(
    (account) => !isAccountActive(account)
  ).length;

  const confirmDelete = () => {
    if (accountToDelete) {
      handleDeleteAccount(accountToDelete.id);
      setShowDeleteDialog(false);
      setAccountToDelete(null);
    }
  };

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
      {/* Top Navigation - Full width inside container */}
      <div style={bankingStyles.topNav}>
        <button
          onClick={() => navigate("/banking")}
          style={bankingStyles.navButton}
          title="Back to Banking"
        >
          ←
        </button>
        <div style={bankingStyles.navTitle}>Banking / Accounts</div>
        <div style={{ display: "flex", gap: "8px" }}>
          {/* Settings Button */}
          <button
            onClick={() => navigate("/settings")}
            style={{
              ...bankingStyles.navButton,
              padding: "6px 10px",
              fontSize: "1.2rem",
            }}
            title="Settings"
          >
            ⚙️
          </button>
          {/* Add Account Button */}
          <button
            onClick={() => navigate("/banking/accounts/add")}
            style={bankingStyles.navButton}
            title="Add Account"
          >
            +
          </button>
        </div>
      </div>

      {/* ALL CONTENT INSIDE THIS DIV - This ensures centering */}
      <div style={{ width: "100%" }}>
        {/* Accounts List - No padding to take full width */}
        <div style={{ width: "100%" }}>
          {sortedAccounts.length === 0 ? (
            <div style={bankingStyles.emptyState}>
              <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🏦</div>
              <div>
                {settings?.showInactive
                  ? "No accounts found"
                  : "No active accounts found"}
              </div>
              <div style={{ fontSize: "0.9rem", marginTop: "5px" }}>
                {settings?.showInactive
                  ? "Add your first account"
                  : 'Tap "+" to add an account'}
              </div>
            </div>
          ) : (
            <div style={{ ...bankingStyles.card, margin: 0, borderRadius: 0 }}>
              {/* Table Header */}
              <div
                style={{
                  display: "flex",
                  padding: "12px 16px",
                  marginBottom: "8px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#495057",
                  borderBottom: "2px solid #e9ecef",
                }}
              >
                <div style={{ flex: 4, padding: "0 8px" }}>Account</div>
                <div style={{ flex: 3, padding: "0 8px", textAlign: "right" }}>
                  Savings
                </div>
                <div style={{ flex: 3, padding: "0 8px" }}>MPIN</div>
                {settings?.showDelete && (
                  <div style={{ width: "60px", padding: "0 8px" }}></div>
                )}
              </div>

              {/* Accounts Rows */}
              <div
                style={{
                  maxHeight: "60vh",
                  overflowY: "auto",
                }}
              >
                {sortedAccounts.map((account, index) => {
                  const isActive = isAccountActive(account);
                  return (
                    <div
                      key={account.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px 16px",
                        borderBottom:
                          index < sortedAccounts.length - 1
                            ? "1px solid #e9ecef"
                            : "none",
                        opacity: isActive ? 1 : 0.7,
                      }}
                    >
                      <div style={{ flex: 4, padding: "0 8px" }}>
                        <div
                          style={{
                            fontWeight: "500",
                            color: isActive ? "#333" : "#6c757d",
                            fontSize: "0.95rem",
                            textDecoration: isActive ? "none" : "line-through",
                          }}
                        >
                          {account.acctCode}
                          {!isActive && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                color: "#dc2626",
                                marginLeft: "6px",
                              }}
                            >
                              (inactive)
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          flex: 3,
                          padding: "0 8px",
                          textAlign: "right",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: "600",
                            color: isActive ? "#4285f4" : "#6c757d",
                          }}
                        >
                          {formatCurrency(account.savingsAmount)}
                        </div>
                      </div>
                      <div style={{ flex: 3, padding: "0 8px" }}>
                        <div
                          style={{
                            fontFamily: "'Courier New', monospace",
                            fontSize: "0.9rem",
                            color: isActive ? "#666" : "#9ca3af",
                          }}
                        >
                          {account.mpin || "••••"}
                        </div>
                      </div>
                      {/* Edit icon only if showDelete is enabled */}
                      {settings?.showDelete && (
                        <div
                          style={{
                            width: "60px",
                            display: "flex",
                            justifyContent: "center",
                            padding: "0 8px",
                          }}
                        >
                          <button
                            onClick={() =>
                              navigate(`/banking/accounts/edit/${account.id}`)
                            }
                            style={{
                              ...bankingStyles.editButton,
                              padding: "6px 10px",
                              fontSize: "0.8rem",
                              minWidth: "auto",
                            }}
                            title="Edit Account"
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Total Savings at the bottom of the list */}
              <div
                style={{
                  marginTop: "15px",
                  padding: "16px",
                  borderTop: "2px solid #e9ecef",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                    {settings?.showInactive
                      ? `Showing ${sortedAccounts.length} of ${accounts.length} accounts`
                      : `Showing ${sortedAccounts.length} active accounts`}
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#4285f4",
                      marginTop: "2px",
                    }}
                  >
                    ({activeAccountsCount} active, {inactiveAccountsCount}{" "}
                    inactive)
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                    Total Savings
                  </div>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "#4285f4",
                    }}
                  >
                    {formatCurrency(totalSavings)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && accountToDelete && (
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
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                fontSize: "1.1rem",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Delete Account?
            </h3>
            <p
              style={{ margin: "0 0 20px 0", color: "#666", lineHeight: "1.5" }}
            >
              Are you sure you want to delete account{" "}
              <span style={{ fontWeight: "600" }}>
                {accountToDelete.acctCode}
              </span>
              ? This action cannot be undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setAccountToDelete(null);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                  borderRadius: "8px",
                  color: "#495057",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#ea4335",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Use the extracted BankingNavigation component */}
      <BankingNavigation />
      {/* Bottom spacing */}
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default AccountsPage;
