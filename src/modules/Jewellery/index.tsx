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
  const { goldRate, settings } = useJewellerySettings();
  const [stats, setStats] = useState({
    totalItems: 0,
    totalWeight: 0,
    buyValue: 0,
    sellValue: 0,
  });
  const [personsWeight, setPersonsWeight] = useState<
    { person: string; totalWeight: number }[]
  >([]);
  const [locationWeight, setLocationWeight] = useState<
    { location: string; totalWeight: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Get makingTaxPercent and resaleDiscountPercent from settings object
  const makingTaxPercent = settings?.makingTaxPercent || 0;
  const resaleDiscountPercent = settings?.resaleDiscountPercent || 0;

  // Fetch real data from Firestore
  useEffect(() => {
    const fetchJewelleryStats = async () => {
      try {
        const db = getFirestore();
        const jewelleryRef = collection(db, "jewellery");
        const snapshot = await getDocs(jewelleryRef);

        const activeItems: Jewellery[] = [];
        const personWeightMap: Record<string, number> = {};
        const locationWeightMap: Record<string, number> = {};

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

            // Aggregate weight by person (boughtFor)
            if (item.boughtFor && item.boughtFor.trim() !== "") {
              const person = item.boughtFor.trim();
              personWeightMap[person] =
                (personWeightMap[person] || 0) + item.weight;
            }

            // Aggregate weight by location
            if (item.location && item.location.trim() !== "") {
              const location = item.location.trim();
              locationWeightMap[location] =
                (locationWeightMap[location] || 0) + item.weight;
            }
          }
        });

        const totalWeight = activeItems.reduce(
          (sum, item) => sum + item.weight,
          0,
        );

        // Calculate buy value (gold rate + making tax percentage)
        const goldValue = totalWeight * goldRate;
        const buyValue = goldValue * (1 + makingTaxPercent / 100);

        // Calculate sell value (gold rate - resale discount percentage)
        const sellValue = goldValue * (1 - resaleDiscountPercent / 100);

        // Convert personWeightMap to array and sort by weight descending
        const personsArray = Object.entries(personWeightMap)
          .map(([person, totalWeight]) => ({ person, totalWeight }))
          .sort((a, b) => b.totalWeight - a.totalWeight);

        // Convert locationWeightMap to array and sort by weight descending
        const locationsArray = Object.entries(locationWeightMap)
          .map(([location, totalWeight]) => ({ location, totalWeight }))
          .sort((a, b) => b.totalWeight - a.totalWeight);

        setStats({
          totalItems: activeItems.length,
          totalWeight,
          buyValue,
          sellValue,
        });
        setPersonsWeight(personsArray);
        setLocationWeight(locationsArray);
      } catch (error) {
        console.error("Error fetching jewellery stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJewelleryStats();
  }, [goldRate, makingTaxPercent, resaleDiscountPercent]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatWeight = (weight: number): string => {
    return `${weight.toFixed(1)}g`;
  };

  const formatPercent = (percent: number): string => {
    return `${percent}%`;
  };

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

      {/* ALL SCROLLABLE CONTENT */}
      <div style={jewelleryStyles.contentWrapper}>
        {/* Three Small Cards for Weight and Values */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          {/* Total Weight Card */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "10px",
              padding: "15px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "5px",
              }}
            >
              Total Weight
            </div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#3b82f6",
              }}
            >
              {formatWeight(stats.totalWeight)}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                marginTop: "5px",
              }}
            >
              {stats.totalItems} items
            </div>
          </div>

          {/* Buy Value Card */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "10px",
              padding: "15px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "5px",
              }}
            >
              Buy Value
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#10b981",
              }}
            >
              {formatCurrency(stats.buyValue)}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                marginTop: "5px",
              }}
            >
              ₹{goldRate}/g + {formatPercent(makingTaxPercent)}
            </div>
          </div>

          {/* Sell Value Card */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "10px",
              padding: "15px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "5px",
              }}
            >
              Sell Value
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#ef4444",
              }}
            >
              {formatCurrency(stats.sellValue)}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                marginTop: "5px",
              }}
            >
              -{formatPercent(resaleDiscountPercent)} resale
            </div>
          </div>
        </div>

        {/* Weight by Person Card */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "10px",
            padding: "15px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "15px",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#333",
              marginBottom: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Weight by Person</span>
            <span
              style={{
                fontSize: "12px",
                color: "#6b7280",
                fontWeight: "normal",
              }}
            >
              {personsWeight.length} persons
            </span>
          </div>

          {personsWeight.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#9ca3af",
                fontSize: "14px",
              }}
            >
              No person data available
            </div>
          ) : (
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {personsWeight.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom:
                      index < personsWeight.length - 1
                        ? "1px solid #f3f4f6"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#4b5563",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginRight: "10px",
                    }}
                    title={item.person}
                  >
                    {item.person}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#111827",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatWeight(item.totalWeight)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weight by Location Card */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "10px",
            padding: "15px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "15px",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#333",
              marginBottom: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Weight by Location</span>
            <span
              style={{
                fontSize: "12px",
                color: "#6b7280",
                fontWeight: "normal",
              }}
            >
              {locationWeight.length} locations
            </span>
          </div>

          {locationWeight.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#9ca3af",
                fontSize: "14px",
              }}
            >
              No location data available
            </div>
          ) : (
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {locationWeight.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom:
                      index < locationWeight.length - 1
                        ? "1px solid #f3f4f6"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#4b5563",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginRight: "10px",
                    }}
                    title={item.location}
                  >
                    {item.location}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#111827",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatWeight(item.totalWeight)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Jewellery Navigation */}
        <JewelleryNavigation />

        {/* Bottom spacing */}
        <div style={{ height: "100px" }}></div>
      </div>
    </div>
  );
};

export default JewelleryHome;
