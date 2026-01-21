import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jewelleryStyles } from "./styles/jewelleryStyles";
import JewelleryNavigation from "./components/JewelleryNavigation";
import { useJewellerySettings } from "./hooks/useSettingsData";

// newly inserted

const JewelleryHome: React.FC = () => {
  const navigate = useNavigate();
  const { goldRate } = useJewellerySettings();
  const [stats, setStats] = useState({
    totalItems: 0,
    totalWeight: 0,
    estimatedValue: 0,
    verifiedCount: 0,
    missingCount: 0,
  });

  // Mock data - replace with actual Firebase data
  useEffect(() => {
    // TODO: Fetch jewellery items and calculate stats
    setTimeout(() => {
      const mockItems = [
        { weight: 25.5, active: true, verificationStatus: "Verified" },
        { weight: 8.2, active: true, verificationStatus: "Missing" },
        { weight: 45.0, active: true, verificationStatus: "Not Verified" },
        { weight: 15.0, active: false, verificationStatus: "Verified" },
      ];

      const totalWeight = mockItems
        .filter((item) => item.active)
        .reduce((sum, item) => sum + item.weight, 0);

      const estimatedValue = totalWeight * goldRate;

      const verifiedCount = mockItems.filter(
        (item) => item.active && item.verificationStatus === "Verified",
      ).length;

      const missingCount = mockItems.filter(
        (item) => item.active && item.verificationStatus === "Missing",
      ).length;

      setStats({
        totalItems: mockItems.filter((item) => item.active).length,
        totalWeight,
        estimatedValue,
        verifiedCount,
        missingCount,
      });
    }, 500);
  }, [goldRate]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const features = [
    {
      id: "jewellery-list",
      title: "Jewellery Items",
      description: "View, add, edit or delete jewellery items",
      icon: "💎",
      path: "/jewellery/list",
    },
    {
      id: "bills-list",
      title: "Bills & Documents",
      description: "Manage purchase bills and documents",
      icon: "📄",
      path: "/jewellery/bills",
    },
    {
      id: "stats",
      title: "Statistics",
      description: "View jewellery statistics and reports",
      icon: "📊",
      path: "/jewellery/stats",
    },
    {
      id: "verification",
      title: "Stock Verification",
      description: "Verify stock and update status",
      icon: "✅",
      path: "/jewellery/verification",
    },
  ];

  return (
    <div style={jewelleryStyles.container}>
      {/* Top Navigation */}
      <div style={jewelleryStyles.topNav}>
        <button
          onClick={() => navigate("/")}
          style={jewelleryStyles.navButton}
          title="Back to Home"
        >
          ←
        </button>
        <div style={jewelleryStyles.navTitle}>Jewellery Management</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate("/settings")}
            style={{
              ...jewelleryStyles.navButton,
              padding: "6px 10px",
              fontSize: "1.2rem",
            }}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Stats Overview Card */}
      <div style={jewelleryStyles.statsCard}>
        <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>
          Jewellery Overview
        </h3>
        <div style={jewelleryStyles.statsGrid}>
          <div style={jewelleryStyles.statItem}>
            <div style={jewelleryStyles.statLabel}>Total Items</div>
            <div style={jewelleryStyles.statValue}>{stats.totalItems}</div>
          </div>
          <div style={jewelleryStyles.statItem}>
            <div style={jewelleryStyles.statLabel}>Total Weight</div>
            <div style={jewelleryStyles.statValue}>
              {stats.totalWeight.toFixed(1)}g
            </div>
          </div>
          <div style={jewelleryStyles.statItem}>
            <div style={jewelleryStyles.statLabel}>Estimated Value</div>
            <div style={jewelleryStyles.statValue}>
              {formatCurrency(stats.estimatedValue)}
            </div>
          </div>
          <div style={jewelleryStyles.statItem}>
            <div style={jewelleryStyles.statLabel}>Verified</div>
            <div style={jewelleryStyles.statValue}>{stats.verifiedCount}</div>
          </div>
        </div>
        {stats.missingCount > 0 && (
          <div
            style={{
              marginTop: "15px",
              padding: "10px",
              backgroundColor: "#fef2f2",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ⚠️ {stats.missingCount} items marked as missing
          </div>
        )}
      </div>

      {/* Feature Cards */}
      {features.map((feature) => (
        <div
          key={feature.id}
          style={jewelleryStyles.featureCard}
          onClick={() => navigate(feature.path)}
        >
          <div style={jewelleryStyles.featureIcon}>{feature.icon}</div>
          <div style={jewelleryStyles.featureTitle}>{feature.title}</div>
          <div style={jewelleryStyles.featureDescription}>
            {feature.description}
          </div>
        </div>
      ))}

      {/* Navigation Component */}
      <JewelleryNavigation />
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default JewelleryHome;
