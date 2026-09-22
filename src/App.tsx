import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ErrorProvider } from "./contexts/ErrorContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { BankingDataProvider } from "./contexts/BankingDataContext";
import { JewelleryDataProvider } from "./contexts/JewelleryDataContext";
import { OnlineDataProvider } from "./contexts/OnlineDataContext";

// Remount all private data when the account changes, including at logout.
function SessionData({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return <BankingDataProvider key={user?.uid ?? "signed-out"}>
    <JewelleryDataProvider><OnlineDataProvider>{children}</OnlineDataProvider></JewelleryDataProvider>
  </BankingDataProvider>;
}

function App() {
  return (
    <ErrorProvider>
      <AuthProvider>
        <BrowserRouter>
          <SettingsProvider>
            <SessionData>
              {/* Main container with responsive max-width constraint */}
              <div className="min-h-screen bg-gray-50 md:bg-gradient-to-br md:from-gray-100 md:to-gray-200">
                {/* Desktop: Centered container with shadow */}
                <div className="w-full md:max-w-2xl md:mx-auto md:min-h-screen md:bg-white md:shadow-xl">
                  <main className="w-full">
                    <AppRoutes />
                  </main>
                </div>
              </div>
            </SessionData>
          </SettingsProvider>
        </BrowserRouter>
      </AuthProvider>
    </ErrorProvider>
  );
}

export default App;