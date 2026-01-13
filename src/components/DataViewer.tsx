import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "../lib/firebase";

interface DataViewerProps {
  userId: string;
}

const DataViewer: React.FC<DataViewerProps> = ({ userId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!userId) return;

    setLoading(true);

    // Reference to user's data in Firebase Realtime Database
    const userDataRef = ref(database, `users/${userId}`);

    const unsubscribe = onValue(
      userDataRef,
      (snapshot) => {
        try {
          const userData = snapshot.val();
          setData(userData);
          setError("");
        } catch (err: any) {
          setError(err.message || "Failed to load data");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      off(userDataRef, "value", unsubscribe);
    };
  }, [userId]);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading your data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <h4>⚠️ Unable to load data</h4>
        <p>{error}</p>
        <p style={styles.errorNote}>
          This could mean:
          <ul>
            <li>No data exists yet in Firebase</li>
            <li>Database rules don't allow read access</li>
            <li>Data is stored in a different path</li>
          </ul>
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>📭</div>
        <h3>No Data Found</h3>
        <p>Your Firebase database doesn't have any data yet.</p>
        <div style={styles.tip}>
          <p>
            <strong>Tip:</strong> Add data through your Android app first, then
            refresh this page.
          </p>
          <p>
            Data path: <code>users/{userId}</code>
          </p>
        </div>
      </div>
    );
  }

  // Convert object to array for easier display
  const dataEntries = Object.entries(data);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>Your Data ({dataEntries.length} items)</h3>
        <div style={styles.stats}>
          <span style={styles.stat}>📊 Total items: {dataEntries.length}</span>
          <span style={styles.stat}>🆔 User: {userId.substring(0, 8)}...</span>
        </div>
      </div>

      <div style={styles.dataContainer}>
        {dataEntries.map(([key, value]: [string, any], index) => (
          <div key={key} style={styles.dataItem}>
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
  );
};

const styles = {
  container: {
    width: "100%",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "20px",
  },
  loading: {
    textAlign: "center" as const,
    padding: "40px",
    color: "#666",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #4285f4",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  error: {
    backgroundColor: "#ffebee",
    borderLeft: "4px solid #f44336",
    padding: "20px",
    borderRadius: "8px",
    margin: "20px 0",
  },
  errorNote: {
    fontSize: "0.9rem",
    color: "#666",
    marginTop: "10px",
  },
  empty: {
    textAlign: "center" as const,
    padding: "40px",
    backgroundColor: "#f9f9f9",
    borderRadius: "12px",
    border: "2px dashed #ddd",
  },
  emptyIcon: {
    fontSize: "3rem",
    marginBottom: "15px",
  },
  tip: {
    backgroundColor: "#e8f5e9",
    padding: "15px",
    borderRadius: "8px",
    marginTop: "20px",
    textAlign: "left" as const,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "2px solid #eee",
  },
  stats: {
    display: "flex",
    gap: "15px",
  },
  stat: {
    backgroundColor: "#e3f2fd",
    padding: "8px 15px",
    borderRadius: "20px",
    fontSize: "0.9rem",
    color: "#1976d2",
  },
  dataContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "15px",
  },
  dataItem: {
    backgroundColor: "white",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    transition: "transform 0.2s",
  },
  dataHeader: {
    backgroundColor: "#f5f5f5",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderBottom: "1px solid #eee",
  },
  dataIndex: {
    backgroundColor: "#4285f4",
    color: "white",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.9rem",
    fontWeight: "bold" as const,
  },
  dataKey: {
    fontFamily: "monospace",
    fontWeight: "bold" as const,
    color: "#333",
  },
  dataContent: {
    padding: "15px 20px",
  },
  dataValue: {
    fontSize: "1rem",
    color: "#333",
    wordBreak: "break-all" as const,
  },
  dataJson: {
    margin: 0,
    fontSize: "0.9rem",
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderRadius: "6px",
    overflow: "auto",
    maxHeight: "300px",
  },
};

export default DataViewer;
