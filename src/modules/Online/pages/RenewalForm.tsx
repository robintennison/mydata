import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { Renewal } from "../types/online.types";

const RenewalForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;

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
    if (isEditing && id) {
      fetchRenewal();
    }
  }, [id, isEditing]);

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
        ...(isEditing ? {} : { createdAt: new Date() }),
      };

      if (isEditing && id) {
        await setDoc(doc(db, "renewals", id), renewalData, { merge: true });
        alert("Renewal updated successfully!");
      } else {
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
                {isEditing ? "Edit Renewal" : "Add Renewal"}
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
                {isEditing ? "Edit Renewal" : "Add Renewal"}
              </h1>
              <p className="text-sm text-gray-500">
                {isEditing ? "Update renewal details" : "Create a new renewal"}
              </p>
            </div>
          </div>
          <button
            type="submit"
            form="renewal-form"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Saving..." : isEditing ? "Update" : "Save"}
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">
          <form id="renewal-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter renewal name"
                required
                disabled={saving}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={
                    new Date(formData.startDate).toISOString().split("T")[0]
                  }
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={new Date(formData.endDate).toISOString().split("T")[0]}
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
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments
              </label>
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RenewalForm;
