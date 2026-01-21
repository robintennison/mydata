import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const JewelleryNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  // Jewellery navigation items matching Banking style - REMOVED "Add" button
  const navItems = [
    {
      id: "home",
      icon: "🏠",
      label: "Home",
      path: "/jewellery",
      bgColor: "#e8f0fe",
      borderColor: "#4285f4",
      hoverColor: "rgba(66, 133, 244, 0.2)",
    },
    {
      id: "list",
      icon: "📋",
      label: "List",
      path: "/jewellery/list",
      bgColor: "#e8f5e9",
      borderColor: "#34a853",
      hoverColor: "rgba(52, 168, 83, 0.2)",
    },
    {
      id: "gallery",
      icon: "🖼️",
      label: "Gallery",
      path: "/jewellery/gallery",
      bgColor: "#fff8e1",
      borderColor: "#fbbc04",
      hoverColor: "rgba(251, 188, 4, 0.2)",
    },
    {
      id: "verification",
      icon: "✅",
      label: "Verify",
      path: "/jewellery/verification",
      bgColor: "#f3e5f5",
      borderColor: "#9c27b0",
      hoverColor: "rgba(156, 39, 176, 0.2)",
    },
    {
      id: "bills",
      icon: "📄",
      label: "Bills",
      path: "/jewellery/bills",
      bgColor: "#ffebee",
      borderColor: "#ea4335",
      hoverColor: "rgba(234, 67, 53, 0.2)",
    },
    // REMOVED: "Add" button from navigation
  ];

  const handleNavigate = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(path);
  };

  // Check if current page is active
  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      (path !== "/jewellery" && location.pathname.startsWith(path))
    );
  };

  return (
    <div
      style={{
        // REMOVED: position: "fixed", bottom: 0, left: 0, right: 0
        backgroundColor: "white",
        borderTop: "1px solid #e5e7eb",
        marginTop: "20px", // Added spacing from content above
        borderRadius: "12px 12px 0 0", // Optional: rounded top corners
      }}
    >
      {/* Container to match the 600px constraint */}
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)", // Changed from 6 to 5 columns
            gap: "8px",
            padding: "12px", // Slightly increased padding
          }}
        >
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <div
                key={item.id}
                onClick={(e) => handleNavigate(item.path, e)}
                style={{
                  ...navButtonStyle,
                  backgroundColor: active ? item.borderColor : item.bgColor,
                  borderColor: item.borderColor,
                  color: active ? "white" : "#374151",
                  transform: active ? "translateY(-2px)" : "translateY(0)",
                  boxShadow: active ? `0 4px 8px ${item.hoverColor}` : "none",
                }}
                onMouseOver={(e) => {
                  if (!active) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 4px 8px ${item.hoverColor}`;
                  }
                }}
                onMouseOut={(e) => {
                  if (!active) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <div
                  style={{
                    fontSize: "1.3rem",
                    marginBottom: "4px",
                    color: active ? "white" : "inherit",
                  }}
                >
                  {item.icon}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: active ? "white" : "#374151",
                  }}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JewelleryNavigation;
