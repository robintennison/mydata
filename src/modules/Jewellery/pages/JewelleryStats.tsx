import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { Jewellery } from "../models/types";

const JewelleryStats: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalItems: 0,
    totalWeight: 0,
    activeItems: 0,
    inactiveItems: 0,
    verifiedCount: 0,
    missingCount: 0,
    notVerifiedCount: 0,
    byLocation: {} as Record<string, { count: number; weight: number }>,
    byPerson: {} as Record<string, { count: number; weight: number }>,
    topLocations: [] as Array<{
      location: string;
      count: number;
      weight: number;
    }>,
    topPeople: [] as Array<{ person: string; count: number; weight: number }>,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndCalculateStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const db = getFirestore();
        const jewelleryCollection = collection(db, "jewellery");
        const snapshot = await getDocs(jewelleryCollection);

        if (snapshot.empty) {
          setStats({
            totalItems: 0,
            totalWeight: 0,
            activeItems: 0,
            inactiveItems: 0,
            verifiedCount: 0,
            missingCount: 0,
            notVerifiedCount: 0,
            byLocation: {},
            byPerson: {},
            topLocations: [],
            topPeople: [],
          });
          setLoading(false);
          return;
        }

        const items: Jewellery[] = [];
        snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          items.push({
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
            verificationStatus: data.verificationStatus || "Not Verified",
            verificationNotes: data.verificationNotes || "",
          });
        });

        // Calculate statistics
        const locationStats: Record<string, { count: number; weight: number }> =
          {};
        const personStats: Record<string, { count: number; weight: number }> =
          {};

        let totalWeight = 0;
        let activeItems = 0;
        let inactiveItems = 0;
        let verifiedCount = 0;
        let missingCount = 0;
        let notVerifiedCount = 0;

        items.forEach((item) => {
          totalWeight += item.weight;

          if (item.active) {
            activeItems++;
          } else {
            inactiveItems++;
          }

          // Verification status
          switch (item.verificationStatus) {
            case "Verified":
              verifiedCount++;
              break;
            case "Missing":
              missingCount++;
              break;
            default:
              notVerifiedCount++;
          }

          // Location statistics
          if (item.location) {
            if (!locationStats[item.location]) {
              locationStats[item.location] = { count: 0, weight: 0 };
            }
            locationStats[item.location].count++;
            locationStats[item.location].weight += item.weight;
          }

          // Person statistics (boughtFor)
          if (item.boughtFor) {
            if (!personStats[item.boughtFor]) {
              personStats[item.boughtFor] = { count: 0, weight: 0 };
            }
            personStats[item.boughtFor].count++;
            personStats[item.boughtFor].weight += item.weight;
          }
        });

        // Sort top locations
        const topLocations = Object.entries(locationStats)
          .map(([location, stats]) => ({ location, ...stats }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Sort top people
        const topPeople = Object.entries(personStats)
          .map(([person, stats]) => ({ person, ...stats }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          totalItems: items.length,
          totalWeight,
          activeItems,
          inactiveItems,
          verifiedCount,
          missingCount,
          notVerifiedCount,
          byLocation: locationStats,
          byPerson: personStats,
          topLocations,
          topPeople,
        });
      } catch (error: any) {
        console.error("Error fetching statistics:", error);
        setError(`Failed to load statistics: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateStats();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    // Refetch data
    setTimeout(() => {
      const fetchAndCalculateStats = async () => {
        try {
          const db = getFirestore();
          const jewelleryCollection = collection(db, "jewellery");
          const snapshot = await getDocs(jewelleryCollection);

          const items: Jewellery[] = [];
          snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            items.push({
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
              verificationStatus: data.verificationStatus || "Not Verified",
              verificationNotes: data.verificationNotes || "",
            });
          });

          // Calculate statistics (same as above)
          const locationStats: Record<
            string,
            { count: number; weight: number }
          > = {};
          const personStats: Record<string, { count: number; weight: number }> =
            {};

          let totalWeight = 0;
          let activeItems = 0;
          let inactiveItems = 0;
          let verifiedCount = 0;
          let missingCount = 0;
          let notVerifiedCount = 0;

          items.forEach((item) => {
            totalWeight += item.weight;

            if (item.active) {
              activeItems++;
            } else {
              inactiveItems++;
            }

            switch (item.verificationStatus) {
              case "Verified":
                verifiedCount++;
                break;
              case "Missing":
                missingCount++;
                break;
              default:
                notVerifiedCount++;
            }

            if (item.location) {
              if (!locationStats[item.location]) {
                locationStats[item.location] = { count: 0, weight: 0 };
              }
              locationStats[item.location].count++;
              locationStats[item.location].weight += item.weight;
            }

            if (item.boughtFor) {
              if (!personStats[item.boughtFor]) {
                personStats[item.boughtFor] = { count: 0, weight: 0 };
              }
              personStats[item.boughtFor].count++;
              personStats[item.boughtFor].weight += item.weight;
            }
          });

          const topLocations = Object.entries(locationStats)
            .map(([location, stats]) => ({ location, ...stats }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          const topPeople = Object.entries(personStats)
            .map(([person, stats]) => ({ person, ...stats }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          setStats({
            totalItems: items.length,
            totalWeight,
            activeItems,
            inactiveItems,
            verifiedCount,
            missingCount,
            notVerifiedCount,
            byLocation: locationStats,
            byPerson: personStats,
            topLocations,
            topPeople,
          });
          setError(null);
        } catch (error: any) {
          console.error("Error refreshing statistics:", error);
          setError(`Refresh failed: ${error.message}`);
        } finally {
          setLoading(false);
        }
      };
      fetchAndCalculateStats();
    }, 100);
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 py-2 px-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/jewellery")}
            className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="Back to Jewellery"
          >
            ←
          </button>
          <div className="font-semibold text-gray-800">
            Jewellery Statistics
          </div>
          <div className="w-10"></div>
        </div>
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 py-2 px-3 flex items-center justify-between">
        <button
          onClick={() => navigate("/jewellery")}
          className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Back to Jewellery"
        >
          ←
        </button>
        <div className="font-semibold text-gray-800">Jewellery Statistics</div>
        <button
          onClick={handleRefresh}
          className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Refresh Statistics"
        >
          🔄
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <span>⚠️</span>
            <strong>Error</strong>
          </div>
          <div className="text-red-700 text-sm mt-1">{error}</div>
          <button
            onClick={handleRefresh}
            className="mt-2 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Stats Cards */}
        <div className="p-4">
          {/* Main Stats Card */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Overview Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Total Items */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="text-sm text-gray-500 mb-1">Total Items</div>
                <div className="text-2xl font-bold text-gray-800">
                  {stats.totalItems}
                </div>
              </div>

              {/* Total Weight */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="text-sm text-gray-500 mb-1">Total Weight</div>
                <div className="text-2xl font-bold text-gray-800">
                  {stats.totalWeight.toFixed(1)}g
                </div>
              </div>

              {/* Active Items */}
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <div className="text-sm text-emerald-600 mb-1">
                  Active Items
                </div>
                <div className="text-2xl font-bold text-emerald-700">
                  {stats.activeItems}
                </div>
              </div>

              {/* Inactive Items */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="text-sm text-gray-500 mb-1">Inactive Items</div>
                <div className="text-2xl font-bold text-gray-600">
                  {stats.inactiveItems}
                </div>
              </div>
            </div>
          </div>

          {/* Verification Status Card */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 mb-4">
            <h4 className="text-md font-semibold text-gray-800 mb-4">
              Verification Status
            </h4>
            <div className="flex flex-col gap-3">
              {/* Verified */}
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <div className="flex-1 text-gray-700">Verified</div>
                <div className="font-semibold text-emerald-600">
                  {stats.verifiedCount}
                </div>
              </div>

              {/* Missing */}
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="flex-1 text-gray-700">Missing</div>
                <div className="font-semibold text-red-600">
                  {stats.missingCount}
                </div>
              </div>

              {/* Not Verified */}
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <div className="flex-1 text-gray-700">Not Verified</div>
                <div className="font-semibold text-gray-600">
                  {stats.notVerifiedCount}
                </div>
              </div>
            </div>
          </div>

          {/* Top Locations Card */}
          {stats.topLocations.length > 0 && (
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 mb-4">
              <h4 className="text-md font-semibold text-gray-800 mb-4">
                Top Locations
              </h4>
              <div className="space-y-3">
                {stats.topLocations.map((location, index) => (
                  <div
                    key={location.location}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-800 font-medium">
                        {location.location}
                      </div>
                      <div className="text-xs text-gray-500">
                        {location.count} items • {location.weight.toFixed(1)}g
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top People Card */}
          {stats.topPeople.length > 0 && (
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-4">
                Top People (Bought For)
              </h4>
              <div className="space-y-3">
                {stats.topPeople.map((person, index) => (
                  <div key={person.person} className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-800 font-medium">
                        {person.person}
                      </div>
                      <div className="text-xs text-gray-500">
                        {person.count} items • {person.weight.toFixed(1)}g
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {stats.totalItems === 0 && !error && (
            <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No Data Available
              </h3>
              <p className="text-gray-600 mb-4">
                Add some jewellery items to see statistics
              </p>
              <button
                onClick={() => navigate("/jewellery/add")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Jewellery Item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JewelleryStats;
