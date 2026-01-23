import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { onlineStyles } from "../styles/onlineStyles"; // Import shared styles
import OnlineNavigation from "./OnlineNavigation";

// Extend shared styles for homepage-specific styles
const homepageStyles = {
  ...onlineStyles,

  // Homepage-specific styles
  centeredContainer: {
    display: "flex",
    flexDirection: "column" as const,
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },

  // Stats Cards
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    padding: "0 15px",
    marginBottom: "15px",
  } as React.CSSProperties,

  statsCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "12px 10px",
    textAlign: "center" as const,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e9ecef",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    minHeight: "80px",
  } as React.CSSProperties,

  statsLabel: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#666",
    marginBottom: "6px",
  } as React.CSSProperties,

  statsValue: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#333",
    marginBottom: "3px",
  } as React.CSSProperties,

  statsSubtitle: {
    fontSize: "0.7rem",
    color: "#888",
  } as React.CSSProperties,

  // Info Cards
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    marginTop: "15px",
  } as React.CSSProperties,

  infoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
    padding: "15px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
  } as React.CSSProperties,

  infoIcon: {
    fontSize: "24px",
    color: "#667eea",
  } as React.CSSProperties,

  infoContent: {
    flex: 1,
  } as React.CSSProperties,

  infoTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: "4px",
  } as React.CSSProperties,

  infoText: {
    fontSize: "12px",
    color: "#718096",
    lineHeight: "1.4",
  } as React.CSSProperties,

  // Badge
  expiringBadge: {
    display: "inline-block",
    backgroundColor: "#fed7d7",
    color: "#c53030",
    padding: "2px 8px",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: "600",
    marginTop: "4px",
  } as React.CSSProperties,
};

