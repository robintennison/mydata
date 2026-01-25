import React, { useEffect, useState } from "react";
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
import ListTab from "./pages/ListTab";
import BillsTab from "./pages/BillsTab";
import GalleryTab from "./pages/GalleryTab";
import VerificationTab from "./pages/VerificationTab";

type TabType = "dashboard" | "list" | "gallery" | "bills" | "verification";

const JewelleryHome: React.FC = () => {
  //const navigate = useNavigate();
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
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

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

  // Format value in lakhs without rupee symbol or L suffix (for privacy)
  const formatValueInLakhs = (amount: number): string => {
    const valueInLakhs = amount / 100000;

    // Format with 2 decimal places if needed, otherwise show as integer
    if (valueInLakhs % 1 === 0) {
      return valueInLakhs.toLocaleString("en-IN");
    } else {
      return valueInLakhs.toLocaleString("en-IN", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    }
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

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            {/* ADDED: Padding container for stat cards */}
            <div style={{ padding: "8px 4px 0 4px" }}>
              {/* Three Small Cards for Weight and Values */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "6px",
                  marginBottom: "8px",
                }}
              >
                {/* Total Weight Card */}
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "10px",
                    padding: "12px 4px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Total Weight
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#3b82f6",
                    }}
                  >
                    {formatWeight(stats.totalWeight)}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#9ca3af",
                      marginTop: "4px",
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
                    padding: "12px 4px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Buy Value
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#10b981",
                    }}
                  >
                    {formatValueInLakhs(stats.buyValue)}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#9ca3af",
                      marginTop: "4px",
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
                    padding: "12px 4px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Sell Value
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#ef4444",
                    }}
                  >
                    {formatValueInLakhs(stats.sellValue)}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#9ca3af",
                      marginTop: "4px",
                    }}
                  >
                    -{formatPercent(resaleDiscountPercent)} resale
                  </div>
                </div>
              </div>

              {/* Weight Distribution Cards - SIDE BY SIDE */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                {/* Weight by Person Card */}
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "10px",
                    padding: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#333",
                      marginBottom: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>By Person</span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        fontWeight: "normal",
                      }}
                    >
                      {personsWeight.length}
                    </span>
                  </div>

                  {personsWeight.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "15px",
                        color: "#9ca3af",
                        fontSize: "12px",
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      No person data
                    </div>
                  ) : (
                    <div
                      style={{
                        flex: 1,
                        overflowY: "auto",
                        maxHeight: "200px",
                        paddingRight: "2px",
                      }}
                    >
                      {personsWeight.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 0",
                            paddingRight: "4px",
                            borderBottom:
                              index < personsWeight.length - 1
                                ? "1px solid #f3f4f6"
                                : "none",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#4b5563",
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              marginRight: "8px",
                              paddingRight: "4px",
                            }}
                            title={item.person}
                          >
                            {item.person}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#111827",
                              whiteSpace: "nowrap",
                              paddingLeft: "4px",
                              paddingRight: "4px",
                              minWidth: "50px",
                              textAlign: "right",
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
                    padding: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#333",
                      marginBottom: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>By Location</span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        fontWeight: "normal",
                      }}
                    >
                      {locationWeight.length}
                    </span>
                  </div>

                  {locationWeight.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "15px",
                        color: "#9ca3af",
                        fontSize: "12px",
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      No location data
                    </div>
                  ) : (
                    <div
                      style={{
                        flex: 1,
                        overflowY: "auto",
                        maxHeight: "200px",
                        paddingRight: "2px",
                      }}
                    >
                      {locationWeight.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 0",
                            paddingRight: "4px",
                            borderBottom:
                              index < locationWeight.length - 1
                                ? "1px solid #f3f4f6"
                                : "none",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#4b5563",
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              marginRight: "8px",
                              paddingRight: "4px",
                            }}
                            title={item.location}
                          >
                            {item.location}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#111827",
                              whiteSpace: "nowrap",
                              paddingLeft: "4px",
                              paddingRight: "4px",
                              minWidth: "50px",
                              textAlign: "right",
                            }}
                          >
                            {formatWeight(item.totalWeight)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      case "list":
        return <ListTab />;
      case "gallery":
        return <GalleryTab compact={false} />;
      case "bills":
        return <BillsTab compact={false} />;
      case "verification":
        return <VerificationTab compact={false} />;
      default:
        return <ListTab />;
    }
  };

  return (
    <div style={jewelleryStyles.container}>
      {/* Tab Navigation - Compact with smaller text */}
      <div
        style={{
          display: "flex",
          backgroundColor: "white",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <button
          onClick={() => setActiveTab("dashboard")}
          style={{
            padding: "14px 8px",
            border: "none",
            backgroundColor:
              activeTab === "dashboard" ? "#f3f4f6" : "transparent",
            color: activeTab === "dashboard" ? "#111827" : "#6b7280",
            fontSize: "12px",
            fontWeight: activeTab === "dashboard" ? "600" : "400",
            borderBottom:
              activeTab === "dashboard" ? "2px solid #3b82f6" : "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "3px",
            flex: 1,
            justifyContent: "center",
            minWidth: 0,
          }}
          title="Dashboard"
        >
          <span>📊</span>
          <span>Dash</span>
        </button>

        <button
          onClick={() => setActiveTab("list")}
          style={{
            padding: "14px 8px",
            border: "none",
            backgroundColor: activeTab === "list" ? "#f3f4f6" : "transparent",
            color: activeTab === "list" ? "#111827" : "#6b7280",
            fontSize: "12px",
            fontWeight: activeTab === "list" ? "600" : "400",
            borderBottom: activeTab === "list" ? "2px solid #3b82f6" : "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "3px",
            flex: 1,
            justifyContent: "center",
            minWidth: 0,
          }}
          title="List"
        >
          <span>📋</span>
          <span>List</span>
        </button>

        <button
          onClick={() => setActiveTab("gallery")}
          style={{
            padding: "14px 8px",
            border: "none",
            backgroundColor:
              activeTab === "gallery" ? "#f3f4f6" : "transparent",
            color: activeTab === "gallery" ? "#111827" : "#6b7280",
            fontSize: "12px",
            fontWeight: activeTab === "gallery" ? "600" : "400",
            borderBottom:
              activeTab === "gallery" ? "2px solid #3b82f6" : "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "3px",
            flex: 1,
            justifyContent: "center",
            minWidth: 0,
          }}
          title="Gallery"
        >
          <span>🖼️</span>
          <span>Gallery</span>
        </button>

        <button
          onClick={() => setActiveTab("bills")}
          style={{
            padding: "14px 8px",
            border: "none",
            backgroundColor: activeTab === "bills" ? "#f3f4f6" : "transparent",
            color: activeTab === "bills" ? "#111827" : "#6b7280",
            fontSize: "12px",
            fontWeight: activeTab === "bills" ? "600" : "400",
            borderBottom: activeTab === "bills" ? "2px solid #3b82f6" : "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "3px",
            flex: 1,
            justifyContent: "center",
            minWidth: 0,
          }}
          title="Bills"
        >
          <span>📄</span>
          <span>Bills</span>
        </button>

        <button
          onClick={() => setActiveTab("verification")}
          style={{
            padding: "14px 8px",
            border: "none",
            backgroundColor:
              activeTab === "verification" ? "#f3f4f6" : "transparent",
            color: activeTab === "verification" ? "#111827" : "#6b7280",
            fontSize: "12px",
            fontWeight: activeTab === "verification" ? "600" : "400",
            borderBottom:
              activeTab === "verification" ? "2px solid #3b82f6" : "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "3px",
            flex: 1,
            justifyContent: "center",
            minWidth: 0,
          }}
          title="Verification"
        >
          <span>✓</span>
          <span>Verify</span>
        </button>
      </div>

      {/* Tab Content Area */}
      <div
        style={{
          ...jewelleryStyles.contentWrapper,
          padding: "8px 2px",
        }}
      >
        {renderTabContent()}

        {/* Bottom spacing */}
        <div style={{ height: "80px" }}></div>
      </div>
    </div>
  );
};

export default JewelleryHome;
