// src/components/Navigation/Navigation.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { navigationItems } from "../../routes";

export const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="navigation">
      <ul className="nav-list">
        {navigationItems.map((item) => (
          <li key={item.path} className="nav-item">
            <Link
              to={item.path}
              className={`nav-link ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-title">{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
