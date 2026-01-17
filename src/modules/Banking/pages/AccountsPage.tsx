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
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<any>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
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

  // Calculate total savings for active accounts only (for stats display)
  const totalSavings = accounts.reduce((sum, account) => {
    if (settings?.showInactive) {
      return sum + account.savingsAmount;
    }
    return sum + (isAccountActive(account) ? account.savingsAmount : 0);
  }, 0);

  // Filter accounts based on search and showInactive setting
  const filteredAccounts = accounts.filter((account) => {
    // First check if it matches search term
    const matchesSearch = account.acctCode
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Filter by active/inactive based on settings
    if (settings?.showInactive !== undefined) {
      if (settings.showInactive) {
        // Only show inactive accounts when showInactive is true
        return matchesSearch && !isAccountActive(account);
      } else {
        // Only show active accounts when showInactive is false or undefined
        return matchesSearch && isAccountActive(account);
      }
    }

    // Default: show all accounts if setting doesn't exist
    return matchesSearch;
  });

  // Count active and inactive accounts for stats
  const activeAccountsCount = accounts.filter((account) =>
    isAccountActive(account)
  ).length;
  const inactiveAccountsCount = accounts.filter(
    (account) => !isAccountActive(account)
  ).length;

  const handleDeleteClick = (account: any) => {
    setAccountToDelete(account);
    setShowDeleteDialog(true);
  };

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
      {/* Header - This will be full width inside the container */}
      <div style={bankingStyles.header}>
        <h1 style={bankingStyles.headerTitle}>📋 Accounts</h1>
        <div style={bankingStyles.headerSubtitle}>
          Manage your bank accounts
        </div>
      </div>

      {/* Top Navigation - Full width inside container */}
      <div style={bankingStyles.topNav}>
        <button
          onClick={() => navigate("/banking")}
          style={bankingStyles.navButton}
          title="Back to Banking"
        >
          ←
        </button>
        <div style={bankingStyles.navTitle}>
          {settings?.showInactive ? "Inactive Accounts" : "Active Accounts"}
        </div>
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
        {/* Search Bar */}
        <div style={{ padding: "15px" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder={`Search ${
                settings?.showInactive ? "inactive" : "active"
              } accounts...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                ...bankingStyles.input,
                paddingLeft: "40px",
                width: "100%",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6c757d",
              }}
            >
              🔍
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#6c757d",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Stats Card - This will be centered because parent is centered */}
        <div style={{ padding: "0 15px", marginBottom: "15px" }}>
          <div style={bankingStyles.statsCard}>
            <div style={bankingStyles.statsLabel}>Total Savings</div>
            <div style={bankingStyles.statsValue}>
              {formatCurrency(totalSavings)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#4285f4" }}>
              Showing {filteredAccounts.length} of {accounts.length} accounts
              {settings?.showInactive !== undefined && (
                <div style={{ fontSize: "0.7rem", marginTop: "4px" }}>
                  ({activeAccountsCount} active, {inactiveAccountsCount}{" "}
                  inactive)
                </div>
              )}
            </div>
            {/* Status Indicators */}
            <div
              style={{
                marginTop: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {/* Edit/Delete Status Indicator */}
              <div
                style={{
                  fontSize: "0.7rem",
                  color: settings?.showDelete ? "#10b981" : "#6c757d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <span>Edit/Delete:</span>
                <span
                  style={{
                    fontWeight: "600",
                    color: settings?.showDelete ? "#10b981" : "#dc2626",
                  }}
                >
                  {settings?.showDelete ? "ENABLED" : "DISABLED"}
                </span>
              </div>

              {/* Active/Inactive Status Indicator */}
              <div
                style={{
                  fontSize: "0.7rem",
                  color: settings?.showInactive ? "#f59e0b" : "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <span>Showing:</span>
                <span
                  style={{
                    fontWeight: "600",
                    color: settings?.showInactive ? "#f59e0b" : "#10b981",
                  }}
                >
                  {settings?.showInactive ? "INACTIVE" : "ACTIVE"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Accounts List */}
        <div style={{ padding: "0 15px" }}>
          {filteredAccounts.length === 0 ? (
            <div style={bankingStyles.emptyState}>
              <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🏦</div>
              <div>
                {searchTerm
                  ? "No matching accounts found"
                  : `No ${
                      settings?.showInactive ? "inactive" : "active"
                    } accounts found`}
              </div>
              <div style={{ fontSize: "0.9rem", marginTop: "5px" }}>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : settings?.showInactive
                  ? "All accounts are currently active"
                  : 'Tap "+" to add an account'}
              </div>
            </div>
          ) : (
            <div style={bankingStyles.card}>
              {/* Table Header */}
              <div
                style={{
                  display: "flex",
                  padding: "12px 0",
                  marginBottom: "8px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#495057",
                  borderBottom: "2px solid #e9ecef",
                }}
              >
                <div style={{ flex: 2, padding: "0 8px" }}>Account</div>
                <div style={{ flex: 1, padding: "0 8px", textAlign: "right" }}>
                  Savings
                </div>
                <div style={{ flex: 1, padding: "0 8px" }}>MPIN</div>
                <div style={{ flex: 1, padding: "0 8px", textAlign: "center" }}>
                  Status
                </div>
                <div
                  style={{
                    width: "80px",
                    padding: "0 8px",
                    textAlign: "center",
                  }}
                >
                  Actions
                </div>
              </div>

              {/* Accounts Rows */}
              <div
                style={{
                  maxHeight: "50vh",
                  overflowY: "auto",
                }}
              >
                {filteredAccounts.map((account, index) => {
                  const isActive = isAccountActive(account);
                  return (
                    <div
                      key={account.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px 0",
                        borderBottom:
                          index < filteredAccounts.length - 1
                            ? "1px solid #e9ecef"
                            : "none",
                        opacity: isActive ? 1 : 0.7,
                      }}
                    >
                      <div style={{ flex: 2, padding: "0 8px" }}>
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
                          flex: 1,
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
                      <div style={{ flex: 1, padding: "0 8px" }}>
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
                      <div
                        style={{
                          flex: 1,
                          padding: "0 8px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            color: isActive ? "#10b981" : "#dc2626",
                            backgroundColor: isActive ? "#f0fdf4" : "#fef2f2",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            display: "inline-block",
                          }}
                        >
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </div>
                      </div>
                      <div
                        style={{
                          width: "80px",
                          display: "flex",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "0 8px",
                        }}
                      >
                        {/* Always show edit icon */}
                        <button
                          onClick={() =>
                            navigate(`/banking/accounts/edit/${account.id}`)
                          }
                          style={{
                            ...bankingStyles.editButton,
                            padding: "6px 10px",
                            fontSize: "0.8rem",
                            minWidth: "auto",
                            opacity: settings?.showDelete ? 1 : 0.6,
                            cursor: settings?.showDelete
                              ? "pointer"
                              : "not-allowed",
                          }}
                          title={
                            settings?.showDelete
                              ? "Edit Account"
                              : "Edit disabled in settings"
                          }
                          disabled={!settings?.showDelete}
                        >
                          ✏️
                        </button>

                        {/* Only show delete icon if showDelete setting is enabled */}
                        {settings?.showDelete && (
                          <button
                            onClick={() => handleDeleteClick(account)}
                            style={{
                              ...bankingStyles.deleteButton,
                              padding: "6px 10px",
                              fontSize: "0.8rem",
                              minWidth: "auto",
                            }}
                            title="Delete Account"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Account Button - Only show when viewing active accounts */}
          {!settings?.showInactive && (
            <div style={{ marginTop: "20px" }}>
              <button
                onClick={() => navigate("/banking/accounts/add")}
                style={bankingStyles.actionButton}
              >
                <span style={{ fontSize: "1.2rem", marginRight: "8px" }}>
                  +
                </span>
                <span>Add New Account</span>
              </button>
            </div>
          )}

          {/* View Toggle Button */}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={() => {
                // This would need to update the settings context
                // For now, we'll navigate to settings page
                navigate("/settings");
              }}
              style={{
                ...bankingStyles.actionButton,
                backgroundColor: settings?.showInactive ? "#10b981" : "#f59e0b",
              }}
            >
              <span style={{ fontSize: "1.2rem", marginRight: "8px" }}>
                {settings?.showInactive ? "✅" : "👁️"}
              </span>
              <span>
                {settings?.showInactive
                  ? "View Active Accounts"
                  : "View Inactive Accounts"}
              </span>
            </button>
          </div>

          {/* Settings Info Box */}
          {!settings?.showDelete && (
            <div
              style={{
                marginTop: "15px",
                padding: "12px",
                backgroundColor: "#fef3c7",
                border: "1px solid #fbbf24",
                borderRadius: "8px",
                fontSize: "0.85rem",
                color: "#92400e",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "1rem" }}>ℹ️</span>
              <div>
                <div style={{ fontWeight: "600" }}>Edit/Delete Disabled</div>
                <div>
                  Go to{" "}
                  <button
                    onClick={() => navigate("/settings")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: "0",
                      fontSize: "0.85rem",
                    }}
                  >
                    Settings
                  </button>{" "}
                  to enable edit/delete functionality
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
