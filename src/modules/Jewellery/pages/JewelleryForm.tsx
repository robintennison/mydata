import React, { useState } from "react";
import {
  Jewellery,
  VerificationStatus,
  VerificationStatusType,
} from "../models/types";

interface JewelleryFormProps {
  initialData?: Partial<Jewellery>;
  onSubmit: (data: Partial<Jewellery>) => void;
  isEditing?: boolean;
}

const JewelleryForm: React.FC<JewelleryFormProps> = ({
  initialData,
  onSubmit,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<Partial<Jewellery>>({
    code: "",
    description: "",
    weight: 0,
    location: "",
    boughtFor: "",
    purchaseDate: Date.now(),
    imageUrl: "",
    active: true,
    verificationStatus: VerificationStatus.NOT_VERIFIED, // Use the VALUE
    verificationNotes: "",
    lastVerified: 0,
    ...initialData,
  });

  // Derive status options from VerificationStatus object VALUES
  const statusOptions = Object.values(VerificationStatus).map((value) => ({
    value,
    label: value,
  }));

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (name === "weight") {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else if (name === "verificationStatus") {
      // Validate that the value is a valid VerificationStatus VALUE
      const validValues = Object.values(VerificationStatus);
      if (validValues.includes(value as VerificationStatusType)) {
        setFormData({ ...formData, [name]: value as VerificationStatusType });

        // If status changes to Verified/Missing, update lastVerified timestamp
        if (
          value === VerificationStatus.VERIFIED ||
          value === VerificationStatus.MISSING
        ) {
          setFormData((prev) => ({
            ...prev,
            [name]: value as VerificationStatusType,
            lastVerified: Date.now(),
          }));
        }
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure lastVerified is set for verified/missing items
    const finalData = { ...formData };
    if (
      finalData.verificationStatus === VerificationStatus.VERIFIED ||
      finalData.verificationStatus === VerificationStatus.MISSING
    ) {
      finalData.lastVerified = finalData.lastVerified || Date.now();
    }

    onSubmit(finalData);
  };

  // Update verification status with notes
  const updateVerification = (
    status: VerificationStatusType,
    notes?: string,
  ) => {
    setFormData({
      ...formData,
      verificationStatus: status,
      verificationNotes: notes || "",
      lastVerified: status === VerificationStatus.NOT_VERIFIED ? 0 : Date.now(),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic Information */}
      <div>
        <label>Code *</label>
        <input
          type="text"
          name="code"
          value={formData.code || ""}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Weight (grams) *</label>
        <input
          type="number"
          name="weight"
          step="0.01"
          value={formData.weight || ""}
          onChange={handleChange}
          required
        />
      </div>

      {/* Verification Status Section */}
      <div>
        <label>Verification Status</label>
        <select
          name="verificationStatus"
          value={formData.verificationStatus || VerificationStatus.NOT_VERIFIED}
          onChange={handleChange}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {formData.verificationStatus !== VerificationStatus.NOT_VERIFIED && (
        <div>
          <label>Verification Notes</label>
          <textarea
            name="verificationNotes"
            value={formData.verificationNotes || ""}
            onChange={handleChange}
            placeholder="Add notes about verification..."
          />
        </div>
      )}

      {/* Quick verification buttons */}
      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
        <button
          type="button"
          onClick={() =>
            updateVerification(
              VerificationStatus.VERIFIED,
              formData.verificationNotes,
            )
          }
          style={{
            backgroundColor:
              formData.verificationStatus === VerificationStatus.VERIFIED
                ? "#10b981"
                : "#e5e7eb",
            color:
              formData.verificationStatus === VerificationStatus.VERIFIED
                ? "white"
                : "#374151",
          }}
        >
          Mark as Verified
        </button>

        <button
          type="button"
          onClick={() =>
            updateVerification(VerificationStatus.MISSING, "Marked as missing")
          }
          style={{
            backgroundColor:
              formData.verificationStatus === VerificationStatus.MISSING
                ? "#ef4444"
                : "#e5e7eb",
            color:
              formData.verificationStatus === VerificationStatus.MISSING
                ? "white"
                : "#374151",
          }}
        >
          Mark as Missing
        </button>

        <button
          type="button"
          onClick={() =>
            updateVerification(VerificationStatus.NOT_VERIFIED, "")
          }
          style={{
            backgroundColor:
              formData.verificationStatus === VerificationStatus.NOT_VERIFIED
                ? "#6b7280"
                : "#e5e7eb",
            color:
              formData.verificationStatus === VerificationStatus.NOT_VERIFIED
                ? "white"
                : "#374151",
          }}
        >
          Reset to Not Verified
        </button>
      </div>

      <button type="submit">
        {isEditing ? "Update Jewellery" : "Add Jewellery"}
      </button>
    </form>
  );
};

export default JewelleryForm;
