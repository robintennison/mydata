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
            {/* DIAGNOSTIC: Add colored borders to identify containers */}
            <div
              className={styles.container}
              style={{
                border: "3px solid red",
                minHeight: "100vh",
                position: "relative",
              }}
            >
              <div
                className={styles.app}
                style={{
                  border: "3px solid blue",
                  position: "relative",
                }}
              >
                <main
                  className={styles.main}
                  style={{
                    border: "3px solid green",
                    position: "relative",
                  }}
                >
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
