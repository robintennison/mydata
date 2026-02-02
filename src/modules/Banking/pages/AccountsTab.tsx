import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { useBankingData } from "../hooks/useBankingData";
import { useBankingOperations } from "../hooks/useBankingOperations";
import { tw, cls } from "../../../utils/tailwindMapping";

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
      navigate(`/banking/accounts/edit/${accountId}`);
    } else {
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
      <div className="flex flex-col items-center justify-center py-16 px-5">
        <div className={tw.bankingSpinner}></div>
        <p className="mt-4 text-gray-600">Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Accounts List */}
      <div className="flex-1 overflow-y-auto">
        {sortedAccounts.length === 0 ? (
          <div className="text-center py-12 px-5 text-gray-500">
            <div className="text-4xl mb-4 opacity-50">🏦</div>
            <div className="text-base font-medium text-gray-600 mb-2">
              {settings?.showInactive
                ? "No accounts found"
                : "No active accounts found"}
            </div>
            <div className="text-sm text-gray-400">
              Add your first account to get started
            </div>
          </div>
        ) : (
          <div>
            {/* Table Header - IMPROVED SPACING */}
            <div className="flex items-center py-2.5 px-4 bg-gray-50 border-b border-gray-300 font-semibold text-xs text-gray-700">
              {/* Account Column - Takes most space */}
              <div className="w-[45%] px-1 text-left">Account</div>
              {/* Savings Column - With some spacing */}
              <div className="w-[25%] px-2 text-left">Savings</div>
              {/* MPIN Column - With more spacing from Savings */}
              <div className="w-[20%] px-2 text-left">MPIN</div>
              {/* Edit Button Column - Pushed to end */}
              {settings?.showDelete && (
                <div className="w-[10%] px-1 flex justify-end"></div>
              )}
            </div>

            {/* Accounts Rows */}
            <div>
              {sortedAccounts.map((account) => {
                const isActive = isAccountActive(account);
                const accountCode = account.acctCode || "";
                const truncatedAccountCode = truncateAccountCode(accountCode);

                return (
                  <div
                    key={account.id}
                    className="bg-white border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleRowClick(account.id)}
                  >
                    <div className="flex items-center py-2.5 px-4 min-h-11">
                      {/* Account Column */}
                      <div className="w-[45%] min-w-0 text-left px-1">
                        <div
                          className={cls(
                            "text-xs font-medium overflow-hidden text-ellipsis whitespace-nowrap",
                            isActive ? "text-gray-800" : "text-gray-500",
                            !isActive && "line-through",
                          )}
                          title={
                            accountCode.length > 15 ? accountCode : undefined
                          }
                        >
                          {truncatedAccountCode}
                          {!isActive && (
                            <span className="text-[9px] text-red-600 ml-0.5 font-normal">
                              (inactive)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Savings Column - With right padding for spacing */}
                      <div className="w-[25%] text-left px-2">
                        <div
                          className={cls(
                            "text-xs font-semibold whitespace-nowrap",
                            isActive ? "text-blue-600" : "text-gray-500",
                          )}
                        >
                          {formatCurrency(account.savingsAmount)}
                        </div>
                      </div>

                      {/* MPIN Column - With left padding for spacing from Savings */}
                      <div className="w-[20%] text-left px-2">
                        <div className="font-mono text-xs text-black overflow-hidden text-ellipsis whitespace-nowrap font-medium">
                          {account.mpin || "••••"}
                        </div>
                      </div>

                      {/* Edit Button Column - Pushed to end */}
                      {settings?.showDelete && (
                        <div className="w-[10%] flex justify-end items-center px-1">
                          <button
                            onClick={(e) => handleEditClick(account.id, e)}
                            className="p-0.5 bg-transparent border-none cursor-pointer text-gray-500 text-xs flex items-center justify-center w-6 h-6 hover:text-blue-600"
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
            <div className="bg-gray-50 border-t border-gray-300 px-4 py-2.5 flex justify-between items-center">
              <div className="flex flex-col justify-center">
                <div className="text-2xs text-gray-600">
                  {settings?.showInactive
                    ? `${sortedAccounts.length} of ${accounts.length} accounts`
                    : `${sortedAccounts.length} active accounts`}
                </div>
                <div className="text-3xs text-gray-400 mt-0.5">
                  ({activeAccountsCount} active, {inactiveAccountsCount}{" "}
                  inactive)
                </div>
              </div>
              <div className="text-right flex flex-col justify-center items-end">
                <div className="text-2xs text-gray-500 font-semibold uppercase tracking-wider">
                  Total Savings
                </div>
                <div className="text-sm font-bold text-blue-600">
                  {formatCurrency(totalSavings)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && accountToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Delete Account?
            </h3>
            <p className="text-gray-600 mb-5 leading-relaxed">
              Are you sure you want to delete account{" "}
              <span className="font-semibold">{accountToDelete.acctCode}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setAccountToDelete(null);
                }}
                className="flex-1 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium cursor-pointer hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-500 border-none rounded-lg text-white font-medium cursor-pointer hover:bg-red-600 transition-colors"
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
