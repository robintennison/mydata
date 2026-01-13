import { useEffect, useState } from "react";
import { ref, get, set } from "firebase/database";

import { database } from "../../../lib/firebase";

interface DataViewerProps {
  userId: string; // Firebase Auth UID (1LxMm1m0TqThXSIflX4xBUdHecL2)
}

const DataViewer: React.FC<DataViewerProps> = ({ userId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [databaseStructure, setDatabaseStructure] = useState<any>(null);

  // Helper to add debug messages
  const debugLog = (msg: string) => {
    console.log(`[DEBUG] ${msg}`);
    setDebugInfo((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${msg}`,
    ]);
  };

  useEffect(() => {
    if (!userId) return;

    const exploreDatabase = async () => {
      setLoading(true);
      setDebugInfo([]);
      setAccountId("");
      setData(null);
      setError("");

      try {
        debugLog(`Starting exploration for Auth user: ${userId}`);
        debugLog(
          `Looking for account ID: 21eDEyV9cUQdxdw1OqxT (known from database)`
        );

        // STEP 1: First, let's check the entire database structure
        debugLog("Checking complete database structure...");
        const rootRef = ref(database, "/");
        const rootSnapshot = await get(rootRef);

        if (!rootSnapshot.exists()) {
          debugLog("ERROR: Database root is completely empty!");
          setError("Database is completely empty. Check Firebase Console.");
          setLoading(false);
          return;
        }

        const rootData = rootSnapshot.val();
        setDatabaseStructure(rootData);
        debugLog(
          `✅ Database has data. Top-level keys: ${Object.keys(rootData).join(
            ", "
          )}`
        );

        // STEP 2: Check if 'accounts' node exists
        if (!rootData.accounts) {
          debugLog("❌ No 'accounts' node found in database");
          setError("No 'accounts' node found. Check your database structure.");
          setLoading(false);
          return;
        }

        debugLog(
          `✅ Found 'accounts' node with ${
            Object.keys(rootData.accounts).length
          } account(s)`
        );

        // STEP 3: Look for the specific account ID
        const targetAccountId = "21eDEyV9cUQdxdw1OqxT";
        if (!rootData.accounts[targetAccountId]) {
          debugLog(
            `❌ Account ID ${targetAccountId} not found under 'accounts'`
          );
          debugLog(
            `Available account IDs: ${Object.keys(rootData.accounts).join(
              ", "
            )}`
          );
          setError(
            `Account ${targetAccountId} not found. Available accounts: ${Object.keys(
              rootData.accounts
            ).join(", ")}`
          );
          setLoading(false);
          return;
        }

        debugLog(`✅ FOUND target account: ${targetAccountId}`);
        setAccountId(targetAccountId);

        // STEP 4: Check what's in this account
        const accountData = rootData.accounts[targetAccountId];
        debugLog(
          `Account ${targetAccountId} has ${
            Object.keys(accountData).length
          } item(s)`
        );
        debugLog(`Keys in account: ${Object.keys(accountData).join(", ")}`);

        // STEP 5: Try to create mapping automatically
        debugLog("Attempting to create user mapping...");
        try {
          const mappingRef = ref(database, `userMappings/${userId}`);
          await set(mappingRef, targetAccountId);
          debugLog(
            `✅ Created mapping: userMappings/${userId} = "${targetAccountId}"`
          );
        } catch (mapErr: any) {
          debugLog(
            `⚠️ Could not create mapping (might be permission issue): ${mapErr.message}`
          );
        }

        // STEP 6: Set the data for display
        setData(accountData);
        debugLog("✅ Data loaded successfully!");
      } catch (err: any) {
        debugLog(`❌ CRITICAL ERROR: ${err.message}`);
        setError(`Database error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    exploreDatabase();
  }, [userId]);

  // Function to manually set the account ID
  const useAccountId = (id: string) => {
    const fetchAccountData = async () => {
      setLoading(true);
      try {
        debugLog(`Manually fetching data for account: ${id}`);
        const accountRef = ref(database, `accounts/${id}`);
        const snapshot = await get(accountRef);

        if (snapshot.exists()) {
          setData(snapshot.val());
          setAccountId(id);
          setError("");
          debugLog(`✅ Successfully loaded data for account ${id}`);
        } else {
          setError(`No data found for account ${id}`);
        }
      } catch (err: any) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchAccountData();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2>🔍 Database Explorer - Loading...</h2>
          <p>
            User ID: <code>{userId}</code>
          </p>
          <p>
            Looking for account: <code>21eDEyV9cUQdxdw1OqxT</code>
          </p>
        </div>

        <div style={styles.spinnerContainer}>
          <div style={styles.spinner}></div>
          <p>Scanning your Firebase database...</p>
        </div>

        <div style={styles.debugPanel}>
          <h4>Debug Log:</h4>
          <div style={styles.debugLog}>
            {debugInfo.map((msg, idx) => (
              <div key={idx} style={styles.debugLine}>
                {msg.includes("✅")
                  ? "🟢"
                  : msg.includes("❌")
                  ? "🔴"
                  : msg.includes("⚠️")
                  ? "🟡"
                  : "🔵"}{" "}
                {msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2>⚠️ Database Exploration Results</h2>
          <p>
            <strong>Auth User ID:</strong> <code>{userId}</code>
          </p>
          <p>
            <strong>Target Account ID:</strong>{" "}
            <code>21eDEyV9cUQdxdw1OqxT</code>
          </p>
        </div>

        <div style={styles.errorCard}>
          <h3>{error || "No data loaded"}</h3>

          {databaseStructure && (
            <div style={styles.databaseInfo}>
              <h4>Database Structure Found:</h4>
              <div style={styles.codeBlock}>
                <pre>{JSON.stringify(databaseStructure, null, 2)}</pre>
              </div>
            </div>
          )}

          <div style={styles.manualSection}>
            <h4>Manual Account Selection:</h4>
            {databaseStructure?.accounts && (
              <div style={styles.accountList}>
                <p>Available accounts:</p>
                {Object.keys(databaseStructure.accounts).map((accId) => (
                  <button
                    key={accId}
                    onClick={() => useAccountId(accId)}
                    style={styles.accountButton}
                  >
                    {accId === "21eDEyV9cUQdxdw1OqxT" ? "⭐ " : ""}
                    {accId} (
                    {Object.keys(databaseStructure.accounts[accId]).length}{" "}
                    items)
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={styles.instructions}>
            <h4>Next Steps:</h4>
            <ol>
              <li>
                Check if account <code>21eDEyV9cUQdxdw1OqxT</code> exists in
                Firebase Console
              </li>
              <li>Verify database rules allow read access</li>
              <li>Try selecting an account manually from the list above</li>
              <li>Check browser console (F12) for more detailed errors</li>
            </ol>
          </div>
        </div>

        <div style={styles.debugPanel}>
          <h4>Debug Log:</h4>
          <div style={styles.debugLog}>
            {debugInfo.map((msg, idx) => (
              <div key={idx} style={styles.debugLine}>
                {msg.includes("✅")
                  ? "🟢"
                  : msg.includes("❌")
                  ? "🔴"
                  : msg.includes("⚠️")
                  ? "🟡"
                  : "🔵"}{" "}
                {msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Success - display the data
  const dataEntries = Object.entries(data);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>✅ Data Loaded Successfully!</h2>
        <div style={styles.successInfo}>
          <p>
            <strong>Auth User:</strong> {userId}
          </p>
          <p>
            <strong>Account ID:</strong> {accountId}
          </p>
          <p>
            <strong>Items Found:</strong> {dataEntries.length}
          </p>
        </div>
      </div>

      <div style={styles.dataSection}>
        <h3>Your Data:</h3>
        <div style={styles.dataGrid}>
          {dataEntries.map(([key, value]: [string, any], index) => (
            <div key={key} style={styles.dataCard}>
              <div style={styles.dataHeader}>
                <span style={styles.dataIndex}>#{index + 1}</span>
                <span style={styles.dataKey}>{key}</span>
              </div>
              <div style={styles.dataContent}>
                {typeof value === "object" ? (
                  <pre style={styles.dataJson}>
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <div style={styles.dataValue}>{String(value)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.debugPanel}>
        <h4>Debug Log:</h4>
        <div style={styles.debugLog}>
          {debugInfo.slice(-10).map((msg, idx) => (
            <div key={idx} style={styles.debugLine}>
              {msg.includes("✅")
                ? "🟢"
                : msg.includes("❌")
                ? "🔴"
                : msg.includes("⚠️")
                ? "🟡"
                : "🔵"}{" "}
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
  },
  header: {
    backgroundColor: "#4285f4",
    color: "white",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
  },
  successInfo: {
    display: "flex",
    gap: "20px",
    marginTop: "10px",
    fontSize: "0.9rem",
  },
  spinnerContainer: {
    textAlign: "center" as const,
    padding: "40px",
    backgroundColor: "white",
    borderRadius: "10px",
    marginBottom: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  spinner: {
    width: "60px",
    height: "60px",
    border: "5px solid #f3f3f3",
    borderTop: "5px solid #4285f4",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  errorCard: {
    backgroundColor: "#ffebee",
    borderLeft: "4px solid #f44336",
    padding: "25px",
    borderRadius: "10px",
    marginBottom: "20px",
  },
  databaseInfo: {
    backgroundColor: "#f5f5f5",
    padding: "15px",
    borderRadius: "8px",
    margin: "15px 0",
    maxHeight: "300px",
    overflow: "auto",
  },
  codeBlock: {
    backgroundColor: "#2d2d2d",
    color: "#f8f8f2",
    padding: "15px",
    borderRadius: "6px",
    overflow: "auto",
    fontSize: "0.8rem",
  },
  manualSection: {
    backgroundColor: "#e3f2fd",
    padding: "20px",
    borderRadius: "8px",
    margin: "15px 0",
  },
  accountList: {
    marginTop: "10px",
  },
  accountButton: {
    display: "block",
    width: "100%",
    padding: "12px",
    margin: "5px 0",
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer",
    textAlign: "left" as const,
    fontSize: "0.9rem",
  },
  instructions: {
    backgroundColor: "#fff3e0",
    padding: "15px",
    borderRadius: "8px",
    marginTop: "20px",
  },
  dataSection: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "10px",
    marginBottom: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  dataGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "15px",
    marginTop: "15px",
  },
  dataCard: {
    backgroundColor: "#f8f9fa",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    overflow: "hidden",
  },
  dataHeader: {
    backgroundColor: "#e9ecef",
    padding: "12px 15px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderBottom: "1px solid #dee2e6",
  },
  dataIndex: {
    backgroundColor: "#6c757d",
    color: "white",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    fontWeight: "bold" as const,
  },
  dataKey: {
    fontFamily: "monospace",
    fontWeight: "bold" as const,
    color: "#495057",
  },
  dataContent: {
    padding: "15px",
  },
  dataValue: {
    fontSize: "0.95rem",
    color: "#212529",
    wordBreak: "break-all" as const,
  },
  dataJson: {
    margin: 0,
    fontSize: "0.8rem",
    backgroundColor: "white",
    padding: "10px",
    borderRadius: "4px",
    overflow: "auto",
    maxHeight: "200px",
    border: "1px solid #e9ecef",
  },
  debugPanel: {
    backgroundColor: "#1a1a1a",
    color: "#f0f0f0",
    padding: "20px",
    borderRadius: "10px",
    marginTop: "20px",
  },
  debugLog: {
    fontFamily: "'Courier New', monospace",
    fontSize: "0.85rem",
    maxHeight: "300px",
    overflowY: "auto" as const,
    padding: "10px",
    backgroundColor: "#2d2d2d",
    borderRadius: "6px",
  },
  debugLine: {
    padding: "4px 0",
    borderBottom: "1px solid #444",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};

export default DataViewer;
