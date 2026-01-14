import React from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../contexts/SettingsContext";
import { useBankingData } from "./hooks/useBankingData";
import { useBankingOperations } from "./hooks/useBankingOperations";

import { bankingStyles } from "./BankingStyles";

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { history, loading } = useBankingData();
  const { handleDeleteHistory } = useBankingOperations();

  // Format to lakhs
  const formatLakhs = (amount: number): string => {
    return (amount / 100000).toFixed(2);
  };

  // Sort history by month (newest first)
  const sortedHistory = [...history].sort((a, b) =>
    b.month.localeCompare(a.month)
  );

  if (loading) {
    return (
      <div style={bankingStyles.container}>
        <div style={bankingStyles.loading}>
          <div style={bankingStyles.spinner}></div>
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={bankingStyles.container}>
      {/* Top Navigation */}
      <div style={bankingStyles.topNav}>
        <button
          onClick={() => navigate("/banking/history/chart")}
          style={bankingStyles.navButton}
          title="View Chart"
        >
          📊
        </button>
        <div style={bankingStyles.navTitle}>History</div>
        <div style={{ display: "flex", gap: "5px" }}>
          <button
            onClick={() => navigate("/banking/history/add")}
            style={bankingStyles.navButton}
            title="Add History"
          >
            +
          </button>
          <button
            onClick={() => navigate("/settings")}
            style={bankingStyles.navButton}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Add History Button */}
      <div style={{ padding: "15px" }}>
        <button
          onClick={() => navigate("/banking/history/add")}
          style={bankingStyles.actionButton}
        >
          <span>📅</span>
          <span>Add Monthly History</span>
        </button>
      </div>

      {/* History List */}
      <div style={{ padding: "0 15px" }}>
        {sortedHistory.length === 0 ? (
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
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📅</div>
            <div>No history records found</div>
            <div style={{ fontSize: "0.9rem", marginTop: "5px" }}>
              Add monthly history to track progress
            </div>
          </div>
        ) : (
          sortedHistory.map((record, _index) => {
            const date = new Date(record.month + "-01");
            const monthName = date.toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            });
            const total = record.savings + record.totalDeposits;

            return (
              <div key={record.month} style={bankingStyles.itemCard}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    {monthName}
                  </div>

                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      backgroundColor: "#f8f9fa",
                      padding: "4px 8px",
                      borderRadius: "12px",
                    }}
                  >
                    Total: {formatLakhs(total)}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "10px",
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
                        color: "#34a853",
                      }}
                    >
                      {formatLakhs(record.savings)}
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
                      FD Amount
                    </div>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: "600",
                        color: "#4285f4",
                      }}
                    >
                      {formatLakhs(record.totalDeposits)}
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
                      onClick={() =>
                        navigate(`/banking/history/edit/${record.month}`)
                      }
                      style={bankingStyles.editButton}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(`Delete history for ${monthName}?`)
                        ) {
                          handleDeleteHistory(record.month);
                        }
                      }}
                      style={bankingStyles.deleteButton}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom spacing */}
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default HistoryPage;
