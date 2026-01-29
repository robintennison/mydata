import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";
import { onlineStyles } from "../styles/onlineStyles";
import OnlineListTab from "./OnlineListTab";
import RenewalListTab from "./RenewalListTab";
import CategoryListTab from "./CategoryListTab";
import styles from "../../../App.module.css"; // Import the CSS module

// Tab components
const TabContent: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  // Use scrollableArea style for tab content
  const tabContainerStyle = {
    ...onlineStyles.scrollableArea,
  };

  return (
    <div style={tabContainerStyle}>
      {(() => {
        switch (activeTab) {
          case "items":
            return <OnlineListTab />;
          case "renewals":
            return <RenewalListTab />;
          case "categories":
            return <CategoryListTab />;
          default:
            return <OnlineListTab />;
        }
      })()}
    </div>
  );
};

const OnlineHomepage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  // State for active tab - initialize from location state if available
  const [activeTab, setActiveTab] = useState<
    "items" | "renewals" | "categories"
  >(() => {
    return location.state?.activeTab || "items";
  });

  // Read the state when component mounts or location changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);

      // Clean up location state to prevent persisting across refreshes
      if (location.state?.activeTab) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [location]);

  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    items: 0,
    renewals: 0,
    categories: 0,
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

        // Handle different date formats
        let endDate = 0;
        if (data.endDate && typeof data.endDate === "number") {
          endDate = data.endDate;
        } else if (
          data.endDate &&
          typeof data.endDate === "object" &&
          data.endDate.toDate
        ) {
          endDate = data.endDate.toDate().getTime();
        } else if (data.endDate && typeof data.endDate === "string") {
          const parsed = Date.parse(data.endDate);
          endDate = isNaN(parsed) ? 0 : parsed;
        }

        if (endDate && endDate <= thirtyDaysFromNow && endDate > now) {
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

  const handleAddClick = () => {
    switch (activeTab) {
      case "items":
        navigate("/online/items/add", {
          state: { returnTo: "/online", activeTab: "items" },
        });
        break;
      case "renewals":
        navigate("/online/renewals/add", {
          state: { returnTo: "/online", activeTab: "renewals" },
        });
        break;
      case "categories":
        navigate("/online/categories/add", {
          state: { returnTo: "/online", activeTab: "categories" },
        });
        break;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleHomeClick = () => {
    navigate("/");
  };

  const getAddButtonTitle = () => {
    switch (activeTab) {
      case "items":
        return "Add Online Item";
      case "renewals":
        return "Add Renewal";
      case "categories":
        return "Add Category";
      default:
        return "Add";
    }
  };

  // Define all icons in one place
  const NAV_ICONS = {
    // Module icons
    BANKING: "🏦",
    JEWELLERY: "💎",
    ONLINE: "🌐",

    // Header action icons
    BACK: "←",
    SETTINGS: "⚙️",
    LOGOUT: "↪️",
    ADD: "➕",
  };

  // Module navigation items
  const MODULE_ITEMS = [
    { path: "/banking", label: "Banking", icon: NAV_ICONS.BANKING },
    { path: "/jewellery", label: "Jewellery", icon: NAV_ICONS.JEWELLERY },
    { path: "/online", label: "Online", icon: NAV_ICONS.ONLINE },
  ];

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div style={onlineStyles.container}>
        {/* Header during loading (without add button) */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            {/* Left side: MyData clickable header */}
            <div className={styles.headerLeft}>
              <button
                className={styles.homeButton}
                onClick={handleHomeClick}
                aria-label="Go to Home"
                title="Go to Home"
              >
                MyData
              </button>
            </div>

            {/* Center: Module Navigation */}
            <div className={styles.headerCenter}>
              <div className={styles.moduleNav}>
                {MODULE_ITEMS.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/" &&
                      location.pathname.startsWith(item.path));

                  return (
                    <button
                      key={item.path}
                      className={`${styles.moduleButton} ${isActive ? styles.activeModule : ""}`}
                      onClick={() => navigate(item.path)}
                      aria-label={item.label}
                      title={item.label}
                    >
                      <span className={styles.moduleIcon}>{item.icon}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right side: Actions */}
            <div className={styles.headerActions}>
              <button
                className={styles.settingsButton}
                onClick={() => navigate("/settings")}
                aria-label="Settings"
                title="Settings"
              >
                {NAV_ICONS.SETTINGS}
              </button>
              <button
                className={styles.logoutButton}
                onClick={handleLogout}
                aria-label="Logout"
                title="Logout"
              >
                <span className={styles.logoutIcon}>{NAV_ICONS.LOGOUT}</span>
              </button>
            </div>
          </div>
        </header>

        <div style={onlineStyles.loading}>
          <div style={onlineStyles.spinner}></div>
          <p>Loading online module...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={onlineStyles.container}>
      {/* Header with add button */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* Left side: MyData clickable header */}
          <div className={styles.headerLeft}>
            <button
              className={styles.homeButton}
              onClick={handleHomeClick}
              aria-label="Go to Home"
              title="Go to Home"
            >
              MyData
            </button>
          </div>

          {/* Center: Module Navigation */}
          <div className={styles.headerCenter}>
            <div className={styles.moduleNav}>
              {MODULE_ITEMS.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== "/" &&
                    location.pathname.startsWith(item.path));

                return (
                  <button
                    key={item.path}
                    className={`${styles.moduleButton} ${isActive ? styles.activeModule : ""}`}
                    onClick={() => navigate(item.path)}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <span className={styles.moduleIcon}>{item.icon}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side: Actions */}
          <div className={styles.headerActions}>
            {/* Add button - displayed left to settings icon */}
            <button
              className={styles.addButton}
              onClick={handleAddClick}
              aria-label={getAddButtonTitle()}
              title={getAddButtonTitle()}
            >
              {NAV_ICONS.ADD}
            </button>

            <button
              className={styles.settingsButton}
              onClick={() => navigate("/settings")}
              aria-label="Settings"
              title="Settings"
            >
              {NAV_ICONS.SETTINGS}
            </button>
            <button
              className={styles.logoutButton}
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
            >
              <span className={styles.logoutIcon}>{NAV_ICONS.LOGOUT}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={onlineStyles.contentWrapper}>
        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            backgroundColor: "white",
            borderBottom: "1px solid #e9ecef",
            padding: "0 4px",
            flexShrink: 0, // Prevent tab navigation from shrinking
          }}
        >
          <button
            onClick={() => setActiveTab("items")}
            style={{
              flex: 1,
              padding: "12px 0",
              backgroundColor: "transparent",
              border: "none",
              borderBottom:
                activeTab === "items"
                  ? "3px solid #48bb78"
                  : "3px solid transparent",
              color: activeTab === "items" ? "#48bb78" : "#666",
              fontWeight: activeTab === "items" ? "600" : "500",
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 0.2s",
              position: "relative",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "items") {
                e.currentTarget.style.backgroundColor = "#f8f9fa";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "items") {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            Items
            {counts.items > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "8px",
                  backgroundColor: "#48bb78",
                  color: "white",
                  fontSize: "0.65rem",
                  padding: "1px 5px",
                  borderRadius: "10px",
                  minWidth: "18px",
                  textAlign: "center",
                }}
              >
                {counts.items}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("renewals")}
            style={{
              flex: 1,
              padding: "12px 0",
              backgroundColor: "transparent",
              border: "none",
              borderBottom:
                activeTab === "renewals"
                  ? "3px solid #ed8936"
                  : "3px solid transparent",
              color: activeTab === "renewals" ? "#ed8936" : "#666",
              fontWeight: activeTab === "renewals" ? "600" : "500",
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 0.2s",
              position: "relative",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "renewals") {
                e.currentTarget.style.backgroundColor = "#f8f9fa";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "renewals") {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            Renewals
            {counts.renewals > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "8px",
                  backgroundColor:
                    counts.expiringSoon > 0 ? "#ed8936" : "#4299e1",
                  color: "white",
                  fontSize: "0.65rem",
                  padding: "1px 5px",
                  borderRadius: "10px",
                  minWidth: "18px",
                  textAlign: "center",
                }}
              >
                {counts.renewals}
                {counts.expiringSoon > 0 && (
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.55rem",
                      marginTop: "1px",
                      color: "#fffaf0",
                    }}
                  >
                    {counts.expiringSoon} soon
                  </span>
                )}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            style={{
              flex: 1,
              padding: "12px 0",
              backgroundColor: "transparent",
              border: "none",
              borderBottom:
                activeTab === "categories"
                  ? "3px solid #4299e1"
                  : "3px solid transparent",
              color: activeTab === "categories" ? "#4299e1" : "#666",
              fontWeight: activeTab === "categories" ? "600" : "500",
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 0.2s",
              position: "relative",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "categories") {
                e.currentTarget.style.backgroundColor = "#f8f9fa";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "categories") {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            Categories
            {counts.categories > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "8px",
                  backgroundColor: "#9f7aea",
                  color: "white",
                  fontSize: "0.65rem",
                  padding: "1px 5px",
                  borderRadius: "10px",
                  minWidth: "18px",
                  textAlign: "center",
                }}
              >
                {counts.categories}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Area - Flex container for proper sizing */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0, // Crucial for flex scrolling
          }}
        >
          <TabContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
};

export default OnlineHomepage;
