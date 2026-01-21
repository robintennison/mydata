import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jewelleryStyles } from "../styles/jewelleryStyles";
import JewelleryNavigation from "../components/JewelleryNavigation";
import { Jewellery } from "../models/types";

const JewelleryStats: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalItems: 0,
    totalWeight: 0,
    verifiedCount: 0,
    missingCount: 0,
    notVerifiedCount: 0,
    byLocation: {} as Record<string, number>,
    byPerson: {} as Record<string, number>,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch jewellery data and calculate stats
    setTimeout(() => {
      const mockItems: Jewellery[] = [
        // Mock data - replace with actual data
      ];

      const calculatedStats = {
        totalItems: mockItems.length,
        totalWeight: mockItems.reduce((sum, item) => sum + item.weight, 0),
        verifiedCount: mockItems.filter(
          (item) => item.verificationStatus === "Verified", // Match Android
        ).length,
        missingCount: mockItems.filter(
          (item) => item.verificationStatus === "Missing", // Match Android
        ).length,
        notVerifiedCount: mockItems.filter(
          (item) => item.verificationStatus === "Not Verified", // Match Android
        ).length,
        byLocation: {},
        byPerson: {},
      };

      setStats(calculatedStats);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div style={jewelleryStyles.container}>
        <div style={jewelleryStyles.loading}>
          <div style={jewelleryStyles.spinner}></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={jewelleryStyles.container}>
      {/* Top Navigation */}
      <div style={jewelleryStyles.topNav}>
        <button
          onClick={() => navigate("/jewellery")}
          style={jewelleryStyles.navButton}
          title="Back to Jewellery"
        >
          ←
        </button>
        <div style={jewelleryStyles.navTitle}>Jewellery Statistics</div>
        <div style={{ width: "40px" }}></div>
      </div>

      {/* Stats Cards */}
      <div style={{ padding: "15px" }}>
        <div style={jewelleryStyles.statsCard}>
          <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>
            Overview Statistics
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
              <div style={jewelleryStyles.statLabel}>Verified</div>
              <div style={jewelleryStyles.statValue}>{stats.verifiedCount}</div>
            </div>
            <div style={jewelleryStyles.statItem}>
              <div style={jewelleryStyles.statLabel}>Not Verified</div>
              <div style={jewelleryStyles.statValue}>
                {stats.notVerifiedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status Chart */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "20px",
            marginTop: "15px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>
            Verification Status
          </h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: "#10b981",
                  borderRadius: "2px",
                }}
              ></div>
              <div style={{ flex: 1 }}>Verified</div>
              <div style={{ fontWeight: "600" }}>{stats.verifiedCount}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: "#ef4444",
                  borderRadius: "2px",
                }}
              ></div>
              <div style={{ flex: 1 }}>Missing</div>
              <div style={{ fontWeight: "600" }}>{stats.missingCount}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: "#6b7280",
                  borderRadius: "2px",
                }}
              ></div>
              <div style={{ flex: 1 }}>Not Verified</div>
              <div style={{ fontWeight: "600" }}>{stats.notVerifiedCount}</div>
            </div>
          </div>
        </div>
      </div>

      <JewelleryNavigation />
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default JewelleryStats;
