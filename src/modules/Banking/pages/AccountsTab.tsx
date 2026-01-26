import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { useBankingData } from "../hooks/useBankingData";
import { useBankingOperations } from "../hooks/useBankingOperations";
import { bankingStyles } from "../styles/BankingStyles";

const AccountsTab: React.FC = () => {
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
    if (settings?.showInactive) {
      return true; // Show all accounts
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
    isAccountActive(account),
  ).length;
  const inactiveAccountsCount = accounts.filter(
    (account) => !isAccountActive(account),
  ).length;

  // Truncate account code to 15 characters
  const truncateAccountCode = (code: string): string => {
    if (!code) return "";
    if (code.length <= 15) return code;
    return `${code.substring(0, 15)}...`;
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      handleDeleteAccount(accountToDelete.id);
      setShowDeleteDialog(false);
      setAccountToDelete(null);
    }
  };

  // Handle row click - view mode when showDelete is false, edit mode when showDelete is true
  const handleRowClick = (accountId: string) => {
    if (settings?.showDelete) {
      // When showDelete is true, open in edit mode
      navigate(`/banking/accounts/edit/${accountId}`);
    } else {
      // When showDelete is false, open in view mode
      // You need to create a view route or modify the existing edit route to handle view mode
      // For now, we'll use the same edit route but the component should handle view mode
      navigate(`/banking/accounts/view/${accountId}`);
    }
  };

  // Handle edit button click - only available when showDelete is true
  const handleEditClick = (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (settings?.showDelete) {
      navigate(`/banking/accounts/edit/${accountId}`);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px",
        }}
      >
        <div style={bankingStyles.spinner}></div>
        <p>Loading accounts...</p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Accounts List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {sortedAccounts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#6c757d",
            }}
          >
            <div
              style={{ fontSize: "48px", marginBottom: "16px", opacity: "0.5" }}
            >
              🏦
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "500",
                color: "#6b7280",
                marginBottom: "8px",
              }}
            >
              {settings?.showInactive
                ? "No accounts found"
                : "No active accounts found"}
            </div>
            <div style={{ fontSize: "14px", color: "#9ca3af" }}>
              Add your first account to get started
            </div>
          </div>
        ) : (
          <div>
            {/* Table Header - ALL LEFT ALIGNED */}
            <div
              style={{
                display: "flex",
                padding: "12px 16px",
                backgroundColor: "#f9fafb",
                borderBottom: "1px solid #e9ecef",
                fontWeight: "600",
                fontSize: "12px",
                color: "#374151",
                alignItems: "center",
              }}
            >
              {/* Account Column */}
              <div
                style={{
                  flex: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                Account
              </div>
              {/* Savings Column - CHANGED to left align */}
              <div
                style={{
                  flex: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                Savings
              </div>
              {/* MPIN Column */}
              <div
                style={{
                  flex: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                MPIN
              </div>
              {settings?.showDelete && (
                <div
                  style={{
                    width: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                ></div>
              )}
            </div>

            {/* Accounts Rows - ALL LEFT ALIGNED */}
            <div>
              {sortedAccounts.map((account) => {
                const isActive = isAccountActive(account);
                const accountCode = account.acctCode || "";
                const truncatedAccountCode = truncateAccountCode(accountCode);

                return (
                  <div
                    key={account.id}
                    style={{
                      backgroundColor: "white",
                      borderBottom: "1px solid #f3f4f6",
                      cursor: "pointer",
                    }}
                    onClick={() => handleRowClick(account.id)}
                  >
                    <div
                      style={{
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        minHeight: "44px",
                      }}
                    >
                      {/* Account Column - LEFT ALIGNED */}
                      <div
                        style={{
                          flex: 4,
                          minWidth: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          paddingRight: "8px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "500",
                            color: isActive ? "#1e293b" : "#6c757d",
                            fontSize: "13px",
                            textDecoration: isActive ? "none" : "line-through",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={
                            accountCode.length > 15 ? accountCode : undefined
                          }
                        >
                          {truncatedAccountCode}
                          {!isActive && (
                            <span
                              style={{
                                fontSize: "9px",
                                color: "#dc2626",
                                marginLeft: "3px",
                                fontWeight: "normal",
                              }}
                            >
                              (inactive)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Savings Column - LEFT ALIGNED */}
                      <div
                        style={{
                          flex: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          paddingRight: "8px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: isActive ? "#4285f4" : "#6c757d",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatCurrency(account.savingsAmount)}
                        </div>
                      </div>

                      {/* MPIN Column - LEFT ALIGNED, BLACK FONT */}
                      <div
                        style={{
                          flex: 3,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          paddingRight: "8px",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'Courier New', monospace",
                            fontSize: "14px",
                            color: "#000000",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontWeight: "500",
                          }}
                        >
                          {account.mpin || "••••"}
                        </div>
                      </div>

                      {/* Edit Button Column - LEFT ALIGNED */}
                      {settings?.showDelete && (
                        <div
                          style={{
                            width: "28px",
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                          }}
                        >
                          <button
                            onClick={(e) => handleEditClick(account.id, e)}
                            style={{
                              padding: "2px",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#6b7280",
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "26px",
                              height: "26px",
                            }}
                            title="Edit Account"
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Savings Footer */}
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#f3f4f6",
                borderTop: "1px solid #e9ecef",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: "11px", color: "#6b7280" }}>
                  {settings?.showInactive
                    ? `${sortedAccounts.length} of ${accounts.length} accounts`
                    : `${sortedAccounts.length} active accounts`}
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "#94a3b8",
                    marginTop: "1px",
                  }}
                >
                  ({activeAccountsCount} active, {inactiveAccountsCount}{" "}
                  inactive)
                </div>
              </div>
              <div
                style={{
                  textAlign: "right",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    color: "#64748b",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Total Savings
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
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
    </div>
  );
};

export default AccountsTab;
