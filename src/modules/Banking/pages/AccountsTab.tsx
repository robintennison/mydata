import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../contexts/SettingsContext";
import { useBankingData } from "../hooks/useBankingData";
import { firestore } from "../../../lib/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import DeleteConfirmationDialog from "../../../components/DeleteConfirmationDialog";

const AccountsTab: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { accounts, loading } = useBankingData();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ New state for search

  // Helper function to check if account is active
  const isAccountActive = (account: any): boolean => {
    if (account.isActive !== undefined) {
      return account.isActive === true;
    }
    return true;
  };

  // Filter accounts based on showInactive setting
  const filteredAccounts = accounts.filter((account) => {
    if (settings?.showInactive) return true;
    return isAccountActive(account);
  });

  // 🔍 Apply search filter (case-insensitive)
  const searchedAccounts = filteredAccounts.filter((account) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const code = (account.acctCode || "").toLowerCase();
    const mpin = (account.mpin || "").toLowerCase();
    const description = (account.acctDetails || "").toLowerCase();
    return code.includes(term) || mpin.includes(term) || description.includes(term);
  });

  // Sort accounts by acctCode in ascending order
  const sortedAccounts = [...searchedAccounts].sort((a, b) => {
    return a.acctCode.localeCompare(b.acctCode);
  });

  // Truncate account code to 12 characters
  const truncateAccountCode = (code: string): string => {
    if (!code) return "";
    if (code.length <= 12) return code;
    return `${code.substring(0, 12)}...`;
  };

  const handleDeleteClick = (account: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setAccountToDelete(account);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, "accounts", accountToDelete.id));
      setShowDeleteDialog(false);
      setAccountToDelete(null);
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRowClick = (accountId: string) => {
    if (settings?.showDelete) {
      navigate(`/banking/accounts/edit/${accountId}`);
    } else {
      navigate(`/banking/accounts/view/${accountId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-5">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 🔍 Search Bar */}
      <div className="flex items-center px-2 py-2 border-b border-gray-200 bg-white">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by account code, MPIN, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Accounts List */}
      <div className="flex-1 overflow-y-auto">
        {sortedAccounts.length === 0 ? (
          <div className="text-center py-12 px-5 text-gray-500">
            <div className="text-4xl mb-4 opacity-50">🏦</div>
            <div className="text-base font-medium text-gray-600 mb-2">
              {searchTerm.trim()
                ? "No accounts match your search"
                : settings?.showInactive
                ? "No accounts found"
                : "No active accounts found"}
            </div>
            <div className="text-sm text-gray-400">
              {searchTerm.trim()
                ? "Try adjusting your search terms"
                : "Add your first account to get started"}
            </div>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="flex items-center py-1.5 px-2 bg-gray-50 border-b border-gray-300 font-semibold text-xs text-gray-700">
              <div className="w-[38%] px-0.5 text-left">Account</div>
              <div className="w-[28%] px-0.5 text-left">MPIN</div>
              <div className="w-[7%] flex justify-end pr-0.5"></div>
            </div>

            {/* Table Rows */}
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
                    <div className="flex items-center py-1.5 px-2 min-h-9">
                      <div className="w-[38%] min-w-0 text-left px-0.5">
                        <div
                          className={`text-xs font-medium overflow-hidden text-ellipsis whitespace-nowrap ${
                            isActive ? "text-gray-800" : "text-gray-500"
                          } ${!isActive ? "line-through" : ""}`}
                          title={accountCode.length > 12 ? accountCode : undefined}
                        >
                          {truncatedAccountCode}
                          {!isActive && (
                            <span className="text-[9px] text-red-600 ml-0.5 font-normal">
                              (inactive)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-[28%] text-left px-0.5">
                        <div className="font-mono text-xs text-black overflow-hidden text-ellipsis whitespace-nowrap font-medium">
                          {account.mpin || "••••"}
                        </div>
                      </div>

                      <div className="w-[7%] flex justify-end items-center pr-0.5">
                        <button
                          onClick={(e) => handleDeleteClick(account, e)}
                          className="p-0 bg-transparent border-none cursor-pointer text-gray-500 text-[10px] flex items-center justify-center w-5 h-5 hover:text-red-600"
                          title="Delete Account"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setAccountToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Account"
        message={`Deleting account "${accountToDelete?.acctCode}" will also delete all associated deposits and history records. This action cannot be undone.`}
        itemName={accountToDelete?.acctCode}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default AccountsTab;