// src/components/Footer.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Footer: React.FC = () => {
  const navigate = useNavigate();

  const styles: { [key: string]: React.CSSProperties } = {
    footer: {
      position: "fixed" as "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "white",
      borderTop: "1px solid #e9ecef",
      padding: "10px 15px",
      zIndex: 100,
      maxWidth: "500px",
      margin: "0 auto",
      boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
    },
    navGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "5px",
    },
    navItem: {
      textAlign: "center" as "center",
      cursor: "pointer",
      padding: "8px 5px",
      borderRadius: "8px",
      transition: "all 0.2s",
      display: "flex",
      flexDirection: "column" as "column",
      alignItems: "center",
      justifyContent: "center",
    },
    navIcon: {
      fontSize: "1.4rem",
      marginBottom: "4px",
      transition: "transform 0.2s",
    },
    navItemName: {
      fontSize: "0.7rem",
      fontWeight: 500,
      color: "#666",
    },
  };

  return (
    <div style={styles.footer}>
      <div style={styles.navGrid}>
        {/* Home */}
        <div
          style={styles.navItem}
          onClick={() => navigate("/")}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f8f9fa";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <div
            style={{
              ...styles.navIcon,
              color: "#4285f4",
            }}
          >
            🏠
          </div>
          <div style={styles.navItemName}>Home</div>
        </div>

        {/* Banking */}
        <div
          style={styles.navItem}
          onClick={() => navigate("/banking")}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f8f9fa";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <div
            style={{
              ...styles.navIcon,
              color: "#34a853",
            }}
          >
            🏦
          </div>
          <div style={styles.navItemName}>Banking</div>
        </div>

        {/* Jewellery */}
        <div
          style={styles.navItem}
          onClick={() => navigate("/jewellery")}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f8f9fa";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <div
            style={{
              ...styles.navIcon,
              color: "#FFD700",
            }}
          >
            💎
          </div>
          <div style={styles.navItemName}>Jewellery</div>
        </div>

        {/* Properties */}
        <div
          style={styles.navItem}
          onClick={() => navigate("/properties")}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f8f9fa";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <div
            style={{
              ...styles.navIcon,
              color: "#ea4335",
            }}
          >
            🏠
          </div>
          <div style={styles.navItemName}>Properties</div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
