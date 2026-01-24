import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { onlineStyles } from "../styles/onlineStyles";
import OnlineListTab from "./OnlineListTab"; // Add this import
import RenewalListTab from "./RenewalListTab"; // Add this import
import CategoryListTab from "./CategoryListTab"; // Add this import

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
  const [activeTab, setActiveTab] = useState<
    "items" | "renewals" | "categories"
  >("items");
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
      {/* Top Navigation with Add button */}
      <div style={onlineStyles.topNav}>
        <button
          onClick={() => navigate("/")}
          style={onlineStyles.navButton}
          title="Back to Home"
        >
          🏠
        </button>
        <div style={onlineStyles.navTitle}>Online</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Add button - changes color based on active tab */}
          <button
            onClick={handleAddClick}
            style={{
              ...onlineStyles.navButton,
              backgroundColor:
                activeTab === "items"
                  ? "#48bb78"
                  : activeTab === "renewals"
                    ? "#ed8936"
                    : "#4299e1",
              color: "white",
              border: "none",
              fontSize: "1.2rem",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={`Add ${activeTab === "items" ? "Item" : activeTab === "renewals" ? "Renewal" : "Category"}`}
          >
            +
          </button>
          <button
            onClick={() => navigate("/settings")}
            style={onlineStyles.navButton}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

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
