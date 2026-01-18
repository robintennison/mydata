import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { useBankingData } from "../hooks/useBankingData";
//import { useBankingOperations } from "../hooks/useBankingOperations";
import { Deposit, BankAccount } from "../../../types/banking.types";
import { bankingStyles } from "../styles";
import BankingNavigation from "./BankingNavigation";

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

const DepositsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { loading, accounts, deposits } = useBankingData();
  //const { handleDeleteDeposit } = useBankingOperations();

  const [filterAccount, setFilterAccount] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("account");
  //const [depositToDelete, setDepositToDelete] = useState<string | null>(null);
  const [localDeposits, setLocalDeposits] = useState<Deposit[]>([]);

  // Refs for dropdowns
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);

  // Update local deposits when data loads
  useEffect(() => {
    if (deposits.length > 0) {
      setLocalDeposits(deposits);
    }
  }, [deposits]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node) &&
        sortButtonRef.current &&
        !sortButtonRef.current.contains(event.target as Node)
      ) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    0
  );

  // const handleDelete = async (id: string) => {
  //   try {
  //     await handleDeleteDeposit(id);
  //     setLocalDeposits((prev) => prev.filter((dep) => dep.id !== id));
  //     setDepositToDelete(null);
  //   } catch (error) {
  //     console.error("Error deleting deposit:", error);
  //     alert("Failed to delete deposit. Please try again.");
  //   }
  // };

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
              Banking / Deposits
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              position: "relative",
            }}
          >
            {/* Sort Button */}
            <button
              ref={sortButtonRef}
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
                setShowFilterDropdown(false);
              }}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "8px",
                color: "#666",
              }}
              title="Sort"
            >
              {sortBy === "account" ? "🔢" : "📅"}
            </button>

            {/* Filter Button */}
            <button
              ref={filterButtonRef}
              onClick={() => {
                setShowFilterDropdown(!showFilterDropdown);
                setShowSortDropdown(false);
              }}
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
      </div>

      {/* Sort Dropdown - Positioned outside the header */}
      {showSortDropdown && (
        <div
          ref={sortDropdownRef}
          style={{
            position: "absolute",
            top: "70px",
            right: "16px",
            backgroundColor: "#ffffff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            zIndex: 1001,
            minWidth: "180px",
            maxHeight: "400px",
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
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
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
                backgroundColor: sortBy === "date" ? "#e3f2fd" : "transparent",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span>📅</span>
                <span>End Date</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Filter Dropdown - Positioned outside the header - FIXED width */}
      {showFilterDropdown && (
        <div
          ref={filterDropdownRef}
          style={{
            position: "absolute",
            top: "70px",
            right: "60px", // Adjusted for filter button position
            backgroundColor: "#ffffff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            zIndex: 1001,
            width: "180px", // Fixed width same as sort dropdown
            maxHeight: "400px",
            overflowY: "auto",
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

      {/* Main Content */}
      <div style={{ padding: "0" }}>
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
            {/* Desktop-like Table Layout matching Deposit Summary Page */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
                marginBottom: "16px",
                backgroundColor: "#ffffff",
              }}
            >
              {/* Table Header - Matching Deposit Summary exactly */}
              <div
                style={{
                  display: "flex",
                  padding: "10px 12px",
                  backgroundColor: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                  fontWeight: "600",
                  fontSize: "13px",
                  color: "#374151",
                }}
              >
                <div style={{ flex: 1 }}>Account</div>
                <div style={{ flex: 1.2 }}>Amount / Notes</div>
                <div style={{ flex: 0.8, textAlign: "right" }}>End Date</div>
                {settings?.showDelete && <div style={{ width: "40px" }}></div>}
              </div>

              {/* Table Body - Single container for all rows */}
              <div
                style={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto" }}
              >
                {filteredDeposits.map((deposit, index) => {
                  const accountName = getAccountName(deposit.accountId);

                  return (
                    <div
                      key={deposit.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "10px 12px",
                        minHeight: "48px",
                        backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                        borderBottom:
                          index < filteredDeposits.length - 1
                            ? "1px solid #f3f4f6"
                            : "none",
                        opacity: deposit.active ? 1 : 0.7,
                      }}
                    >
                      {/* Account */}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#1e293b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {accountName}
                        </div>
                      </div>

                      {/* Amount + Comments */}
                      <div
                        style={{
                          flex: 1.2,
                          display: "flex",
                          alignItems: "center",
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#1976d2",
                            flexShrink: 0,
                          }}
                        >
                          {formatInLakhs(deposit.amount)}
                        </div>
                        <div style={{ width: "8px" }}></div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6b7280",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {deposit.comments}
                        </div>
                      </div>

                      {/* End Date - Right aligned */}
                      <div
                        style={{
                          flex: 0.8,
                          textAlign: "right",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#475569",
                            fontFamily: "monospace",
                          }}
                        >
                          {formatDate(deposit.endDate)}
                        </div>
                      </div>

                      {/* Actions */}
                      {settings?.showDelete && (
                        <div
                          style={{
                            width: "40px",
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={() =>
                              navigate(`/banking/deposits/edit/${deposit.id}`)
                            }
                            style={{
                              padding: "4px",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#6b7280",
                              fontSize: "16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "32px",
                              height: "32px",
                            }}
                            title="Edit"
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
                    {sortBy === "account"
                      ? " (Sorted by Account)"
                      : " (Sorted by Date)"}
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

                {/* REMOVED: "Showing active deposits only" message */}
              </div>
            </div>
            {/* Use the extracted BankingNavigation component */}
            <BankingNavigation />
            {/* Bottom spacer like Android */}
            <div style={{ height: "32px" }}></div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog - REMOVED since delete will be in edit screen */}
    </div>
  );
};

export default DepositsListPage;
