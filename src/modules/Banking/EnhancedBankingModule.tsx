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
import { styles } from "./styles";
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

  // Create formatter functions with exact signatures
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

  const getTabLabel = (tab: BankingTab) => {
    switch (tab) {
      case "accounts":
        return `📋 Accounts (${accounts.length})`;
      case "deposits":
        return `💰 Deposits (${deposits.length})`;
      case "summary":
        return "📊 Account Summary";
      case "history":
        return `📈 History & Chart (${history.length})`;
      case "settings":
        return "⚙️ Settings";
      default:
        return tab;
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading banking data...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>🏦 Enhanced Banking Module</h2>
        <p style={styles.subtitle}>
          Edit/Delete:{" "}
          {settings.enableEditDelete ? "✅ Enabled" : "❌ Disabled"} •{" "}
          {accounts.length} Accounts • {deposits.length} Deposits
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={styles.tabs}>
        {(
          [
            "accounts",
            "deposits",
            "summary",
            "history",
            "settings",
          ] as BankingTab[]
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "8px 8px 0 0",
              cursor: "pointer",
              fontSize: "0.95rem",
              transition: "all 0.2s",
              backgroundColor: activeTab === tab ? "#4285f4" : "#f8f9fa",
              color: activeTab === tab ? "white" : "#333",
            }}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={styles.content}>
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
  );
};

export default EnhancedBankingModule;
