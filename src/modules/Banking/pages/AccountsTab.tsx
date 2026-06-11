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

  // Truncate account code to 12 characters
  const truncateAccountCode = (code: string): string => {
    if (!code) return "";
    if (code.length <= 12) return code;
    return `${code.substring(0, 12)}...`;
  };

  const handleDeleteClick = (account: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click from triggering
    setAccountToDelete(account);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    
    setIsDeleting(true);
    try {
      // Directly delete from Firebase
      await deleteDoc(doc(firestore, "accounts", accountToDelete.id));
      console.log("DEBUG: Deleted account:", accountToDelete.id);
      
      // Close dialog and clear state
      setShowDeleteDialog(false);
      setAccountToDelete(null);
      
      // The accounts list will automatically update when Firebase realtime listener picks up the change
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setIsDeleting(false);
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
            {/* Table Header - COMPACT */}
            <div className="flex items-center py-1.5 px-2 bg-gray-50 border-b border-gray-300 font-semibold text-xs text-gray-700">
              {/* Account Column */}
              <div className="w-[38%] px-0.5 text-left">Account</div>
              {/* MPIN Column - More space */}
              <div className="w-[28%] px-0.5 text-left">MPIN</div>
              {/* Delete Button Column - Minimal space */}
              <div className="w-[7%] flex justify-end pr-0.5"></div>
            </div>

            {/* Accounts Rows - COMPACT */}
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
                      {/* Account Column */}
                      <div className="w-[38%] min-w-0 text-left px-0.5">
                        <div
                          className={`text-xs font-medium overflow-hidden text-ellipsis whitespace-nowrap ${
                            isActive ? "text-gray-800" : "text-gray-500"
                          } ${!isActive ? "line-through" : ""}`}
                          title={
                            accountCode.length > 12 ? accountCode : undefined
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

                      {/* MPIN Column - More space now */}
                      <div className="w-[28%] text-left px-0.5">
                        <div className="font-mono text-xs text-black overflow-hidden text-ellipsis whitespace-nowrap font-medium">
                          {account.mpin || "••••"}
                        </div>
                      </div>

                      {/* Delete Button Column - Minimal space */}
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

      {/* Delete Confirmation Dialog - Using reusable component */}
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