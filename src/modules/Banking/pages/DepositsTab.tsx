import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { useBankingData } from "../hooks/useBankingData";
import { Deposit, BankAccount } from "../../../types/banking.types";
import { bankingStyles } from "../styles";

// Custom formatter for Lakhs - REMOVED "L" suffix
const formatInLakhs = (amount: number): string => {
  return (amount / 100000).toFixed(2); // Just the number with 2 decimals
};

// Date formatter function for dd-mm-yy format
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${day}-${month}-${year}`;
};

type SortOption = "account" | "date";

const DepositsTab: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { loading, accounts, deposits } = useBankingData();

  const [filterAccount, setFilterAccount] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("account");
  const [localDeposits, setLocalDeposits] = useState<Deposit[]>([]);

  // Refs for dropdowns
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Update local deposits when data loads
  useEffect(() => {
    if (deposits.length > 0) {
      setLocalDeposits(deposits);
    }
  }, [deposits]);

  // Helper to check if account is active (safely)
  const isAccountActive = (account: BankAccount): boolean => {
    return account.isActive === undefined ? true : account.isActive;
  };

  // Get account name for filtering
  const getAccountName = (accountId: string): string => {
    const account = accounts.find((acc) => acc.id === accountId);
    return account?.acctCode || "?";
  };

  // Filter deposits exactly like Android app with proper account filtering and sorting
  const filteredDeposits = localDeposits

    .filter((dep) => {
      if (filterAccount === "All") return true;
      // Get account name for filtering
      const account = accounts.find((acc) => acc.id === dep.accountId);
      return account?.acctCode === filterAccount;
    })
    .filter((dep) => {
      // Display active deposits by default, show all if showInactive is true
      if (settings?.showInactive) return true;
      return dep.active;
    })
    .sort((a, b) => {
      const accountA = accounts.find((acc) => acc.id === a.accountId);
      const accountB = accounts.find((acc) => acc.id === b.accountId);
      const codeA = accountA?.acctCode || "";
      const codeB = accountB?.acctCode || "";

      if (sortBy === "account") {
        // Sort by account code
        if (codeA < codeB) return -1;
        if (codeA > codeB) return 1;
        // If same account, then sort by endDate ascending
        return a.endDate - b.endDate;
      } else {
        // Sort by date
        if (a.endDate < b.endDate) return -1;
        if (a.endDate > b.endDate) return 1;
        // If same date, then sort by account code
        if (codeA < codeB) return -1;
        if (codeA > codeB) return 1;
        return 0;
      }
    });

  // Calculate total amount like Android
  const totalAmount = filteredDeposits.reduce(
    (sum, dep) => sum + dep.amount,
    0,
  );

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
        <p>Loading deposits...</p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* REMOVED: Search and Filter Row - replaced with just filter and sort buttons */}

      {/* Filter and Sort Row */}
      <div
        style={{
          padding: "10px 15px",
          backgroundColor: "white",
          borderBottom: "1px solid #e9ecef",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {/* Filter Button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            style={{
              padding: "10px 12px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #e9ecef",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              minWidth: "100px",
            }}
            title="Filter by Account"
          >
            <span>🔍</span>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {filterAccount === "All" ? "All" : filterAccount}
            </span>
          </button>

          {/* Filter Dropdown */}
          {showFilterDropdown && (
            <>
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 99,
                }}
                onClick={() => setShowFilterDropdown(false)}
              />
              <div
                ref={filterDropdownRef}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  zIndex: 100,
                  width: "180px",
                  maxHeight: "300px",
                  overflowY: "auto",
                  marginTop: "4px",
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
                  Filter by Account
                </div>

                <div>
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

                  {/* Sort accounts by acctCode */}
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
                            filterAccount === account.acctCode
                              ? "#1976d2"
                              : "#333",
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
            </>
          )}
        </div>

        {/* Sort Button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            style={{
              padding: "10px 12px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #e9ecef",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            title={`Sort by ${sortBy === "account" ? "Account Code" : "End Date"}`}
          >
            <span>{sortBy === "account" ? "🔢" : "📅"}</span>
          </button>

          {/* Sort Dropdown */}
          {showSortDropdown && (
            <>
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 99,
                }}
                onClick={() => setShowSortDropdown(false)}
              />
              <div
                ref={sortDropdownRef}
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  zIndex: 100,
                  minWidth: "180px",
                  maxHeight: "400px",
                  overflow: "hidden",
                  marginTop: "4px",
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
                  Sort By
                </div>

                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <button
                    onClick={() => {
                      setSortBy("account");
                      setShowSortDropdown(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      color: sortBy === "account" ? "#1976d2" : "#333",
                      backgroundColor:
                        sortBy === "account" ? "#e3f2fd" : "transparent",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>🔢</span>
                      <span>Account Code</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setSortBy("date");
                      setShowSortDropdown(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      color: sortBy === "date" ? "#1976d2" : "#333",
                      backgroundColor:
                        sortBy === "date" ? "#e3f2fd" : "transparent",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>📅</span>
                      <span>End Date</span>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Deposits List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
        {filteredDeposits.length === 0 ? (
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
              💰
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "500",
                color: "#6b7280",
                marginBottom: "8px",
              }}
            >
              {filterAccount !== "All"
                ? `No deposits for ${filterAccount}`
                : settings?.showInactive
                  ? "No deposits available"
                  : "No active deposits available"}
            </div>
            <div style={{ fontSize: "14px", color: "#9ca3af" }}>
              {filterAccount === "All" && "Add your first deposit"}
            </div>
          </div>
        ) : (
          <div style={{ padding: "0 8px" }}>
            {/* Deposits List - Card Style */}
            {filteredDeposits.map((deposit) => {
              const accountName = getAccountName(deposit.accountId);

              return (
                <div
                  key={deposit.id}
                  style={{
                    backgroundColor: "white",
                    margin: "0 8px 8px 8px",
                    borderRadius: "8px",
                    border: "1px solid #e9ecef",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    navigate(`/banking/deposits/edit/${deposit.id}`)
                  }
                >
                  <div
                    style={{
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      minHeight: "48px",
                    }}
                  >
                    {/* Left side - Account and Date */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: "500",
                            color: "#333",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {accountName}
                        </span>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "#666",
                            fontFamily: "monospace",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDate(deposit.endDate)}
                        </span>
                      </div>

                      {deposit.comments && (
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#718096",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {deposit.comments}
                        </div>
                      )}
                    </div>

                    {/* Right side - Amount and Edit button */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginLeft: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: "600",
                          color: "#1976d2",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatInLakhs(deposit.amount)}
                      </span>

                      {settings?.showDelete && (
                        <button
                          style={{
                            padding: "6px",
                            backgroundColor: "#4299e1",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/banking/deposits/edit/${deposit.id}`);
                          }}
                          title="Edit"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Total Summary Card */}
            <div
              style={{
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid #e0e0e0",
                margin: "0 8px",
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
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  Total Summary
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
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
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    color: "#333",
                  }}
                >
                  Total Amount:
                </div>
                <div
                  style={{
                    fontSize: "1.2rem",
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
                    fontSize: "0.8rem",
                    color: "#666",
                    fontStyle: "italic",
                    marginTop: "8px",
                    padding: "4px 0",
                  }}
                >
                  Filtered by: {filterAccount}
                </div>
              )}

              {/* Sort Info */}
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  marginTop: "4px",
                  padding: "4px 0",
                }}
              >
                Sorted by: {sortBy === "account" ? "Account Code" : "End Date"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositsTab;
