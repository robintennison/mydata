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
import "./EnhancedBankingModule.css"; // Import CSS file
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

  // Get window width for responsive labels
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getTabLabel = (tab: BankingTab) => {
    if (isMobile) {
      switch (tab) {
        case "accounts":
          return `Accounts (${accounts.length})`;
        case "deposits":
          return `Deposits (${deposits.length})`;
        case "summary":
          return "Summary";
        case "history":
          return `History (${history.length})`;
        case "settings":
          return "Settings";
        default:
          return tab;
      }
    } else {
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
    }
  };

  if (loading) {
    return (
      <div className="banking-loading">
        <div className="banking-spinner"></div>
        <p>Loading banking data...</p>
      </div>
    );
  }

  return (
    <div className="enhanced-banking-container">
      {/* Header */}
      <div className="banking-header">
        <h2 className="banking-title">🏦 Enhanced Banking Module</h2>
        <p className="banking-subtitle">
          Edit/Delete:{" "}
          {settings.enableEditDelete ? "✅ Enabled" : "❌ Disabled"} •{" "}
          {accounts.length} Accounts • {deposits.length} Deposits
        </p>
      </div>

      {/* Navigation Tabs - Scrollable on mobile */}
      <div className="banking-tabs-container">
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
            className={`banking-tab ${
              activeTab === tab ? "banking-tab-active" : "banking-tab-inactive"
            }`}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="banking-content">
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

      {/* Mobile-specific instructions - using CSS class */}
      <div className="mobile-tip">
        💡 <strong>Tip:</strong> Scroll horizontally on tables to view all
        columns
      </div>
    </div>
  );
};

export default EnhancedBankingModule;
