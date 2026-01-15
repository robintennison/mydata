import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { Deposit, BankAccount } from "../../../types/banking.types";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { bankingStyles } from "../styles";

// Mock data - replace with actual API calls
const mockDeposits: Deposit[] = [
  {
    id: "1",
    accountId: "acc1",
    amount: 500000,
    startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 60 * 24 * 60 * 60 * 1000,
    comments: "Fixed Deposit for future planning",
    active: true,
  },
  {
    id: "2",
    accountId: "acc2",
    amount: 300000,
    startDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 45 * 24 * 60 * 60 * 1000,
    comments: "Emergency fund",
    active: true,
  },
];

const mockAccounts: BankAccount[] = [
  {
    id: "acc1",
    acctCode: "SB1234",
    savingsAmount: 1000000,
    acctDetails: "Savings Account",
    mpin: "1234",
    isActive: true,
  },
  {
    id: "acc2",
    acctCode: "CB5678",
    savingsAmount: 2000000,
    acctDetails: "Current Account",
    mpin: "5678",
    isActive: true,
  },
];

// Custom formatter for Lakhs like Android version
const formatInLakhs = (amount: number): string => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  return formatCurrency(amount);
};

const DepositsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [filterAccount, setFilterAccount] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [depositToDelete, setDepositToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Replace with actual API calls
      setDeposits(mockDeposits);
      setAccounts(mockAccounts);
      setLoading(false);
    };
    loadData();
  }, []);

  // Filter deposits
  const filteredDeposits = deposits
    .filter((dep) => {
      if (filterAccount === "All") return true;
      const account = accounts.find((acc) => acc.id === dep.accountId);
      return account?.acctCode === filterAccount;
    })
    .filter((dep) => {
      if (settings?.showInactive) return true;
      return dep.active;
    })
    .sort((a, b) => a.endDate - b.endDate);

  // Calculate total
  const totalAmount = filteredDeposits.reduce(
    (sum, dep) => sum + dep.amount,
    0
  );

  const handleDelete = async (id: string) => {
    // Replace with actual API call
    setDeposits((prev) => prev.filter((dep) => dep.id !== id));
    setDepositToDelete(null);
  };

  const getAccountName = (accountId: string): string => {
    const account = accounts.find((acc) => acc.id === accountId);
    return account?.acctCode || "?";
  };

  if (loading) {
    return (
      <div style={bankingStyles.container}>
        <div style={bankingStyles.loading}>
          <div style={bankingStyles.spinner}></div>
          <p>Loading deposits...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={bankingStyles.container}>
      {/* Header */}
      <div style={bankingStyles.header}>
        <h1 style={bankingStyles.headerTitle}>💰 Deposits</h1>
        <div style={bankingStyles.headerSubtitle}>Manage your deposits</div>
      </div>

      {/* Top Navigation */}
      <div style={bankingStyles.topNav}>
        <button
          onClick={() => navigate("/banking")}
          style={bankingStyles.navButton}
          title="Back to Banking"
        >
          ←
        </button>
        <div style={bankingStyles.navTitle}>Deposits List</div>
        <div style={{ display: "flex", gap: "8px" }}>
          {/* Filter Button */}
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            style={bankingStyles.navButton}
            title="Filter"
          >
            🔍
          </button>
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
          {/* Add Deposit Button */}
          <button
            onClick={() => navigate("/banking/deposits/add")}
            style={bankingStyles.navButton}
            title="Add Deposit"
          >
            +
          </button>
        </div>
      </div>

      {/* Filter Dropdown */}
      {showFilterDropdown && (
        <div
          style={{
            position: "absolute",
            top: "120px",
            right: "20px",
            backgroundColor: "#fff",
            border: "1px solid #e9ecef",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 1000,
            minWidth: "200px",
          }}
        >
          <div
            style={{
              padding: "12px",
              fontSize: "0.9rem",
              color: "#6c757d",
              borderBottom: "1px solid #e9ecef",
            }}
          >
            Current: {filterAccount}
          </div>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            <button
              onClick={() => {
                setFilterAccount("All");
                setShowFilterDropdown(false);
              }}
              style={{
                width: "100%",
                padding: "12px",
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.95rem",
                color: filterAccount === "All" ? "#4285f4" : "#333",
                backgroundColor:
                  filterAccount === "All" ? "#f0f7ff" : "transparent",
              }}
            >
              All Accounts
            </button>
            {accounts
              .filter((acc) => acc.isActive !== false)
              .sort((a, b) => a.acctCode.localeCompare(b.acctCode))
              .map((account) => (
                <button
                  key={account.id}
                  onClick={() => {
                    setFilterAccount(account.acctCode);
                    setShowFilterDropdown(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    color:
                      filterAccount === account.acctCode ? "#4285f4" : "#333",
                    backgroundColor:
                      filterAccount === account.acctCode
                        ? "#f0f7ff"
                        : "transparent",
                    borderBottom: "1px solid #f1f3f4",
                  }}
                >
                  {account.acctCode}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ padding: "15px" }}>
        {filteredDeposits.length === 0 ? (
          <div style={bankingStyles.emptyState}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>💰</div>
            <div>No deposits available</div>
            <div
              style={{ fontSize: "0.9rem", marginTop: "5px", color: "#6c757d" }}
            >
              {filterAccount !== "All"
                ? `No deposits for ${filterAccount}`
                : 'Tap "+" to add a deposit'}
            </div>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div
              style={{
                display: "flex",
                padding: "12px 8px",
                marginBottom: "8px",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#495057",
                borderBottom: "2px solid #e9ecef",
              }}
            >
              <div style={{ flex: 1 }}>Account</div>
              <div style={{ flex: 1.2 }}>Amount / Notes</div>
              <div style={{ flex: 0.8, textAlign: "right" }}>End Date</div>
              <div style={{ width: "56px" }}></div>
            </div>

            {/* Deposits List */}
            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {filteredDeposits.map((deposit) => {
                const accountName = getAccountName(deposit.accountId);

                return (
                  <div
                    key={deposit.id}
                    style={{
                      backgroundColor: "#f8f9fa",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      padding: "12px",
                      minHeight: "48px",
                      display: "flex",
                      alignItems: "center",
                      opacity: deposit.active ? 1 : 0.7,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 500,
                          color: "#333",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {accountName}
                      </div>
                    </div>

                    <div
                      style={{
                        flex: 1.2,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "#4285f4",
                          flex: "0.6",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatInLakhs(deposit.amount)}
                      </div>
                      <div style={{ width: "6px" }}></div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "#666",
                          flex: "1",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {deposit.comments.substring(0, 30)}
                        {deposit.comments.length > 30 && "..."}
                      </div>
                    </div>

                    <div style={{ flex: 0.8, textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "0.95rem",
                          color: "#495057",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(deposit.endDate, "en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div
                      style={{
                        width: "56px",
                        display: "flex",
                        gap: "4px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() =>
                          navigate(`/banking/deposits/edit/${deposit.id}`)
                        }
                        style={{
                          padding: "6px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#6c757d",
                          fontSize: "1rem",
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      {settings?.showDelete && (
                        <button
                          onClick={() => setDepositToDelete(deposit.id)}
                          style={{
                            padding: "6px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#dc2626",
                            fontSize: "1rem",
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Summary */}
            <div style={{ marginTop: "20px" }}>
              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      color: "#333",
                    }}
                  >
                    Total Summary
                  </div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      color: "#6c757d",
                    }}
                  >
                    {filteredDeposits.length} deposit
                    {filteredDeposits.length !== 1 ? "s" : ""}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 500,
                      color: "#333",
                    }}
                  >
                    Total Amount:
                  </div>
                  <div
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: 700,
                      color: "#4285f4",
                    }}
                  >
                    {formatInLakhs(totalAmount)}
                  </div>
                </div>

                {filterAccount !== "All" && (
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#6c757d",
                      fontStyle: "italic",
                      marginTop: "8px",
                    }}
                  >
                    Filtered by: {filterAccount}
                  </div>
                )}

                {!settings?.showInactive && (
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#6c757d",
                      fontStyle: "italic",
                      marginTop: "4px",
                    }}
                  >
                    Showing active deposits only
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {depositToDelete && (
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
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
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
                fontWeight: 600,
                color: "#333",
              }}
            >
              Delete Deposit?
            </h3>
            <p
              style={{ margin: "0 0 20px 0", color: "#666", lineHeight: "1.5" }}
            >
              Delete this deposit? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setDepositToDelete(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                  borderRadius: "8px",
                  color: "#495057",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontSize: "0.95rem",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(depositToDelete)}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#ea4335",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontSize: "0.95rem",
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

export default DepositsListPage;
