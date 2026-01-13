import { useEffect, useState } from "react";
import { firestore } from "../lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

interface SmartDataViewerProps {
  userId: string;
}

interface BankAccount {
  id: string;
  acctCode?: string;
  acctDetails?: string;
  savingsAmount?: number;
  mpin?: string;
  // Add other fields as needed
}

interface Deposit {
  id: string;
  accountId: string;
  amount?: number;
  date?: string;
  description?: string;
  // Add other fields
}

interface History {
  id: string;
  month: string;
  // Add other fields
}

interface DepositAdjustment {
  id: string;
  // Add fields
}

const SmartDataViewer: React.FC<SmartDataViewerProps> = ({ userId }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [adjustments, setAdjustments] = useState<DepositAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "accounts" | "deposits" | "history" | "adjustments"
  >("accounts");

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      console.log("Loading all banking data...");

      try {
        // Load accounts
        console.log("Loading accounts...");
        const accountsCol = collection(firestore, "accounts");
        const accountsSnapshot = await getDocs(accountsCol);
        const accountsData: BankAccount[] = accountsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as BankAccount)
        );
        setAccounts(accountsData);
        console.log(`Loaded ${accountsData.length} accounts`);

        // Load deposits
        console.log("Loading deposits...");
        const depositsCol = collection(firestore, "deposits");
        const depositsSnapshot = await getDocs(depositsCol);
        const depositsData: Deposit[] = depositsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Deposit)
        );
        setDeposits(depositsData);
        console.log(`Loaded ${depositsData.length} deposits`);

        // Load history
        console.log("Loading history...");
        const historyCol = collection(firestore, "history");
        const historySnapshot = await getDocs(historyCol);
        const historyData: History[] = historySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              month: doc.id, // History uses month as document ID
              ...doc.data(),
            } as History)
        );
        setHistory(historyData);
        console.log(`Loaded ${historyData.length} history records`);

        // Load adjustments
        console.log("Loading adjustments...");
        const adjustmentsCol = collection(firestore, "deposit_adjustments");
        const adjustmentsSnapshot = await getDocs(adjustmentsCol);
        const adjustmentsData: DepositAdjustment[] =
          adjustmentsSnapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as DepositAdjustment)
          );
        setAdjustments(adjustmentsData);
        console.log(`Loaded ${adjustmentsData.length} adjustments`);
      } catch (error: any) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Calculate totals
  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (acc.savingsAmount || 0),
    0
  );
  const totalDeposits = deposits.reduce(
    (sum, dep) => sum + (dep.amount || 0),
    0
  );
  const accountCount = accounts.length;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.spinnerContainer}>
          <div style={styles.spinner}></div>
          <h3>Loading Banking Data...</h3>
          <p>Fetching accounts, deposits, history, and adjustments</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header with Stats */}
      <div style={styles.header}>
        <h2 style={styles.title}>🏦 My Banking Data</h2>
        <p style={styles.subtitle}>Connected to your Android app's Firestore</p>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>💰</div>
            <div style={styles.statContent}>
              <h4>Total Balance</h4>
              <p style={styles.statNumber}>{formatCurrency(totalBalance)}</p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statContent}>
              <h4>Accounts</h4>
              <p style={styles.statNumber}>{accountCount}</p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>📥</div>
            <div style={styles.statContent}>
              <h4>Total Deposits</h4>
              <p style={styles.statNumber}>{formatCurrency(totalDeposits)}</p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>📈</div>
            <div style={styles.statContent}>
              <h4>History Records</h4>
              <p style={styles.statNumber}>{history.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("accounts")}
          style={{
            ...styles.tabButton,
            backgroundColor: activeTab === "accounts" ? "#4285f4" : "#f8f9fa",
            color: activeTab === "accounts" ? "white" : "#333",
          }}
        >
          💰 Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab("deposits")}
          style={{
            ...styles.tabButton,
            backgroundColor: activeTab === "deposits" ? "#4285f4" : "#f8f9fa",
            color: activeTab === "deposits" ? "white" : "#333",
          }}
        >
          📥 Deposits ({deposits.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          style={{
            ...styles.tabButton,
            backgroundColor: activeTab === "history" ? "#4285f4" : "#f8f9fa",
            color: activeTab === "history" ? "white" : "#333",
          }}
        >
          📈 History ({history.length})
        </button>
        <button
          onClick={() => setActiveTab("adjustments")}
          style={{
            ...styles.tabButton,
            backgroundColor:
              activeTab === "adjustments" ? "#4285f4" : "#f8f9fa",
            color: activeTab === "adjustments" ? "white" : "#333",
          }}
        >
          🔧 Adjustments ({adjustments.length})
        </button>
      </div>

      {/* Content Area */}
      <div style={styles.content}>
        {activeTab === "accounts" && (
          <AccountsTab accounts={accounts} deposits={deposits} />
        )}

        {activeTab === "deposits" && (
          <DepositsTab deposits={deposits} accounts={accounts} />
        )}

        {activeTab === "history" && <HistoryTab history={history} />}

        {activeTab === "adjustments" && (
          <AdjustmentsTab adjustments={adjustments} />
        )}
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          🔗 Connected to: <strong>accounts</strong>, <strong>deposits</strong>,{" "}
          <strong>history</strong>, <strong>deposit_adjustments</strong>
        </p>
        <p style={styles.footerNote}>
          Same data as your Android app • Real-time Firestore • No user
          separation
        </p>
      </div>
    </div>
  );
};

