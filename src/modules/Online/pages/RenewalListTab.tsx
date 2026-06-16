import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnlineItem } from "../types/online.types";
import { useSettings } from "../../../contexts/SettingsContext";
import { formatDateDisplay } from "../../../utils/formatters";
import { useOnlineDataContext } from "../../../contexts/OnlineDataContext";

// Helper function for conditional classes
const cls = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const RenewalListTab: React.FC = () => {
  const navigate = useNavigate();
  const { items: allOnlineItems, loading } = useOnlineDataContext();
  const [items, setItems] = useState<OnlineItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { settings } = useSettings();

  useEffect(() => {
    const itemsWithEndDates = allOnlineItems
      .filter((item) => item.endDate != null)
      .sort((a, b) => {
        if (a.endDate && b.endDate) {
          return a.endDate - b.endDate;
        }
        return 0;
      });

    setItems(itemsWithEndDates);
  }, [allOnlineItems]);

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

  // Clear search term
  const clearSearch = () => {
    setSearchTerm("");
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.detail &&
        item.detail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category &&
        item.category.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleRowClick = (itemId: string) => {
    if (settings?.showDelete) {
      navigate(`/online/items/edit/${itemId}`);
    } else {
      navigate(`/online/items/view/${itemId}`);
    }
  };

  const handleEditClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    navigate(`/online/items/edit/${itemId}`);
  };

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
          {searchTerm ? (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-5 text-center h-full">
            <div className="text-4xl mb-4 opacity-50">🔄</div>
            <div className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm
                ? "No matching renewals found"
                : "No items with end dates yet"}
            </div>
            <div className="text-sm text-gray-400">
              {!searchTerm && "Add end dates to online items to see them here"}
            </div>
          </div>
        ) : (
          <div className="p-2">
            {/* Results Info */}
            <div className="flex justify-between items-center mb-2 px-1 py-1">
              <span className="text-xs text-gray-600">
                {filteredItems.length} renewal
                {filteredItems.length !== 1 ? "s" : ""}
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
              {filteredItems.map((item) => {
                const statusInfo = item.endDate
                  ? getStatusInfo(item.endDate)
                  : {
                      classes: "bg-gray-100 text-gray-600",
                      text: "No date",
                      icon: "⚪",
                    };

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => handleRowClick(item.id)}
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleRowClick(item.id);
                      }
                    }}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        {/* Left: Name and Category */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {item.name}
                            </span>
                            {item.category && (
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                                {item.category}
                              </span>
                            )}
                          </div>
                          {item.detail && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">
                              {item.detail}
                            </div>
                          )}
                        </div>

                        {/* Middle: End Date */}
                        <div className="flex items-center gap-1 min-w-[100px] justify-end">
                          <span className="text-xs text-gray-500">
                            {item.endDate
                              ? formatDateDisplay(item.endDate, "en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "No end date"}
                          </span>
                        </div>

                        {/* Right: Status and Actions */}
                        <div className="flex items-center gap-2 ml-2">
                          {/* Status Indicator */}
                          {item.endDate && (
                            <div
                              className={cls(
                                "text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1",
                                statusInfo.classes,
                              )}
                            >
                              <span>{statusInfo.icon}</span>
                              <span>{statusInfo.text}</span>
                            </div>
                          )}

                          {/* Action Buttons - Only show edit if showDelete is true */}
                          {settings?.showDelete && (
                            <div className="flex gap-1">
                              <button
                                className="px-2 py-1.5 bg-green-500 text-white border-none rounded cursor-pointer text-xs font-medium hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                                onClick={(e) => handleEditClick(e, item.id)}
                                title="Edit"
                              >
                                ✏️
                              </button>
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