import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  deleteDoc,
} from "firebase/firestore";
import { Renewal } from "../types/online.types";
import { useSettings } from "../../../contexts/SettingsContext";

const RenewalForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const { settings } = useSettings();
  const showDelete = settings?.showDelete || false;

  const getModeFromPath = (): "add" | "edit" | "view" => {
    const path = location.pathname;

    if (path.includes("/online/renewals/add")) return "add";
    if (path.includes("/online/renewals/edit/")) return "edit";
    if (path.includes("/online/renewals/view/")) return "view";

    return id ? "view" : "add";
  };

  const mode = getModeFromPath();
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";
  const isViewMode = mode === "view";

  // If showDelete is false and we're in edit mode, redirect to view mode
  useEffect(() => {
    if (isEditMode && !showDelete && id) {
      navigate(`/online/renewals/view/${id}`, { replace: true });
    }
  }, [isEditMode, showDelete, id, navigate]);

  const [formData, setFormData] = useState<Renewal>({
    id: "",
    name: "",
    startDate: Date.now(),
    endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    comments: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRenewal();
    } else {
      setFormData({
        id: "",
        name: "",
        startDate: Date.now(),
        endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        comments: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }, [id, location.pathname]);

  const fetchRenewal = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const db = getFirestore();
      const renewalRef = doc(db, "renewals", id);
      const renewalDoc = await getDoc(renewalRef);

      if (renewalDoc.exists()) {
        const data = renewalDoc.data();

        const getTimestamp = (field: any): number => {
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

        setFormData({
          id: renewalDoc.id,
          name: data.name || "",
          startDate: getTimestamp(data.startDate),
          endDate: getTimestamp(data.endDate),
          comments: data.comments || "",
          createdAt: getTimestamp(data.createdAt),
          updatedAt: getTimestamp(data.updatedAt),
        });
      } else {
        alert("Renewal not found");
        navigate("/online", { state: { activeTab: "renewals" } });
      }
    } catch (error) {
      console.error("Error fetching renewal:", error);
      alert("Failed to load renewal");
      navigate("/online", { state: { activeTab: "renewals" } });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Renewal name is required");
      return;
    }

    if (formData.endDate <= formData.startDate) {
      alert("End date must be after start date");
      return;
    }

    try {
      setSaving(true);
      const db = getFirestore();

      const renewalData = {
        name: formData.name.trim(),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        comments: formData.comments?.trim() || "",
        updatedAt: new Date(),
        ...(isAddMode ? { createdAt: new Date() } : {}),
      };

      if (isEditMode && id) {
        await setDoc(doc(db, "renewals", id), renewalData, { merge: true });
        alert("Renewal updated successfully!");
      } else if (isAddMode) {
        await addDoc(collection(db, "renewals"), renewalData);
        alert("Renewal added successfully!");
      }

      navigate("/online", { state: { activeTab: "renewals" } });
    } catch (error) {
      console.error("Error saving renewal:", error);
      alert("Failed to save renewal");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this renewal? This action cannot be undone.",
    );

    if (!confirmDelete) return;

    try {
      setSaving(true);
      const db = getFirestore();
      await deleteDoc(doc(db, "renewals", id));
      alert("Renewal deleted successfully!");
      navigate("/online", { state: { activeTab: "renewals" } });
    } catch (error) {
      console.error("Error deleting renewal:", error);
      alert("Failed to delete renewal");
      setSaving(false);
    }
  };

  const getPageTitle = () => {
    if (isAddMode) return "Add Renewal";
    if (isEditMode) return "Edit Renewal";
    if (isViewMode) return "View Renewal";
    return "Renewal Details";
  };

  const getPageSubtitle = () => {
    if (isAddMode) return "Create a new renewal";
    if (isEditMode) return "Update renewal details";
    if (isViewMode) return "View renewal details";
    return "";
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return "Unknown";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid date";
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } catch (error) {
      return "Error formatting date";
    }
  };

  const formatDateInput = (timestamp: number): string => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch (error) {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() =>
                navigate("/online", { state: { activeTab: "renewals" } })
              }
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Back"
            >
              ←
            </button>
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading renewal...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() =>
                navigate("/online", { state: { activeTab: "renewals" } })
              }
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Back"
            >
              ←
            </button>
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
              <p className="text-sm text-gray-500">{getPageSubtitle()}</p>
            </div>
          </div>

          {/* EDIT button in header - Only show in view mode AND when showDelete is true */}
          {isViewMode && showDelete && (
            <button
              onClick={() =>
                navigate(`/online/renewals/edit/${id}`, {
                  state: { returnTo: "/online", activeTab: "renewals" },
                })
              }
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Edit this renewal"
            >
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      {/* Form/View Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name {!isViewMode && "*"}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  !isViewMode &&
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isViewMode ? "bg-gray-50 cursor-default" : "bg-white"
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="Enter renewal name"
                required={!isViewMode}
                disabled={isViewMode || saving}
                readOnly={isViewMode}
                autoFocus={!isViewMode}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date {!isViewMode && "*"}
                </label>
                {isViewMode ? (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 min-h-[40px] flex items-center">
                    {formatDate(formData.startDate)}
                  </div>
                ) : (
                  <input
                    type="date"
                    value={formatDateInput(formData.startDate)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startDate: new Date(e.target.value).getTime(),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                    disabled={saving}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date {!isViewMode && "*"}
                </label>
                {isViewMode ? (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 min-h-[40px] flex items-center">
                    {formatDate(formData.endDate)}
                  </div>
                ) : (
                  <input
                    type="date"
                    value={formatDateInput(formData.endDate)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endDate: new Date(e.target.value).getTime(),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                    disabled={saving}
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments
              </label>
              {isViewMode ? (
                <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 whitespace-pre-wrap break-words overflow-auto min-h-[80px] leading-relaxed">
                  {formData.comments || "No comments provided"}
                </div>
              ) : (
                <textarea
                  value={formData.comments || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, comments: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y min-h-[80px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter any comments or notes"
                  rows={3}
                  disabled={saving}
                />
              )}
            </div>

            {/* Timestamps - Show in View mode */}
            {isViewMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Created
                  </label>
                  <div className="text-sm text-gray-900">
                    {formatDate(formData.createdAt)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Last Updated
                  </label>
                  <div className="text-sm text-gray-900">
                    {formatDate(formData.updatedAt)}
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions - Only show when NOT in view mode AND (is add mode OR showDelete is true for edit mode) */}
            {!isViewMode && (isAddMode || (isEditMode && showDelete)) && (
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/online", { state: { activeTab: "renewals" } })
                    }
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  {/* DELETE Button - Only show in edit mode and when showDelete is true */}
                  {isEditMode && showDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                      disabled={saving}
                    >
                      {saving ? "Deleting..." : "Delete"}
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : isAddMode
                        ? "Add Renewal"
                        : "Update Renewal"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RenewalForm;
