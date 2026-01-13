import React, { useState, useEffect } from "react";
import type { SummaryTabProps } from "../../../types/banking.types";
import { cardStyles } from "../../../styles/components/cards";
import { formStyles } from "../../../styles/components/forms";
import "./TableStyles.css";

const SummaryTab: React.FC<SummaryTabProps> = ({
  summaries,
  accounts,
  deposits,
  adjustments,
  onAdjustment,
  enableEditDelete,
  formatCurrency,
  formatDate,
}) => {
  const [showAdjustmentForm, setShowAdjustmentForm] = useState<string | null>(
    null
  );
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>("");
  const [adjustmentNote, setAdjustmentNote] = useState<string>("");

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
  const totalNetBalance = summaries.reduce((sum, s) => sum + s.netBalance, 0);

  // Helper function to get account details by ID
  const getAccountDetails = (accountId: string): string => {
    const account = accounts.find(a => a.id === accountId);
    return account?.acctDetails || "No details available";
  };

  const responsiveGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(350px, 1fr))",
    gap: isMobile ? "16px" : "20px",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const responsiveCard = {
    ...cardStyles.card,
    padding: isMobile ? "16px" : "20px",
    borderRadius: isMobile ? "10px" : "12px",
    marginBottom: isMobile ? "0" : "0",
  };

  return (
    <div style={{ width: "100%", overflowX: "hidden", padding: isMobile ? "0" : "4px" }}>
      {/* Header Section */}
      <div style={{
        ...cardStyles.sectionHeader,
        padding: isMobile ? "16px 0" : "0 0 20px 0",
        textAlign: isMobile ? "center" : "left",
      }}>
        <h3 style={{
          fontSize: isMobile ? "1.25rem" : "1.5rem",
          margin: isMobile ? "0 0 8px 0" : "0 0 12px 0",
        }}>Account Summary</h3>
        
        {isMobile && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "20px",
          }}>
            <div style={{
              backgroundColor: "#e8f5e9",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #c8e6c9",
            }}>
              <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "4px" }}>
                Total Net Balance
              </div>
              <div style={{ 
                fontSize: "1.4rem", 
                fontWeight: "700", 
                color: totalNetBalance >= 0 ? "#2e7d32" : "#c62828" 
              }}>
                {formatCurrency(totalNetBalance)}
              </div>
            </div>
            
            <div style={{
              backgroundColor: "#e3f2fd",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #bbdefb",
              display: "flex",
              justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "4px" }}>
                  Accounts
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                  {accounts.length}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "4px" }}>
                  Total Deposits
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                  {formatCurrency(totalDeposits)}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isMobile && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            backgroundColor: "#f8f9fa",
            padding: "16px",
            borderRadius: "10px",
            border: "1px solid #e9ecef",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <div>
                <div style={{ fontSize: "0.9rem", color: "#6c757d", marginBottom: "4px" }}>
                  Total Accounts
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: "600" }}>
                  {accounts.length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.9rem", color: "#6c757d", marginBottom: "4px" }}>
                  Total Deposits
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: "600" }}>
                  {formatCurrency(totalDeposits)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.9rem", color: "#6c757d", marginBottom: "4px" }}>
                  Net Balance
                </div>
                <div style={{ 
                  fontSize: "1.2rem", 
                  fontWeight: "700", 
                  color: totalNetBalance >= 0 ? "#2e7d32" : "#c62828" 
                }}>
                  {formatCurrency(totalNetBalance)}
                </div>
              </div>
            </div>
            
            {enableEditDelete && (
              <div style={{
                fontSize: "0.85rem",
                color: "#666",
                backgroundColor: "#fff3cd",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #ffeaa7",
              }}>
                💡 Click "Adjust" on any account to make changes
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards Grid */}
      <div style={responsiveGrid}>
        {summaries.map((summary) => {
          const accountAdjustments = adjustments.filter(
            (a) => a.accountId === summary.accountId
          );
          const recentAdjustments = accountAdjustments.slice(0, 2);
          const accountDetails = getAccountDetails(summary.accountId);

          return (
            <div key={summary.accountId} style={responsiveCard}>
              {/* Card Header */}
              <div style={{
                ...cardStyles.cardHeader,
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "flex-start" : "center",
                marginBottom: isMobile ? "12px" : "16px",
                gap: isMobile ? "8px" : "0",
              }}>
                <div>
                  <h4 style={{ 
                    margin: 0, 
                    color: "#212529",
                    fontSize: isMobile ? "1.05rem" : "1.1rem",
                  }}>
                    {summary.acctCode}
                  </h4>
                  {accountDetails && accountDetails !== "No details available" && (
                    <p style={{
                      margin: "4px 0 0 0",
                      fontSize: isMobile ? "0.8rem" : "0.85rem",
                      color: "#6c757d",
                      lineHeight: "1.3",
                    }}>
                      {isMobile 
                        ? accountDetails.substring(0, 40) + 
                          (accountDetails.length > 40 ? "..." : "")
                        : accountDetails.substring(0, 60) + 
                          (accountDetails.length > 60 ? "..." : "")
                      }
                    </p>
                  )}
                </div>
                
                {enableEditDelete && (
                  <button
                    onClick={() =>
                      setShowAdjustmentForm(
                        showAdjustmentForm === summary.accountId
                          ? null
                          : summary.accountId
                      )
                    }
                    style={{
                      ...formStyles.smallButton,
                      padding: isMobile ? "8px 12px" : "6px 12px",
                      fontSize: isMobile ? "0.85rem" : "0.85rem",
                      width: isMobile ? "100%" : "auto",
                      marginTop: isMobile ? "8px" : "0",
                    }}
                  >
                    {showAdjustmentForm === summary.accountId
                      ? "✕ Cancel"
                      : "📝 Adjust Balance"}
                  </button>
                )}
              </div>

              {/* Adjustment Form */}
              {showAdjustmentForm === summary.accountId && (
                <div style={{
                  ...cardStyles.adjustmentForm,
                  padding: isMobile ? "16px" : "16px",
                  marginBottom: isMobile ? "16px" : "16px",
                  backgroundColor: isMobile ? "#f8f9fa" : "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                }}>
                  <div style={formStyles.formGroup}>
                    <label style={{
                      fontSize: isMobile ? "0.9rem" : "0.95rem",
                      marginBottom: "6px",
                      display: "block",
                      fontWeight: "500",
                    }}>Adjustment Amount (₹)</label>
                    <input
                      type="number"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      style={{
                        ...formStyles.input,
                        width: "100%",
                        padding: isMobile ? "10px 12px" : "12px 16px",
                        fontSize: isMobile ? "0.9rem" : "1rem",
                      }}
                      placeholder="Positive or negative amount"
                    />
                  </div>
                  <div style={formStyles.formGroup}>
                    <label style={{
                      fontSize: isMobile ? "0.9rem" : "0.95rem",
                      marginBottom: "6px",
                      display: "block",
                      fontWeight: "500",
                    }}>Note</label>
                    <input
                      type="text"
                      value={adjustmentNote}
                      onChange={(e) => setAdjustmentNote(e.target.value)}
                      style={{
                        ...formStyles.input,
                        width: "100%",
                        padding: isMobile ? "10px 12px" : "12px 16px",
                        fontSize: isMobile ? "0.9rem" : "1rem",
                      }}
                      placeholder="Reason for adjustment"
                    />
                  </div>
                  <div style={{
                    display: "flex",
                    gap: "12px",
                    flexDirection: isMobile ? "column" : "row",
                  }}>
                    <button
                      onClick={() => handleAdjustmentSubmit(summary.accountId)}
                      style={{
                        ...formStyles.saveButton,
                        width: isMobile ? "100%" : "auto",
                        padding: isMobile ? "12px 16px" : "10px 20px",
                        fontSize: isMobile ? "0.95rem" : "0.9rem",
                        flex: isMobile ? "none" : "1",
                      }}
                      disabled={!adjustmentAmount}
                    >
                      Apply Adjustment
                    </button>
                    <button
                      onClick={() => {
                        setAdjustmentAmount("");
                        setAdjustmentNote("");
                        setShowAdjustmentForm(null);
                      }}
                      style={{
                        ...formStyles.cancelButton,
                        width: isMobile ? "100%" : "auto",
                        padding: isMobile ? "12px 16px" : "10px 20px",
                        fontSize: isMobile ? "0.95rem" : "0.9rem",
                        flex: isMobile ? "none" : "1",
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr",
                gap: isMobile ? "12px" : "12px",
                marginBottom: isMobile ? "16px" : "20px",
              }}>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: isMobile ? "10px" : "12px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                }}>
                  <span style={{
                    fontSize: isMobile ? "0.8rem" : "0.85rem",
                    color: "#6c757d",
                    marginBottom: "4px",
                  }}>Savings</span>
                  <span style={{
                    fontSize: isMobile ? "1rem" : "1.1rem",
                    fontWeight: "600",
                    color: "#212529",
                  }}>
                    {formatCurrency(summary.savings)}
                  </span>
                </div>

                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: isMobile ? "10px" : "12px",
                  backgroundColor: "#e8f5e9",
                  borderRadius: "8px",
                  border: "1px solid #c8e6c9",
                }}>
                  <span style={{
                    fontSize: isMobile ? "0.8rem" : "0.85rem",
                    color: "#2e7d32",
                    marginBottom: "4px",
                  }}>Deposits</span>
                  <span style={{
                    fontSize: isMobile ? "1rem" : "1.1rem",
                    fontWeight: "600",
                    color: "#1b5e20",
                  }}>
                    {formatCurrency(summary.deposits)}
                  </span>
                </div>

                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: isMobile ? "10px" : "12px",
                  backgroundColor: summary.adjustments >= 0 ? "#e8f5e9" : "#ffebee",
                  borderRadius: "8px",
                  border: `1px solid ${summary.adjustments >= 0 ? "#c8e6c9" : "#ffcdd2"}`,
                  gridColumn: isMobile ? "1 / span 2" : "1",
                }}>
                  <span style={{
                    fontSize: isMobile ? "0.8rem" : "0.85rem",
                    color: summary.adjustments >= 0 ? "#2e7d32" : "#c62828",
                    marginBottom: "4px",
                  }}>Adjustments</span>
                  <span style={{
                    fontSize: isMobile ? "1rem" : "1.1rem",
                    fontWeight: "600",
                    color: summary.adjustments >= 0 ? "#1b5e20" : "#b71c1c",
                  }}>
                    {formatCurrency(summary.adjustments)}
                  </span>
                </div>
              </div>

              {/* Net Balance - Highlighted */}
              <div style={{
                padding: isMobile ? "16px" : "20px",
                backgroundColor: summary.netBalance >= 0 ? "#e8f5e9" : "#ffebee",
                borderRadius: "10px",
                border: `2px solid ${summary.netBalance >= 0 ? "#4caf50" : "#f44336"}`,
                textAlign: "center",
                marginBottom: isMobile ? "16px" : "20px",
              }}>
                <div style={{
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                  color: summary.netBalance >= 0 ? "#2e7d32" : "#c62828",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}>
                  Net Balance
                </div>
                <div style={{
                  fontSize: isMobile ? "1.4rem" : "1.6rem",
                  fontWeight: "700",
                  color: summary.netBalance >= 0 ? "#1b5e20" : "#b71c1c",
                }}>
                  {formatCurrency(summary.netBalance)}
                </div>
              </div>

              {/* Recent Adjustments */}
              {recentAdjustments.length > 0 && (
                <div style={{
                  ...cardStyles.adjustmentsList,
                  padding: isMobile ? "12px" : "16px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                }}>
                  <h5 style={{ 
                    margin: "0 0 12px 0", 
                    fontSize: isMobile ? "0.9rem" : "0.95rem",
                    color: "#495057",
                  }}>
                    Recent Adjustments
                    {accountAdjustments.length > 2 && (
                      <span style={{ 
                        fontSize: "0.8rem", 
                        color: "#6c757d",
                        marginLeft: "8px",
                      }}>
                        ({accountAdjustments.length} total)
                      </span>
                    )}
                  </h5>
                  
                  {recentAdjustments.map((adj) => (
                    <div key={adj.id} style={{
                      ...cardStyles.adjustmentItem,
                      padding: isMobile ? "8px 0" : "8px 0",
                      borderBottom: "1px solid #e9ecef",
                      flexDirection: isMobile ? "column" : "row",
                      alignItems: isMobile ? "flex-start" : "center",
                      gap: isMobile ? "4px" : "12px",
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: isMobile ? "100%" : "auto",
                      }}>
                        <span
                          style={{
                            color: adj.adjustmentAmount >= 0 ? "#28a745" : "#dc3545",
                            fontWeight: "bold",
                            fontSize: isMobile ? "0.95rem" : "1rem",
                            minWidth: isMobile ? "none" : "80px",
                          }}
                        >
                          {adj.adjustmentAmount >= 0 ? "+" : ""}{formatCurrency(adj.adjustmentAmount)}
                        </span>
                        <span style={{ 
                          fontSize: isMobile ? "0.75rem" : "0.8rem", 
                          color: "#6c757d",
                          flex: isMobile ? "1" : "none",
                          textAlign: isMobile ? "right" : "left",
                        }}>
                          {formatDate(adj.timestamp)}
                        </span>
                      </div>
                      {adj.note && (
                        <span style={{ 
                          fontSize: isMobile ? "0.8rem" : "0.85rem", 
                          color: "#495057",
                          fontStyle: "italic",
                          width: isMobile ? "100%" : "auto",
                          marginTop: isMobile ? "2px" : "0",
                        }}>
                          "{adj.note}"
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Empty adjustments state */}
              {accountAdjustments.length === 0 && enableEditDelete && (
                <div style={{
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px dashed #dee2e6",
                  textAlign: "center",
                  marginTop: "12px",
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: isMobile ? "0.8rem" : "0.85rem",
                    color: "#6c757d",
                  }}>
                    No adjustments yet. Click "Adjust" to make changes.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Stats Summary */}
      {isMobile && summaries.length > 0 && (
        <div style={{
          marginTop: "24px",
          padding: "16px",
          backgroundColor: "#e3f2fd",
          borderRadius: "10px",
          border: "1px solid #bbdefb",
        }}>
          <h4 style={{ 
            margin: "0 0 12px 0", 
            fontSize: "1rem",
            color: "#1565c0",
          }}>
            Quick Summary
          </h4>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}>
            <div>
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>
                Total Savings
              </div>
              <div style={{ fontSize: "1rem", fontWeight: "600" }}>
                {formatCurrency(summaries.reduce((sum, s) => sum + s.savings, 0))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>
                Total Adjustments
              </div>
              <div style={{ 
                fontSize: "1rem", 
                fontWeight: "600",
                color: summaries.reduce((sum, s) => sum + s.adjustments, 0) >= 0 ? "#28a745" : "#dc3545"
              }}>
                {formatCurrency(summaries.reduce((sum, s) => sum + s.adjustments, 0))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryTab;