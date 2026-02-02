import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Category } from "../types/online.types";

const CategoryListTab: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      try {
        const db = getFirestore();
        await deleteDoc(doc(db, "online_categories", id));
        setCategories(categories.filter((cat) => cat.id !== id));
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("Failed to delete category");
      }
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
    <div className="min-h-full">
      <div className="p-2 bg-white border-b border-gray-200 shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2.5 pl-3 pr-10 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-5 text-center flex-1">
            <div className="text-4xl mb-4 opacity-50">📁</div>
            <div className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm
                ? "No matching categories found"
                : "No categories yet"}
            </div>
            <div className="text-sm text-gray-400">
              {!searchTerm && "Add your first category"}
            </div>
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
                  className="text-xs text-blue-500 cursor-pointer px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>

            <div className="space-y-2">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-sm"
                  onClick={() =>
                    navigate(`/online/categories/edit/${category.id}`)
                  }
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

                    <div className="ml-2 flex gap-1">
                      <button
                        className="px-2.5 py-1.5 bg-green-500 text-white border-none rounded cursor-pointer text-xs font-medium hover:bg-green-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/online/categories/edit/${category.id}`);
                        }}
                        title="Edit"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="px-2.5 py-1.5 bg-red-500 text-white border-none rounded cursor-pointer text-xs font-medium hover:bg-red-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(category.id, category.name);
                        }}
                        title="Delete"
                      >
                        🗑️
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

export default CategoryListTab;
