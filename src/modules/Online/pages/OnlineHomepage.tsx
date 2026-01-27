import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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

  if (loading) {
    return (
      <div style={onlineStyles.container}>
        <div style={onlineStyles.loading}>
          <div style={onlineStyles.spinner}></div>
          <p>Loading online module...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={onlineStyles.container}>
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

      {/* Add button - now as Floating Action Button */}
      <button
        onClick={handleAddClick}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor:
            activeTab === "items"
              ? "#48bb78"
              : activeTab === "renewals"
                ? "#ed8936"
                : "#4299e1",
          color: "white",
          border: "none",
          borderRadius: "50%",
          padding: "16px",
          fontSize: "20px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "56px",
          height: "56px",
          transition: "background-color 0.2s, transform 0.2s",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          zIndex: 100,
        }}
        title={`Add ${activeTab === "items" ? "Item" : activeTab === "renewals" ? "Renewal" : "Category"}`}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        +
      </button>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        button:hover {
          opacity: 0.9;
        }
        
        /* Tab button hover effect */
        div > button[style*="background-color: transparent"]:hover {
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default OnlineHomepage;
