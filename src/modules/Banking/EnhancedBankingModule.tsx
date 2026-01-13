import React, { useState } from "react";
import { useSettings } from "../../contexts/SettingsContext";
import {
  AccountsTab,
  DepositsTab,
  SummaryTab,
  HistoryTab,
  SettingsTab,
} from "./components";
import { useBankingData } from "./hooks/useBankingData";
import { useBankingOperations } from "./hooks/useBankingOperations";
import {
  calculateAccountSummaries,
  calculateChartData,
} from "./utils/calculations";
import type {
  BankingTab,
  ChartPoint,
  AccountSummary,
  BankAccount,
  Deposit,
  History,
} from "../../types/banking.types";

const EnhancedBankingModule: React.FC = () => {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<BankingTab>("accounts");
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(
    null
  );
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const [editingHistory, setEditingHistory] = useState<History | null>(null);

  const { loading, accounts, deposits, history, adjustments } =
    useBankingData();
  const {
    handleSaveAccount,
    handleDeleteAccount,
    handleSaveDeposit,
    handleDeleteDeposit,
    handleSaveHistory,
    handleDeleteHistory,
    handleSummaryAdjustment,
  } = useBankingOperations();

  const accountSummaries: AccountSummary[] = calculateAccountSummaries(
    accounts,
    deposits,
    adjustments
  );

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-IN");
  };

  const chartData: ChartPoint[] = calculateChartData(history, formatCurrency);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* CRITICAL CSS THAT OVERRIDES EVERYTHING */}
      <style>{`
        /* NUCLEAR OPTION: Reset everything */
        .banking-container * {
          display: block !important;
          float: none !important;
          position: static !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
        }
        
        /* Force single column */
        .banking-container {
          display: block !important;
          width: 100vw !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
          position: relative !important;
        }
        
        /* Tables can scroll */
        .table-responsive-container {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          width: 100%;
        }
      `}</style>

      <div className="banking-container">
        {/* SIMPLE HEADER */}
        <div
          style={{
            background: "#4285f4",
            color: "white",
            padding: "20px 15px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "24px", marginBottom: "10px" }}>🏦</div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            Banking Module
          </div>
          <div style={{ fontSize: "14px", opacity: 0.9 }}>
            {accounts.length} Accounts • {deposits.length} Deposits
          </div>
        </div>

        {/* SIMPLE TAB SELECTION - NO FLEX, NO GRID */}
        <div>
          <div
            style={{
              padding: "15px",
              background: "#f8f9fa",
              borderBottom: "1px solid #ddd",
            }}
          >
            Select Option:
          </div>

          {/* Accounts */}
          <div
            onClick={() => setActiveTab("accounts")}
            style={{
              padding: "15px",
              borderBottom: "1px solid #eee",
              background: activeTab === "accounts" ? "#e8f0fe" : "white",
              color: activeTab === "accounts" ? "#4285f4" : "#333",
              fontWeight: activeTab === "accounts" ? "bold" : "normal",
            }}
          >
            🏦 Accounts ({accounts.length})
          </div>

          {/* Deposits */}
          <div
            onClick={() => setActiveTab("deposits")}
            style={{
              padding: "15px",
              borderBottom: "1px solid #eee",
              background: activeTab === "deposits" ? "#e8f0fe" : "white",
              color: activeTab === "deposits" ? "#4285f4" : "#333",
              fontWeight: activeTab === "deposits" ? "bold" : "normal",
            }}
          >
            💰 Deposits ({deposits.length})
          </div>

          {/* Summary */}
          <div
            onClick={() => setActiveTab("summary")}
            style={{
              padding: "15px",
              borderBottom: "1px solid #eee",
              background: activeTab === "summary" ? "#e8f0fe" : "white",
              color: activeTab === "summary" ? "#4285f4" : "#333",
              fontWeight: activeTab === "summary" ? "bold" : "normal",
            }}
          >
            📊 Summary
          </div>

          {/* History */}
          <div
            onClick={() => setActiveTab("history")}
            style={{
              padding: "15px",
              borderBottom: "1px solid #eee",
              background: activeTab === "history" ? "#e8f0fe" : "white",
              color: activeTab === "history" ? "#4285f4" : "#333",
              fontWeight: activeTab === "history" ? "bold" : "normal",
            }}
          >
            📈 History ({history.length})
          </div>

          {/* Settings */}
          <div
            onClick={() => setActiveTab("settings")}
            style={{
              padding: "15px",
              borderBottom: "1px solid #eee",
              background: activeTab === "settings" ? "#e8f0fe" : "white",
              color: activeTab === "settings" ? "#4285f4" : "#333",
              fontWeight: activeTab === "settings" ? "bold" : "normal",
            }}
          >
            ⚙️ Settings
          </div>
        </div>

        {/* CONTENT AREA - ALWAYS BELOW MENU */}
        <div style={{ padding: "20px 15px" }}>
          {activeTab === "accounts" && (
            <AccountsTab
              accounts={accounts}
              editingAccount={editingAccount}
              setEditingAccount={setEditingAccount}
              onSaveAccount={handleSaveAccount}
              onDeleteAccount={handleDeleteAccount}
              enableEditDelete={settings.enableEditDelete}
              formatCurrency={formatCurrency}
            />
          )}

          {activeTab === "deposits" && (
            <DepositsTab
              deposits={deposits}
              accounts={accounts}
              editingDeposit={editingDeposit}
              setEditingDeposit={setEditingDeposit}
              onSaveDeposit={handleSaveDeposit}
              onDeleteDeposit={handleDeleteDeposit}
              enableEditDelete={settings.enableEditDelete}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}

          {activeTab === "summary" && (
            <SummaryTab
              summaries={accountSummaries}
              accounts={accounts}
              deposits={deposits}
              adjustments={adjustments}
              onAdjustment={handleSummaryAdjustment}
              enableEditDelete={settings.enableEditDelete}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}

          {activeTab === "history" && (
            <HistoryTab
              history={history}
              chartData={chartData}
              editingHistory={editingHistory}
              setEditingHistory={setEditingHistory}
              onSaveHistory={handleSaveHistory}
              onDeleteHistory={handleDeleteHistory}
              enableEditDelete={settings.enableEditDelete}
              formatCurrency={formatCurrency}
            />
          )}

          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>
    </>
  );
};

export default EnhancedBankingModule;
