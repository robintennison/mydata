import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../contexts/SettingsContext";
import { useBankingData } from "./hooks/useBankingData";
import { useBankingOperations } from "./hooks/useBankingOperations";

import { bankingStyles } from "./BankingStyles";

const DepositSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { accounts, deposits, adjustments, loading } = useBankingData();
  const { handleSummaryAdjustment } = useBankingOperations();

  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentNote, setAdjustmentNote] = useState("");

  // Format to lakhs
  const formatLakhs = (amount: number): string => {
    return (amount / 100000).toFixed(2);
  };

  // Calculate summary for each account
  const accountSummaries = accounts.map((account) => {
    const accountDeposits = deposits.filter((d) => d.accountId === account.id);
    const accountAdjustments = adjustments.filter(
      (a) => a.accountId === account.id
    );

    const totalDeposits = accountDeposits.reduce((sum, d) => sum + d.amount, 0);
    const totalAdjustments = accountAdjustments.reduce(
      (sum, a) => sum + a.adjustmentAmount,
      0
    );

    return {
      accountId: account.id,
      acctCode: account.acctCode,
      savings: account.savingsAmount,
      deposits: totalDeposits,
      adjustments: totalAdjustments,
      netBalance: account.savingsAmount + totalDeposits + totalAdjustments,
    };
  });

  // Calculate totals
  const totalSavings = accountSummaries.reduce((sum, s) => sum + s.savings, 0);
  const totalDeposits = accountSummaries.reduce(
    (sum, s) => sum + s.deposits,
    0
  );
  const totalAdjustments = accountSummaries.reduce(
    (sum, s) => sum + s.adjustments,
    0
  );
  const totalNetBalance = accountSummaries.reduce(
    (sum, s) => sum + s.netBalance,
    0
  );

  const handleAdjustmentSubmit = (accountId: string) => {
    const amount = parseFloat(adjustmentAmount);
    if (!isNaN(amount) && amount !== 0) {
      handleSummaryAdjustment(accountId, amount, adjustmentNote);
      setAdjustmentAmount("");
      setAdjustmentNote("");
      setEditingAccount(null);
    }
  };

  if (loading) {
    return (
      <div style={bankingStyles.container}>
        <div style={bankingStyles.loading}>
          <div style={bankingStyles.spinner}></div>
          <p>Loading summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={bankingStyles.container}>
      {/* Top Navigation */}
      <div style={bankingStyles.topNav}>
        <button
          onClick={() => navigate("/banking")}
          style={bankingStyles.navButton}
          title="Back to Home"
        >
          ←
        </button>
        <div style={bankingStyles.navTitle}>Summary</div>
        <button
          onClick={() => navigate("/settings")}
          style={bankingStyles.navButton}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Adjustment Form */}
      {editingAccount && (
        <div
          style={{
            ...bankingStyles.card,
            margin: "15px",
            backgroundColor: "#f8f9fa",
          }}
        >
          <div
            style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#333",
              marginBottom: "15px",
            }}
          >
            Adjust Balance
          </div>

          <div style={{ marginBottom: "15px" }}>
            <div
              style={{ fontSize: "0.9rem", color: "#666", marginBottom: "5px" }}
            >
              Adjustment Amount (₹)
            </div>
            <input
              type="number"
              value={adjustmentAmount}
              onChange={(e) => setAdjustmentAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
              placeholder="Positive or negative amount"
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div
              style={{ fontSize: "0.9rem", color: "#666", marginBottom: "5px" }}
            >
              Note
            </div>
            <input
              type="text"
              value={adjustmentNote}
              onChange={(e) => setAdjustmentNote(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
              placeholder="Reason for adjustment"
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => handleAdjustmentSubmit(editingAccount)}
              style={{
                ...bankingStyles.actionButton,
                backgroundColor: "#34a853",
              }}
              disabled={!adjustmentAmount}
            >
              Apply Adjustment
            </button>
            <button
              onClick={() => {
                setAdjustmentAmount("");
                setAdjustmentNote("");
                setEditingAccount(null);
              }}
              style={{
                ...bankingStyles.actionButton,
                backgroundColor: "#6c757d",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Account Summaries */}
      <div style={{ padding: "0 15px" }}>
        {accountSummaries.length === 0 ? (
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
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📊</div>
            <div>No accounts found</div>
          </div>
        ) : (
          accountSummaries.map((summary) => (
            <div key={summary.accountId} style={bankingStyles.itemCard}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  {summary.acctCode}
                </div>

                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: "700",
                    color: summary.netBalance >= 0 ? "#34a853" : "#ea4335",
                  }}
                >
                  {formatLakhs(summary.netBalance)}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                  marginBottom: "15px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#6c757d",
                      marginBottom: "2px",
                    }}
                  >
                    Savings
                  </div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    {formatLakhs(summary.savings)}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#6c757d",
                      marginBottom: "2px",
                    }}
                  >
                    Deposits
                  </div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      color: "#4285f4",
                    }}
                  >
                    {formatLakhs(summary.deposits)}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#6c757d",
                      marginBottom: "2px",
                    }}
                  >
                    Adjustments
                  </div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      color: summary.adjustments >= 0 ? "#34a853" : "#ea4335",
                    }}
                  >
                    {formatLakhs(summary.adjustments)}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#6c757d",
                      marginBottom: "2px",
                    }}
                  >
                    Net Balance
                  </div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "700",
                      color: summary.netBalance >= 0 ? "#34a853" : "#ea4335",
                    }}
                  >
                    {formatLakhs(summary.netBalance)}
                  </div>
                </div>
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
                    onClick={() => setEditingAccount(summary.accountId)}
                    style={bankingStyles.editButton}
                  >
                    📝 Adjust
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Totals Section */}
      <div
        style={{
          ...bankingStyles.totalSection,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={bankingStyles.totalLabel}>Total Savings:</div>
          <div style={bankingStyles.totalValue}>
            {formatLakhs(totalSavings)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={bankingStyles.totalLabel}>Total Deposits:</div>
          <div style={bankingStyles.totalValue}>
            {formatLakhs(totalDeposits)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={bankingStyles.totalLabel}>Total Adjustments:</div>
          <div
            style={{
              ...bankingStyles.totalValue,
              color: totalAdjustments >= 0 ? "#34a853" : "#ea4335",
            }}
          >
            {formatLakhs(totalAdjustments)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            paddingTop: "10px",
            borderTop: "2px solid #4285f4",
            marginTop: "5px",
          }}
        >
          <div style={{ ...bankingStyles.totalLabel, fontSize: "1.1rem" }}>
            Net Total:
          </div>
          <div
            style={{
              ...bankingStyles.totalValue,
              fontSize: "1.5rem",
              color: totalNetBalance >= 0 ? "#34a853" : "#ea4335",
            }}
          >
            {formatLakhs(totalNetBalance)}
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default DepositSummaryPage;
