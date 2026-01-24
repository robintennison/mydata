// components/Layout/Header.tsx
import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import styles from "../../App.module.css";
import HeaderNav from "../Navigation/HeaderNav";

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

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
            <span className={styles.logoIcon}>💰</span>
            <span>MyData</span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <HeaderNav />
          <button
            className={styles.logoutButton}
            onClick={handleLogout}
            aria-label="Logout"
          >
            <span className={styles.logoutIcon}>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
