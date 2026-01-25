import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocation
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
  const location = useLocation(); // Added useLocation

  // State for active tab
  const [activeTab, setActiveTab] = useState<
    "items" | "renewals" | "categories"
  >("items");

  // Read the state when component mounts or location changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

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

  const handleAddClick = () => {
    switch (activeTab) {
      case "items":
        navigate("/online/items/add");
        break;
      case "renewals":
        navigate("/online/renewals/add");
        break;
      case "categories":
        navigate("/online/categories/add");
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
      {/* REMOVED: Top Navigation header - now in main Layout Header */}

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          backgroundColor: "white",
          borderBottom: "1px solid #e9ecef",
          padding: "0 15px",
        }}
      >
        <button
          onClick={() => setActiveTab("items")}
          style={{
            flex: 1,
            padding: "15px 0",
            backgroundColor: "transparent",
            border: "none",
            borderBottom:
              activeTab === "items"
                ? "2px solid #48bb78"
                : "2px solid transparent",
            color: activeTab === "items" ? "#48bb78" : "#666",
            fontWeight: activeTab === "items" ? "600" : "500",
            fontSize: "0.95rem",
            cursor: "pointer",
            transition: "all 0.2s",
            position: "relative",
          }}
        >
          Items
          {counts.items > 0 && (
            <span
              style={{
                position: "absolute",
                top: "8px",
                right: "15px",
                backgroundColor: "#48bb78",
                color: "white",
                fontSize: "0.7rem",
                padding: "2px 6px",
                borderRadius: "10px",
                minWidth: "20px",
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
            padding: "15px 0",
            backgroundColor: "transparent",
            border: "none",
            borderBottom:
              activeTab === "renewals"
                ? "2px solid #ed8936"
                : "2px solid transparent",
            color: activeTab === "renewals" ? "#ed8936" : "#666",
            fontWeight: activeTab === "renewals" ? "600" : "500",
            fontSize: "0.95rem",
            cursor: "pointer",
            transition: "all 0.2s",
            position: "relative",
          }}
        >
          Renewals
          {counts.renewals > 0 && (
            <span
              style={{
                position: "absolute",
                top: "8px",
                right: "15px",
                backgroundColor:
                  counts.expiringSoon > 0 ? "#ed8936" : "#4299e1",
                color: "white",
                fontSize: "0.7rem",
                padding: "2px 6px",
                borderRadius: "10px",
                minWidth: "20px",
                textAlign: "center",
              }}
            >
              {counts.renewals}
              {counts.expiringSoon > 0 && (
                <span
                  style={{
                    display: "block",
                    fontSize: "0.6rem",
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
            padding: "15px 0",
            backgroundColor: "transparent",
            border: "none",
            borderBottom:
              activeTab === "categories"
                ? "2px solid #4299e1"
                : "2px solid transparent",
            color: activeTab === "categories" ? "#4299e1" : "#666",
            fontWeight: activeTab === "categories" ? "600" : "500",
            fontSize: "0.95rem",
            cursor: "pointer",
            transition: "all 0.2s",
            position: "relative",
          }}
        >
          Categories
          {counts.categories > 0 && (
            <span
              style={{
                position: "absolute",
                top: "8px",
                right: "15px",
                backgroundColor: "#9f7aea",
                color: "white",
                fontSize: "0.7rem",
                padding: "2px 6px",
                borderRadius: "10px",
                minWidth: "20px",
                textAlign: "center",
              }}
            >
              {counts.categories}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <TabContent activeTab={activeTab} />
      </div>

      {/* Add button - now as Floating Action Button */}
      <button
        onClick={handleAddClick}
        style={{
          position: "fixed" as const,
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
