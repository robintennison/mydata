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
      {/* Filter and Sort Row - COMPACT */}
      <div
        style={{
          padding: "6px 8px", // Reduced padding
          backgroundColor: "white",
          borderBottom: "1px solid #e9ecef",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px", // Reduced gap
        }}
      >
        {/* Filter Button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            style={{
              padding: "6px 8px", // Reduced padding
              backgroundColor: "#f8f9fa",
              border: "1px solid #e9ecef",
              borderRadius: "4px", // Smaller radius
              cursor: "pointer",
              fontSize: "12px", // Smaller font
              display: "flex",
              alignItems: "center",
              gap: "4px", // Reduced gap
              minWidth: "80px", // Smaller min width
            }}
            title="Filter by Account"
          >
            <span>🔍</span>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: "11px", // Smaller
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
                  borderRadius: "6px", // Smaller
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)", // Lighter shadow
                  zIndex: 100,
                  width: "150px", // Smaller
                  maxHeight: "250px", // Smaller
                  overflowY: "auto",
                  marginTop: "2px", // Reduced margin
                }}
              >
                <div
                  style={{
                    padding: "8px 12px", // Reduced
                    fontSize: "12px", // Smaller
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
                      padding: "8px 12px", // Reduced
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px", // Smaller
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
                          padding: "8px 12px", // Reduced
                          textAlign: "left",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "13px", // Smaller
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
              padding: "6px 8px", // Reduced
              backgroundColor: "#f8f9fa",
              border: "1px solid #e9ecef",
              borderRadius: "4px", // Smaller
              cursor: "pointer",
              fontSize: "12px", // Smaller
              display: "flex",
              alignItems: "center",
              gap: "4px", // Reduced
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
                  borderRadius: "6px", // Smaller
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)", // Lighter
                  zIndex: 100,
                  minWidth: "150px", // Smaller
                  maxHeight: "300px",
                  overflow: "hidden",
                  marginTop: "2px", // Reduced
                }}
              >
                <div
                  style={{
                    padding: "8px 12px", // Reduced
                    fontSize: "12px", // Smaller
                    color: "#666",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  Sort By
                </div>

                <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                  <button
                    onClick={() => {
                      setSortBy("account");
                      setShowSortDropdown(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px", // Reduced
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px", // Smaller
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
                        gap: "6px", // Reduced
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
                      padding: "8px 12px", // Reduced
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px", // Smaller
                      color: sortBy === "date" ? "#1976d2" : "#333",
                      backgroundColor:
                        sortBy === "date" ? "#e3f2fd" : "transparent",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px", // Reduced
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

      {/* Deposits List - SIMPLE TABLE ROWS */}
      <div style={{ flex: 1, overflowY: "auto" }}>
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
          <div>
            {/* Table Header - SIMPLE */}
            <div
              style={{
                display: "flex",
                padding: "6px 4px", // Reduced
                backgroundColor: "#f9fafb",
                borderBottom: "1px solid #e9ecef",
                fontWeight: "600",
                fontSize: "11px", // Smaller
                color: "#374151",
              }}
            >
              <div style={{ flex: 3, padding: "0 4px" }}>Account</div>
              <div style={{ flex: 2, padding: "0 4px" }}>Date</div>
              <div style={{ flex: 2, padding: "0 4px", textAlign: "right" }}>
                Amount
              </div>
              {settings?.showDelete && <div style={{ width: "30px" }}></div>}
            </div>

            {/* Table Rows - SIMPLE */}
            <div>
              {filteredDeposits.map((deposit) => {
                const accountName = getAccountName(deposit.accountId);

                return (
                  <div
                    key={deposit.id}
                    style={{
                      backgroundColor: "white",
                      borderBottom: "1px solid #f3f4f6",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      navigate(`/banking/deposits/edit/${deposit.id}`)
                    }
                  >
                    <div
                      style={{
                        padding: "6px 4px", // Reduced
                        display: "flex",
                        alignItems: "center",
                        minHeight: "36px", // Reduced
                      }}
                    >
                      {/* Account */}
                      <div style={{ flex: 3, padding: "0 4px", minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "12px", // Smaller
                            color: "#333",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {accountName}
                          {deposit.comments && (
                            <span
                              style={{
                                fontSize: "10px", // Smaller
                                color: "#718096",
                                marginLeft: "4px",
                              }}
                            >
                              {deposit.comments.length > 10
                                ? `${deposit.comments.substring(0, 10)}...`
                                : deposit.comments}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <div style={{ flex: 2, padding: "0 4px" }}>
                        <div
                          style={{
                            fontSize: "11px", // Smaller
                            color: "#666",
                            fontFamily: "monospace",
                          }}
                        >
                          {formatDate(deposit.endDate)}
                        </div>
                      </div>

                      {/* Amount */}
                      <div
                        style={{
                          flex: 2,
                          padding: "0 4px",
                          textAlign: "right",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px", // Smaller
                            fontWeight: "600",
                            color: "#1976d2",
                          }}
                        >
                          {formatInLakhs(deposit.amount)}
                        </div>
                      </div>

                      {/* Edit button */}
                      {settings?.showDelete && (
                        <div
                          style={{
                            width: "30px",
                            display: "flex",
                            justifyContent: "center",
                            paddingRight: "2px",
                          }}
                        >
                          <button
                            style={{
                              padding: "2px", // Reduced
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#6b7280",
                              fontSize: "12px", // Smaller
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "26px", // Smaller
                              height: "26px", // Smaller
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/banking/deposits/edit/${deposit.id}`);
                            }}
                            title="Edit"
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

            {/* Total Summary Footer - SIMPLE */}
            <div
              style={{
                padding: "8px 4px", // Reduced
                backgroundColor: "#f3f4f6",
                borderTop: "1px solid #e9ecef",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px", // Reduced
                }}
              >
                <div style={{ fontSize: "11px", color: "#6b7280" }}>
                  {filteredDeposits.length} deposit
                  {filteredDeposits.length !== 1 ? "s" : ""}
                  {filterAccount !== "All" && ` for ${filterAccount}`}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "10px", // Smaller
                      color: "#64748b",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Total
                  </div>
                  <div
                    style={{
                      fontSize: "14px", // Smaller
                      fontWeight: "700",
                      color: "#1976d2",
                    }}
                  >
                    {formatInLakhs(totalAmount)}
                  </div>
                </div>
              </div>

              {/* Sort Info - Compact */}
              <div
                style={{
                  fontSize: "10px", // Smaller
                  color: "#94a3b8",
                  textAlign: "center",
                  paddingTop: "2px",
                  borderTop: "1px dashed #e5e7eb",
                  marginTop: "4px",
                }}
              >
                Sorted by {sortBy === "account" ? "account code" : "end date"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositsTab;
