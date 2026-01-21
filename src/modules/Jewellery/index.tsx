import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jewelleryStyles } from "./styles/jewelleryStyles";
import JewelleryNavigation from "./components/JewelleryNavigation";
import { useJewellerySettings } from "./hooks/useSettingsData";
import {
  getFirestore,
  collection,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { Jewellery, VerificationStatus } from "./models/types";

const JewelleryHome: React.FC = () => {
  const navigate = useNavigate();
  const { goldRate } = useJewellerySettings();
  const [stats, setStats] = useState({
    totalItems: 0,
    totalWeight: 0,
    estimatedValue: 0,
    verifiedCount: 0,
    missingCount: 0,
    notVerifiedCount: 0,
    withImagesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch real data from Firestore
  useEffect(() => {
    const fetchJewelleryStats = async () => {
      try {
        const db = getFirestore();
        const jewelleryRef = collection(db, "jewellery");
        const snapshot = await getDocs(jewelleryRef);

        const activeItems: Jewellery[] = [];

        snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          const item: Jewellery = {
            id: doc.id,
            code: data.code || "",
            description: data.description || "",
            weight: data.weight || 0,
            location: data.location || "",
            boughtFor: data.boughtFor || "",
            purchaseDate: data.purchaseDate || 0,
            imageUrl: data.imageUrl || "",
            active: data.active !== false,
            billId: data.billId,
            lastVerified: data.lastVerified || 0,
            verificationStatus:
              data.verificationStatus || VerificationStatus.NOT_VERIFIED,
            verificationNotes: data.verificationNotes || "",
          };

          if (item.active) {
            activeItems.push(item);
          }
        });

        const totalWeight = activeItems.reduce(
          (sum, item) => sum + item.weight,
          0,
        );
        const estimatedValue = totalWeight * goldRate;
        const verifiedCount = activeItems.filter(
          (item) => item.verificationStatus === VerificationStatus.VERIFIED,
        ).length;
        const missingCount = activeItems.filter(
          (item) => item.verificationStatus === VerificationStatus.MISSING,
        ).length;
        const notVerifiedCount = activeItems.filter(
          (item) => item.verificationStatus === VerificationStatus.NOT_VERIFIED,
        ).length;
        const withImagesCount = activeItems.filter(
          (item) => item.imageUrl && item.imageUrl.trim() !== "",
        ).length;

        setStats({
          totalItems: activeItems.length,
          totalWeight,
          estimatedValue,
          verifiedCount,
          missingCount,
          notVerifiedCount,
          withImagesCount,
        });
      } catch (error) {
        console.error("Error fetching jewellery stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJewelleryStats();
  }, [goldRate]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Bottom navigation buttons (4 buttons like Banking)
  const bottomNavButtons = [
    {
      id: "list",
      title: "List",
      icon: "📋",
      description: "View all items",
      path: "/jewellery/list",
      color: "#3b82f6",
    },
    {
      id: "gallery",
      title: "Gallery",
      icon: "🖼️",
      description: "Image gallery",
      path: "/jewellery/gallery",
      color: "#8b5cf6",
    },
    {
      id: "verification",
      title: "Verify",
      icon: "✅",
      description: "Stock check",
      path: "/jewellery/verification",
      color: "#10b981",
    },
    {
      id: "bills",
      title: "Bills",
      icon: "📄",
      description: "Documents",
      path: "/jewellery/bills",
      color: "#f59e0b",
    },
  ];

  const features = [
    {
      id: "add-jewellery",
      title: "Add Jewellery",
      description: "Add new jewellery item with details and images",
      icon: "➕",
      path: "/jewellery/add",
    },
    {
      id: "quick-actions",
      title: "Quick Actions",
      description: "Bulk verification and status updates",
      icon: "⚡",
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
            <div style={jewelleryStyles.statValue}>
              {loading ? "..." : stats.totalItems}
            </div>
          </div>
          <div style={jewelleryStyles.statItem}>
            <div style={jewelleryStyles.statLabel}>Total Weight</div>
            <div style={jewelleryStyles.statValue}>
              {loading ? "..." : `${stats.totalWeight.toFixed(1)}g`}
            </div>
          </div>
          <div style={jewelleryStyles.statItem}>
            <div style={jewelleryStyles.statLabel}>Estimated Value</div>
            <div style={jewelleryStyles.statValue}>
              {loading ? "..." : formatCurrency(stats.estimatedValue)}
            </div>
          </div>
          <div style={jewelleryStyles.statItem}>
            <div style={jewelleryStyles.statLabel}>Verified</div>
            <div style={{ ...jewelleryStyles.statValue, color: "#10b981" }}>
              {loading ? "..." : stats.verifiedCount}
            </div>
          </div>
          <div style={jewelleryStyles.statItem}>
            <div style={jewelleryStyles.statLabel}>Not Verified</div>
            <div style={{ ...jewelleryStyles.statValue, color: "#6b7280" }}>
              {loading ? "..." : stats.notVerifiedCount}
            </div>
          </div>
          <div style={jewelleryStyles.statItem}>
            <div style={jewelleryStyles.statLabel}>With Images</div>
            <div style={jewelleryStyles.statValue}>
              {loading ? "..." : stats.withImagesCount}
            </div>
          </div>
        </div>
        {!loading && stats.missingCount > 0 && (
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

      {/* Feature Cards - Keep your original layout */}
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

      {/* Bottom Navigation (4 buttons like Banking) - Added ABOVE main navigation */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          padding: "15px",
          backgroundColor: "white",
          borderTop: "1px solid #e5e7eb",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "10px",
        }}
      >
        {bottomNavButtons.map((button) => (
          <button
            key={button.id}
            onClick={() => navigate(button.path)}
            style={{
              flex: 1,
              padding: "12px 8px",
              backgroundColor: button.color,
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500" as const,
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              transition: "background-color 0.2s",
            }}
            title={button.description}
          >
            <div style={{ fontSize: "18px" }}>{button.icon}</div>
            <div style={{ fontSize: "11px", fontWeight: "400" as const }}>
              {button.title}
            </div>
          </button>
        ))}
      </div>

      {/* Navigation Component */}
      <JewelleryNavigation />
      <div style={{ height: "20px" }}></div>

      {/* Add hover effect CSS */}
      <style>{`
        .bottom-nav-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default JewelleryHome;
