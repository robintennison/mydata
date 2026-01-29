// components/Layout/Header.tsx - Ensure it has the updated CSS classes
import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../../App.module.css";

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
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Left side: MyData clickable header */}
        <div className={styles.headerLeft}>
          <button
            className={styles.homeButton}
            onClick={handleHomeClick}
            aria-label="Go to Home"
            title="Go to Home"
          >
            MyData
          </button>
        </div>

        {/* Center: Module Navigation */}
        <div className={styles.headerCenter}>
          <div className={styles.moduleNav}>
            {MODULE_ITEMS.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));

              return (
                <button
                  key={item.path}
                  className={`${styles.moduleButton} ${isActive ? styles.activeModule : ""}`}
                  onClick={() => navigate(item.path)}
                  aria-label={item.label}
                  title={item.label}
                >
                  <span className={styles.moduleIcon}>{item.icon}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: Actions */}
        <div className={styles.headerActions}>
          {/* Add button - displayed left to settings icon */}
          {showAddButton && (
            <button
              className={styles.addButton}
              onClick={handleAddClick}
              aria-label={addButtonTitle}
              title={addButtonTitle}
            >
              {NAV_ICONS.ADD}
            </button>
          )}

          <button
            className={styles.settingsButton}
            onClick={() => navigate("/settings")}
            aria-label="Settings"
            title="Settings"
          >
            {NAV_ICONS.SETTINGS}
          </button>
          <button
            className={styles.logoutButton}
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <span className={styles.logoutIcon}>{NAV_ICONS.LOGOUT}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
