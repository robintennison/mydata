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
            {/* Main container with responsive max-width constraint */}
            <div className="min-h-screen bg-gray-50 md:bg-gradient-to-br md:from-gray-100 md:to-gray-200">
              {/* Desktop: Centered container with shadow */}
              <div className="w-full md:max-w-2xl md:mx-auto md:min-h-screen md:bg-white md:shadow-xl">
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