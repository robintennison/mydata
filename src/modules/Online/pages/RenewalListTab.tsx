import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { Renewal } from "../types/online.types";
import { useSettings } from "../../../contexts/SettingsContext"; // Import SettingsContext

// Helper function for conditional classes
const cls = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const RenewalListTab: React.FC = () => {
  const navigate = useNavigate();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { settings } = useSettings(); // Get settings from context

  useEffect(() => {
    fetchRenewals();
  }, []);

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const renewalsRef = collection(db, "renewals");
      const snapshot = await getDocs(renewalsRef);

      const renewalsList: Renewal[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();

        const convertToTimestamp = (field: any): number => {
          if (!field) return Date.now();
          if (field && typeof field === "object" && "toDate" in field) {
            return field.toDate().getTime();
          }
          if (typeof field === "number") return field;
          if (typeof field === "string") {
            const parsed = Date.parse(field);
            return isNaN(parsed) ? Date.now() : parsed;
          }
          return Date.now();
        };

        renewalsList.push({
          id: doc.id,
          name: data.name || "",
          startDate: convertToTimestamp(data.startDate),
          endDate: convertToTimestamp(data.endDate),
          comments: data.comments || "",
          createdAt: convertToTimestamp(data.createdAt),
          updatedAt: convertToTimestamp(data.updatedAt),
        });
      });

      renewalsList.sort((a, b) => a.endDate - b.endDate);
      setRenewals(renewalsList);
    } catch (error) {
      console.error("Error fetching renewals:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "-";
    }
  };

  const getDaysUntilExpiry = (endDate: number) => {
    const now = Date.now();
    return Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  };

  const getStatusInfo = (endDate: number) => {
    const daysUntilExpiry = getDaysUntilExpiry(endDate);
    const now = Date.now();

    if (endDate < now) {
      return {
        classes: "bg-red-100 text-red-700",
        text: "Expired",
        icon: "🔴",
      };
    } else if (daysUntilExpiry <= 7) {
      return {
        classes: "bg-yellow-100 text-yellow-800",
        text: `${daysUntilExpiry}d`,
        icon: "🟡",
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        classes: "bg-blue-100 text-blue-700",
        text: `${daysUntilExpiry}d`,
        icon: "🔵",
      };
    } else {
      return {
        classes: "bg-green-100 text-green-700",
        text: "",
        icon: "",
      };
    }
  };

  const filteredRenewals = renewals.filter(
    (renewal) =>
      renewal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (renewal.comments &&
        renewal.comments.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-15 px-5 flex-1">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading renewals...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-2 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Search renewals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2.5 pl-3 pr-10 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {filteredRenewals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-5 text-center h-full">
            <div className="text-4xl mb-4 opacity-50">🔄</div>
            <div className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm ? "No matching renewals found" : "No renewals yet"}
            </div>
            <div className="text-sm text-gray-400">
              {!searchTerm && "Add your first renewal"}
            </div>
            {!searchTerm && (
              <button
                onClick={() => navigate("/online/renewals/add")}
                className="mt-4 px-4 py-2 bg-blue-500 text-white border-none rounded cursor-pointer text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Renewal
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {/* Results Info */}
            <div className="flex justify-between items-center mb-2 px-1 py-1">
              <span className="text-xs text-gray-600">
                {filteredRenewals.length} renewal
                {filteredRenewals.length !== 1 ? "s" : ""}
              </span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-xs text-blue-500 cursor-pointer px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Clear search
                </button>
              )}
            </div>

            {/* Renewals List - Single Row Layout */}
            <div className="space-y-1.5 pb-4">
              {filteredRenewals.map((renewal) => {
                const statusInfo = getStatusInfo(renewal.endDate);

                return (
                  <div
                    key={renewal.id}
                    className="bg-white rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() =>
                      navigate(`/online/renewals/edit/${renewal.id}`)
                    }
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        navigate(`/online/renewals/edit/${renewal.id}`);
                      }
                    }}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        {/* Left: Name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {renewal.name}
                            </span>
                          </div>
                        </div>

                        {/* Middle: End Date */}
                        <div className="flex items-center gap-1 min-w-[100px] justify-end">
                          <span className="text-xs text-gray-500">
                            {formatDate(renewal.endDate)}
                          </span>
                        </div>

                        {/* Right: Status and Actions */}
                        <div className="flex items-center gap-2 ml-2">
                          {/* Status Indicator */}
                          <div
                            className={cls(
                              "text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1",
                              statusInfo.classes,
                            )}
                          >
                            <span>{statusInfo.icon}</span>
                            <span>{statusInfo.text}</span>
                          </div>

                          {/* Action Buttons - Only show edit if showDelete is true */}
                          {settings?.showDelete && (
                            <div className="flex gap-1">
                              <button
                                className="px-2 py-1.5 bg-green-500 text-white border-none rounded cursor-pointer text-xs font-medium hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/online/renewals/edit/${renewal.id}`,
                                  );
                                }}
                                title="Edit"
                              >
                                ✏️
                              </button>
                              {/* Removed delete button as per requirement */}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RenewalListTab;
