// src/App.tsx
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ErrorProvider } from "./contexts/ErrorContext";
import { AuthProvider } from "./contexts/AuthContext"; // Add this import

// Import global styles
import "./shared/styles/design-tokens.css";
import "./shared/styles/base.css";
import "./shared/styles/utilities.css";

// Import App-specific CSS
import "./App.css";

function App() {
  // Remove the Firebase auth state from here - AuthContext handles it now
  return (
    <ErrorProvider>
      <SettingsProvider>
        <BrowserRouter>
          <AuthProvider>
            {" "}
            {/* Wrap everything with AuthProvider */}
            <AppRoutes /> {/* Remove isAuthenticated and user props */}
          </AuthProvider>
        </BrowserRouter>
      </SettingsProvider>
    </ErrorProvider>
  );
}

export default App;
