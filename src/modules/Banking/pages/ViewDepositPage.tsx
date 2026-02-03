// src/modules/banking/ViewDepositPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBankingData } from "../hooks/useBankingData";
import { useSettings } from "../../../contexts/SettingsContext";
import { Deposit } from "../../../types/banking.types";
import { formatDate } from "../../../utils/formatters";

const ViewDepositPage: React.FC = () => {
  const { depositId } = useParams();
  const navigate = useNavigate();
  const { accounts, deposits, loading: dataLoading } = useBankingData();
  const { settings } = useSettings();

  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [accountCode, setAccountCode] = useState("");

  // Format amount in lakhs without "L" suffix
  const formatInLakhs = (amount: number): string => {
    return (amount / 100000).toFixed(2);
  };

  // Load deposit data
  useEffect(() => {
    if (depositId && deposits.length > 0) {
      const foundDeposit = deposits.find((d) => d.id === depositId);
      if (foundDeposit) {
        setDeposit(foundDeposit);

        // Find account code
        const account = accounts.find(
          (acc) => acc.id === foundDeposit.accountId,
        );
        setAccountCode(account?.acctCode || "Unknown");
      }
    }
  }, [depositId, deposits, accounts]);

  const handleBack = () => {
    navigate("/banking", {
      state: { activeTab: "deposits" },
      replace: true,
    });
  };

  const handleEdit = () => {
    navigate(`/banking/deposits/edit/${depositId}`);
  };

  if (dataLoading || !deposit) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500">Loading deposit details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 mb-4">
        <button
          onClick={handleBack}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg text-xl cursor-pointer flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Back"
        >
          ←
        </button>
        <div className="text-xl font-bold text-gray-900">
          Banking / View Deposit
        </div>

        {/* EDIT button in top nav - only show if showDelete setting is true */}
        {settings?.showDelete && (
          <button
            onClick={handleEdit}
            className="px-3 py-2 bg-blue-500 text-white border-none rounded-lg text-sm font-medium cursor-pointer min-w-10 flex items-center justify-center hover:bg-blue-600 transition-colors"
            title="Edit"
          >
            ✏️ Edit
          </button>
        )}
      </div>

      {/* Deposit Details Card */}
      <div className="py-5">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 mb-4">
          {/* Account */}
          <div className="mb-5">
            <div className="text-sm text-gray-600 mb-1 font-medium">
              Account
            </div>
            <div className="text-xl text-gray-900 font-semibold">
              {accountCode}
            </div>
          </div>

          {/* Amount */}
          <div className="mb-5">
            <div className="text-sm text-gray-600 mb-1 font-medium">Amount</div>
            <div className="text-2xl text-blue-600 font-bold flex items-baseline">
              <span>₹{formatInLakhs(deposit.amount)}</span>
              <span className="text-sm text-gray-600 ml-2 font-normal">
                ({deposit.amount.toLocaleString("en-IN")})
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <div className="text-sm text-gray-600 mb-1 font-medium">
                Start Date
              </div>
              <div className="text-base text-gray-900 font-medium">
                {formatDate(deposit.startDate, "en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1 font-medium">
                End Date
              </div>
              <div className="text-base text-gray-900 font-medium">
                {formatDate(deposit.endDate, "en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="mb-5">
            <div className="text-sm text-gray-600 mb-1 font-medium">
              Duration
            </div>
            <div className="text-base text-gray-900 font-medium">
              {Math.round(
                (deposit.endDate - deposit.startDate) / (1000 * 60 * 60 * 24),
              )}{" "}
              days
            </div>
          </div>

          {/* Status */}
          <div className="mb-5">
            <div className="text-sm text-gray-600 mb-1 font-medium">Status</div>
            <div
              className={`px-2 py-1 rounded-lg text-xs font-medium inline-block ${deposit.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
            >
              {deposit.active ? "● Active" : "● Inactive"}
            </div>
          </div>

          {/* Comments (if any) */}
          {deposit.comments && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-2 font-medium">
                Comments
              </div>
              <div className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200">
                {deposit.comments || "No comments"}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - EDIT button only shows if showDelete setting is true */}
        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className={`px-4 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium hover:bg-gray-200 transition-colors ${
              settings?.showDelete ? "flex-1" : "w-full"
            }`}
          >
            ← Back to Deposits
          </button>

          {/* EDIT button - only show if showDelete setting is true */}
          {settings?.showDelete && (
            <button
              onClick={handleEdit}
              className="flex-1 px-4 py-3 bg-blue-500 text-white border-none rounded-lg cursor-pointer text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
            >
              ✏️ Edit Deposit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewDepositPage;
