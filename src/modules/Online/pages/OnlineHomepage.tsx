import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";
import { tw, cls } from "../../../utils/tailwindMapping";
import OnlineListTab from "./OnlineListTab";
import RenewalListTab from "./RenewalListTab";
import CategoryListTab from "./CategoryListTab";
import Header from "../../../components/Layout/Header";

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
  const { isAuthenticated } = useAuth();

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

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className={tw.container}>
        <Header />
        <div className={tw.loading}>
          <div className={tw.spinner}></div>
          <p>Loading online module...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={tw.container}>
      <Header
        showAddButton={true}
        onAddClick={handleAddClick}
        addButtonTitle={getAddButtonTitle()}
      />

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
