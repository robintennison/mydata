import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";
import { onlineStyles } from "../styles/onlineStyles";
import OnlineListTab from "./OnlineListTab";
import RenewalListTab from "./RenewalListTab";
import CategoryListTab from "./CategoryListTab";

// Tab components
const TabContent: React.FC<{ activeTab: string }> = ({ activeTab }) => {
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

  // Define all icons in one place - MATCH THE HEADER COMPONENT EXACTLY
  const NAV_ICONS = {
    // Module icons
    BANKING: "🏦",
    JEWELLERY: "💎",
    ONLINE: "🌐",

    // Header action icons
    BACK: "←",
    SETTINGS: "⚙️",
    LOGOUT: "↪️",
    ADD: "➕", // This should match the Header component
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
      <div
        style={{ display: "flex", flexDirection: "column", height: "100vh" }}
      >
        {/* Header during loading */}
        <header style={headerStyles.header}>
          <div style={headerStyles.headerContent}>
            {/* Left side: MyData clickable header */}
            <div style={headerStyles.headerLeft}>
              <button
                style={headerStyles.homeButton}
                onClick={handleHomeClick}
                aria-label="Go to Home"
                title="Go to Home"
              >
                MyData
              </button>
            </div>

            {/* Center: Module Navigation */}
            <div style={headerStyles.headerCenter}>
              <div style={headerStyles.moduleNav}>
                {MODULE_ITEMS.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/" &&
                      location.pathname.startsWith(item.path));

                  return (
                    <button
                      key={item.path}
                      style={{
                        ...headerStyles.moduleButton,
                        ...(isActive && headerStyles.activeModule),
                      }}
                      onClick={() => navigate(item.path)}
                      aria-label={item.label}
                      title={item.label}
                    >
                      <span style={headerStyles.moduleIcon}>{item.icon}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right side: Actions */}
            <div style={headerStyles.headerActions}>
              <button
                style={headerStyles.settingsButton}
                onClick={() => navigate("/settings")}
                aria-label="Settings"
                title="Settings"
              >
                {NAV_ICONS.SETTINGS}
              </button>
              <button
                style={headerStyles.logoutButton}
                onClick={handleLogout}
                aria-label="Logout"
                title="Logout"
              >
                <span style={headerStyles.logoutIcon}>{NAV_ICONS.LOGOUT}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Loading content */}
        <div style={onlineStyles.container}>
          <div style={onlineStyles.loading}>
            <div style={onlineStyles.spinner}></div>
            <p>Loading online module...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Custom Header for Online module */}
      <header style={headerStyles.header}>
        <div style={headerStyles.headerContent}>
          {/* Left side: MyData clickable header */}
          <div style={headerStyles.headerLeft}>
            <button
              style={headerStyles.homeButton}
              onClick={handleHomeClick}
              aria-label="Go to Home"
              title="Go to Home"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(59, 130, 246, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              MyData
            </button>
          </div>

          {/* Center: Module Navigation */}
          <div style={headerStyles.headerCenter}>
            <div style={headerStyles.moduleNav}>
              {MODULE_ITEMS.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== "/" &&
                    location.pathname.startsWith(item.path));

                return (
                  <button
                    key={item.path}
                    style={{
                      ...headerStyles.moduleButton,
                      ...(isActive && headerStyles.activeModule),
                    }}
                    onClick={() => navigate(item.path)}
                    aria-label={item.label}
                    title={item.label}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "#e5e7eb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <span style={headerStyles.moduleIcon}>{item.icon}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side: Actions */}
          <div style={headerStyles.headerActions}>
            {/* Add button - displayed left to settings icon WITH BOX EFFECT */}
            <button
              style={headerStyles.addButton}
              onClick={handleAddClick}
              aria-label={getAddButtonTitle()}
              title={getAddButtonTitle()}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(79, 70, 229, 0.1)";
                e.currentTarget.style.boxShadow =
                  "0 2px 4px rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
                e.currentTarget.style.boxShadow =
                  "0 1px 2px rgba(0, 0, 0, 0.05)";
              }}
            >
              {NAV_ICONS.ADD}
            </button>

            <button
              style={headerStyles.settingsButton}
              onClick={() => navigate("/settings")}
              aria-label="Settings"
              title="Settings"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(107, 114, 128, 0.1)";
                e.currentTarget.style.boxShadow =
                  "0 1px 2px rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {NAV_ICONS.SETTINGS}
            </button>
            <button
              style={headerStyles.logoutButton}
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(239, 68, 68, 0.1)";
                e.currentTarget.style.boxShadow =
                  "0 1px 2px rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span style={headerStyles.logoutIcon}>{NAV_ICONS.LOGOUT}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            backgroundColor: "white",
            borderBottom: "1px solid #e9ecef",
            padding: "0 4px",
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

        {/* Tab Content */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            padding: "8px 4px",
          }}
        >
          <TabContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
};

// Header styles - UPDATED to match the App.module.css styling
const headerStyles = {
  header: {
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    borderBottom: "1px solid #e5e7eb",
    position: "sticky" as const,
    top: 0,
    zIndex: 1000,
    height: "56px",
    padding: "8px 0",
  },
  headerContent: {
    display: "flex" as const,
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: "600px",
    margin: "0 auto",
    width: "100%",
    padding: "0 16px",
    height: "100%",
    gap: "8px",
  },
  headerLeft: {
    flex: "0 0 auto" as const,
    display: "flex" as const,
    alignItems: "center",
    minWidth: "36px",
  },
  homeButton: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    fontSize: "1.3rem",
    fontWeight: 700,
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    textDecoration: "none",
    letterSpacing: "-0.5px",
  },
  headerCenter: {
    flex: 1,
    display: "flex" as const,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 0,
  },
  moduleNav: {
    display: "flex" as const,
    gap: "12px",
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  moduleButton: {
    background: "transparent",
    border: "none",
    color: "#374151",
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    minWidth: "50px",
    minHeight: "50px",
    opacity: 0.8,
  },
  activeModule: {
    backgroundColor: "#eff6ff",
    color: "#3b82f6",
    opacity: 1,
    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
  },
  moduleIcon: {
    fontSize: "1.5rem",
    lineHeight: 1,
  },
  headerActions: {
    flex: "0 0 auto" as const,
    display: "flex" as const,
    alignItems: "center",
    gap: "8px",
  },
  addButton: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "6px",
    transition: "all 0.2s",
    color: "#4f46e5",
    marginRight: 0,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "44px",
    height: "44px",
  },
  settingsButton: {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "6px",
    transition: "all 0.2s",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "44px",
    height: "44px",
  },
  logoutButton: {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "6px",
    transition: "all 0.2s",
    color: "#ef4444",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "44px",
    height: "44px",
  },
  logoutIcon: {
    fontSize: "1.2rem",
    transform: "rotate(180deg)",
  },
};

export default OnlineHomepage;
