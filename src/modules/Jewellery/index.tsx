import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jewelleryStyles } from "./styles/jewelleryStyles";
import { useJewellerySettings } from "./hooks/useSettingsData";
import {
  getFirestore,
  collection,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { Jewellery, VerificationStatus } from "./models/types";
import JewelleryNavigation from "./components/JewelleryNavigation";

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

  if (loading) {
    return (
      <div style={jewelleryStyles.centeredContainer}>
        <div style={jewelleryStyles.loading}>
          <div style={jewelleryStyles.spinner}></div>
          <p>Loading jewellery data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={jewelleryStyles.container}>
      {/* Top Navigation - Added plus icon */}
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
          {/* Plus icon for adding jewellery */}
          <button
            onClick={() => navigate("/jewellery/add")}
            style={{
              ...jewelleryStyles.navButton,
              padding: "6px 10px",
              fontSize: "1.2rem",
              backgroundColor: "#10b981",
              color: "white",
            }}
            title="Add Jewellery"
          >
            ➕
          </button>
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

      {/* ALL SCROLLABLE CONTENT */}
      <div style={jewelleryStyles.contentWrapper}>
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
                {`${stats.totalWeight.toFixed(1)}g`}
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
              <div style={{ ...jewelleryStyles.statValue, color: "#10b981" }}>
                {stats.verifiedCount}
              </div>
            </div>
            <div style={jewelleryStyles.statItem}>
              <div style={jewelleryStyles.statLabel}>Not Verified</div>
              <div style={{ ...jewelleryStyles.statValue, color: "#6b7280" }}>
                {stats.notVerifiedCount}
              </div>
            </div>
            <div style={jewelleryStyles.statItem}>
              <div style={jewelleryStyles.statLabel}>With Images</div>
              <div style={jewelleryStyles.statValue}>
                {stats.withImagesCount}
              </div>
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

        {/* Jewellery Navigation - This should NOT be fixed */}
        {/* Make sure JewelleryNavigation component doesn't have position: fixed */}
        <JewelleryNavigation />

        {/* Bottom spacing for the fixed bottom module navigation */}
        {/* This creates space at the bottom so content isn't hidden behind the fixed nav */}
        <div style={{ height: "100px" }}></div>
      </div>
    </div>
  );
};

export default JewelleryHome;
