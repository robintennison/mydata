import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { useBankingData } from "../hooks/useBankingData";
import { useBankingOperations } from "../hooks/useBankingOperations";
import { Deposit, BankAccount } from "../../../types/banking.types";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { bankingStyles } from "../styles";

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
  const { loading, accounts, deposits } = useBankingData();
  const { handleDeleteDeposit } = useBankingOperations();

  const [filterAccount, setFilterAccount] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [depositToDelete, setDepositToDelete] = useState<string | null>(null);
  const [localDeposits, setLocalDeposits] = useState<Deposit[]>([]);

  // Update local deposits when data loads
  useEffect(() => {
    if (deposits.length > 0) {
      setLocalDeposits(deposits);
    }
  }, [deposits]);

  // Filter deposits exactly like Android app
  const filteredDeposits = localDeposits
    .filter((dep) => {
      if (filterAccount === "All") return true;
      const account = accounts.find((acc) => acc.id === dep.accountId);
      return account?.acctCode === filterAccount;
    })
    .filter((dep) => {
      if (settings?.showInactive) return true;
      return dep.active;
    })
    .sort((a, b) => a.endDate - b.endDate); // ascending by endDate like Android

  // Calculate total amount like Android
  const totalAmount = filteredDeposits.reduce(
    (sum, dep) => sum + dep.amount,
    0
  );

  const handleDelete = async (id: string) => {
    try {
      await handleDeleteDeposit(id);
      setLocalDeposits((prev) => prev.filter((dep) => dep.id !== id));
      setDepositToDelete(null);
    } catch (error) {
      console.error("Error deleting deposit:", error);
      alert("Failed to delete deposit. Please try again.");
    }
  };

  const getAccountName = (accountId: string): string => {
    const account = accounts.find((acc) => acc.id === accountId);
    return account?.acctCode || "?";
  };

  // Helper to check if account is active (safely)
  const isAccountActive = (account: BankAccount): boolean => {
    return account.isActive === undefined ? true : account.isActive;
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
      {/* Header - Exactly like Android TopAppBar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "16px 16px 8px 16px",
          borderBottom: "1px solid #e0e0e0",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                padding: "4px",
                color: "#333",
              }}
              title="Back"
            >
              ←
            </button>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#333",
                margin: 0,
              }}
            >
              Deposits
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Filter Button */}
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "8px",
                color: "#666",
              }}
              title="Filter"
            >
              🔍
            </button>

            {/* Settings Button */}
            <button
              onClick={() => navigate("/settings")}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "8px",
                color: "#666",
              }}
              title="Settings"
            >
              ⚙️
            </button>

            {/* Add Deposit Button */}
            <button
              onClick={() => navigate("/banking/deposits/add")}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "8px",
                color: "#666",
              }}
              title="Add Deposit"
            >
              +
            </button>
          </div>
        </div>

        {/* Filter Dropdown - Like Android DropdownMenu */}
        {showFilterDropdown && (
          <div
            style={{
              position: "absolute",
              top: "70px",
              right: "16px",
              backgroundColor: "#ffffff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              zIndex: 1000,
              minWidth: "180px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                fontSize: "0.875rem",
                color: "#666",
                borderBottom: "1px solid #f0f0f0",
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
                  padding: "12px 16px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  color: filterAccount === "All" ? "#1976d2" : "#333",
                  backgroundColor:
                    filterAccount === "All" ? "#e3f2fd" : "transparent",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                All Accounts
              </button>

              {accounts
                .filter((acc) => isAccountActive(acc))
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
                      padding: "12px 16px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      color:
                        filterAccount === account.acctCode ? "#1976d2" : "#333",
                      backgroundColor:
                        filterAccount === account.acctCode
                          ? "#e3f2fd"
                          : "transparent",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    {account.acctCode}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ padding: "16px" }}>
        {filteredDeposits.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 20px",
              textAlign: "center",
              color: "#666",
            }}
          >
            <div
              style={{ fontSize: "3rem", marginBottom: "16px", opacity: 0.3 }}
            >
              💰
            </div>
            <div style={{ fontSize: "1.1rem", marginBottom: "8px" }}>
              No deposits available
            </div>
            <div style={{ fontSize: "0.95rem", color: "#888" }}>
              {filterAccount !== "All"
                ? `No deposits for ${filterAccount}`
                : 'Tap "+" to add a deposit'}
            </div>
          </div>
        ) : (
          <>
            {/* Table Header - Exactly like Android */}
            <div
              style={{
                display: "flex",
                padding: "12px 0",
                marginBottom: "8px",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#666",
                borderBottom: "2px solid #e0e0e0",
              }}
            >
              <div style={{ flex: 1 }}>Account</div>
              <div style={{ flex: 1.2 }}>Amount / Notes</div>
              <div style={{ flex: 0.8, textAlign: "right" }}>End Date</div>
              <div style={{ width: "56px" }}></div>
            </div>

            {/* Deposits List - Matching Android Card styling */}
            <div
              style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}
            >
              {filteredDeposits.map((deposit, _index) => {
                const accountName = getAccountName(deposit.accountId);

                return (
                  <div
                    key={deposit.id}
                    style={{
                      backgroundColor: "#f8f9fa",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      padding: "12px",
                      minHeight: "40px",
                      display: "flex",
                      alignItems: "center",
                      opacity: deposit.active ? 1 : 0.7,
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    {/* Account */}
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

                    {/* Amount + Comments - Single row like Android */}
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
                          color: "#1976d2",
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

                    {/* End Date - Right aligned */}
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

                    {/* Actions - Exactly like Android spacing */}
                    <div
                      style={{
                        width: "56px",
                        display: "flex",
                        gap: "4px",
                        justifyContent: "flex-end",
                        paddingLeft: "8px",
                      }}
                    >
                      {/* Edit Button - Always visible */}
                      <button
                        onClick={() =>
                          navigate(`/banking/deposits/edit/${deposit.id}`)
                        }
                        style={{
                          padding: "6px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#666",
                          fontSize: "1.1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>

                      {/* Delete Button - Only if showDelete is enabled */}
                      {settings?.showDelete && (
                        <button
                          onClick={() => setDepositToDelete(deposit.id)}
                          style={{
                            padding: "6px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#d32f2f",
                            fontSize: "1.1rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
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

            {/* Total Summary Card - Matching Android exactly */}
            <div style={{ marginTop: "16px" }}>
              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px",
                  padding: "16px",
                  border: "1px solid #e0e0e0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                {/* Header */}
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
                      color: "#666",
                    }}
                  >
                    {filteredDeposits.length} deposit
                    {filteredDeposits.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Total Amount */}
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
                      color: "#1976d2",
                    }}
                  >
                    {formatInLakhs(totalAmount)}
                  </div>
                </div>

                {/* Filter Info */}
                {filterAccount !== "All" && (
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#666",
                      fontStyle: "italic",
                      marginTop: "8px",
                      padding: "4px 0",
                    }}
                  >
                    Filtered by: {filterAccount}
                  </div>
                )}

                {/* Show Inactive Info */}
                {!settings?.showInactive && (
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#666",
                      fontStyle: "italic",
                      padding: "4px 0",
                    }}
                  >
                    Showing active deposits only
                  </div>
                )}
              </div>
            </div>

            {/* Bottom spacer like Android */}
            <div style={{ height: "32px" }}></div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog - Matching Android AlertDialog */}
      {settings?.showDelete && depositToDelete && (
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
            zIndex: 2000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#333",
              }}
            >
              Delete deposit
            </h3>
            <p
              style={{
                margin: "0 0 24px 0",
                color: "#666",
                lineHeight: "1.5",
                fontSize: "0.95rem",
              }}
            >
              Delete this deposit? This action cannot be undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setDepositToDelete(null)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "transparent",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  color: "#666",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  minWidth: "80px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => depositToDelete && handleDelete(depositToDelete)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#d32f2f",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  minWidth: "80px",
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