// --- Tab Components ---

const AccountsTab: React.FC<{
  accounts: BankAccount[];
  deposits: Deposit[];
}> = ({ accounts, deposits }) => {
  // Calculate deposit totals per account
  const accountDeposits: Record<string, number> = {};
  deposits.forEach((deposit) => {
    if (deposit.accountId) {
      accountDeposits[deposit.accountId] =
        (accountDeposits[deposit.accountId] || 0) + (deposit.amount || 0);
    }
  });

  return (
    <div>
      <h3>Bank Accounts</h3>
      <div style={styles.accountsGrid}>
        {accounts.map((account) => (
          <div key={account.id} style={styles.accountCard}>
            <div style={styles.accountHeader}>
              <span style={styles.accountCode}>
                {account.acctCode || "No Code"}
              </span>
              <span
                style={{
                  ...styles.accountBalance,
                  color:
                    (account.savingsAmount || 0) >= 0 ? "#2e7d32" : "#d32f2f",
                }}
              >
                {formatCurrency(account.savingsAmount || 0)}
              </span>
            </div>

            <div style={styles.accountDetails}>
              <p>
                <strong>ID:</strong> <code>{account.id}</code>
              </p>
              <p>
                <strong>Details:</strong> {account.acctDetails || "N/A"}
              </p>
              {account.mpin && (
                <p>
                  <strong>MPIN:</strong> {account.mpin}
                </p>
              )}

              {accountDeposits[account.id] && (
                <div style={styles.depositSummary}>
                  <p>
                    <strong>Total Deposits:</strong>{" "}
                    {formatCurrency(accountDeposits[account.id])}
                  </p>
                </div>
              )}
            </div>

            <div style={styles.accountStats}>
              <span style={styles.stat}>
                Deposits:{" "}
                {deposits.filter((d) => d.accountId === account.id).length}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DepositsTab: React.FC<{
  deposits: Deposit[];
  accounts: BankAccount[];
}> = ({ deposits, accounts }) => {
  const getAccountCode = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    return account?.acctCode || "Unknown";
  };

  return (
    <div>
      <h3>Deposits</h3>
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <span style={styles.tableCell}>Date</span>
          <span style={styles.tableCell}>Account</span>
          <span style={styles.tableCell}>Amount</span>
          <span style={styles.tableCell}>Description</span>
          <span style={styles.tableCell}>ID</span>
        </div>

        {deposits.map((deposit) => (
          <div key={deposit.id} style={styles.tableRow}>
            <span style={styles.tableCell}>{deposit.date || "N/A"}</span>
            <span style={styles.tableCell}>
              {getAccountCode(deposit.accountId)} (
              {deposit.accountId?.substring(0, 8)}...)
            </span>
            <span
              style={{
                ...styles.tableCell,
                color: (deposit.amount || 0) >= 0 ? "#2e7d32" : "#d32f2f",
                fontWeight: "bold",
              }}
            >
              {formatCurrency(deposit.amount || 0)}
            </span>
            <span style={styles.tableCell}>
              {deposit.description || "No description"}
            </span>
            <span
              style={{
                ...styles.tableCell,
                fontFamily: "monospace",
                fontSize: "0.8rem",
              }}
            >
              {deposit.id.substring(0, 10)}...
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const HistoryTab: React.FC<{ history: History[] }> = ({ history }) => {
  return (
    <div>
      <h3>Monthly History</h3>
      <div style={styles.historyGrid}>
        {history.map((record) => (
          <div key={record.id} style={styles.historyCard}>
            <div style={styles.historyHeader}>
              <span style={styles.historyMonth}>{record.month}</span>
            </div>
            <div style={styles.historyContent}>
              <pre style={styles.historyData}>
                {JSON.stringify(record, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdjustmentsTab: React.FC<{ adjustments: DepositAdjustment[] }> = ({
  adjustments,
}) => {
  return (
    <div>
      <h3>Deposit Adjustments</h3>
      {adjustments.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No adjustments found</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <span style={styles.tableCell}>ID</span>
            <span style={styles.tableCell}>Data</span>
          </div>
          {adjustments.map((adj) => (
            <div key={adj.id} style={styles.tableRow}>
              <span style={{ ...styles.tableCell, fontFamily: "monospace" }}>
                {adj.id.substring(0, 15)}...
              </span>
              <span style={styles.tableCell}>
                <pre style={styles.dataPreview}>
                  {JSON.stringify(adj, null, 2)}
                </pre>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper Functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Styles
const styles = {
  container: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
  spinnerContainer: {
    textAlign: "center" as const,
    padding: "50px",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #f3f3f3",
    borderTop: "5px solid #4285f4",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  header: {
    marginBottom: "30px",
  },
  title: {
    color: "#212529",
    margin: "0 0 10px 0",
  },
  subtitle: {
    color: "#6c757d",
    margin: "0 0 20px 0",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },
  statCard: {
    backgroundColor: "#f8f9fa",
    padding: "20px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    border: "1px solid #e9ecef",
  },
  statIcon: {
    fontSize: "2rem",
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: "1.5rem",
    fontWeight: "bold" as const,
    color: "#212529",
    margin: "5px 0 0 0",
  },
  tabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "25px",
    flexWrap: "wrap" as const,
  },
  tabButton: {
    flex: 1,
    minWidth: "150px",
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "600" as const,
    transition: "all 0.2s",
  },
  content: {
    minHeight: "400px",
  },
  accountsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "20px",
  },
  accountCard: {
    backgroundColor: "#f8f9fa",
    border: "1px solid #e0e0e0",
    borderRadius: "10px",
    overflow: "hidden",
  },
  accountHeader: {
    backgroundColor: "#e9ecef",
    padding: "15px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #dee2e6",
  },
  accountCode: {
    fontWeight: "bold" as const,
    fontSize: "1.1rem",
    color: "#212529",
  },
  accountBalance: {
    fontWeight: "bold" as const,
    fontSize: "1.1rem",
  },
  accountDetails: {
    padding: "20px",
  },
  depositSummary: {
    backgroundColor: "white",
    padding: "10px",
    borderRadius: "6px",
    marginTop: "10px",
    border: "1px solid #e9ecef",
  },
  accountStats: {
    backgroundColor: "#e9ecef",
    padding: "10px 20px",
    borderTop: "1px solid #dee2e6",
    display: "flex",
    justifyContent: "flex-end",
  },
  stat: {
    fontSize: "0.85rem",
    color: "#6c757d",
  },
  tableContainer: {
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    overflow: "hidden",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 2fr 1fr",
    backgroundColor: "#e9ecef",
    padding: "12px 15px",
    fontWeight: "bold" as const,
    color: "#495057",
    borderBottom: "1px solid #dee2e6",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 2fr 1fr",
    padding: "12px 15px",
    borderBottom: "1px solid #dee2e6",
    backgroundColor: "white",
  },
  tableCell: {
    padding: "5px 0",
    color: "#212529",
  },
  historyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  historyCard: {
    backgroundColor: "#f8f9fa",
    border: "1px solid #e0e0e0",
    borderRadius: "10px",
    overflow: "hidden",
  },
  historyHeader: {
    backgroundColor: "#e9ecef",
    padding: "15px",
    borderBottom: "1px solid #dee2e6",
  },
  historyMonth: {
    fontWeight: "bold" as const,
    color: "#212529",
    fontSize: "1.1rem",
  },
  historyContent: {
    padding: "15px",
  },
  historyData: {
    margin: 0,
    fontSize: "0.85rem",
    backgroundColor: "white",
    padding: "10px",
    borderRadius: "6px",
    overflow: "auto",
    maxHeight: "200px",
  },
  dataPreview: {
    margin: 0,
    fontSize: "0.8rem",
    backgroundColor: "#f8f9fa",
    padding: "10px",
    borderRadius: "4px",
    overflow: "auto",
    maxHeight: "100px",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "40px",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
    color: "#6c757d",
  },
  footer: {
    marginTop: "30px",
    paddingTop: "20px",
    borderTop: "1px solid #e9ecef",
    textAlign: "center" as const,
  },
  footerText: {
    color: "#6c757d",
    margin: "0 0 5px 0",
  },
  footerNote: {
    color: "#adb5bd",
    fontSize: "0.85rem",
    margin: 0,
  },
};

export default SmartDataViewer;
