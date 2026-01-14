//import React, { useEffect, useState } from "react";
//import { useSettings } from "../../contexts/SettingsContext";
import { useBankingData } from "./hooks/useBankingData";
import { bankingStyles } from "./BankingStyles";
import { useNavigate } from "react-router-dom";

const BankingHomePage: React.FC = () => {
  const navigate = useNavigate();
  //const { settings } = useSettings();
  const { loading, accounts, deposits, history } = useBankingData();

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  //   // Format to lakhs
  //   const formatLakhs = (amount: number): string => {
  //     return (amount / 100000).toFixed(2);
  //   };

  // Calculate totals
  const totalSavings = accounts.reduce(
    (sum, account) => sum + account.savingsAmount,
    0
  );
  const totalDeposits = deposits.reduce(
    (sum, deposit) => sum + deposit.amount,
    0
  );

  // Get last 6 months history
  const last6Months = [...history]
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 6);

  if (loading) {
    return (
      <div style={bankingStyles.container}>
        <div style={bankingStyles.loading}>
          <div style={bankingStyles.spinner}></div>
          <p>Loading banking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={bankingStyles.container}>
      {/* Header */}
      <div style={bankingStyles.header}>
        <h1 style={bankingStyles.headerTitle}>🏦 Banking</h1>
        <div style={bankingStyles.headerSubtitle}>
          Manage your accounts and deposits
        </div>
      </div>

      {/* Top Navigation */}
      <div style={bankingStyles.topNav}>
        <div style={{ flex: 1 }}></div>
        <div style={bankingStyles.navTitle}>Dashboard</div>
        <button
          onClick={() => navigate("/settings")}
          style={bankingStyles.navButton}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          padding: "15px",
        }}
      >
        {/* Total Savings Card */}
        <div style={bankingStyles.statsCard}>
          <div style={bankingStyles.statsLabel}>Total Savings</div>
          <div style={bankingStyles.statsValue}>
            {formatCurrency(totalSavings)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#34a853" }}>
            From {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Total Deposits Card */}
        <div style={bankingStyles.statsCard}>
          <div style={bankingStyles.statsLabel}>Total Deposits</div>
          <div style={bankingStyles.statsValue}>
            {formatCurrency(totalDeposits)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#4285f4" }}>
            {deposits.length} active deposit{deposits.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div style={bankingStyles.card}>
        <div style={bankingStyles.cardTitle}>
          <span>📅</span>
          <span>Recent History (Last 6 Months)</span>
        </div>

        {last6Months.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "20px", color: "#6c757d" }}
          >
            No history data available
          </div>
        ) : (
          <div>
            {last6Months.map((record, index) => {
              const date = new Date(record.month + "-01");
              const monthName = date.toLocaleDateString("en-IN", {
                month: "short",
                year: "2-digit",
              });

              return (
                <div
                  key={record.month}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom:
                      index < last6Months.length - 1
                        ? "1px solid #eee"
                        : "none",
                  }}
                >
                  <div style={{ fontWeight: "500", color: "#333" }}>
                    {monthName}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#4285f4",
                        fontWeight: "600",
                      }}
                    >
                      {formatCurrency(record.totalDeposits)}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>
                      Total:{" "}
                      {formatCurrency(record.savings + record.totalDeposits)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation Icons */}
      <div style={bankingStyles.navGrid}>
        {/* Accounts */}
        <div
          onClick={() => navigate("/banking/accounts")}
          style={{
            ...bankingStyles.navIcon,
            borderColor: "#4285f4",
            backgroundColor: "#e8f0fe",
          }}
        >
          <div style={{ fontSize: "1.8rem" }}>🏦</div>
          <div style={bankingStyles.navIconText}>Accounts</div>
          <div style={{ fontSize: "0.8rem", color: "#666" }}>
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Deposits */}
        <div
          onClick={() => navigate("/banking/deposits")}
          style={{
            ...bankingStyles.navIcon,
            borderColor: "#34a853",
            backgroundColor: "#e8f5e9",
          }}
        >
          <div style={{ fontSize: "1.8rem" }}>💰</div>
          <div style={bankingStyles.navIconText}>Deposits</div>
          <div style={{ fontSize: "0.8rem", color: "#666" }}>
            {deposits.length} deposit{deposits.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* History */}
        <div
          onClick={() => navigate("/banking/history")}
          style={{
            ...bankingStyles.navIcon,
            borderColor: "#fbbc04",
            backgroundColor: "#fff8e1",
          }}
        >
          <div style={{ fontSize: "1.8rem" }}>📈</div>
          <div style={bankingStyles.navIconText}>History</div>
          <div style={{ fontSize: "0.8rem", color: "#666" }}>
            {history.length} record{history.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Summary */}
        <div
          onClick={() => navigate("/banking/summary")}
          style={{
            ...bankingStyles.navIcon,
            borderColor: "#9c27b0",
            backgroundColor: "#f3e5f5",
          }}
        >
          <div style={{ fontSize: "1.8rem" }}>📊</div>
          <div style={bankingStyles.navIconText}>Summary</div>
          <div style={{ fontSize: "0.8rem", color: "#666" }}>View reports</div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default BankingHomePage;
