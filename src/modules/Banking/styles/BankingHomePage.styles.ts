// src/modules/BankingHomePage/styles.ts
export const bankingHomeStyles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
  } as React.CSSProperties,

  header: {
    backgroundColor: "#ffffff",
    padding: "24px 20px",
    borderBottom: "1px solid #e2e8f0",
  } as React.CSSProperties,

  headerTitle: {
    margin: "0 0 8px 0",
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  } as React.CSSProperties,

  headerSubtitle: {
    margin: "0",
    fontSize: "14px",
    color: "#64748b",
  } as React.CSSProperties,

  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
  } as React.CSSProperties,

  navButton: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    cursor: "pointer",
    transition: "all 0.2s",
  } as React.CSSProperties,

  navTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
  } as React.CSSProperties,

  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  } as React.CSSProperties,

  statsLabel: {
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  } as React.CSSProperties,

  statsValue: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "4px",
  } as React.CSSProperties,

  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "16px",
    margin: "15px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  } as React.CSSProperties,

  cardTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  } as React.CSSProperties,

  navGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
    padding: "15px",
  } as React.CSSProperties,

  navIcon: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    border: "2px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "center",
  } as React.CSSProperties,

  navIconText: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#374151",
    marginTop: "8px",
    marginBottom: "4px",
  } as React.CSSProperties,

  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  } as React.CSSProperties,

  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  } as React.CSSProperties,

  // EMW Card Specific Styles
  emwCard: {
    backgroundColor: "#f8f9fa",
    border: "2px solid #e9ecef",
    position: "relative",
    overflow: "hidden",
  } as React.CSSProperties,

  emwDecorativeCorner: {
    position: "absolute",
    top: "0",
    right: "0",
    width: "0",
    height: "0",
    borderTop: "60px solid #f0f9ff",
    borderLeft: "60px solid transparent",
    zIndex: 0,
  } as React.CSSProperties,

  emwBadge: {
    backgroundColor: "#3b82f6",
    color: "white",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    fontWeight: "600",
  } as React.CSSProperties,

  emwTitle: {
    fontSize: "0.95rem",
    color: "#1e40af",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  } as React.CSSProperties,

  interestBadge: {
    fontSize: "0.7rem",
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "4px 8px",
    borderRadius: "12px",
    fontWeight: "500",
  } as React.CSSProperties,

  emwGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "15px",
  } as React.CSSProperties,

  emwBox: {
    backgroundColor: "white",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    textAlign: "center",
  } as React.CSSProperties,

  emwBoxLabel: {
    fontSize: "0.75rem",
    color: "#6b7280",
    marginBottom: "6px",
  } as React.CSSProperties,

  emwBoxValue: {
    fontSize: "1.2rem",
    fontWeight: "700",
  } as React.CSSProperties,

  emwBoxSubtext: {
    fontSize: "0.7rem",
    color: "#9ca3af",
    marginTop: "4px",
  } as React.CSSProperties,

  lastMonthBox: {
    backgroundColor: "white",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  } as React.CSSProperties,

  lastMonthLabel: {
    fontSize: "0.75rem",
    color: "#6b7280",
  } as React.CSSProperties,

  lastMonthValue: {
    fontSize: "0.9rem",
    fontWeight: "600",
  } as React.CSSProperties,

  trendBadge: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "0.7rem",
    fontWeight: "500",
  } as React.CSSProperties,

  infoBox: {
    fontSize: "0.75rem",
    color: "#6b7280",
    lineHeight: "1.4",
    backgroundColor: "#f3f4f6",
    padding: "8px 10px",
    borderRadius: "6px",
    borderLeft: "3px solid #3b82f6",
  } as React.CSSProperties,

  infoBoxTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "4px",
    fontWeight: "500",
  } as React.CSSProperties,

  // Total Balance Card Styles
  totalBalanceCard: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
  } as React.CSSProperties,

  totalBalanceLabel: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "0.9rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  } as React.CSSProperties,

  totalBalanceValue: {
    fontSize: "1.8rem",
    fontWeight: "700",
    margin: "8px 0",
  } as React.CSSProperties,

  totalBalanceSubtext: {
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.8)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "4px",
  } as React.CSSProperties,

  // History item styles
  historyItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #eee",
  } as React.CSSProperties,

  historyMonth: {
    fontWeight: "500",
    color: "#333",
  } as React.CSSProperties,

  historyBalance: {
    fontSize: "0.9rem",
    color: "#4285f4",
    fontWeight: "600",
  } as React.CSSProperties,

  historyDetails: {
    fontSize: "0.8rem",
    color: "#666",
    display: "flex",
    gap: "8px",
  } as React.CSSProperties,

  monthlyChange: {
    fontSize: "0.7rem",
    marginTop: "2px",
  } as React.CSSProperties,

  // Adjustment breakdown styles
  adjustmentBreakdown: {
    marginTop: "8px",
    padding: "6px",
    backgroundColor: "#f8f9fa",
    borderRadius: "6px",
    fontSize: "0.75rem",
    color: "#495057",
    borderLeft: "3px solid #4285f4",
  } as React.CSSProperties,

  breakdownItem: {
    display: "flex",
    justifyContent: "space-between",
  } as React.CSSProperties,

  breakdownTotal: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "4px",
    paddingTop: "4px",
    borderTop: "1px dashed #ddd",
    fontWeight: "500",
  } as React.CSSProperties,
};