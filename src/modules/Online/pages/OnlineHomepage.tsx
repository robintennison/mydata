import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import styles from "./Online.module.css";

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
      const categoriesSnapshot = await getDocs(collection(db, "categories"));
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

  const navigationCards = [
    {
      title: "Categories",
      description: "Manage item categories",
      icon: "📁",
      path: "/online/categories",
      color: "#4299e1",
      count: counts.categories,
      quickActions: [
        {
          label: "Add Category",
          type: "path" as const,
          path: "/online/categories/add",
        },
        {
          label: "View All",
          type: "path" as const,
          path: "/online/categories",
        },
      ],
    },
    {
      title: "Online Items",
      description: "Manage your online purchases and items",
      icon: "🛒",
      path: "/online/items",
      color: "#48bb78",
      count: counts.items,
      quickActions: [
        { label: "Add Item", type: "path" as const, path: "/online/items/add" },
        { label: "View All", type: "path" as const, path: "/online/items" },
        { label: "Search Items", type: "path" as const, path: "/online/items" },
      ],
    },
    {
      title: "Renewals",
      description: "Track subscription renewals",
      icon: "🔄",
      path: "/online/renewals",
      color: "#ed8936",
      count: counts.renewals,
      badge:
        counts.expiringSoon > 0 ? `${counts.expiringSoon} expiring soon` : null,
      quickActions: [
        {
          label: "Add Renewal",
          type: "path" as const,
          path: "/online/renewals/add",
        },
        { label: "View All", type: "path" as const, path: "/online/renewals" },
        {
          label: "Expiring Soon",
          type: "path" as const,
          path: "/online/renewals",
        },
      ],
    },
    {
      title: "Dashboard",
      description: "Online module overview",
      icon: "📊",
      path: "/online",
      color: "#9f7aea",
      count: 0,
      quickActions: [
        { label: "Refresh", type: "action" as const, action: fetchCounts },
      ],
    },
  ];

  const quickActions = [
    {
      label: "Add New Item",
      icon: "➕",
      path: "/online/items/add",
      color: "#48bb78",
    },
    {
      label: "Add Renewal",
      icon: "📅",
      path: "/online/renewals/add",
      color: "#ed8936",
    },
    {
      label: "Add Category",
      icon: "🏷️",
      path: "/online/categories/add",
      color: "#4299e1",
    },
    {
      label: "View All Items",
      icon: "👁️",
      path: "/online/items",
      color: "#9f7aea",
    },
  ];

  const handleQuickAction = (action: any) => {
    if (action.type === "path") {
      navigate(action.path);
    } else if (action.type === "action" && action.action) {
      action.action();
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading online module...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Top Navigation */}
      <div className={styles.topNav}>
        <button
          onClick={() => navigate("/")}
          className={styles.navButton}
          title="Back to Home"
        >
          🏠
        </button>
        <div className={styles.navTitle}>Online Module</div>
        <button
          onClick={() => navigate("/settings")}
          className={styles.navButton}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.contentWrapper}>
        {/* Stats Overview */}
        <div className={styles.statsRow}>
          <div
            className={styles.statCard}
            onClick={() => navigate("/online/categories")}
          >
            <div
              className={styles.statIcon}
              style={{ backgroundColor: "#ebf8ff" }}
            >
              📁
            </div>
            <div className={styles.statContent}>
              <div className={styles.statTitle}>Categories</div>
              <div className={styles.statValue}>{counts.categories}</div>
            </div>
          </div>

          <div
            className={styles.statCard}
            onClick={() => navigate("/online/items")}
          >
            <div
              className={styles.statIcon}
              style={{ backgroundColor: "#f0fff4" }}
            >
              🛒
            </div>
            <div className={styles.statContent}>
              <div className={styles.statTitle}>Items</div>
              <div className={styles.statValue}>{counts.items}</div>
            </div>
          </div>

          <div
            className={styles.statCard}
            onClick={() => navigate("/online/renewals")}
          >
            <div
              className={styles.statIcon}
              style={{ backgroundColor: "#fffaf0" }}
            >
              🔄
            </div>
            <div className={styles.statContent}>
              <div className={styles.statTitle}>Renewals</div>
              <div className={styles.statValue}>{counts.renewals}</div>
              {counts.expiringSoon > 0 && (
                <div className={styles.expiringBadge}>
                  {counts.expiringSoon} soon
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Module Navigation Cards */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Navigation</div>
            <div className={styles.sectionSubtitle}>
              Select a section to manage
            </div>
          </div>

          <div className={styles.cardsGrid}>
            {navigationCards.map((card, index) => (
              <div
                key={index}
                className={styles.moduleCard}
                onClick={() => navigate(card.path)}
              >
                <div
                  className={styles.cardIcon}
                  style={{ backgroundColor: card.color + "20" }}
                >
                  <span style={{ fontSize: "28px", color: card.color }}>
                    {card.icon}
                  </span>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{card.title}</h3>
                    {card.count > 0 && (
                      <span className={styles.cardCount}>{card.count}</span>
                    )}
                  </div>
                  <p className={styles.cardDescription}>{card.description}</p>
                  {card.badge && (
                    <div className={styles.cardBadge}>{card.badge}</div>
                  )}

                  {/* Quick Action Buttons */}
                  <div className={styles.quickActionButtons}>
                    {card.quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        className={styles.quickActionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAction(action);
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Quick Actions</div>
            <div className={styles.sectionSubtitle}>
              Frequent actions for faster access
            </div>
          </div>
          <div className={styles.quickActionGrid}>
            {quickActions.map((action, index) => (
              <button
                key={index}
                className={styles.quickActionCard}
                onClick={() => navigate(action.path)}
                style={{ borderColor: action.color }}
              >
                <span
                  className={styles.actionIcon}
                  style={{ color: action.color }}
                >
                  {action.icon}
                </span>
                <span className={styles.actionLabel}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity (Placeholder) */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Recent Activity</div>
            <button className={styles.refreshButton} onClick={fetchCounts}>
              🔄 Refresh
            </button>
          </div>
          <div className={styles.recentActivity}>
            <div className={styles.activityItem}>
              <span className={styles.activityIcon}>📁</span>
              <div className={styles.activityText}>
                <strong>{counts.categories}</strong> categories available
              </div>
            </div>
            <div className={styles.activityItem}>
              <span className={styles.activityIcon}>🛒</span>
              <div className={styles.activityText}>
                <strong>{counts.items}</strong> online items tracked
              </div>
            </div>
            <div className={styles.activityItem}>
              <span className={styles.activityIcon}>🔄</span>
              <div className={styles.activityText}>
                <strong>{counts.renewals}</strong> renewals being tracked
              </div>
            </div>
            {counts.expiringSoon > 0 && (
              <div className={styles.activityItem}>
                <span className={styles.activityIcon}>⚠️</span>
                <div className={styles.activityText}>
                  <strong>{counts.expiringSoon}</strong> renewals expiring soon
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom spacing */}
        <div className={styles.bottomSpacing}></div>
      </div>
    </div>
  );
};

export default OnlineHomepage;
