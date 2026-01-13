import { useEffect, useState } from "react";
import { database, firestore } from "../lib/firebase";
import { ref, get } from "firebase/database";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

interface DualDataViewerProps {
  userId: string;
}

const DualDataViewer: React.FC<DualDataViewerProps> = ({ userId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"realtime" | "firestore" | null>(null);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [allAccounts, setAllAccounts] = useState<Record<string, any> | null>(
    null
  );

  const addDebug = (msg: string) => {
    console.log(msg);
    setDebugInfo((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${msg}`,
    ]);
  };

  useEffect(() => {
    const checkBothDatabases = async () => {
      setLoading(true);
      addDebug("Starting database check...");

      // Try Firestore first (most likely)
      addDebug("1. Checking Firestore Database...");

      try {
        // Try to get the accounts collection
        const accountsColRef = collection(firestore, "accounts");
        const accountsSnapshot = await getDocs(accountsColRef);

        if (!accountsSnapshot.empty) {
          addDebug(
            `✅ Found Firestore "accounts" collection with ${accountsSnapshot.size} documents`
          );

          const accountsData: Record<string, any> = {};
          accountsSnapshot.forEach((doc) => {
            accountsData[doc.id] = doc.data();
          });

          // Save all accounts for display
          setAllAccounts(accountsData);

          // Check if our target account exists
          if (accountsData["21eDEyV9cUQdxdw1OqxT"]) {
            addDebug(`✅ Found target account: 21eDEyV9cUQdxdw1OqxT`);
            setData(accountsData["21eDEyV9cUQdxdw1OqxT"]);
            setSource("firestore");
            setLoading(false);
            return;
          } else {
            addDebug(
              `❌ Target account not found. Available accounts: ${Object.keys(
                accountsData
              ).join(", ")}`
            );
            // Show first account for debugging
            const firstAccountId = Object.keys(accountsData)[0];
            setData(accountsData[firstAccountId]);
            setSource("firestore");
            setLoading(false);
            return;
          }
        } else {
          addDebug('Firestore "accounts" collection exists but is empty');
        }

        // Try users collection
        const usersColRef = collection(firestore, "users");
        const usersSnapshot = await getDocs(usersColRef);

        if (!usersSnapshot.empty) {
          addDebug(
            `✅ Found Firestore "users" collection with ${usersSnapshot.size} documents`
          );

          const usersData: Record<string, any> = {};
          usersSnapshot.forEach((doc) => {
            usersData[doc.id] = doc.data();
          });

          setData(usersData);
          setSource("firestore");
          setLoading(false);
          return;
        }

        // Try direct document access
        addDebug("Trying direct document access...");
        const accountDocRef = doc(
          firestore,
          "accounts",
          "21eDEyV9cUQdxdw1OqxT"
        );
        const accountDocSnap = await getDoc(accountDocRef);

        if (accountDocSnap.exists()) {
          addDebug(`✅ Found direct document: accounts/21eDEyV9cUQdxdw1OqxT`);
          setData(accountDocSnap.data());
          setSource("firestore");
          setLoading(false);
          return;
        }

        addDebug("❌ No data found in Firestore");
      } catch (firestoreErr: any) {
        addDebug(
          `Firestore error: ${firestoreErr.message} (code: ${firestoreErr.code})`
        );
      }

      // Try Realtime Database second (for completeness)
      addDebug("2. Checking Realtime Database...");

      try {
        const accountsRef = ref(database, "accounts");
        const accountsSnapshot = await get(accountsRef);

        if (accountsSnapshot.exists()) {
          const accountsData = accountsSnapshot.val();
          addDebug(`✅ Found Realtime Database "accounts" node`);
          setData(accountsData);
          setSource("realtime");
          setLoading(false);
          return;
        }

        addDebug("❌ Realtime Database is empty");
      } catch (realtimeErr: any) {
        addDebug(`Realtime DB error: ${realtimeErr.message}`);
      }

      // If we get here, no data found
      setError("No data found in either Firebase database.");
      setLoading(false);
    };

    checkBothDatabases();
  }, [userId]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.darkText}>🔍 Checking Firebase Databases...</h2>
        </div>

        <div style={styles.spinnerContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.darkText}>Scanning for your data...</p>
        </div>

        <div style={styles.debugSection}>
          <h4 style={styles.darkText}>Progress Log:</h4>
          <div style={styles.debugLog}>
            {debugInfo.map((msg, idx) => (
              <div key={idx} style={styles.debugLine}>
                {msg.includes("✅") ? "✅" : msg.includes("❌") ? "❌" : "🔍"}{" "}
                {msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h3 style={styles.darkText}>⚠️ No Data Found</h3>
          <p style={styles.darkText}>{error}</p>
        </div>

        <div style={styles.debugSection}>
          <h4 style={styles.darkText}>Debug Log:</h4>
          <div style={styles.debugLog}>
            {debugInfo.map((msg, idx) => (
              <div key={idx} style={styles.debugLine}>
                {msg.includes("✅") ? "✅" : msg.includes("❌") ? "❌" : "🔍"}{" "}
                {msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Success - display data with better formatting
  const dataEntries = Object.entries(data || {});

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.success,
          backgroundColor: source === "firestore" ? "#e8f5e9" : "#e3f2fd",
          borderLeftColor: source === "firestore" ? "#34a853" : "#4285f4",
        }}
      >
        <h3 style={styles.darkText}>
          {source === "firestore"
            ? "✅ Firestore Data Found"
            : "✅ Realtime Database Data Found"}
        </h3>
        <p style={styles.darkText}>
          <strong>Source:</strong>{" "}
          {source === "firestore" ? "Cloud Firestore" : "Realtime Database"}
        </p>
        <p style={styles.darkText}>
          <strong>Account ID:</strong> 21eDEyV9cUQdxdw1OqxT
        </p>
        <p style={styles.darkText}>
          <strong>Items Found:</strong> {dataEntries.length}
        </p>
      </div>

      <div style={styles.dataSection}>
        <h3 style={styles.darkText}>Your Account Data:</h3>

        <div style={styles.dataGrid}>
          {dataEntries.map(([key, value]: [string, any]) => (
            <div key={key} style={styles.dataCard}>
              <div style={styles.dataHeader}>
                <span style={styles.dataLabel}>{formatKey(key)}</span>
                <span style={styles.dataType}>{typeof value}</span>
              </div>
              <div style={styles.dataValue}>
                {typeof value === "object" ? (
                  <pre style={styles.dataJson}>
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <span style={getValueStyle(value)}>
                    {formatValue(key, value)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {allAccounts && (
        <div style={styles.allAccounts}>
          <h4 style={styles.darkText}>
            All Accounts in Database ({Object.keys(allAccounts).length} total):
          </h4>
          <div style={styles.accountsList}>
            {Object.entries(allAccounts).map(
              ([accountId, accountData]: [string, any]) => (
                <div
                  key={accountId}
                  style={{
                    ...styles.accountItem,
                    backgroundColor:
                      accountId === "21eDEyV9cUQdxdw1OqxT"
                        ? "#fff3e0"
                        : "white",
                  }}
                >
                  <div style={styles.accountHeader}>
                    <span style={styles.accountId}>
                      {accountId === "21eDEyV9cUQdxdw1OqxT" ? "⭐ " : ""}
                      {accountId}
                    </span>
                    <span style={styles.accountStats}>
                      {Object.keys(accountData).length} fields
                    </span>
                  </div>
                  {accountId === "21eDEyV9cUQdxdw1OqxT" && (
                    <div style={styles.currentAccountNote}>
                      <small>👆 This is your current account</small>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}

      <div style={styles.debugSection}>
        <h4 style={styles.darkText}>Debug Log:</h4>
        <div style={styles.debugLog}>
          {debugInfo.slice(-5).map((msg, idx) => (
            <div key={idx} style={styles.debugLine}>
              {msg.includes("✅") ? "✅" : msg.includes("❌") ? "❌" : "🔍"}{" "}
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper functions for formatting
const formatKey = (key: string): string => {
  const formatted = key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
  return formatted;
};

const formatValue = (key: string, value: any): string => {
  if (
    key.toLowerCase().includes("amount") ||
    key.toLowerCase().includes("balance")
  ) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(Number(value));
  }
  return String(value);
};

const getValueStyle = (value: any) => {
  const numValue = Number(value);
  if (!isNaN(numValue)) {
    return {
      color: numValue < 0 ? "#d32f2f" : "#2e7d32",
      fontWeight: "bold" as const,
      fontSize: "1.1rem",
    };
  }
  return { color: "#333" };
};

const styles = {
  container: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    marginBottom: "20px",
  },
  header: {
    marginBottom: "20px",
  },
  darkText: {
    color: "#212529", // Dark color for readability
    margin: 0,
  },
  spinnerContainer: {
    textAlign: "center" as const,
    padding: "30px",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
    marginBottom: "20px",
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
  success: {
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "25px",
    borderLeft: "5px solid",
  },
  error: {
    backgroundColor: "#ffebee",
    borderLeft: "4px solid #f44336",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
  },
  dataSection: {
    marginBottom: "30px",
  },
  dataGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
    marginTop: "15px",
  },
  dataCard: {
    backgroundColor: "#f8f9fa",
    border: "1px solid #e0e0e0",
    borderRadius: "10px",
    overflow: "hidden",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  dataHeader: {
    backgroundColor: "#e9ecef",
    padding: "15px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #dee2e6",
  },
  dataLabel: {
    fontWeight: "600" as const,
    color: "#495057",
    fontSize: "1rem",
  },
  dataType: {
    backgroundColor: "#6c757d",
    color: "white",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "bold" as const,
  },
  dataValue: {
    padding: "20px",
    color: "#212529",
  },
  dataJson: {
    margin: 0,
    fontSize: "0.85rem",
    backgroundColor: "white",
    padding: "15px",
    borderRadius: "6px",
    overflow: "auto",
    maxHeight: "200px",
    border: "1px solid #e9ecef",
    color: "#212529",
  },
  allAccounts: {
    backgroundColor: "#f8f9fa",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
  },
  accountsList: {
    marginTop: "15px",
    maxHeight: "300px",
    overflowY: "auto" as const,
  },
  accountItem: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "10px",
    transition: "background-color 0.2s",
  },
  accountHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "5px",
  },
  accountId: {
    fontFamily: "monospace",
    fontWeight: "600" as const,
    color: "#333",
    fontSize: "0.9rem",
  },
  accountStats: {
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "bold" as const,
  },
  currentAccountNote: {
    marginTop: "5px",
    fontSize: "0.8rem",
    color: "#ff9800",
    fontStyle: "italic" as const,
  },
  debugSection: {
    backgroundColor: "#f5f5f5",
    padding: "15px",
    borderRadius: "8px",
    marginTop: "20px",
  },
  debugLog: {
    fontFamily: "monospace",
    fontSize: "0.85rem",
    maxHeight: "150px",
    overflowY: "auto" as const,
    padding: "10px",
    backgroundColor: "#2d2d2d",
    color: "#f0f0f0",
    borderRadius: "6px",
    marginTop: "10px",
  },
  debugLine: {
    padding: "4px 0",
    borderBottom: "1px solid #444",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};

export default DualDataViewer;
