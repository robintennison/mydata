// src/modules/banking/ViewDepositPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBankingData } from "../hooks/useBankingData";
import { Deposit } from "../../../types/banking.types";
import { formatDate } from "../../../utils/formatters";
import { bankingStyles } from "../styles";

const ViewDepositPage: React.FC = () => {
  const { depositId } = useParams();
  const navigate = useNavigate();
  const { accounts, deposits, loading: dataLoading } = useBankingData();

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
      <div style={bankingStyles.container}>
        <div style={bankingStyles.loading}>
          <div style={bankingStyles.spinner}></div>
          <p>Loading deposit details...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={bankingStyles.container}>
      {/* Top Navigation */}
      <div style={bankingStyles.topNav}>
        <button
          onClick={handleBack}
          style={bankingStyles.navButton}
          title="Back"
        >
          ←
        </button>
        <div style={bankingStyles.navTitle}>Banking / View Deposit</div>
        {/* Edit button in top nav for view mode */}
        <button
          onClick={handleEdit}
          style={{
            ...bankingStyles.navButton,
            backgroundColor: "#3b82f6",
            color: "#fff",
            border: "none",
          }}
          title="Edit"
        >
          ✏️ Edit
        </button>
      </div>

      {/* Deposit Details Card */}
      <div style={{ padding: "20px 0" }}>
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            marginBottom: "20px",
          }}
        >
          {/* Account */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "0.9rem",
                color: "#6b7280",
                marginBottom: "4px",
                fontWeight: 500,
              }}
            >
              Account
            </div>
            <div
              style={{
                fontSize: "1.25rem",
                color: "#111827",
                fontWeight: 600,
              }}
            >
              {accountCode}
            </div>
          </div>

          {/* Amount */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "0.9rem",
                color: "#6b7280",
                marginBottom: "4px",
                fontWeight: 500,
              }}
            >
              Amount
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                color: "#1976d2",
                fontWeight: 700,
                display: "flex",
                alignItems: "baseline",
              }}
            >
              <span>₹{formatInLakhs(deposit.amount)}</span>
              <span
                style={{
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  marginLeft: "8px",
                  fontWeight: 400,
                }}
              >
                ({deposit.amount.toLocaleString("en-IN")})
              </span>
            </div>
          </div>

          {/* Dates */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  marginBottom: "4px",
                  fontWeight: 500,
                }}
              >
                Start Date
              </div>
              <div
                style={{
                  fontSize: "1rem",
                  color: "#111827",
                  fontWeight: 500,
                }}
              >
                {formatDate(deposit.startDate, "en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  marginBottom: "4px",
                  fontWeight: 500,
                }}
              >
                End Date
              </div>
              <div
                style={{
                  fontSize: "1rem",
                  color: "#111827",
                  fontWeight: 500,
                }}
              >
                {formatDate(deposit.endDate, "en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Duration */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "0.9rem",
                color: "#6b7280",
                marginBottom: "4px",
                fontWeight: 500,
              }}
            >
              Duration
            </div>
            <div
              style={{
                fontSize: "1rem",
                color: "#111827",
                fontWeight: 500,
              }}
            >
              {Math.round(
                (deposit.endDate - deposit.startDate) / (1000 * 60 * 60 * 24),
              )}{" "}
              days
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "0.9rem",
                color: "#6b7280",
                marginBottom: "4px",
                fontWeight: 500,
              }}
            >
              Status
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 12px",
                borderRadius: "20px",
                backgroundColor: deposit.active ? "#d1fae5" : "#fee2e2",
                color: deposit.active ? "#065f46" : "#991b1b",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              {deposit.active ? "● Active" : "● Inactive"}
            </div>
          </div>

          {/* Comments (if any) */}
          {deposit.comments && (
            <div
              style={{
                marginTop: "24px",
                paddingTop: "24px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#6b7280",
                  marginBottom: "8px",
                  fontWeight: 500,
                }}
              >
                Comments
              </div>
              <div
                style={{
                  fontSize: "1rem",
                  color: "#374151",
                  lineHeight: "1.5",
                  whiteSpace: "pre-wrap",
                  backgroundColor: "#f9fafb",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              >
                {deposit.comments || "No comments"}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleBack}
            style={{
              ...bankingStyles.actionButton,
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              flex: 1,
            }}
          >
            ← Back to Deposits
          </button>

          <button
            onClick={handleEdit}
            style={{
              ...bankingStyles.actionButton,
              backgroundColor: "#3b82f6",
              color: "#fff",
              border: "none",
              flex: 1,
            }}
          >
            ✏️ Edit Deposit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewDepositPage;
