import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";
import { tw, cls } from "../../../utils/tailwindMapping";
import OnlineListTab from "./OnlineListTab";
import RenewalListTab from "./RenewalListTab";
import CategoryListTab from "./CategoryListTab";
import styles from "../../../App.module.css"; // Keep CSS module for header for now

// Tab components
const TabContent: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  return (
    <div className={tw.scrollableArea}>
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
      <div className={tw.container}>
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

        <div className={tw.loading}>
          <div className={tw.spinner}></div>
          <p>Loading online module...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={tw.container}>
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
      <div className={tw.contentWrapper}>
        {/* Tab Navigation with Tailwind */}
        <div className="flex bg-white border-b border-gray-200 px-1 shrink-0">
          <button
            onClick={() => setActiveTab("items")}
            className={cls(
              "flex-1 py-3 bg-transparent border-none relative whitespace-nowrap transition-all duration-200",
              activeTab === "items"
                ? "border-b-2 border-blue-500 text-blue-500 font-semibold"
                : "border-b-2 border-transparent text-gray-600 font-medium hover:bg-gray-50",
            )}
          >
            Items
            {counts.items > 0 && (
              <span className="absolute top-1.5 right-2 bg-green-500 text-white text-xs px-1.5 rounded-full min-w-[18px] text-center">
                {counts.items}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("renewals")}
            className={cls(
              "flex-1 py-3 bg-transparent border-none relative whitespace-nowrap transition-all duration-200",
              activeTab === "renewals"
                ? "border-b-2 border-orange-500 text-orange-500 font-semibold"
                : "border-b-2 border-transparent text-gray-600 font-medium hover:bg-gray-50",
            )}
          >
            Renewals
            {counts.renewals > 0 && (
              <span
                className={cls(
                  "absolute top-1.5 right-2 text-white text-xs px-1.5 rounded-full min-w-[18px] text-center",
                  counts.expiringSoon > 0 ? "bg-orange-500" : "bg-blue-500",
                )}
              >
                {counts.renewals}
                {counts.expiringSoon > 0 && (
                  <span className="block text-[0.55rem] mt-0.5 text-orange-50">
                    {counts.expiringSoon} soon
                  </span>
                )}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={cls(
              "flex-1 py-3 bg-transparent border-none relative whitespace-nowrap transition-all duration-200",
              activeTab === "categories"
                ? "border-b-2 border-blue-500 text-blue-500 font-semibold"
                : "border-b-2 border-transparent text-gray-600 font-medium hover:bg-gray-50",
            )}
          >
            Categories
            {counts.categories > 0 && (
              <span className="absolute top-1.5 right-2 bg-purple-400 text-white text-xs px-1.5 rounded-full min-w-[18px] text-center">
                {counts.categories}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <TabContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
};

export default OnlineHomepage;
