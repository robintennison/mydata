import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import Header from "../../components/Layout/Header";
import { cls } from "../../utils/tailwindMapping";

type TabType = "dashboard" | "list" | "gallery" | "bills" | "verification";

const JewelleryHome: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  // Initialize activeTab from location state if available
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    return location.state?.activeTab || "dashboard";
  });

  // Read activeTab from location state when component mounts or location changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);

      // Clean up location state to prevent persisting across refreshes
      if (location.state?.activeTab) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [location]);

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

  // Handle Add button click for Header
  const handleAddClick = () => {
    switch (activeTab) {
      case "list":
        navigate("/jewellery/add", {
          state: { returnTo: "/jewellery", activeTab: "list" },
        });
        break;
      case "bills":
        navigate("/jewellery/bills/add", {
          state: { returnTo: "/jewellery", activeTab: "bills" },
        });
        break;
      case "dashboard":
      case "gallery":
      case "verification":
      default:
        // For tabs that don't have add functionality, show guidance
        if (
          activeTab === "dashboard" ||
          activeTab === "gallery" ||
          activeTab === "verification"
        ) {
          alert(
            "Select List tab to add jewellery items or Bills tab to add bills",
          );
        }
        break;
    }
  };

  // Check if current tab should show Add button
  const shouldShowAddButton = () => {
    return activeTab === "list" || activeTab === "bills";
  };

  // Get button title based on active tab
  const getAddButtonTitle = () => {
    switch (activeTab) {
      case "list":
        return "Add Jewellery Item";
      case "bills":
        return "Add Bill";
      default:
        return "Add";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-5">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 text-sm">Loading jewellery data...</p>
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
            <div className="pt-2 px-1">
              {/* Three Small Cards for Weight and Values */}
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {/* Total Weight Card */}
                <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                  <div className="text-[11px] text-gray-500 mb-1">
                    Total Weight
                  </div>
                  <div className="text-base font-semibold text-blue-500">
                    {formatWeight(stats.totalWeight)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {stats.totalItems} items
                  </div>
                </div>

                {/* Buy Value Card */}
                <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                  <div className="text-[11px] text-gray-500 mb-1">
                    Buy Value
                  </div>
                  <div className="text-sm font-semibold text-emerald-500">
                    {formatValueInLakhs(stats.buyValue)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    ₹{goldRate}/g + {formatPercent(makingTaxPercent)}
                  </div>
                </div>

                {/* Sell Value Card */}
                <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                  <div className="text-[11px] text-gray-500 mb-1">
                    Sell Value
                  </div>
                  <div className="text-sm font-semibold text-red-500">
                    {formatValueInLakhs(stats.sellValue)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    -{formatPercent(resaleDiscountPercent)} resale
                  </div>
                </div>
              </div>

              {/* Weight Distribution Cards - SIDE BY SIDE */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {/* Weight by Person Card */}
                <div className="bg-white rounded-lg p-3 shadow-sm h-full flex flex-col">
                  <div className="text-[13px] font-semibold text-gray-800 mb-2.5 flex justify-between items-center">
                    <span>By Person</span>
                    <span className="text-[11px] text-gray-500 font-normal">
                      {personsWeight.length}
                    </span>
                  </div>

                  {personsWeight.length === 0 ? (
                    <div className="text-center p-4 text-gray-400 text-xs flex-1 flex items-center justify-center">
                      No person data
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto max-h-[200px] pr-0.5">
                      {personsWeight.map((item, index) => (
                        <div
                          key={index}
                          className={`flex justify-between items-center py-2 pr-1 ${
                            index < personsWeight.length - 1
                              ? "border-b border-gray-100"
                              : ""
                          }`}
                        >
                          <div
                            className="text-xs text-gray-600 flex-1 overflow-hidden text-ellipsis whitespace-nowrap mr-2"
                            title={item.person}
                          >
                            {item.person}
                          </div>
                          <div className="text-xs font-semibold text-gray-900 whitespace-nowrap min-w-[50px] text-right">
                            {formatWeight(item.totalWeight)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Weight by Location Card */}
                <div className="bg-white rounded-lg p-3 shadow-sm h-full flex flex-col">
                  <div className="text-[13px] font-semibold text-gray-800 mb-2.5 flex justify-between items-center">
                    <span>By Location</span>
                    <span className="text-[11px] text-gray-500 font-normal">
                      {locationWeight.length}
                    </span>
                  </div>

                  {locationWeight.length === 0 ? (
                    <div className="text-center p-4 text-gray-400 text-xs flex-1 flex items-center justify-center">
                      No location data
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto max-h-[200px] pr-0.5">
                      {locationWeight.map((item, index) => (
                        <div
                          key={index}
                          className={`flex justify-between items-center py-2 pr-1 ${
                            index < locationWeight.length - 1
                              ? "border-b border-gray-100"
                              : ""
                          }`}
                        >
                          <div
                            className="text-xs text-gray-600 flex-1 overflow-hidden text-ellipsis whitespace-nowrap mr-2"
                            title={item.location}
                          >
                            {item.location}
                          </div>
                          <div className="text-xs font-semibold text-gray-900 whitespace-nowrap min-w-[50px] text-right">
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

  // Tab Button Component
  const TabButton = ({
    id,
    label,
    icon,
  }: {
    id: TabType;
    label: string;
    icon: string;
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cls(
        "flex-1 py-3.5 px-2 bg-transparent border-none text-xs flex items-center justify-center gap-1 min-w-0 transition-all cursor-pointer",
        activeTab === id
          ? "bg-gray-100 text-gray-900 font-semibold border-b-2 border-blue-500"
          : "text-gray-500 font-normal hover:bg-gray-50",
      )}
      title={label}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-screen">
      {/* Header with Add button */}
      <Header
        showAddButton={shouldShowAddButton()}
        onAddClick={handleAddClick}
        addButtonTitle={getAddButtonTitle()}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Tab Navigation - Compact with smaller text */}
        <div className="flex bg-white border-b border-gray-200 shrink-0">
          <TabButton id="dashboard" label="Dash" icon="📊" />
          <TabButton id="list" label="List" icon="📋" />
          <TabButton id="gallery" label="Gallery" icon="🖼️" />
          <TabButton id="bills" label="Bills" icon="📄" />
          <TabButton id="verification" label="Verify" icon="✓" />
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto px-0.5 py-2">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default JewelleryHome;
