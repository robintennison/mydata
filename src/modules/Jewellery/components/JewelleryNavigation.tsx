import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const JewelleryNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      path: "/jewellery",
      icon: "🏠",
      label: "Home",
      isActive: location.pathname === "/jewellery",
    },
    {
      path: "/jewellery/list",
      icon: "💎",
      label: "Items",
      isActive:
        location.pathname === "/jewellery/list" ||
        location.pathname.includes("/jewellery/edit/") ||
        location.pathname === "/jewellery/add",
    },
    {
      path: "/jewellery/bills",
      icon: "📄",
      label: "Bills",
      isActive:
        location.pathname === "/jewellery/bills" ||
        location.pathname.includes("/jewellery/bills/edit/") ||
        location.pathname === "/jewellery/bills/add",
    },
    {
      path: "/jewellery/stats",
      icon: "📊",
      label: "Stats",
      isActive: location.pathname === "/jewellery/stats",
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "#ffffff",
        borderTop: "1px solid #e9ecef",
        display: "flex",
        justifyContent: "space-around",
        padding: "10px 0",
        zIndex: 100,
      }}
    >
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px 12px",
            borderRadius: "8px",
            color: item.isActive ? "#3b82f6" : "#6b7280",
            fontWeight: item.isActive ? "600" : "400",
            fontSize: "12px",
            transition: "all 0.2s",
          }}
        >
          <div style={{ fontSize: "1.2rem", marginBottom: "4px" }}>
            {item.icon}
          </div>
          <div>{item.label}</div>
        </button>
      ))}
    </div>
  );
};

export default JewelleryNavigation;
