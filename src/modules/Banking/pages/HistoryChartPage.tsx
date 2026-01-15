import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bankingStyles } from "../styles";
import { useBankingData } from "../hooks/useBankingData";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const HistoryChartPage: React.FC = () => {
  const navigate = useNavigate();
  const { loading, history } = useBankingData();
  const chartRef = useRef<any>(null);
  const [chartData, setChartData] = useState<ChartData<"line"> | null>(null);

  // Format month for display (e.g., "2024-01" -> "Jan 24")
  const formatMonth = (month: string): string => {
    try {
      const [year, monthNum] = month.split("-");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthName = monthNames[parseInt(monthNum) - 1] || monthNum;
      return `${monthName} '${year.slice(2)}`;
    } catch {
      return month;
    }
  };

  // Convert to lakhs
  const toLakhs = (value: number): number => value / 100000;

  // Prepare chart data
  useEffect(() => {
    if (history.length === 0) return;

    // Get last 6 months, sorted chronologically
    const sortedHistory = [...history]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    if (sortedHistory.length < 2) return;

    const labels = sortedHistory.map((record) => formatMonth(record.month));
    const depositsData = sortedHistory.map((record) =>
      parseFloat(toLakhs(record.totalDeposits).toFixed(2))
    );
    const totalData = sortedHistory.map((record) =>
      parseFloat(toLakhs(record.savings + record.totalDeposits).toFixed(2))
    );

    const data: ChartData<"line"> = {
      labels,
      datasets: [
        {
          label: "Deposits",
          data: depositsData,
          borderColor: "#2196F3", // Blue
          backgroundColor: "rgba(33, 150, 243, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 3,
        },
        {
          label: "Total (Deposits + Savings)",
          data: totalData,
          borderColor: "#4CAF50", // Green
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 3,
        },
      ],
    };

    setChartData(data);
  }, [history]);

  // Chart options with null-safe callbacks
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio:
      typeof window !== "undefined" && window.innerWidth < 768 ? 1.5 : 2,

    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size:
              typeof window !== "undefined" && window.innerWidth < 768
                ? 12
                : 14,
          },
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: "Last 6 Months Trend (in Lakhs)",
        font: {
          size:
            typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 18,
          weight: "bold",
        },
        color: "#2c3e50",
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        cornerRadius: 6,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            // Handle null/undefined values
            if (value === null || value === undefined) {
              return `${context.dataset.label}: No data`;
            }
            return `${context.dataset.label}: ${value.toFixed(2)} L`;
          },
        },
      },
    },

    scales: {
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          font: {
            size:
              typeof window !== "undefined" && window.innerWidth < 768
                ? 11
                : 12,
          },
          color: "#555",
          maxRotation: 0,
        },
        title: {
          display: true,
          text: "Months",
          font: {
            size:
              typeof window !== "undefined" && window.innerWidth < 768
                ? 12
                : 14,
            weight: 600,
          },
          color: "#2c3e50",
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          font: {
            size:
              typeof window !== "undefined" && window.innerWidth < 768
                ? 11
                : 12,
          },
          color: "#555",
          callback: function (value) {
            if (value === null || value === undefined) {
              return "N/A";
            }
            if (typeof value === "number") {
              return `${value} L`;
            }
            return value;
          },
        },
        title: {
          display: true,
          text: "Amount (in Lakhs)",
          font: {
            size:
              typeof window !== "undefined" && window.innerWidth < 768
                ? 12
                : 14,
            weight: 600,
          },
          color: "#2c3e50",
        },
      },
    },

    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div style={bankingStyles.container}>
        <div style={bankingStyles.loading}>
          <div style={bankingStyles.spinner}></div>
          <p>Loading chart...</p>
        </div>
      </div>
    );
  }

  // Check if history has enough data
  const hasEnoughData = history.length >= 2;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={bankingStyles.header}>
        <div style={bankingStyles.headerTopRow}>
          <div style={bankingStyles.headerLeft}>
            <button
              onClick={handleBack}
              style={styles.backButton}
              title="Go Back"
            >
              ←
            </button>
            <h1 style={bankingStyles.headerTitle}>History Chart</h1>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {history.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📊</div>
            <div style={styles.emptyText}>No history data available</div>
            <div style={styles.emptySubtext}>
              Add some history records first
            </div>
            <button
              onClick={() => navigate("/banking/history")}
              style={styles.addHistoryButton}
            >
              Go to History
            </button>
          </div>
        ) : !hasEnoughData ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📈</div>
            <div style={styles.emptyText}>Need more data for chart</div>
            <div style={styles.emptySubtext}>
              Add at least 2 months of history
            </div>
            <button
              onClick={() => navigate("/banking/history")}
              style={styles.addHistoryButton}
            >
              Add History
            </button>
          </div>
        ) : (
          <>
            {/* Chart Container */}
            <div style={styles.chartContainer}>
              {chartData && (
                <div style={styles.chartWrapper}>
                  <Line
                    ref={chartRef}
                    data={chartData}
                    options={chartOptions}
                  />
                </div>
              )}
            </div>

            {/* Instructions */}
            <div style={styles.instructions}>
              <div style={styles.instructionItem}>
                <span style={styles.instructionIcon}>📱</span>
                <span>Tap points for details</span>
              </div>
              <div style={styles.instructionItem}>
                <span style={styles.instructionIcon}>↔️</span>
                <span>Use two fingers to zoom on mobile</span>
              </div>
            </div>

            {/* Data Summary */}
            <div style={styles.summaryCard}>
              <div style={styles.summaryTitle}>Last 6 Months Summary</div>

              {(() => {
                if (!chartData) return null;

                const sortedHistory = [...history]
                  .sort((a, b) => a.month.localeCompare(b.month))
                  .slice(-6);

                const latest = sortedHistory[sortedHistory.length - 1];
                const previous = sortedHistory[sortedHistory.length - 2];

                if (!latest || !previous) return null;

                const latestTotal = toLakhs(
                  latest.savings + latest.totalDeposits
                );
                const previousTotal = toLakhs(
                  previous.savings + previous.totalDeposits
                );
                const growth = latestTotal - previousTotal;
                const growthPercent =
                  previousTotal > 0 ? (growth / previousTotal) * 100 : 0;

                return (
                  <div style={styles.summaryContent}>
                    <div style={styles.summaryRow}>
                      <span>Latest Total:</span>
                      <span style={styles.summaryValue}>
                        {latestTotal.toFixed(2)} L
                      </span>
                    </div>
                    <div style={styles.summaryRow}>
                      <span>Monthly Growth:</span>
                      <span
                        style={{
                          ...styles.summaryValue,
                          color: growth >= 0 ? "#2e7d32" : "#d32f2f",
                        }}
                      >
                        {growth >= 0 ? "+" : ""}
                        {growth.toFixed(2)} L ({growthPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <div style={styles.summaryRow}>
                      <span>Period:</span>
                      <span style={styles.summaryValue}>
                        {formatMonth(sortedHistory[0].month)} -{" "}
                        {formatMonth(latest.month)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>

      {/* Bottom spacing */}
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: "100%",
    maxWidth: "500px",
    margin: "0 auto",
    backgroundColor: "#f5f7fa",
    minHeight: "100vh",
  },
  backButton: {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    color: "white",
    cursor: "pointer",
    marginRight: "10px",
    padding: "5px",
  },
  content: {
    padding: "15px",
  },
  chartContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "15px",
    marginBottom: "15px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
  },
  chartWrapper: {
    position: "relative",
    height: "300px",
    width: "100%",
  },
  instructions: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "15px",
    marginBottom: "15px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  instructionItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "0.85rem",
    color: "#666",
  },
  instructionIcon: {
    fontSize: "1rem",
    width: "24px",
    textAlign: "center" as const,
  },
  summaryCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
  },
  summaryTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#333",
    marginBottom: "15px",
    paddingBottom: "10px",
    borderBottom: "1px solid #eee",
  },
  summaryContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.9rem",
  },
  summaryValue: {
    fontWeight: 600,
    color: "#2c3e50",
  },
  emptyState: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "40px 20px",
    textAlign: "center" as const,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
    marginTop: "20px",
  },
  emptyIcon: {
    fontSize: "3rem",
    marginBottom: "15px",
    opacity: 0.5,
  },
  emptyText: {
    fontSize: "1.1rem",
    fontWeight: 500,
    marginBottom: "5px",
    color: "#333",
  },
  emptySubtext: {
    fontSize: "0.9rem",
    color: "#666",
    marginBottom: "20px",
  },
  addHistoryButton: {
    padding: "12px 24px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#34a853",
    color: "white",
    fontSize: "0.95rem",
    fontWeight: 500,
    cursor: "pointer",
  },
};

export default HistoryChartPage;
