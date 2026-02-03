import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
      <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-50 min-h-screen pb-20 px-2 box-border overflow-x-hidden">
      {/* Top Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 py-2 px-3 flex items-center justify-between">
        <button
          onClick={() => navigate("/jewellery")}
          className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded text-base"
          title="Back to Jewellery"
        >
          ←
        </button>
        <div className="font-semibold text-gray-800">Jewellery Statistics</div>
        <div className="w-10"></div>
      </div>

      {/* Stats Cards */}
      <div className="p-4">
        {/* Stats Card Container */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Overview Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Total Items */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Total Items</div>
              <div className="text-2xl font-bold text-gray-800">
                {stats.totalItems}
              </div>
            </div>

            {/* Total Weight */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Total Weight</div>
              <div className="text-2xl font-bold text-gray-800">
                {stats.totalWeight.toFixed(1)}g
              </div>
            </div>

            {/* Verified */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Verified</div>
              <div className="text-2xl font-bold text-emerald-600">
                {stats.verifiedCount}
              </div>
            </div>

            {/* Not Verified */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Not Verified</div>
              <div className="text-2xl font-bold text-gray-600">
                {stats.notVerifiedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status Chart */}
        <div className="bg-white rounded-lg p-5 mt-4 shadow-sm border border-gray-200">
          <h4 className="text-md font-semibold text-gray-800 mb-4">
            Verification Status
          </h4>
          <div className="flex flex-col gap-3">
            {/* Verified */}
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded"></div>
              <div className="flex-1 text-gray-700">Verified</div>
              <div className="font-semibold text-gray-800">
                {stats.verifiedCount}
              </div>
            </div>

            {/* Missing */}
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <div className="flex-1 text-gray-700">Missing</div>
              <div className="font-semibold text-gray-800">
                {stats.missingCount}
              </div>
            </div>

            {/* Not Verified */}
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <div className="flex-1 text-gray-700">Not Verified</div>
              <div className="font-semibold text-gray-800">
                {stats.notVerifiedCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-5"></div>
    </div>
  );
};

export default JewelleryStats;
