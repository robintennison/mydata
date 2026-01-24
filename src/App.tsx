// src/App.tsx
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ErrorProvider } from "./contexts/ErrorContext";
import { AuthProvider } from "./contexts/AuthContext";

// Import global styles
import "./shared/styles/design-tokens.css";
import "./shared/styles/base.css";
import "./shared/styles/utilities.css";
import "./App.css";

// Import the CSS module
import styles from "./App.module.css";

function App() {
  return (
    <ErrorProvider>
      <SettingsProvider>
        <BrowserRouter>
          <AuthProvider>
            <div className={styles.container}>
              <div className={styles.app}>
                {/* REMOVE Header here - it's already in AppRoutes */}
                <main className={styles.main}>
                  <AppRoutes />
                </main>
              </div>
            </div>
          </AuthProvider>
        </BrowserRouter>
      </SettingsProvider>
    </ErrorProvider>
  );
}

export default App;
