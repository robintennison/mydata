import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../contexts/SettingsContext";
import { useBankingData } from "./hooks/useBankingData";
import { useBankingOperations } from "./hooks/useBankingOperations";

import { bankingStyles } from "./BankingStyles";

const DepositsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { deposits, accounts, loading } = useBankingData();
  const { handleDeleteDeposit } = useBankingOperations();
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

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

  // Sort deposits
  const sortedDeposits = [...deposits].sort((a, b) => {
    if (sortBy === "date") {
      return b.endDate - a.endDate;
    } else {
      return b.amount - a.amount;
    }
  });

  const totalDeposits = deposits.reduce(
    (sum, deposit) => sum + deposit.amount,
    0
  );

  // Get account name by ID
  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? account.acctCode : "Unknown Account";
  };

  if (loading) {
    return (
      <div style={bankingStyles.container}>
        <div style={bankingStyles.loading}>
          <div style={bankingStyles.spinner}></div>
          <p>Loading deposits...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={bankingStyles.container}>
      {/* Top Navigation */}
      <div style={bankingStyles.topNav}>
        <button
          onClick={() => setSortBy(sortBy === "date" ? "amount" : "date")}
          style={bankingStyles.navButton}
          title={`Sort by ${sortBy === "date" ? "Amount" : "Date"}`}
        >
          {sortBy === "date" ? "📅" : "💰"}
        </button>
        <div style={bankingStyles.navTitle}>Deposits</div>
        <div style={{ display: "flex", gap: "5px" }}>
          <button
            onClick={() => navigate("/settings")}
            style={bankingStyles.navButton}
            title="Settings"
          >
            ⚙️
          </button>
          <button
            onClick={() => navigate("/banking/deposits/add")}
            style={bankingStyles.navButton}
            title="Add Deposit"
          >
            +
          </button>
        </div>
      </div>

      {/* Add Deposit Button */}
      <div style={{ padding: "15px" }}>
        <button
          onClick={() => navigate("/banking/deposits/add")}
          style={bankingStyles.actionButton}
        >
          <span>💰</span>
          <span>Add New Deposit</span>
        </button>
      </div>

      {/* Deposits List */}
      <div style={{ padding: "0 15px" }}>
        {sortedDeposits.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#6c757d",
              backgroundColor: "#f8f9fa",
              borderRadius: "10px",
              margin: "20px 0",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>💰</div>
            <div>No deposits found</div>
            <div style={{ fontSize: "0.9rem", marginTop: "5px" }}>
              Tap "Add New Deposit" to get started
            </div>
          </div>
        ) : (
          sortedDeposits.map((deposit) => (
            <div key={deposit.id} style={bankingStyles.itemCard}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "#333",
                      marginBottom: "5px",
                    }}
                  >
                    {getAccountName(deposit.accountId)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginBottom: "8px",
                    }}
                  >
                    Amount: {formatCurrency(deposit.amount)}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "0.9rem",
                    color: deposit.active ? "#34a853" : "#ea4335",
                    fontWeight: "600",
                    backgroundColor: deposit.active ? "#e8f5e9" : "#ffebee",
                    padding: "4px 8px",
                    borderRadius: "12px",
                  }}
                >
                  {deposit.active ? "Active" : "Inactive"}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                  End: {formatDate(deposit.endDate)}
                </div>

                {deposit.comments && (
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#666",
                      fontStyle: "italic",
                    }}
                  >
                    {deposit.comments.substring(0, 20)}
                    {deposit.comments.length > 20 ? "..." : ""}
                  </div>
                )}
              </div>

              {settings.enableEditDelete && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                    borderTop: "1px solid #eee",
                    paddingTop: "10px",
                  }}
                >
                  <button
                    onClick={() =>
                      navigate(`/banking/deposits/edit/${deposit.id}`)
                    }
                    style={bankingStyles.editButton}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this deposit?")) {
                        handleDeleteDeposit(deposit.id);
                      }
                    }}
                    style={bankingStyles.deleteButton}
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Total Deposits */}
      <div style={bankingStyles.totalSection}>
        <div style={bankingStyles.totalLabel}>Total Deposits:</div>
        <div style={bankingStyles.totalValue}>
          {formatCurrency(totalDeposits)}
        </div>
      </div>

      {/* Bottom spacing */}
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default DepositsPage;
