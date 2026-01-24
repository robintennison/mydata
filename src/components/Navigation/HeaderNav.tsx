import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { navItems } from "../../lib/navigation";
import styles from "./HeaderNav.module.css";

const HeaderNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const filteredNavItems = navItems.filter(
    (item) => !item.requiresAuth || (item.requiresAuth && isAuthenticated),
  );

  if (filteredNavItems.length === 0) {
    return null;
  }

  return (
    <nav className={styles.headerNav}>
      {filteredNavItems.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path !== "/" && location.pathname.startsWith(item.path));

        return (
          <button
            key={item.path}
            className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            onClick={() => navigate(item.path)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                navigate(item.path);
              }
            }}
            aria-label={`Go to ${item.label}`}
            aria-current={isActive ? "page" : undefined}
            type="button"
          >
            <span className={styles.icon} aria-hidden="true">
              {item.icon}
            </span>
            <span className={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default HeaderNav;
