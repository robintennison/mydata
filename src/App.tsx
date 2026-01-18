// src/App.tsx
import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { AppRoutes } from "./routes";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ErrorProvider } from "./contexts/ErrorContext";

// Import global styles
import "./shared/styles/design-tokens.css";
import "./shared/styles/base.css";
import "./shared/styles/utilities.css";

// Import App-specific CSS
import "./App.css";
import styles from "./App.module.css"; // Create this file

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
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Connecting to Firebase...</p>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <ErrorProvider>
      <SettingsProvider>
        <BrowserRouter>
          <div className={styles.container}>
            <div className={styles.app}>
              {/* Simple Header - Only show on login page */}
              {!isAuthenticated && (
                <header className={styles.header}>
                  <div className={styles.headerContent}>
                    <h1 className={styles.logo}>
                      <span className={styles.logoIcon}>📱</span>
                      My Data Web
                    </h1>
                  </div>
                </header>
              )}

              <main className={styles.main}>
                <AppRoutes isAuthenticated={isAuthenticated} user={user} />
              </main>

              {/* Simple Footer */}
              <footer className={styles.footer}>
                <p>
                  Connected to Firebase • Same data as Android app • Personal use
                  only
                </p>
              </footer>
            </div>
          </div>
        </BrowserRouter>
      </SettingsProvider>
    </ErrorProvider>
  );
}

export default App;
