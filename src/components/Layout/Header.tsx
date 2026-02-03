// components/Layout/Header.tsx
import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

interface HeaderProps {
  showAddButton?: boolean;
  onAddClick?: () => void;
  addButtonTitle?: string;
}

const Header: React.FC<HeaderProps> = ({
  showAddButton = false,
  onAddClick,
  addButtonTitle = "Add",
}) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Define all icons in one place
  const NAV_ICONS = {
    // Module icons
    BANKING: "🏦",
    JEWELLERY: "💎",
    ONLINE: "🌐",

    // Header action icons
    BACK: "←",
    SETTINGS: "⚙️",
    LOGOUT: "↪️",
    ADD: "➕",
  };

  // Module navigation items
  const MODULE_ITEMS = [
    { path: "/banking", label: "Banking", icon: NAV_ICONS.BANKING },
    { path: "/jewellery", label: "Jewellery", icon: NAV_ICONS.JEWELLERY },
    { path: "/online", label: "Online", icon: NAV_ICONS.ONLINE },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleHomeClick = () => {
    navigate("/");
  };

  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-slate-800 to-slate-900 text-white py-3 shadow-lg shadow-slate-900/30">
      <div className="flex items-center justify-between px-3 sm:px-4 w-full">
        {/* Left side: MyData clickable header - hidden on mobile when actions are shown */}
        <div className="flex-1 min-w-0">
          <button
            className="text-lg sm:text-xl font-semibold hover:text-slate-300 transition-colors p-1 sm:p-2 -ml-1 sm:-ml-2 rounded-md hover:bg-slate-700/30 whitespace-nowrap overflow-hidden text-ellipsis"
            onClick={handleHomeClick}
            aria-label="Go to Home"
            title="Go to Home"
          >
            MyData
          </button>
        </div>

        {/* Center: Module Navigation - smaller on mobile */}
        <div className="flex justify-center mx-2">
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-700/40 p-1 sm:p-2 rounded-full backdrop-blur-sm">
            {MODULE_ITEMS.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));

              return (
                <button
                  key={item.path}
                  className={`p-1.5 sm:p-2.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? "bg-white text-slate-800 shadow-md sm:shadow-lg transform scale-105 sm:scale-110"
                      : "hover:bg-slate-600/50 hover:scale-105"
                  }`}
                  onClick={() => navigate(item.path)}
                  aria-label={item.label}
                  title={item.label}
                >
                  <span className="text-base sm:text-xl">{item.icon}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: Actions - compact on mobile */}
        <div className="flex-1 flex justify-end items-center gap-1 sm:gap-2 min-w-0">
          {/* Add button - displayed left to settings icon */}
          {showAddButton && (
            <button
              className="p-1.5 sm:p-3 rounded-full hover:bg-slate-600/50 transition-all hover:scale-105 flex-shrink-0"
              onClick={handleAddClick}
              aria-label={addButtonTitle}
              title={addButtonTitle}
            >
              <span className="text-base sm:text-xl">{NAV_ICONS.ADD}</span>
            </button>
          )}

          <button
            className="p-1.5 sm:p-3 rounded-full hover:bg-slate-600/50 transition-all hover:scale-105 flex-shrink-0"
            onClick={() => navigate("/settings")}
            aria-label="Settings"
            title="Settings"
          >
            <span className="text-base sm:text-xl">{NAV_ICONS.SETTINGS}</span>
          </button>
          <button
            className="p-1.5 sm:p-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all hover:scale-105 flex items-center justify-center flex-shrink-0"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <span className="text-base sm:text-xl">{NAV_ICONS.LOGOUT}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
