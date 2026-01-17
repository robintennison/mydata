import React from "react";
import { useNavigate } from "react-router-dom";
import { bankingStyles } from "../styles";
import BankingNavigation from "./BankingNavigation"; //

const DepositsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={bankingStyles.container}>
      {/* Header */}
      <div style={bankingStyles.header}>
        <h1 style={bankingStyles.headerTitle}>🏦 Deposits</h1>
        <div style={bankingStyles.headerSubtitle}>Manage your deposits</div>
      </div>

      {/* Top Navigation */}
      <div style={bankingStyles.topNav}>
        <button
          onClick={() => navigate("/banking")}
          style={bankingStyles.navButton}
          title="Back to Banking"
        >
          ←
        </button>
        <div style={bankingStyles.navTitle}>Deposits</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate("/settings")}
            style={{
              ...bankingStyles.navButton,
              padding: "6px 10px",
              fontSize: "1.2rem",
            }}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: "15px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <button
            onClick={() => navigate("/banking/deposits/add")}
            style={{
              ...bankingStyles.actionButton,
              backgroundColor: "#4285f4",
              fontSize: "1rem",
              padding: "16px",
            }}
          >
            Add Deposit
          </button>

          <button
            onClick={() => navigate("/banking/deposits/list")}
            style={{
              ...bankingStyles.actionButton,
              backgroundColor: "transparent",
              border: "2px solid #4285f4",
              color: "#4285f4",
              fontSize: "1rem",
              padding: "16px",
            }}
          >
            View Deposits
          </button>
        </div>
      </div>
      <BankingNavigation />
    </div>
  );
};

export default DepositsPage;
