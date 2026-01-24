// src/components/Navigation/BottomNav.tsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./BottomNav.module.css";

interface NavItem {
  path: string;
  label: string;
  icon: string;
  requiresAuth: boolean;
}

const navItems: NavItem[] = [
  { path: "/", label: "Home", icon: "🏠", requiresAuth: true },
  { path: "/banking", label: "Banking", icon: "🏦", requiresAuth: true },
  { path: "/jewellery", label: "Jewellery", icon: "💎", requiresAuth: true },
  { path: "/online", label: "Online", icon: "🌐", requiresAuth: true },
  // Removed: { path: "/properties", label: "Properties", icon: "🏢", requiresAuth: true },
];

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Filter items based on authentication requirements
  const filteredNavItems = navItems.filter(
    (item) => !item.requiresAuth || (item.requiresAuth && isAuthenticated),
  );

  // Check if current route is a login/signup page
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  // Don't show nav on auth pages or if no filtered items
  if (isAuthPage || filteredNavItems.length === 0) {
    return null;
  }

  return (
    <div className={styles.bottomNavContainer}>
      <nav className={styles.bottomNav}>
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
    </div>
  );
};

export default BottomNav;
