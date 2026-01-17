// src/modules/Banking/pages/BankingNavigation.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const BankingNavigation: React.FC = () => {
  const navigate = useNavigate();

  const navButtonStyle = {
    backgroundColor: "#e8f0fe",
    borderRadius: "10px",
    padding: "12px 8px",
    border: "1px solid #4285f4",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "center" as const,
    minHeight: "70px",
  };

  const navItems = [
    {
      id: "accounts",
      icon: "🏦",
      label: "Accounts",
      path: "/banking/accounts",
      bgColor: "#e8f0fe",
      borderColor: "#4285f4",
      hoverColor: "rgba(66, 133, 244, 0.2)",
    },
    {
      id: "deposits",
      icon: "💰",
      label: "Deposits",
      path: "/banking/deposits",
      bgColor: "#e8f5e9",
      borderColor: "#34a853",
      hoverColor: "rgba(52, 168, 83, 0.2)",
    },
    {
      id: "history",
      icon: "📈",
      label: "History",
      path: "/banking/history",
      bgColor: "#fff8e1",
      borderColor: "#fbbc04",
      hoverColor: "rgba(251, 188, 4, 0.2)",
    },
    {
      id: "summary",
      icon: "📊",
      label: "Summary",
      path: "/banking/summary",
      bgColor: "#f3e5f5",
      borderColor: "#9c27b0",
      hoverColor: "rgba(156, 39, 176, 0.2)",
    },
  ];

  const handleNavigate = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(path);
  };

  return (
    <div
      style={{
        padding: "0 15px 15px 15px",
        marginTop: "auto",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
        }}
      >
        {navItems.map((item) => (
          <div
            key={item.id}
            onClick={(e) => handleNavigate(item.path, e)}
            style={{
              ...navButtonStyle,
              backgroundColor: item.bgColor,
              borderColor: item.borderColor,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 4px 8px ${item.hoverColor}`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>
              {item.icon}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BankingNavigation;
