import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import LoginForm from "./components/Auth/LoginForm";
import MyDataHomepage from "./MyDataHomepage";
import JewelleryViewer from "./modules/Jewellery/JewelleryViewer";
import PropertiesViewer from "./modules/Properties/PropertiesViewer";
import OnlineViewer from "./modules/Online/OnlineViewer";
import "./App.css";
import { SettingsProvider } from "./contexts/SettingsContext";
import BankingHomePage from "./modules/Banking/BankingHomePage";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
          {/* Simple Header - Only show on login page */}
          {!user && (
            <header style={styles.header}>
              <div style={styles.headerContent}>
                <h1 style={styles.logo}>
                  <span style={styles.logoIcon}>📱</span>
                  My Data Web
                </h1>
              </div>
            </header>
          )}

          <main style={styles.main}>
            <Routes>
              {/* Default route - Show MyDataHomepage after login */}
              <Route
                path="/"
                element={user ? <MyDataHomepage /> : <LoginForm />}
              />

              {/* Banking route - Only accessible from navigation */}
              <Route
                path="/banking"
                element={
                  user ? <BankingHomePage /> : <Navigate to="/" replace />
                }
              />

              {/* Other module routes */}
              <Route
                path="/jewellery"
                element={
                  user ? (
                    <JewelleryViewer userId={user.uid} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              <Route
                path="/properties"
                element={
                  user ? (
                    <PropertiesViewer userId={user.uid} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              <Route
                path="/online"
                element={
                  user ? (
                    <OnlineViewer userId={user.uid} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              {/* Settings route */}
              <Route
                path="/settings"
                element={
                  user ? <div>Settings Page</div> : <Navigate to="/" replace />
                }
              />

              {/* Catch-all route - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Simple Footer */}
          <footer style={styles.footer}>
            <p>
              Connected to Firebase • Same data as Android app • Personal use
              only
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
    justifyContent: "center",
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
  main: {
    flex: 1,
  },
  loginContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
    padding: "20px",
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
    padding: "15px",
    fontSize: "0.8rem",
    marginTop: "auto",
  },
};

export default App;
