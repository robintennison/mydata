// AccountSelector.tsx
import React, { useState, useEffect, useRef } from "react";

interface Account {
  id: string;
  acctCode: string;
  acctDetails?: string;
  savingsAmount?: number;
  [key: string]: any;
}

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccountId: string;
  selectedAccountCode: string;
  onAccountSelect: (accountId: string, accountCode: string) => void;
  error?: boolean;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts,
  selectedAccountId,
  selectedAccountCode,
  onAccountSelect,
  error = false,
  disabled = false,
  loading = false,
  placeholder = "Select account",
  className = "",
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputClick = () => {
    if (disabled || loading) return;
    
    if (accounts.length > 0) {
      setShowDropdown(!showDropdown);
    } else if (!loading) {
      alert("No accounts available. Please add an account first.");
    }
  };

  const handleAccountSelect = (account: Account) => {
    onAccountSelect(account.id, account.acctCode);
    setShowDropdown(false);
  };

  const getDisplayValue = () => {
    if (loading) return "Loading accounts...";
    if (selectedAccountCode) return selectedAccountCode;
    if (accounts.length === 0 && !loading) return "No accounts available";
    return "";
  };

  const isDisabled = disabled || (accounts.length === 0 && !loading);

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Account *
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={getDisplayValue()}
          readOnly
          onClick={handleInputClick}
          placeholder={loading ? "Loading accounts..." : placeholder}
          className={`w-full p-3 border rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed pr-10 ${
            accounts.length > 0 && !loading
              ? "cursor-pointer"
              : "cursor-not-allowed opacity-70"
          } ${error ? "border-red-300" : "border-gray-300"}`}
          disabled={isDisabled}
        />
        {accounts.length > 0 && !loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            ▼
          </div>
        )}
      </div>

      {/* Account Dropdown */}
      {showDropdown && accounts.length > 0 && (
        <div
          ref={dropdownRef}
          className="fixed left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-[calc(100%-30px)] max-w-2xl max-h-[60vh] overflow-hidden mt-1"
          style={{
            top: inputRef.current
              ? `${
                  inputRef.current.getBoundingClientRect().bottom +
                  window.scrollY +
                  4
                }px`
              : "200px",
          }}
        >
          <div className="p-3 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-700 sticky top-0 z-10 flex justify-between items-center">
            <span>Select Account ({accounts.length} available)</span>
            <button
              onClick={() => setShowDropdown(false)}
              className="text-gray-500 text-lg hover:text-gray-700 p-1"
              title="Close"
            >
              ×
            </button>
          </div>

          <div className="max-h-[calc(60vh-60px)] overflow-y-auto py-1">
            {accounts
              .sort((a, b) => a.acctCode.localeCompare(b.acctCode))
              .map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleAccountSelect(account)}
                  className={`w-full px-4 py-3 text-left text-sm border-b border-gray-100 flex justify-between items-start transition-colors ${
                    selectedAccountId === account.id
                      ? "bg-blue-50"
                      : "bg-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {account.acctCode}
                    </div>
                    {account.acctDetails && (
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {account.acctDetails.split("\n")[0]}
                      </div>
                    )}
                  </div>
                  {account.savingsAmount !== undefined && (
                    <div
                      className={`text-xs font-semibold whitespace-nowrap ml-3 text-right min-w-20 ${
                        account.savingsAmount >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ₹{account.savingsAmount.toLocaleString("en-IN")}
                    </div>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSelector;