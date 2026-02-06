import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { Category } from "../types/online.types";
import { useSettings } from "../../../contexts/SettingsContext"; // Import SettingsContext

const CategoryListTab: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { settings } = useSettings(); // Get settings from context

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const categoriesRef = collection(db, "online_categories");
      const snapshot = await getDocs(categoriesRef);

      const categoriesList: Category[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        categoriesList.push({
          id: doc.id,
          name: data.name || "",
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });

      categoriesList.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(categoriesList);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-15 px-5 flex-1">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading categories...</p>
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
            placeholder="Search categories..."
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
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-5 text-center h-full">
            <div className="text-4xl mb-4 opacity-50">📁</div>
            <div className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm
                ? "No matching categories found"
                : "No categories yet"}
            </div>
            <div className="text-sm text-gray-400">
              {!searchTerm && "Add your first category"}
            </div>
            {!searchTerm && (
              <button
                onClick={() => navigate("/online/categories/add")}
                className="mt-4 px-4 py-2 bg-blue-500 text-white border-none rounded cursor-pointer text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Category
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {/* Results Info */}
            <div className="flex justify-between items-center mb-2 px-1 py-1">
              <span className="text-xs text-gray-600">
                {filteredCategories.length} categor
                {filteredCategories.length !== 1 ? "ies" : "y"}
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

            {/* Category List */}
            <div className="space-y-2 pb-4">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() =>
                    navigate(`/online/categories/edit/${category.id}`)
                  }
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigate(`/online/categories/edit/${category.id}`);
                    }
                  }}
                >
                  <div className="p-3 flex items-center min-h-12">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-lg font-semibold text-blue-700">
                        {category.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {category.name}
                      </div>
                    </div>

                    {/* Only show edit button if showDelete is true in settings */}
                    {settings?.showDelete && (
                      <div className="ml-2">
                        <button
                          className="px-2.5 py-1.5 bg-green-500 text-white border-none rounded cursor-pointer text-xs font-medium hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/online/categories/edit/${category.id}`);
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryListTab;