const OnlineHomepage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    categories: 0,
    items: 0,
    renewals: 0,
    expiringSoon: 0,
  });

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const now = Date.now();
      const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

      // Fetch categories count
      const categoriesSnapshot = await getDocs(
        collection(db, "online_categories"),
      );
      const categoriesCount = categoriesSnapshot.size;

      // Fetch online items count
      const itemsSnapshot = await getDocs(collection(db, "online"));
      const itemsCount = itemsSnapshot.size;

      // Fetch renewals count and expiring soon count
      const renewalsSnapshot = await getDocs(collection(db, "renewals"));
      let renewalsCount = 0;
      let expiringSoonCount = 0;

      renewalsSnapshot.forEach((doc) => {
        const data = doc.data();
        renewalsCount++;
        if (
          data.endDate &&
          data.endDate <= thirtyDaysFromNow &&
          data.endDate > now
        ) {
          expiringSoonCount++;
        }
      });

      setCounts({
        categories: categoriesCount,
        items: itemsCount,
        renewals: renewalsCount,
        expiringSoon: expiringSoonCount,
      });
    } catch (error) {
      console.error("Error fetching counts:", error);
    } finally {
      setLoading(false);
    }
  };

  const infoCards = [
    {
      icon: "📁",
      title: "Categories",
      text: "Organize items into categories for better management",
      path: "/online/categories",
      count: counts.categories,
      color: "#4299e1",
    },
    {
      icon: "🛒",
      title: "Online Items",
      text: "Track your online purchases and digital assets",
      path: "/online/items",
      count: counts.items,
      color: "#48bb78",
    },
    {
      icon: "🔄",
      title: "Renewals",
      text: "Manage subscription renewals and deadlines",
      path: "/online/renewals",
      count: counts.renewals,
      color: "#ed8936",
      badge:
        counts.expiringSoon > 0 ? `${counts.expiringSoon} expiring soon` : null,
    },
    {
      icon: "📊",
      title: "Dashboard",
      text: "Overview of your online module",
      path: "/online",
      count: 0,
      color: "#9f7aea",
    },
  ];

  if (loading) {
    return (
      <div style={homepageStyles.centeredContainer}>
        <div style={homepageStyles.loading}>
          <div style={homepageStyles.spinner}></div>
          <p>Loading online module...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={homepageStyles.container}>
      {/* Top Navigation */}
      <div style={homepageStyles.topNav}>
        <button
          onClick={() => navigate("/")}
          style={homepageStyles.navButton}
          title="Back to Home"
        >
          🏠
        </button>
        <div style={homepageStyles.navTitle}>Online / Dashboard</div>
        <button
          onClick={() => navigate("/settings")}
          style={homepageStyles.navButton}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Main Content */}
      <div style={homepageStyles.contentWrapper}>
        {/* Stats Overview */}
        <div style={homepageStyles.statsRow}>
          <div
            style={homepageStyles.statsCard}
            onClick={() => navigate("/online/categories")}
          >
            <div style={homepageStyles.statsLabel}>Categories</div>
            <div style={homepageStyles.statsValue}>{counts.categories}</div>
          </div>

          <div
            style={homepageStyles.statsCard}
            onClick={() => navigate("/online/items")}
          >
            <div style={homepageStyles.statsLabel}>Items</div>
            <div style={homepageStyles.statsValue}>{counts.items}</div>
          </div>

          <div
            style={homepageStyles.statsCard}
            onClick={() => navigate("/online/renewals")}
          >
            <div style={homepageStyles.statsLabel}>Renewals</div>
            <div style={homepageStyles.statsValue}>{counts.renewals}</div>
            {counts.expiringSoon > 0 && (
              <div style={homepageStyles.expiringBadge}>
                {counts.expiringSoon} soon
              </div>
            )}
          </div>
        </div>

        {/* Quick Info Grid */}
        <div style={homepageStyles.section}>
          <div style={homepageStyles.sectionHeader}>
            <div style={homepageStyles.sectionTitle}>Quick Overview</div>
          </div>
          <div style={homepageStyles.infoGrid}>
            {infoCards.map((card, index) => (
              <div
                key={index}
                style={homepageStyles.infoCard}
                onClick={() => navigate(card.path)}
              >
                <div
                  style={{
                    ...homepageStyles.infoIcon,
                    color: card.color,
                  }}
                >
                  {card.icon}
                </div>
                <div style={homepageStyles.infoContent}>
                  <div style={homepageStyles.infoTitle}>{card.title}</div>
                  <div style={homepageStyles.infoText}>{card.text}</div>
                  {card.badge && (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#c05621",
                        backgroundColor: "#feebc8",
                        padding: "2px 6px",
                        borderRadius: "8px",
                        display: "inline-block",
                      }}
                    >
                      {card.badge}
                    </div>
                  )}
                </div>
                {card.count > 0 && (
                  <div
                    style={{
                      backgroundColor: card.color,
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {card.count}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={homepageStyles.section}>
          <div style={homepageStyles.sectionHeader}>
            <div style={homepageStyles.sectionTitle}>Quick Actions</div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            <button
              onClick={() => navigate("/online/items/add")}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#48bb78",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>➕</span>
              <span>Add New Item</span>
            </button>
            <button
              onClick={() => navigate("/online/renewals/add")}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#ed8936",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>📅</span>
              <span>Add Renewal</span>
            </button>
            <button
              onClick={() => navigate("/online/categories/add")}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#4299e1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>🏷️</span>
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* Tips Section */}
        <div style={homepageStyles.section}>
          <div style={homepageStyles.sectionHeader}>
            <div style={homepageStyles.sectionTitle}>Tips</div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "12px",
                backgroundColor: "#f0fff4",
                borderRadius: "8px",
                border: "1px solid #c6f6d5",
              }}
            >
              <span style={{ fontSize: "18px", color: "#38a169" }}>💡</span>
              <div>
                <div
                  style={{
                    fontWeight: "600",
                    color: "#276749",
                    fontSize: "14px",
                  }}
                >
                  Organize with Categories
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#718096",
                    marginTop: "4px",
                  }}
                >
                  Create categories first to better organize your online items
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "12px",
                backgroundColor: "#fffaf0",
                borderRadius: "8px",
                border: "1px solid #feebc8",
              }}
            >
              <span style={{ fontSize: "18px", color: "#d69e2e" }}>⏰</span>
              <div>
                <div
                  style={{
                    fontWeight: "600",
                    color: "#975a16",
                    fontSize: "14px",
                  }}
                >
                  Track Renewals
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#718096",
                    marginTop: "4px",
                  }}
                >
                  Add renewals to never miss subscription deadlines
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Online Navigation Component */}
        <OnlineNavigation />

        {/* Bottom spacing */}
        <div style={{ height: "20px" }}></div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        
        button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default OnlineHomepage;
