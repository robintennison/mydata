import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { useBankingData } from "../hooks/useBankingData";
import { useBankingOperations } from "../hooks/useBankingOperations";
import { accountsPageStyles } from "../styles/AccountsPageStyles";

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
    if (account.isActive !== undefined) {
      return account.isActive === true;
    }
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
    const matchesSearch = account.acctCode
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (settings?.showInactive !== undefined) {
      if (settings.showInactive) {
        return matchesSearch && !isAccountActive(account);
      } else {
        return matchesSearch && isAccountActive(account);
      }
    }

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
      <div style={accountsPageStyles.container}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #f3f3f3",
              borderTop: "3px solid #4285f4",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          ></div>
          <p style={{ marginTop: "10px" }}>Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={accountsPageStyles.container}>
      {/* Header */}
      <div style={accountsPageStyles.header}>
        <h1 style={accountsPageStyles.headerTitle}>📋 Banking / Accounts</h1>
        <div style={accountsPageStyles.headerSubtitle}>
          Manage your bank accounts
        </div>
      </div>

      {/* Top Navigation */}
      <div style={accountsPageStyles.topNav}>
        <button
          onClick={() => navigate("/banking")}
          style={accountsPageStyles.navButton}
          title="Back to Banking"
        >
          ←
        </button>
        <div style={accountsPageStyles.navTitle}>
          Banking / {settings?.showInactive ? "Inactive Accounts" : "Active Accounts"}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate("/settings")}
            style={{
              ...accountsPageStyles.navButton,
              padding: "6px 10px",
              fontSize: "1.2rem",
            }}
            title="Settings"
          >
            ⚙️
          </button>
          <button
            onClick={() => navigate("/banking/accounts/add")}
            style={accountsPageStyles.navButton}
            title="Add Account"
          >
            +
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ width: "100%" }}>
        {/* Search Bar */}
        <div style={{ padding: "15px" }}>
          <div style={accountsPageStyles.searchInputContainer}>
            <input
              type="text"
              placeholder={`Search ${
                settings?.showInactive ? "inactive" : "active"
              } accounts...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "10px 15px",
                border: "1px solid #e9ecef",
                borderRadius: "8px",
                fontSize: "0.95rem",
                ...accountsPageStyles.searchInput,
              }}
            />
            <div style={accountsPageStyles.searchIcon}>🔍</div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={accountsPageStyles.clearSearchButton}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Stats Card */}
        <div style={{ padding: "0 15px", marginBottom: "15px" }}>
          <div style={accountsPageStyles.statsCard}>
            <div style={accountsPageStyles.statsLabel}>Total Savings</div>
            <div style={accountsPageStyles.statsValue}>
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
            <div style={accountsPageStyles.statusIndicators}>
              <div
                style={{
                  ...accountsPageStyles.statusIndicator,
                  color: settings?.showDelete ? "#10b981" : "#6c757d",
                }}
              >
                <span>Edit/Delete:</span>
                <span
                  style={{
                    ...accountsPageStyles.statusText,
                    color: settings?.showDelete ? "#10b981" : "#dc2626",
                  }}
                >
                  {settings?.showDelete ? "ENABLED" : "DISABLED"}
                </span>
              </div>
              <div
                style={{
                  ...accountsPageStyles.statusIndicator,
                  color: settings?.showInactive ? "#f59e0b" : "#10b981",
                }}
              >
                <span>Showing:</span>
                <span
                  style={{
                    ...accountsPageStyles.statusText,
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
            <div style={accountsPageStyles.emptyState}>
              <div style={accountsPageStyles.emptyStateIcon}>🏦</div>
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
            <div style={accountsPageStyles.accountsListCard}>
              {/* Table Header */}
              <div style={accountsPageStyles.tableHeader}>
                <div style={accountsPageStyles.tableHeaderCell(2)}>Account</div>
                <div style={accountsPageStyles.tableHeaderCell(1, "right")}>
                  Savings
                </div>
                <div style={accountsPageStyles.tableHeaderCell(1)}>MPIN</div>
                <div style={accountsPageStyles.tableHeaderCell(1, "center")}>
                  Status
                </div>
                <div style={accountsPageStyles.tableHeaderCell(0.8, "center")}>
                  Actions
                </div>
              </div>

              {/* Accounts Rows */}
              <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
                {filteredAccounts.map((account, index) => {
                  const isActive = isAccountActive(account);
                  return (
                    <div
                      key={account.id}
                      style={accountsPageStyles.tableRow(
                        index === filteredAccounts.length - 1,
                        isActive
                      )}
                    >
                      <div style={accountsPageStyles.tableHeaderCell(2)}>
                        <div style={accountsPageStyles.accountCode(isActive)}>
                          {account.acctCode}
                          {!isActive && (
                            <span style={accountsPageStyles.inactiveLabel}>
                              (inactive)
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        style={accountsPageStyles.tableHeaderCell(1, "right")}
                      >
                        <div style={accountsPageStyles.savingsAmount(isActive)}>
                          {formatCurrency(account.savingsAmount)}
                        </div>
                      </div>
                      <div style={accountsPageStyles.tableHeaderCell(1)}>
                        <div style={accountsPageStyles.mpinText(isActive)}>
                          {account.mpin || "••••"}
                        </div>
                      </div>
                      <div
                        style={accountsPageStyles.tableHeaderCell(1, "center")}
                      >
                        <div style={accountsPageStyles.statusBadge(isActive)}>
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </div>
                      </div>
                      <div style={accountsPageStyles.actionsContainer}>
                        <button
                          onClick={() =>
                            navigate(`/banking/accounts/edit/${account.id}`)
                          }
                          style={accountsPageStyles.editButton(
                            !!settings?.showDelete
                          )}
                          title={
                            settings?.showDelete
                              ? "Edit Account"
                              : "Edit disabled in settings"
                          }
                          disabled={!settings?.showDelete}
                        >
                          ✏️
                        </button>
                        {settings?.showDelete && (
                          <button
                            onClick={() => handleDeleteClick(account)}
                            style={accountsPageStyles.deleteButton}
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

          {/* Add Account Button */}
          {!settings?.showInactive && (
            <div style={{ marginTop: "20px" }}>
              <button
                onClick={() => navigate("/banking/accounts/add")}
                style={accountsPageStyles.actionButton}
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
              onClick={() => navigate("/settings")}
              style={accountsPageStyles.viewToggleButton(
                !!settings?.showInactive
              )}
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
            <div style={accountsPageStyles.settingsInfoBox}>
              <span style={{ fontSize: "1rem" }}>ℹ️</span>
              <div>
                <div style={{ fontWeight: "600" }}>Edit/Delete Disabled</div>
                <div>
                  Go to{" "}
                  <button
                    onClick={() => navigate("/settings")}
                    style={accountsPageStyles.settingsLink}
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
        <div style={accountsPageStyles.deleteDialogOverlay}>
          <div style={accountsPageStyles.deleteDialog}>
            <h3 style={accountsPageStyles.deleteDialogTitle}>
              Delete Account?
            </h3>
            <p style={accountsPageStyles.deleteDialogMessage}>
              Are you sure you want to delete account{" "}
              <span style={{ fontWeight: "600" }}>
                {accountToDelete.acctCode}
              </span>
              ? This action cannot be undone.
            </p>
            <div style={accountsPageStyles.deleteDialogButtons}>
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setAccountToDelete(null);
                }}
                style={accountsPageStyles.deleteDialogButton(true)}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={accountsPageStyles.deleteDialogButton()}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacing */}
      <div style={accountsPageStyles.bottomSpacing}></div>
    </div>
  );
};

export default AccountsPage;
