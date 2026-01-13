import React, { useEffect, useState } from "react";
import type { HistoryTabProps, History } from "../../../types/banking.types";
import { formStyles } from "../../../styles/components/forms";
import { chartStyles } from "../../../styles/components/charts";
import "./TableStyles.css"; // Import the shared table styles

const HistoryTab: React.FC<HistoryTabProps> = ({
  history,
  chartData,
  editingHistory,
  setEditingHistory,
  onSaveHistory,
  onDeleteHistory,
  enableEditDelete,
  formatCurrency,
}) => {
  // Create initial form data with all required properties
  const [formData, setFormData] = useState<History>({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    totalDeposits: 0,
    savings: 0,
  });

  // Mobile state for better UX
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (editingHistory) {
      setFormData(editingHistory);
    } else {
      // Reset to initial state
      setFormData({
        month: new Date().toISOString().slice(0, 7),
        totalDeposits: 0,
        savings: 0,
      });
    }
  }, [editingHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveHistory(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "month" ? value : parseFloat(value) || 0,
    }));
  };

  // Find max value for chart scaling
  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  // Helper function to format month name
  const formatMonthName = (month: string): string => {
    const [year, monthNum] = month.split("-").map(Number);
    const date = new Date(year, monthNum - 1, 1);
    return isMobile
      ? date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
      : date.toLocaleDateString("en-IN", { year: "numeric", month: "long" });
  };

  // Sort history by date (newest first)
  const sortedHistory = [...history].sort((a, b) =>
    b.month.localeCompare(a.month)
  );

  // Responsive form styles
  const responsiveFormGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
    gap: isMobile ? "12px" : "16px",
    width: "100%",
    marginBottom: "16px",
  };

  const responsiveFormGroup = {
    width: "100%",
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      {/* Header */}
      <div
        style={{
          ...formStyles.sectionHeader,
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "12px" : "0",
          alignItems: isMobile ? "flex-start" : "center",
          marginBottom: isMobile ? "16px" : "20px",
        }}
      >
        <h3
          style={{
            fontSize: isMobile ? "1.25rem" : "1.5rem",
            margin: 0,
          }}
        >
          Monthly History & Trends
        </h3>
        <button
          onClick={() => setEditingHistory(null)}
          style={{
            ...formStyles.addButton,
            width: isMobile ? "100%" : "auto",
            padding: isMobile ? "10px 16px" : "8px 16px",
            fontSize: isMobile ? "0.9rem" : "0.85rem",
          }}
        >
          + Add Month
        </button>
      </div>

      {/* History Form */}
      {(editingHistory === null || editingHistory.month) && (
        <form
          onSubmit={handleSubmit}
          style={{
            ...formStyles.form,
            padding: isMobile ? "12px" : "16px",
            marginBottom: isMobile ? "16px" : "20px",
          }}
        >
          <div style={responsiveFormGrid}>
            <div style={responsiveFormGroup}>
              <label
                style={{
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                  marginBottom: "6px",
                  display: "block",
                  fontWeight: "500",
                }}
              >
                Month (YYYY-MM) *
              </label>
              <input
                type="month"
                name="month"
                value={formData.month}
                onChange={handleChange}
                required
                style={{
                  ...formStyles.input,
                  width: "100%",
                  padding: isMobile ? "10px 12px" : "12px 16px",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                }}
              />
            </div>
            <div style={responsiveFormGroup}>
              <label
                style={{
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                  marginBottom: "6px",
                  display: "block",
                  fontWeight: "500",
                }}
              >
                Total Deposits (₹)
              </label>
              <input
                type="number"
                name="totalDeposits"
                value={formData.totalDeposits}
                onChange={handleChange}
                style={{
                  ...formStyles.input,
                  width: "100%",
                  padding: isMobile ? "10px 12px" : "12px 16px",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                }}
                placeholder="0"
              />
            </div>
            <div style={responsiveFormGroup}>
              <label
                style={{
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                  marginBottom: "6px",
                  display: "block",
                  fontWeight: "500",
                }}
              >
                Savings (₹)
              </label>
              <input
                type="number"
                name="savings"
                value={formData.savings}
                onChange={handleChange}
                style={{
                  ...formStyles.input,
                  width: "100%",
                  padding: isMobile ? "10px 12px" : "12px 16px",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                }}
                placeholder="0"
              />
            </div>
          </div>

          <div
            style={{
              ...formStyles.formActions,
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? "8px" : "12px",
            }}
          >
            <button
              type="submit"
              style={{
                ...formStyles.saveButton,
                width: isMobile ? "100%" : "auto",
                padding: isMobile ? "12px 16px" : "10px 24px",
                fontSize: isMobile ? "0.95rem" : "0.9rem",
              }}
            >
              {editingHistory ? "Update Month" : "Add Month"}
            </button>

            {editingHistory && (
              <button
                type="button"
                onClick={() => setEditingHistory(null)}
                style={{
                  ...formStyles.cancelButton,
                  width: isMobile ? "100%" : "auto",
                  padding: isMobile ? "12px 16px" : "10px 24px",
                  fontSize: isMobile ? "0.95rem" : "0.9rem",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Chart Section */}
      <div
        style={{
          ...chartStyles.section,
          marginBottom: isMobile ? "20px" : "30px",
          backgroundColor: "white",
          padding: isMobile ? "16px" : "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          border: "1px solid #e9ecef",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            flexDirection: isMobile ? "column" : "row",
            marginBottom: isMobile ? "12px" : "16px",
            gap: isMobile ? "8px" : "0",
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: isMobile ? "1.1rem" : "1.2rem",
              color: "#212529",
            }}
          >
            📈 Deposits Trend
          </h4>
          {sortedHistory.length > 0 && (
            <div
              style={{
                fontSize: isMobile ? "0.8rem" : "0.9rem",
                color: "#666",
                backgroundColor: "#f8f9fa",
                padding: isMobile ? "6px 10px" : "8px 12px",
                borderRadius: "6px",
                border: "1px solid #e9ecef",
                textAlign: isMobile ? "center" : "left",
                width: isMobile ? "100%" : "auto",
              }}
            >
              Showing {sortedHistory.length} month
              {sortedHistory.length !== 1 ? "s" : ""} of data
            </div>
          )}
        </div>

        {/* Chart Container */}
        <div
          style={{
            ...chartStyles.container,
            height: isMobile ? "200px" : "250px",
            padding: isMobile ? "10px 5px" : "20px 10px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            overflowX:
              chartData.length > (isMobile ? 4 : 6) ? "auto" : "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            style={{
              ...chartStyles.bars,
              minWidth: isMobile
                ? `${chartData.length * 60}px`
                : `${chartData.length * 70}px`,
              height: isMobile ? "160px" : "200px",
              paddingBottom: "10px",
            }}
          >
            {chartData.map((point, index) => (
              <div
                key={point.month}
                style={{
                  ...chartStyles.barContainer,
                  width: isMobile ? "50px" : "60px",
                  margin: isMobile ? "0 8px" : "0 12px",
                }}
              >
                <div
                  style={{
                    ...chartStyles.barLabel,
                    fontSize: isMobile ? "0.75rem" : "0.8rem",
                    height: isMobile ? "20px" : "24px",
                    marginBottom: "4px",
                    color: "#666",
                    fontWeight: "500",
                  }}
                >
                  {isMobile
                    ? new Date(point.month + "-01").toLocaleDateString(
                        "en-IN",
                        { month: "short" }
                      )
                    : new Date(point.month + "-01").toLocaleDateString(
                        "en-IN",
                        { month: "short", year: "2-digit" }
                      )}
                </div>
                <div
                  style={{
                    ...chartStyles.barWrapper,
                    height: isMobile ? "120px" : "150px",
                    backgroundColor: "#f1f3f4",
                    borderRadius: "4px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      ...chartStyles.bar,
                      height: `${(point.value / maxValue) * 100}%`,
                      backgroundColor:
                        index === chartData.length - 1 ? "#34a853" : "#4285f4",
                      position: "absolute",
                      bottom: 0,
                      left: "10%",
                      width: "80%",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease",
                    }}
                    title={`${point.month}: ${point.displayValue}`}
                  />
                </div>
                <div
                  style={{
                    ...chartStyles.barValue,
                    fontSize: isMobile ? "0.7rem" : "0.75rem",
                    marginTop: "6px",
                    height: isMobile ? "20px" : "24px",
                    color: "#495057",
                    fontWeight: "500",
                    textAlign: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isMobile
                    ? formatCurrency(point.value)
                        .replace("₹", "₹")
                        .replace(/,/g, "K")
                    : formatCurrency(point.value).replace("₹", "₹")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Legend */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
            marginTop: isMobile ? "12px" : "16px",
            paddingTop: isMobile ? "12px" : "16px",
            borderTop: "1px solid #e9ecef",
            fontSize: isMobile ? "0.8rem" : "0.85rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#4285f4",
                borderRadius: "2px",
              }}
            ></div>
            <span style={{ color: "#666" }}>Past Months</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#34a853",
                borderRadius: "2px",
              }}
            ></div>
            <span style={{ color: "#666" }}>Current/Latest</span>
          </div>
          {isMobile && chartData.length > 3 && (
            <div
              style={{
                fontSize: "0.75rem",
                color: "#4285f4",
                backgroundColor: "#e8f0fe",
                padding: "4px 8px",
                borderRadius: "4px",
                marginTop: "4px",
              }}
            >
              ← Scroll → to see more months
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="desktop-table-view">
        <div className="table-responsive-container">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Total Deposits</th>
                <th>Savings</th>
                <th>Deposit vs Savings</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedHistory.map((record) => {
                const ratio =
                  record.totalDeposits > 0
                    ? ((record.savings / record.totalDeposits) * 100).toFixed(1)
                    : "0.0";

                return (
                  <tr key={record.month}>
                    <td style={{ fontWeight: "500", minWidth: "140px" }}>
                      {formatMonthName(record.month)}
                    </td>
                    <td
                      style={{
                        fontWeight: "600",
                        color: "#1a73e8",
                        minWidth: "120px",
                      }}
                    >
                      {formatCurrency(record.totalDeposits)}
                    </td>
                    <td
                      style={{
                        fontWeight: "600",
                        color: record.savings >= 0 ? "#0d652d" : "#c5221f",
                        minWidth: "120px",
                      }}
                    >
                      {formatCurrency(record.savings)}
                    </td>
                    <td style={{ minWidth: "140px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: "8px",
                            backgroundColor: "#f1f3f4",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(parseFloat(ratio), 100)}%`,
                              height: "100%",
                              backgroundColor:
                                parseFloat(ratio) >= 50
                                  ? "#34a853"
                                  : parseFloat(ratio) >= 25
                                  ? "#fbbc04"
                                  : "#ea4335",
                              borderRadius: "4px",
                            }}
                          ></div>
                        </div>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "500",
                            minWidth: "40px",
                            color:
                              parseFloat(ratio) >= 50
                                ? "#0d652d"
                                : parseFloat(ratio) >= 25
                                ? "#e37400"
                                : "#c5221f",
                          }}
                        >
                          {ratio}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {enableEditDelete && (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: isMobile ? "wrap" : "nowrap",
                          }}
                        >
                          <button
                            onClick={() => setEditingHistory(record)}
                            style={{
                              ...formStyles.smallButton,
                              padding: isMobile ? "6px 10px" : "6px 12px",
                              fontSize: isMobile ? "0.8rem" : "0.85rem",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteHistory(record.month)}
                            style={{
                              ...formStyles.smallButton,
                              ...formStyles.deleteButton,
                              padding: isMobile ? "6px 10px" : "6px 12px",
                              fontSize: isMobile ? "0.8rem" : "0.85rem",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="mobile-card-view">
        {sortedHistory.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "#666",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              border: "1px dashed #dee2e6",
            }}
          >
            No history data found. Click "Add Month" to start tracking.
          </div>
        ) : (
          sortedHistory.map((record) => {
            const ratio =
              record.totalDeposits > 0
                ? ((record.savings / record.totalDeposits) * 100).toFixed(1)
                : "0.0";

            return (
              <div key={record.month} className="mobile-card">
                <div
                  className="mobile-card-row"
                  style={{
                    backgroundColor: "#f8f9fa",
                    padding: "12px",
                    borderRadius: "6px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#212529",
                        marginBottom: "4px",
                      }}
                    >
                      {formatMonthName(record.month)}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#666",
                      }}
                    >
                      Savings Rate: {ratio}%
                    </div>
                  </div>
                </div>

                <div className="mobile-card-row">
                  <span className="mobile-card-label">Total Deposits:</span>
                  <span
                    className="mobile-card-value"
                    style={{ color: "#1a73e8", fontWeight: "600" }}
                  >
                    {formatCurrency(record.totalDeposits)}
                  </span>
                </div>

                <div className="mobile-card-row">
                  <span className="mobile-card-label">Savings:</span>
                  <span
                    className="mobile-card-value"
                    style={{
                      color: record.savings >= 0 ? "#0d652d" : "#c5221f",
                      fontWeight: "600",
                    }}
                  >
                    {formatCurrency(record.savings)}
                  </span>
                </div>

                <div className="mobile-card-row">
                  <span className="mobile-card-label">Savings Rate:</span>
                  <div className="mobile-card-value">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          width: "60px",
                          height: "6px",
                          backgroundColor: "#f1f3f4",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(parseFloat(ratio), 100)}%`,
                            height: "100%",
                            backgroundColor:
                              parseFloat(ratio) >= 50
                                ? "#34a853"
                                : parseFloat(ratio) >= 25
                                ? "#fbbc04"
                                : "#ea4335",
                            borderRadius: "3px",
                          }}
                        ></div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: "500",
                          minWidth: "40px",
                          textAlign: "right",
                          color:
                            parseFloat(ratio) >= 50
                              ? "#0d652d"
                              : parseFloat(ratio) >= 25
                              ? "#e37400"
                              : "#c5221f",
                        }}
                      >
                        {ratio}%
                      </span>
                    </div>
                  </div>
                </div>

                {enableEditDelete && (
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Actions:</span>
                    <div
                      className="mobile-card-value"
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "flex-end",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => setEditingHistory(record)}
                        style={{
                          ...formStyles.smallButton,
                          padding: "8px 12px",
                          fontSize: "0.85rem",
                          minWidth: "70px",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteHistory(record.month)}
                        style={{
                          ...formStyles.smallButton,
                          ...formStyles.deleteButton,
                          padding: "8px 12px",
                          fontSize: "0.85rem",
                          minWidth: "70px",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      {sortedHistory.length > 0 && (
        <div
          style={{
            marginTop: isMobile ? "20px" : "24px",
            padding: isMobile ? "16px" : "20px",
            backgroundColor: "#f0f7ff",
            borderRadius: "10px",
            border: "1px solid #d1e7ff",
          }}
        >
          <h4
            style={{
              margin: "0 0 12px 0",
              fontSize: isMobile ? "1rem" : "1.1rem",
              color: "#1565c0",
            }}
          >
            📊 Monthly Averages
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
              gap: isMobile ? "16px" : "20px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: isMobile ? "0.8rem" : "0.85rem",
                  color: "#666",
                  marginBottom: "4px",
                }}
              >
                Avg. Deposits
              </div>
              <div
                style={{
                  fontSize: isMobile ? "1rem" : "1.1rem",
                  fontWeight: "600",
                  color: "#1a73e8",
                }}
              >
                {formatCurrency(
                  sortedHistory.reduce((sum, r) => sum + r.totalDeposits, 0) /
                    sortedHistory.length
                )}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: isMobile ? "0.8rem" : "0.85rem",
                  color: "#666",
                  marginBottom: "4px",
                }}
              >
                Avg. Savings
              </div>
              <div
                style={{
                  fontSize: isMobile ? "1rem" : "1.1rem",
                  fontWeight: "600",
                  color:
                    sortedHistory.reduce((sum, r) => sum + r.savings, 0) /
                      sortedHistory.length >=
                    0
                      ? "#0d652d"
                      : "#c5221f",
                }}
              >
                {formatCurrency(
                  sortedHistory.reduce((sum, r) => sum + r.savings, 0) /
                    sortedHistory.length
                )}
              </div>
            </div>
            {!isMobile && (
              <>
                <div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    Total Deposits
                  </div>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "#1a73e8",
                    }}
                  >
                    {formatCurrency(
                      sortedHistory.reduce((sum, r) => sum + r.totalDeposits, 0)
                    )}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    Total Savings
                  </div>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color:
                        sortedHistory.reduce((sum, r) => sum + r.savings, 0) >=
                        0
                          ? "#0d652d"
                          : "#c5221f",
                    }}
                  >
                    {formatCurrency(
                      sortedHistory.reduce((sum, r) => sum + r.savings, 0)
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          {isMobile && (
            <div
              style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #d1e7ff",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#666",
                    marginBottom: "4px",
                  }}
                >
                  Total Deposits
                </div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color: "#1a73e8",
                  }}
                >
                  {formatCurrency(
                    sortedHistory.reduce((sum, r) => sum + r.totalDeposits, 0)
                  )}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#666",
                    marginBottom: "4px",
                  }}
                >
                  Total Savings
                </div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color:
                      sortedHistory.reduce((sum, r) => sum + r.savings, 0) >= 0
                        ? "#0d652d"
                        : "#c5221f",
                  }}
                >
                  {formatCurrency(
                    sortedHistory.reduce((sum, r) => sum + r.savings, 0)
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
