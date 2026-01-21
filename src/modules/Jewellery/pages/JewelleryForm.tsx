import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jewelleryStyles } from "../styles/jewelleryStyles";
import { Jewellery, VerificationStatus } from "../models/types";
import { useJewellerySettings } from "../hooks/useSettingsData";

const JewelleryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const { locations, boughtForOptions } = useJewellerySettings();
  const [loading, setLoading] = useState(false);
  //const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<Jewellery>({
    code: "",
    description: "",
    weight: 0,
    location: locations[0] || "", // Use first location from settings
    boughtFor: boughtForOptions[0] || "", // Use first boughtFor from settings
    purchaseDate: Date.now(),
    imageUrl: "",
    active: true,
    lastVerified: 0,
    verificationStatus: VerificationStatus.NOT_VERIFIED,
    verificationNotes: "",
  });

  useEffect(() => {
    if (isEditMode) {
      // TODO: Load jewellery data from Firebase
      setLoading(true);
      setTimeout(() => {
        const mockData: Jewellery = {
          id,
          code: "G001",
          description: "Gold Chain",
          weight: 25.5,
          location: "Locker", // This should come from saved data
          boughtFor: "Robin", // This should come from saved data
          purchaseDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
          imageUrl: "",
          active: true,
          lastVerified: Date.now(),
          verificationStatus: VerificationStatus.VERIFIED,
          verificationNotes: "Verified on 15th Dec",
        };
        setFormData(mockData);
        setLoading(false);
      }, 500);
    } else {
      // For new items, set default values from settings
      setFormData((prev) => ({
        ...prev,
        location: locations[0] || "",
        boughtFor: boughtForOptions[0] || "",
      }));
    }
  }, [id, isEditMode, locations, boughtForOptions]);

  // ... rest of the handleImageUpload function remains the same ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Upload image first if exists
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        // TODO: Call Firebase upload function
        // imageUrl = await uploadImage(imageFile);
      }

      const jewelleryData = {
        ...formData,
        imageUrl,
        purchaseDate: new Date(formData.purchaseDate).getTime(),
      };

      // TODO: Save to Firebase
      console.log("Saving jewellery:", jewelleryData);

      // Show success message and navigate back
      setTimeout(() => {
        setLoading(false);
        navigate("/jewellery/list");
      }, 1000);
    } catch (error) {
      console.error("Error saving jewellery:", error);
      setLoading(false);
      alert("Error saving jewellery. Please try again.");
    }
  };

  if (loading && isEditMode) {
    return (
      <div style={jewelleryStyles.container}>
        <div style={jewelleryStyles.loading}>
          <div style={jewelleryStyles.spinner}></div>
          <p>Loading jewellery data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={jewelleryStyles.container}>
      {/* Top Navigation */}
      <div style={jewelleryStyles.topNav}>
        <button
          onClick={() => navigate("/jewellery/list")}
          style={jewelleryStyles.navButton}
          title="Back to List"
        >
          ←
        </button>
        <div style={jewelleryStyles.navTitle}>
          {isEditMode ? "Edit Jewellery" : "Add Jewellery"}
        </div>
        <div style={{ width: "40px" }}></div>
      </div>

      <form onSubmit={handleSubmit} style={jewelleryStyles.formContainer}>
        {/* Basic Information */}
        <div style={jewelleryStyles.formGroup}>
          <label style={jewelleryStyles.label}>Code *</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            style={jewelleryStyles.input}
            required
            placeholder="e.g., G001, S002"
          />
        </div>

        <div style={jewelleryStyles.formGroup}>
          <label style={jewelleryStyles.label}>Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            style={jewelleryStyles.textarea}
            required
            placeholder="Describe the jewellery item"
          />
        </div>

        <div style={jewelleryStyles.formGroup}>
          <label style={jewelleryStyles.label}>Weight (grams) *</label>
          <input
            type="number"
            step="0.1"
            value={formData.weight}
            onChange={(e) =>
              setFormData({
                ...formData,
                weight: parseFloat(e.target.value) || 0,
              })
            }
            style={jewelleryStyles.input}
            required
            min="0"
          />
        </div>

        {/* Location Dropdown from Settings */}
        <div style={jewelleryStyles.formGroup}>
          <label style={jewelleryStyles.label}>Location</label>
          <select
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            style={jewelleryStyles.select}
          >
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            Manage locations in{" "}
            <a
              href="/settings"
              onClick={(e) => {
                e.preventDefault();
                navigate("/settings", { state: { scrollTo: "locations" } });
              }}
              style={{ color: "#3b82f6", textDecoration: "underline" }}
            >
              Settings
            </a>
          </div>
        </div>

        {/* Bought For Dropdown from Settings */}
        <div style={jewelleryStyles.formGroup}>
          <label style={jewelleryStyles.label}>Bought For</label>
          <select
            value={formData.boughtFor}
            onChange={(e) =>
              setFormData({ ...formData, boughtFor: e.target.value })
            }
            style={jewelleryStyles.select}
          >
            {boughtForOptions.map((person) => (
              <option key={person} value={person}>
                {person}
              </option>
            ))}
          </select>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            Manage "Bought For" in{" "}
            <a
              href="/settings"
              onClick={(e) => {
                e.preventDefault();
                navigate("/settings", { state: { scrollTo: "boughtFor" } });
              }}
              style={{ color: "#3b82f6", textDecoration: "underline" }}
            >
              Settings
            </a>
          </div>
        </div>

        {/* ... rest of the form remains the same ... */}
      </form>
    </div>
  );
};

export default JewelleryForm;
