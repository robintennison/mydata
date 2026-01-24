// src/components/Navigation/BottomNav.tsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { navItems } from "../../lib/navigation";

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
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1000, pointerEvents: 'none', backgroundColor: 'transparent' }}>
      <nav style={{ width: '100%', maxWidth: '600px', backgroundColor: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0.5rem 0', boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.08)', height: '70px', borderRadius: '16px 16px 0 0', margin: '0 auto', pointerEvents: 'auto', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))', position: 'relative', zIndex: 1001 }}>
        {filteredNavItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));

          return (
            <button
              key={item.path}
              className={isActive ? "active" : ""}
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
              <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block' }} aria-hidden="true">
                {item.icon}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, textAlign: 'center', whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
