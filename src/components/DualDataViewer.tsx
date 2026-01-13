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
            setData(accountsData); // Show all accounts for debugging
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

        // Try user document
        const userDocRef = doc(firestore, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          addDebug(`✅ Found user document: users/${userId}`);
          setData(userDocSnap.data());
          setSource("firestore");
          setLoading(false);
          return;
        }

        addDebug("❌ No data found in Firestore");
      } catch (firestoreErr: any) {
        addDebug(
          `Firestore error: ${firestoreErr.message} (code: ${firestoreErr.code})`
        );

        // If permission denied, database might not exist or rules block access
        if (firestoreErr.code === "permission-denied") {
          addDebug(
            "Firestore permission denied. Check Firestore rules or if database exists."
          );
        }
      }

      // Try Realtime Database second
      addDebug("2. Checking Realtime Database...");

      try {
        // Try to get accounts data
        const accountsRef = ref(database, "accounts");
        const accountsSnapshot = await get(accountsRef);

        if (accountsSnapshot.exists()) {
          const accountsData = accountsSnapshot.val();
          addDebug(`✅ Found Realtime Database "accounts" node`);

          if (accountsData["21eDEyV9cUQdxdw1OqxT"]) {
            addDebug(`✅ Found target account in Realtime DB`);
            setData(accountsData["21eDEyV9cUQdxdw1OqxT"]);
            setSource("realtime");
            setLoading(false);
            return;
          } else {
            addDebug(
              `Available accounts: ${Object.keys(accountsData).join(", ")}`
            );
            setData(accountsData);
            setSource("realtime");
            setLoading(false);
            return;
          }
        }

        // Try users data
        const usersRef = ref(database, `users/${userId}`);
        const usersSnapshot = await get(usersRef);

        if (usersSnapshot.exists()) {
          addDebug(`✅ Found user data in Realtime DB: users/${userId}`);
          setData(usersSnapshot.val());
          setSource("realtime");
          setLoading(false);
          return;
        }

        // Try root to see structure
        const rootRef = ref(database, "/");
        const rootSnapshot = await get(rootRef);

        if (rootSnapshot.exists()) {
          const rootData = rootSnapshot.val();
          addDebug(
            `Realtime DB has data. Keys: ${Object.keys(rootData).join(", ")}`
          );
          setData(rootData);
          setSource("realtime");
        } else {
          addDebug("❌ Realtime Database is completely empty");
        }
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
        <h3>🔍 Checking Firebase Databases...</h3>
        <div style={styles.spinner}></div>

        <div style={styles.debugSection}>
          <h4>Progress Log:</h4>
          <div style={styles.debugLog}>
            {debugInfo.map((msg, idx) => (
              <div key={idx} style={styles.debugLine}>
                {msg.includes("✅") ? "✅" : msg.includes("❌") ? "❌" : "🔍"}{" "}
                {msg}
              </div>
            ))}
          </div>
        </div>

        <div style={styles.instructions}>
          <p>
            <strong>Checking:</strong>
          </p>
          <ol>
            <li>Firestore Database → "accounts" collection</li>
            <li>Firestore Database → "users" collection</li>
            <li>Realtime Database → "accounts" node</li>
            <li>Realtime Database → "users" node</li>
          </ol>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h3>⚠️ No Data Found</h3>
          <p>{error}</p>

          <div style={styles.suggestions}>
            <h4>Please check in Firebase Console:</h4>
            <ol>
              <li>
                Go to <strong>Firestore Database → Data tab</strong>
              </li>
              <li>Do you see any collections? (accounts, users, etc.)</li>
              <li>
                Go to <strong>Realtime Database → Data tab</strong>
              </li>
              <li>Is there any data there?</li>
            </ol>
            <p>
              <strong>Screenshots would be very helpful!</strong>
            </p>
          </div>
        </div>

        <div style={styles.debugSection}>
          <h4>Debug Log:</h4>
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

  // Success - display data
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
        <h3>
          {source === "firestore"
            ? "✅ Firestore Data Found"
            : "✅ Realtime Database Data Found"}
        </h3>
        <p>
          <strong>Source:</strong>{" "}
          {source === "firestore" ? "Cloud Firestore" : "Realtime Database"}
        </p>
        <p>
          <strong>Items Found:</strong> {dataEntries.length}
        </p>
      </div>

      <div style={styles.dataSection}>
        <h4>Your Data:</h4>
        <pre style={styles.code}>{JSON.stringify(data, null, 2)}</pre>
      </div>

      <div style={styles.debugSection}>
        <h4>Debug Log:</h4>
        <div style={styles.debugLog}>
          {debugInfo.slice(-10).map((msg, idx) => (
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

const styles = {
  container: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    marginBottom: "20px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #4285f4",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "20px auto",
  },
  success: {
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
    borderLeft: "4px solid",
  },
  error: {
    backgroundColor: "#ffebee",
    borderLeft: "4px solid #f44336",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  suggestions: {
    backgroundColor: "#fff3e0",
    padding: "15px",
    borderRadius: "6px",
    marginTop: "15px",
  },
  dataSection: {
    backgroundColor: "#f8f9fa",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
    overflow: "auto",
    maxHeight: "500px",
  },
  code: {
    margin: 0,
    fontSize: "0.9rem",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap" as const,
  },
  debugSection: {
    backgroundColor: "#f5f5f5",
    padding: "15px",
    borderRadius: "8px",
  },
  debugLog: {
    fontFamily: "monospace",
    fontSize: "0.85rem",
    maxHeight: "200px",
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
  instructions: {
    backgroundColor: "#e3f2fd",
    padding: "15px",
    borderRadius: "8px",
    marginTop: "20px",
    fontSize: "0.9rem",
  },
};

export default DualDataViewer;
