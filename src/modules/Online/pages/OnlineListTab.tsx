import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { OnlineItem } from "../types/online.types";

const OnlineListTab: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<OnlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [categories, setCategories] = useState<string[]>(["All"]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Extract unique categories from items
    const uniqueCategories = Array.from(
      new Set(items.map((item) => item.category).filter(Boolean)),
    ).sort();
    setCategories(["All", ...uniqueCategories]);
  }, [items]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const itemsRef = collection(db, "online");
      const itemsSnapshot = await getDocs(itemsRef);

      const itemsList: OnlineItem[] = [];
      itemsSnapshot.forEach((doc) => {
        const data = doc.data();
        itemsList.push({
          id: doc.id,
          name: data.name || "",
          detail: data.detail || "",
          category: data.category || "",
          image1: data.image1 || "",
          image2: data.image2 || "",
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });

      itemsList.sort((a, b) => a.name.localeCompare(b.name));
      setItems(itemsList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    // Filter by search term
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by category
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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
      <div className="p-2 bg-white border-b border-gray-200 flex gap-2 items-center shrink-0">
        {/* Search Input */}
        <div className="flex-[2] min-w-0 relative">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2.5 pl-3 pr-10 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </span>
        </div>

        {/* Category Filter Dropdown */}
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
            <div className="text-4xl mb-4 opacity-50">🛒</div>
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
            {/* Results Info */}
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

            {/* Items List */}
            <div className="space-y-2 pb-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => navigate(`/online/items/view/${item.id}`)}
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigate(`/online/items/view/${item.id}`);
                    }
                  }}
                >
                  <div className="p-3 flex items-center min-h-12">
                    {/* Image thumbnail if available */}
                    {(item.image1 || item.image2) && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden mr-3 flex-shrink-0 bg-gray-50 flex items-center justify-center">
                        <img
                          src={item.image1 || item.image2}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

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
                      </div>
                      {item.detail && (
                        <div className="text-xs text-gray-600 truncate leading-relaxed">
                          {item.detail}
                        </div>
                      )}
                    </div>

                    {/* Edit button only */}
                    <div className="ml-2">
                      <button
                        className="px-3 py-1.5 bg-green-500 text-white border-none rounded cursor-pointer text-xs font-medium hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/online/items/edit/${item.id}`);
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineListTab;
