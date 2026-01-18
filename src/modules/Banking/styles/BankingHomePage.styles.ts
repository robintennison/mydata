export const bankingHomeStyles = {
  // Container and layout
  centeredContainer: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    maxWidth: "600px",
    margin: "0 auto",
    width: "100%",
  } as React.CSSProperties,

  loading: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    color: "#6c757d",
  } as React.CSSProperties,

  spinner: {
    border: "4px solid rgba(0, 0, 0, 0.1)",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    borderLeftColor: "#4285f4",
    animation: "spin 1s linear infinite",
  } as React.CSSProperties,

  // Header
  header: {
    padding: "20px 15px 10px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e9ecef",
  } as React.CSSProperties,

  headerTitle: {
    fontSize: "1.8rem",
    fontWeight: "700" as const,
    color: "#333",
    margin: "0 0 4px 0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  } as React.CSSProperties,

  headerSubtitle: {
    fontSize: "0.9rem",
    color: "#6c757d",
  } as React.CSSProperties,

  // Top Navigation
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 15px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e9ecef",
  } as React.CSSProperties,

  navTitle: {
    fontSize: "1rem",
    fontWeight: "600" as const,
    color: "#333",
  } as React.CSSProperties,

  navButton: {
    background: "none",
    border: "none",
    fontSize: "1.2rem",
    color: "#4285f4",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    minWidth: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,

  // Cards
  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
  } as React.CSSProperties,

  statsLabel: {
    fontSize: "0.875rem",
    fontWeight: "500" as const,
    color: "#6b7280",
    marginBottom: "8px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  } as React.CSSProperties,

  statsValue: {
    fontSize: "1.5rem",
    fontWeight: "600" as const,
    color: "#1f2937",
    marginBottom: "4px",
  } as React.CSSProperties,

  // EMW Card Specific Styles
  emwCard: {
    backgroundColor: "#f8f9fa",
    border: "2px solid #e9ecef",
    position: "relative" as const,
    overflow: "hidden" as const,
  } as React.CSSProperties,

  emwDecorativeCorner: {
    position: "absolute" as const,
    top: "0",
    right: "0",
    width: "0",
    height: "0",
    borderTop: "60px solid #f0f9ff",
    borderLeft: "60px solid transparent",
    zIndex: 0,
  } as React.CSSProperties,

  emwTitle: {
    fontSize: "0.95rem",
    color: "#1e40af",
    display: "flex",
    alignItems: "center",
    gap: "8px",
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
    fontWeight: "600" as const,
  } as React.CSSProperties,

  interestBadge: {
    fontSize: "0.7rem",
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "4px 8px",
    borderRadius: "12px",
    fontWeight: "500" as const,
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
    textAlign: "center" as const,
  } as React.CSSProperties,

  emwBoxLabel: {
    fontSize: "0.75rem",
    color: "#6b7280",
    marginBottom: "6px",
  } as React.CSSProperties,

  emwBoxValue: {
    fontSize: "1.2rem",
    fontWeight: "700" as const,
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
    marginBottom: "12px",
  } as React.CSSProperties,

  lastMonthLabel: {
    fontSize: "0.75rem",
    color: "#6b7280",
  } as React.CSSProperties,

  lastMonthValue: {
    fontSize: "0.9rem",
    fontWeight: "600" as const,
  } as React.CSSProperties,

  trendBadge: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "0.7rem",
    fontWeight: "500" as const,
  } as React.CSSProperties,

  infoBox: {
    fontSize: "0.75rem",
    color: "#6b7280",
    lineHeight: "1.4",
    backgroundColor: "#f3f4f6",
    padding: "8px 10px",
    borderRadius: "6px",
    borderLeft: "3px solid #3b82f6",
    marginBottom: "8px",
  } as React.CSSProperties,

  infoBoxTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "4px",
    fontWeight: "500" as const,
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
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  } as React.CSSProperties,

  totalBalanceValue: {
    fontSize: "1.8rem",
    fontWeight: "700" as const,
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

  // Adjustment breakdown styles
  adjustmentBreakdown: {
    marginTop: "8px",
    padding: "8px",
    backgroundColor: "#f8f9fa",
    borderRadius: "6px",
    border: "1px solid #e9ecef",
  } as React.CSSProperties,

  breakdownItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    marginBottom: "2px",
  } as React.CSSProperties,

  breakdownTotal: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "4px",
    paddingTop: "4px",
    borderTop: "1px dashed #ddd",
    fontWeight: "500" as const,
    fontSize: "12px",
  } as React.CSSProperties,

  // History Card Styles
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  } as React.CSSProperties,

  cardTitle: {
    fontSize: "1rem",
    fontWeight: "600" as const,
    color: "#374151",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  } as React.CSSProperties,

  historyItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
  } as React.CSSProperties,

  historyMonth: {
    fontWeight: "500" as const,
    fontSize: "0.95rem",
    color: "#333",
  } as React.CSSProperties,

  historyBalance: {
    fontSize: "1rem",
    fontWeight: "600" as const,
    color: "#333",
  } as React.CSSProperties,

  historyDetails: {
    fontSize: "0.75rem",
    color: "#6c757d",
    display: "flex",
    gap: "8px",
    marginTop: "2px",
  } as React.CSSProperties,

  monthlyChange: {
    fontSize: "0.75rem",
    marginTop: "2px",
  } as React.CSSProperties,

  // Navigation Icons
  navGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  } as React.CSSProperties,

  navIcon: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "15px",
    border: "1px solid",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "center" as const,
  } as React.CSSProperties,

  navIconText: {
    fontSize: "0.875rem",
    fontWeight: "600" as const,
    color: "#374151",
    marginTop: "8px",
    marginBottom: "4px",
  } as React.CSSProperties,

  // Global styles
  contentWrapper: {
    width: "100%",
  } as React.CSSProperties,

  sectionPadding: {
    padding: "15px 0",
  } as React.CSSProperties,
};