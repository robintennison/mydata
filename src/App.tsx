// src/App.tsx
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ErrorProvider } from "./contexts/ErrorContext";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <ErrorProvider>
      <SettingsProvider>
        <BrowserRouter>
          <AuthProvider>
            {/* Main container */}
            <div className="min-h-screen bg-gray-50">
              <div className="w-full">
                <main className="w-full">
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
