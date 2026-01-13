import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database } from "../../../lib/firebase";

interface DatabaseExplorerProps {
  userId: string;
}

const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({ userId }) => {
  const [rootData, setRootData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const exploreDatabase = async () => {
      setLoading(true);
      try {
        // Try to get the entire database root to see structure
        const rootRef = ref(database, "/");
        const snapshot = await get(rootRef);

        if (snapshot.exists()) {
          setRootData(snapshot.val());
          console.log("Database structure:", snapshot.val());
        } else {
          setError("Database is empty");
        }
      } catch (err: any) {
        setError(err.message);
        console.error("Database exploration error:", err);
      } finally {
        setLoading(false);
      }
    };

    exploreDatabase();
  }, [userId]);

  if (loading) {
    return <div>Exploring database structure...</div>;
  }

  if (error) {
    return (
      <div
        style={{ color: "red", padding: "20px", backgroundColor: "#ffebee" }}
      >
        <h4>Error exploring database:</h4>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3>Database Structure Explorer</h3>
      <p>This shows all data in your Firebase Realtime Database:</p>

      <div style={styles.structure}>
        <pre style={styles.code}>{JSON.stringify(rootData, null, 2)}</pre>
      </div>

      <div style={styles.tips}>
        <h4>Common Database Paths:</h4>
        <ul>
          <li>
            <code>users/{userId}</code>
          </li>
          <li>
            <code>users/{userId}/data</code>
          </li>
          <li>
            <code>userData/{userId}</code>
          </li>
          <li>
            <code>data/{userId}</code>
          </li>
          <li>
            <code>/{userId}</code> (directly under root)
          </li>
        </ul>
        <p>
          Look at the structure above to see where your data is actually stored.
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    marginTop: "20px",
  },
  structure: {
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderRadius: "8px",
    maxHeight: "500px",
    overflow: "auto",
    margin: "20px 0",
  },
  code: {
    margin: 0,
    fontSize: "0.9rem",
    fontFamily: "monospace",
  },
  tips: {
    backgroundColor: "#e3f2fd",
    padding: "15px",
    borderRadius: "8px",
  },
};

export default DatabaseExplorer;
