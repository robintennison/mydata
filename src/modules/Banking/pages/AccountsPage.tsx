import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { useBankingData } from "../hooks/useBankingData";
import { useBankingOperations } from "../hooks/useBankingOperations";
import { bankingStyles } from "../styles/BankingStyles";

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

  const totalSavings = accounts.reduce(
    (sum, account) => sum + account.savingsAmount,
    0
  );

  // Filter accounts based on search
  const filteredAccounts = accounts.filter((account) =>
    account.acctCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div style={bankingStyles.navTitle}>Accounts List</div>
        <button
          onClick={() => navigate("/banking/accounts/add")}
          style={bankingStyles.navButton}
          title="Add Account"
        >
          +
        </button>
      </div>

      {/* ALL CONTENT INSIDE THIS DIV - This ensures centering */}
      <div style={{ width: "100%" }}>
        {/* Search Bar */}
        <div style={{ padding: "15px" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search accounts..."
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
              From {accounts.length} account{accounts.length !== 1 ? "s" : ""}
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
                  : "No accounts found"}
              </div>
              <div style={{ fontSize: "0.9rem", marginTop: "5px" }}>
                {searchTerm
                  ? "Try adjusting your search terms"
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
                {filteredAccounts.map((account, index) => (
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
                    }}
                  >
                    <div style={{ flex: 2, padding: "0 8px" }}>
                      <div
                        style={{
                          fontWeight: "500",
                          color: "#333",
                          fontSize: "0.95rem",
                        }}
                      >
                        {account.acctCode}
                      </div>
                    </div>
                    <div
                      style={{ flex: 1, padding: "0 8px", textAlign: "right" }}
                    >
                      <div
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: "600",
                          color: "#4285f4",
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
                          color: "#666",
                        }}
                      >
                        {account.mpin || "••••"}
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
                        title="Edit"
                      >
                        ✏️
                      </button>
                      {settings.enableEditDelete && (
                        <button
                          onClick={() => handleDeleteClick(account)}
                          style={{
                            ...bankingStyles.deleteButton,
                            padding: "6px 10px",
                            fontSize: "0.8rem",
                            minWidth: "auto",
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Account Button */}
          <div style={{ marginTop: "20px" }}>
            <button
              onClick={() => navigate("/banking/accounts/add")}
              style={bankingStyles.actionButton}
            >
              <span style={{ fontSize: "1.2rem", marginRight: "8px" }}>+</span>
              <span>Add New Account</span>
            </button>
          </div>
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

      {/* Bottom spacing */}
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default AccountsPage;
