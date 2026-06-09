// src/modules/banking/DepositsTab.tsx (Tailwind Version)
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { useBankingData } from "../hooks/useBankingData";
import { Deposit, BankAccount } from "../../../types/banking.types";
import { formatLakhs } from "../../../utils/formatters";

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
  const [sortBy, setSortBy] = useState<SortOption>("date"); // CHANGED: default to "date"
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
        // Sort by date (endDate) - CHANGED: sort by endDate ascending (earliest first)
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

  // Handle row click - FIXED: Always go to edit for now
  const handleRowClick = (depositId: string) => {
    navigate(`/banking/deposits/view/${depositId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-5">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading deposits...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter and Sort Row - COMPACT */}
      <div className="flex justify-between items-center gap-2 px-3 py-1.5 bg-white border-b border-gray-200">
        {/* Filter Button */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs cursor-pointer min-w-20 hover:bg-gray-100"
            title="Filter by Account"
          >
            <span>🔍</span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs">
              {filterAccount === "All" ? "All" : filterAccount}
            </span>
          </button>
          {/* Filter Dropdown */}
          {showFilterDropdown && (
            <>
              <div
                className="fixed inset-0 z-50"
                onClick={() => setShowFilterDropdown(false)}
              />
              <div
                ref={filterDropdownRef}
                className="absolute top-full left-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 w-40 max-h-64 overflow-y-auto mt-0.5"
              >
                <div className="px-3 py-2 text-xs text-gray-600 border-b border-gray-200">
                  Filter by Account
                </div>
                <div>
                  <button
                    onClick={() => {
                      setFilterAccount("All");
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm cursor-pointer border-b border-gray-100 ${
                      filterAccount === "All"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-transparent text-gray-800 hover:bg-gray-50"
                    }`}
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
                        className={`w-full px-3 py-2 text-left text-sm cursor-pointer border-b border-gray-100 ${
                          filterAccount === account.acctCode
                            ? "bg-blue-50 text-blue-600"
                            : "bg-transparent text-gray-800 hover:bg-gray-50"
                        }`}
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
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs cursor-pointer hover:bg-gray-100"
            title={`Sort by ${sortBy === "account" ? "Account Code" : "End Date"}`}
          >
            <span>{sortBy === "account" ? "🔢" : "📅"}</span>
          </button>
          {/* Sort Dropdown */}
          {showSortDropdown && (
            <>
              <div
                className="fixed inset-0 z-50"
                onClick={() => setShowSortDropdown(false)}
              />
              <div
                ref={sortDropdownRef}
                className="absolute top-full right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-40 max-h-80 overflow-hidden mt-0.5"
              >
                <div className="px-3 py-2 text-xs text-gray-600 border-b border-gray-200">
                  Sort By
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSortBy("account");
                      setShowSortDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm cursor-pointer border-b border-gray-100 ${
                      sortBy === "account"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-transparent text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>🔢</span>
                      <span>Account Code</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("date");
                      setShowSortDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm cursor-pointer ${
                      sortBy === "date"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-transparent text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
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
      <div className="flex-1 overflow-y-auto">
        {filteredDeposits.length === 0 ? (
          <div className="text-center py-12 px-5 text-gray-500">
            <div className="text-4xl mb-4 opacity-50">💰</div>
            <div className="text-base font-medium text-gray-600 mb-2">
              {filterAccount !== "All"
                ? `No deposits for ${filterAccount}`
                : settings?.showInactive
                  ? "No deposits available"
                  : "No active deposits available"}
            </div>
            <div className="text-sm text-gray-400">
              {filterAccount === "All" && "Add your first deposit"}
            </div>
          </div>
        ) : (
          <div>
            {/* Table Header - FLEXIBLE WITH MIN-WIDTHS */}
            <div className="flex items-center py-1.5 px-2 bg-gray-50 border-b border-gray-300 font-semibold text-xs text-gray-700">
              <div className="flex-grow px-1 min-w-[100px]">Account</div>
              <div className="px-1 min-w-[80px] flex-shrink-0">Date</div>
              <div className="px-1 min-w-[70px] text-right flex-shrink-0">
                Amount
              </div>
              {settings?.showDelete && (
                <div className="w-12 px-1 flex-shrink-0"></div>
              )}
            </div>
            {/* Table Rows - FLEXIBLE WITH MIN-WIDTHS */}
            <div>
              {filteredDeposits.map((deposit) => {
                const accountName = getAccountName(deposit.accountId);
                const isInactive = !deposit.active;
                return (
                  <div
                    key={deposit.id}
                    className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isInactive ? "bg-red-50/30 opacity-70" : "bg-white"
                    }`}
                    onClick={() => handleRowClick(deposit.id)}
                  >
                    <div className="flex items-center py-1.5 px-2 min-h-9">
                      {/* Account - Flexible */}
                      <div className="flex-grow px-1 min-w-0">
                        <div
                          className={`text-xs overflow-hidden text-ellipsis whitespace-nowrap ${
                            isInactive ? "text-gray-500" : "text-gray-800"
                          }`}
                        >
                          {accountName}
                          {deposit.comments && (
                            <span
                              className={`text-[10px] ml-1 ${
                                isInactive ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {deposit.comments.length > 10
                                ? `${deposit.comments.substring(0, 10)}...`
                                : deposit.comments}
                            </span>
                          )}
                          {isInactive && (
                            <span className="text-[9px] bg-red-100 text-red-600 px-1 py-px rounded ml-1">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Date - Fixed minimum width */}
                      <div className="px-1 min-w-[80px] flex-shrink-0">
                        <div
                          className={`text-xs font-mono tracking-tight whitespace-nowrap ${
                            isInactive ? "text-gray-500" : "text-gray-600"
                          }`}
                        >
                          {formatDate(deposit.endDate)}
                        </div>
                      </div>
                      {/* Amount - Fixed minimum width */}
                      <div className="px-1 min-w-[70px] text-right flex-shrink-0">
                        <div
                          className={`text-xs font-semibold ${
                            isInactive ? "text-gray-500" : "text-blue-600"
                          }`}
                        >
                          {formatLakhs(deposit.amount)}
                        </div>
                      </div>
                      {/* Edit button */}
                      {settings?.showDelete && (
                        <div className="w-12 flex justify-center px-1 flex-shrink-0">
                          <button
                            className="p-0.5 bg-transparent border-none cursor-pointer text-gray-500 text-xs flex items-center justify-center w-6 h-6 hover:text-blue-600"
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
            <div className="bg-gray-50 border-t border-gray-300 px-2 py-2">
              <div className="flex justify-between items-center mb-1">
                <div className="text-[10px] text-gray-600">
                  {filteredDeposits.length} deposit
                  {filteredDeposits.length !== 1 ? "s" : ""}
                  {filterAccount !== "All" && ` for ${filterAccount}`}
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                    Total
                  </div>
                  <div className="text-sm font-bold text-blue-600">
                    {formatLakhs(totalAmount)}
                  </div>
                </div>
              </div>
              {/* Sort Info - Compact */}
              <div className="text-[10px] text-gray-400 text-center pt-1 border-t border-dashed border-gray-300 mt-1">
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