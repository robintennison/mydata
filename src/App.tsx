import { useEffect, useState } from "react";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import LoginForm from "./components/Auth/LoginForm";
import EnhancedBankingModule from "./modules/Banking/EnhancedBankingModule";
import JewelleryViewer from "./modules/Jewellery/JewelleryViewer";
import PropertiesViewer from "./modules/Properties/PropertiesViewer";
import OnlineViewer from "./modules/Online/OnlineViewer";
import FileUpload from "./components/FileUpload";
import "./App.css";
import { SettingsProvider } from "./contexts/SettingsContext";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"data" | "upload">("data");
  const [activeModule, setActiveModule] = useState<
    "banking" | "jewellery" | "properties" | "online"
  >("banking");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error: any) {
      console.error("Logout error:", error.message);
    }
  };

  const getModuleButtonStyle = (module: string) => ({
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    marginBottom: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    textAlign: "left" as const,
    transition: "background-color 0.2s",
    backgroundColor: activeModule === module ? "#4285f4" : "transparent",
    color: activeModule === module ? "white" : "#333",
  });

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Connecting to Firebase...</p>
      </div>
    );
  }

  return (
    <SettingsProvider>
      <div style={styles.container}>
        <div style={styles.app}>
          <header style={styles.header}>
            <div style={styles.headerContent}>
              <h1 style={styles.logo}>
                <span style={styles.logoIcon}>📱</span>
                My Data Web
              </h1>
              {user && (
                <div style={styles.userMenu}>
                  <span style={styles.userEmail}>{user.email}</span>
                  <button onClick={handleLogout} style={styles.logoutButton}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </header>

          <main style={styles.main}>
            {user ? (
              <div style={styles.dashboard}>
                <div style={styles.sidebar}>
                  <div style={styles.userCard}>
                    <div style={styles.avatar}>
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div style={styles.userInfo}>
                      <h3>{user.email}</h3>
                      <p style={styles.userId}>
                        ID: {user.uid.substring(0, 10)}...
                      </p>
                    </div>
                  </div>

                  <nav style={styles.nav}>
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        color: "#666",
                        fontSize: "0.9rem",
                      }}
                    >
                      Modules
                    </h4>

                    <button
                      onClick={() => {
                        setActiveModule("banking");
                        setActiveTab("data");
                      }}
                      style={getModuleButtonStyle("banking")}
                    >
                      🏦 Enhanced Banking
                    </button>

                    <button
                      onClick={() => {
                        setActiveModule("jewellery");
                        setActiveTab("data");
                      }}
                      style={getModuleButtonStyle("jewellery")}
                    >
                      💎 Jewellery
                    </button>

                    <button
                      onClick={() => {
                        setActiveModule("properties");
                        setActiveTab("data");
                      }}
                      style={getModuleButtonStyle("properties")}
                    >
                      🏠 Properties
                    </button>

                    <button
                      onClick={() => {
                        setActiveModule("online");
                        setActiveTab("data");
                      }}
                      style={getModuleButtonStyle("online")}
                    >
                      🌐 Online
                    </button>
                  </nav>

                  <nav style={styles.nav}>
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        color: "#666",
                        fontSize: "0.9rem",
                      }}
                    >
                      Actions
                    </h4>
                    <button
                      onClick={() => setActiveTab("data")}
                      style={{
                        ...styles.navButton,
                        backgroundColor:
                          activeTab === "data" ? "#4285f4" : "transparent",
                        color: activeTab === "data" ? "white" : "#333",
                      }}
                    >
                      📊 View Data
                    </button>
                    <button
                      onClick={() => setActiveTab("upload")}
                      style={{
                        ...styles.navButton,
                        backgroundColor:
                          activeTab === "upload" ? "#4285f4" : "transparent",
                        color: activeTab === "upload" ? "white" : "#333",
                      }}
                    >
                      📁 Upload Files
                    </button>
                  </nav>

                  <div style={styles.projectInfo}>
                    <h4>Project Info</h4>
                    <p>
                      <strong>Project:</strong> robintennison-mydata
                    </p>
                    <p>
                      <strong>Active Module:</strong> {activeModule}
                    </p>
                    <p>
                      <strong>Storage:</strong> Firebase Storage
                    </p>
                  </div>
                </div>

                <div style={styles.content}>
                  {activeTab === "data" ? (
                    (() => {
                      switch (activeModule) {
                        case "banking":
                          return <EnhancedBankingModule />;
                        case "jewellery":
                          return <JewelleryViewer userId={user.uid} />;
                        case "properties":
                          return <PropertiesViewer userId={user.uid} />;
                        case "online":
                          return <OnlineViewer userId={user.uid} />;
                        default:
                          return <EnhancedBankingModule />;
                      }
                    })()
                  ) : (
                    <FileUpload userId={user.uid} />
                  )}
                </div>
              </div>
            ) : (
              <div style={styles.loginContainer}>
                <div style={styles.loginCard}>
                  <div style={styles.welcome}>
                    <h2>Welcome to My Data Web</h2>
                    <p>Access your Android app data from any device</p>
                  </div>
                  <LoginForm />
                  <div style={styles.features}>
                    <h3>Features:</h3>
                    <ul style={styles.featureList}>
                      <li>📱 Same data as Android app</li>
                      <li>☁️ Real-time Firebase sync</li>
                      <li>📁 File upload to Storage</li>
                      <li>🔒 Secure authentication</li>
                      <li>
                        🏦 Enhanced Banking Module (Accounts, Deposits, Summary,
                        History)
                      </li>
                      <li>💎 Jewellery Tracking</li>
                      <li>🏠 Property Management</li>
                      <li>🌐 Online Accounts</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </main>

          <footer style={styles.footer}>
            <p>
              Connected to Firebase • Same data as Android app • Personal use
              only • Active Module: {activeModule}
            </p>
          </footer>
        </div>
      </div>
    </SettingsProvider>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  app: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #f3f3f3",
    borderTop: "5px solid #4285f4",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },
  header: {
    backgroundColor: "#4285f4",
    color: "white",
    padding: "1rem 2rem",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
  },
  logo: {
    margin: 0,
    fontSize: "1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: {
    fontSize: "1.8rem",
  },
  userMenu: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  userEmail: {
    fontSize: "0.9rem",
    opacity: 0.9,
  },
  logoutButton: {
    backgroundColor: "white",
    color: "#4285f4",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "600" as const,
  },
  main: {
    flex: 1,
    padding: "20px",
  },
  dashboard: {
    display: "flex",
    gap: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
  },
  sidebar: {
    width: "250px",
    flexShrink: 0,
  },
  userCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
  },
  avatar: {
    width: "50px",
    height: "50px",
    backgroundColor: "#4285f4",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.2rem",
    fontWeight: "bold" as const,
  },
  userInfo: {
    flex: 1,
  },
  userId: {
    fontSize: "0.8rem",
    color: "#666",
    wordBreak: "break-all" as const,
  },
  nav: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "15px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    marginBottom: "20px",
  },
  navButton: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    marginBottom: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    textAlign: "left" as const,
    transition: "background-color 0.2s",
  },
  projectInfo: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    fontSize: "0.9rem",
  },
  content: {
    flex: 1,
  },
  loginContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "70vh",
  },
  loginCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
    maxWidth: "500px",
    width: "100%",
  },
  welcome: {
    textAlign: "center" as const,
    marginBottom: "30px",
  },
  features: {
    marginTop: "30px",
    padding: "20px",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
  },
  featureList: {
    listStyleType: "none",
    padding: 0,
    margin: "10px 0 0 0",
  },
  footer: {
    backgroundColor: "#333",
    color: "white",
    textAlign: "center" as const,
    padding: "20px",
    fontSize: "0.9rem",
    marginTop: "auto",
  },
};

export default App;
