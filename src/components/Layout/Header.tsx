// components/Layout/Header.tsx
import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "../../App.module.css";
import HeaderNav from "../Navigation/HeaderNav";

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>
            <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              MyData
            </span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <HeaderNav />
          <button
            className={styles.logoutButton}
            onClick={handleLogout}
            aria-label="Logout"
          >
            {/* Choose one of these more visible icons: */}

            {/* Option 1: Power button (most recognizable) */}
            {/*<span className={styles.logoutIcon}>🔌</span>*/}
            <span className={styles.logoutIcon}>↪️</span>

            {/* Option 2: Exit sign */}
            {/* <span className={styles.logoutIcon}>🚶‍♂️</span> */}

            {/* Option 3: Door with arrow */}
            {/* <span className={styles.logoutIcon}>🚪➡️</span> */}

            {/* Option 4: Simple "X" */}
            {/* <span className={styles.logoutIcon}>✕</span> */}

            {/* Option 5: Logout text with arrow */}
            {/* <span className={styles.logoutIcon}>↪️</span> */}

            {/* Option 6: Power symbol (Unicode) */}
            <span className={styles.logoutIcon}>⏻</span>

            <span className={styles.logoutText}>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
