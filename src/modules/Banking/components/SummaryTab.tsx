import React, { useState } from "react";
import type { SummaryTabProps } from "../../../types/banking.types";
import { cardStyles } from "../../../styles/components/cards";
import { formStyles } from "../../../styles/components/forms";

const SummaryTab: React.FC<SummaryTabProps> = ({
  summaries,
  accounts,
  deposits,
  adjustments,
  onAdjustment,
  enableEditDelete,
  formatCurrency, // Add this
  formatDate, // Add this
}) => {
  const [showAdjustmentForm, setShowAdjustmentForm] = useState<string | null>(
    null
  );
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>("");
  const [adjustmentNote, setAdjustmentNote] = useState<string>("");

  const handleAdjustmentSubmit = (accountId: string) => {
    if (!adjustmentAmount) return;

    const amount = parseFloat(adjustmentAmount);
    if (!isNaN(amount) && amount !== 0) {
      onAdjustment(accountId, amount, adjustmentNote);
      setAdjustmentAmount("");
      setAdjustmentNote("");
      setShowAdjustmentForm(null);
    }
  };

  const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div>
      <div style={cardStyles.sectionHeader}>
        <h3>Account Summary</h3>
        <p style={{ color: "#6c757d", marginTop: "8px" }}>
          Total Accounts: {accounts.length} • Total Deposits:{" "}
          {formatCurrency(totalDeposits)}
        </p>
      </div>

      {/* Summary Cards */}
      <div style={cardStyles.grid}>
        {summaries.map((summary) => (
          <div key={summary.accountId} style={cardStyles.card}>
            <div style={cardStyles.cardHeader}>
              <h4 style={{ margin: 0, color: "#212529" }}>
                {summary.acctCode}
              </h4>
              {enableEditDelete && (
                <button
                  onClick={() =>
                    setShowAdjustmentForm(
                      showAdjustmentForm === summary.accountId
                        ? null
                        : summary.accountId
                    )
                  }
                  style={formStyles.smallButton}
                >
                  {showAdjustmentForm === summary.accountId
                    ? "Cancel"
                    : "Adjust"}
                </button>
              )}
            </div>

            {/* Adjustment Form */}
            {showAdjustmentForm === summary.accountId && (
              <div style={cardStyles.adjustmentForm}>
                <div style={formStyles.formGroup}>
                  <label>Adjustment Amount (₹)</label>
                  <input
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    style={formStyles.input}
                    placeholder="Positive or negative amount"
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label>Note</label>
                  <input
                    type="text"
                    value={adjustmentNote}
                    onChange={(e) => setAdjustmentNote(e.target.value)}
                    style={formStyles.input}
                    placeholder="Reason for adjustment"
                  />
                </div>
                <button
                  onClick={() => handleAdjustmentSubmit(summary.accountId)}
                  style={formStyles.saveButton}
                  disabled={!adjustmentAmount}
                >
                  Apply Adjustment
                </button>
              </div>
            )}

            <div style={cardStyles.stats}>
              <div style={cardStyles.statItem}>
                <span style={cardStyles.statLabel}>Savings:</span>
                <span style={cardStyles.statValue}>
                  {formatCurrency(summary.savings)}
                </span>
              </div>
              <div style={cardStyles.statItem}>
                <span style={cardStyles.statLabel}>Deposits:</span>
                <span style={cardStyles.statValue}>
                  {formatCurrency(summary.deposits)}
                </span>
              </div>
              <div style={cardStyles.statItem}>
                <span style={cardStyles.statLabel}>Adjustments:</span>
                <span
                  style={{
                    ...cardStyles.statValue,
                    color: summary.adjustments >= 0 ? "#28a745" : "#dc3545",
                  }}
                >
                  {formatCurrency(summary.adjustments)}
                </span>
              </div>
              <div style={cardStyles.statItem}>
                <span style={{ ...cardStyles.statLabel, fontWeight: "bold" }}>
                  Net Balance:
                </span>
                <span
                  style={{
                    ...cardStyles.statValue,
                    fontWeight: "bold",
                    color: summary.netBalance >= 0 ? "#212529" : "#dc3545",
                    fontSize: "1.1rem",
                  }}
                >
                  {formatCurrency(summary.netBalance)}
                </span>
              </div>
            </div>

            {/* Recent Adjustments */}
            {adjustments.filter((a) => a.accountId === summary.accountId)
              .length > 0 && (
              <div style={cardStyles.adjustmentsList}>
                <h5 style={{ margin: "15px 0 10px 0", fontSize: "0.9rem" }}>
                  Recent Adjustments:
                </h5>
                {adjustments
                  .filter((a) => a.accountId === summary.accountId)
                  .slice(0, 3)
                  .map((adj) => (
                    <div key={adj.id} style={cardStyles.adjustmentItem}>
                      <span
                        style={{
                          color:
                            adj.adjustmentAmount >= 0 ? "#28a745" : "#dc3545",
                          fontWeight: "bold",
                        }}
                      >
                        {formatCurrency(adj.adjustmentAmount)}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                        {formatDate(adj.timestamp)} - {adj.note}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryTab;
