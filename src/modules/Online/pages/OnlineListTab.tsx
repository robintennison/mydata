import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnlineItem, FILE_TYPES } from "../types/online.types";
import { useSettings } from "../../../contexts/SettingsContext";
import { formatDateDisplay } from "../../../utils/formatters";
import { useOnlineDataContext } from "../../../contexts/OnlineDataContext";

const OnlineListTab: React.FC = () => {
  const navigate = useNavigate();
  const { items, loading } = useOnlineDataContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const { settings } = useSettings();
  const showDelete = settings?.showDelete || false;

  useEffect(() => {
    const uniqueCategories = Array.from(
      new Set(items.map((item) => item.category).filter(Boolean)),
    ).sort();
    setCategories(["All", ...uniqueCategories]);
  }, [items]);

  // Check if item has renewal dates and get status
  const getItemStatus = (
    item: OnlineItem,
  ): { text: string; className: string } => {
    // If there's no end date, it's not a renewable item
    if (!item.endDate) {
      return { text: "No renewal", className: "bg-gray-100 text-gray-600" };
    }

    // If there's an end date but no start date, treat as a date-only item
    if (item.endDate && !item.startDate) {
      const now = Date.now();
      if (now <= item.endDate) {
        return {
          text: "● Active until",
          className: "bg-green-100 text-green-700",
        };
      } else {
        return { text: "○ Expired", className: "bg-red-100 text-red-700" };
      }
    }

    // Full renewal with both dates
    if (item.startDate && item.endDate) {
      const now = Date.now();
      if (now >= item.startDate && now <= item.endDate) {
        return { text: "● Active", className: "bg-green-100 text-green-700" };
      } else if (now < item.startDate) {
        return { text: "○ Upcoming", className: "bg-blue-100 text-blue-700" };
      } else {
        return { text: "○ Expired", className: "bg-red-100 text-red-700" };
      }
    }

    return { text: "No renewal", className: "bg-gray-100 text-gray-600" };
  };

  // Get file icon based on type
  const getFileIcon = (type: string): string => {
    switch (type) {
      case FILE_TYPES.IMAGE:
        return "🖼️";
      case FILE_TYPES.PDF:
        return "📄";
      default:
        return "📁";
    }
  };

  // Check if item has any files
  const hasFiles = (item: OnlineItem): boolean => {
    return !!(item.file1 || item.file2);
  };

  // Get file info display
  const getFileDisplay = (item: OnlineItem): string => {
    const files = [];
    if (item.file1 && item.file1Type !== FILE_TYPES.NONE) {
      files.push(`${getFileIcon(item.file1Type)} File 1`);
    }
    if (item.file2 && item.file2Type !== FILE_TYPES.NONE) {
      files.push(`${getFileIcon(item.file2Type)} File 2`);
    }
    return files.join(" • ");
  };

  // Clear search term
  const clearSearch = () => {
    setSearchTerm("");
  };

  // Filter items
  const getFilteredItems = () => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  };

  const filteredItems = getFilteredItems();

  const handleRowClick = (itemId: string) => {
    if (showDelete) {
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
        <p className="text-gray-600">Loading items...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search and Filter Row */}
      <div className="p-2 bg-white border-b border-gray-200 flex gap-2 items-center shrink-0 flex-wrap">
        <div className="flex-[2] min-w-0 relative">
          <input
            type="text"
            placeholder="Search items..."
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
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2.5 pl-3 pr-8 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs pointer-events-none">
            ▼
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-5 text-center h-full">
            <div className="text-4xl mb-4 opacity-50">📋</div>
            <div className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm || selectedCategory !== "All"
                ? "No matching items found"
                : "No items yet"}
            </div>
            <div className="text-sm text-gray-400">
              {!searchTerm &&
                selectedCategory === "All" &&
                "Add your first item using the ＋ button"}
            </div>
            {!searchTerm && selectedCategory === "All" && (
              <button
                onClick={() => navigate("/online/items/add")}
                className="mt-4 px-4 py-2 bg-blue-500 text-white border-none rounded cursor-pointer text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Item
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            <div className="flex justify-between items-center mb-2 px-1 py-1">
              <span className="text-xs text-gray-600">
                {filteredItems.length} item
                {filteredItems.length !== 1 ? "s" : ""}
                {selectedCategory !== "All" && ` in ${selectedCategory}`}
              </span>
              {(searchTerm || selectedCategory !== "All") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All");
                  }}
                  className="text-xs text-blue-500 cursor-pointer px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="space-y-2 pb-4">
              {filteredItems.map((item) => {
                const status = getItemStatus(item);
                const hasRenewal = item.startDate && item.endDate;
                const hasOnlyEndDate = !item.startDate && item.endDate;
                const hasAttachments = hasFiles(item);
                const fileDisplay = getFileDisplay(item);

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-lg border cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      hasRenewal
                        ? "border-l-4 border-l-green-500"
                        : hasOnlyEndDate
                          ? "border-l-4 border-l-orange-500"
                          : "border-gray-200"
                    }`}
                    onClick={() => handleRowClick(item.id)}
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleRowClick(item.id);
                      }
                    }}
                  >
                    <div className="p-3">
                      <div className="flex items-start min-h-12">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {item.name}
                            </span>
                            {item.category && (
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                                {item.category}
                              </span>
                            )}
                            {/* Status indicator */}
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${status.className}`}
                            >
                              {status.text}
                            </span>
                          </div>

                          {item.detail && (
                            <div className="text-xs text-gray-600 truncate leading-relaxed mb-1">
                              {item.detail}
                            </div>
                          )}

                          {/* File attachment indicator */}
                          {hasAttachments && (
                            <div className="text-xs text-purple-600 flex items-center gap-1 mb-1">
                              <span>📎</span>
                              <span className="truncate">{fileDisplay}</span>
                            </div>
                          )}

                          {/* Date display - always show if end date exists */}
                          {item.endDate && (
                            <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                              <span className="flex items-center gap-1">
                                <span className="text-gray-400">📅</span>
                                {item.startDate ? (
                                  <>
                                    {formatDateDisplay(item.startDate)} -{" "}
                                    {formatDateDisplay(item.endDate)}
                                  </>
                                ) : (
                                  <>Ends: {formatDateDisplay(item.endDate)}</>
                                )}
                              </span>
                            </div>
                          )}

                          {/* Show "No dates" message only if no dates at all */}
                          {!item.endDate && !item.startDate && (
                            <div className="text-xs text-gray-400 italic">
                              No dates set
                            </div>
                          )}
                        </div>

                        {/* Edit button only - conditionally shown based on settings */}
                        {showDelete && (
                          <div className="ml-2 flex-shrink-0">
                            <button
                              className="px-3 py-1.5 bg-green-500 text-white border-none rounded cursor-pointer text-xs font-medium hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
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
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineListTab;