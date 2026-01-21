import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jewelleryStyles } from "../styles/jewelleryStyles";
import { Jewellery } from "../models/types";

const JewelleryDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Jewellery | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch jewellery item details from Firebase
    setTimeout(() => {
      const mockItem: Jewellery = {
        id,
        code: "G001",
        description: "Gold Chain",
        weight: 25.5,
        location: "Locker",
        boughtFor: "Robin",
        purchaseDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
        imageUrl: "",
        active: true,
        lastVerified: Date.now(),
        verificationStatus: "Verified",
        verificationNotes: "Verified on 15th Dec",
      };
      setItem(mockItem);
      setLoading(false);
    }, 500);
  }, [id]);

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={jewelleryStyles.container}>
        <div style={jewelleryStyles.loading}>
          <div style={jewelleryStyles.spinner}></div>
          <p>Loading jewellery details...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={jewelleryStyles.container}>
        <div style={jewelleryStyles.emptyState}>
          <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🔍</div>
          <div>Jewellery item not found</div>
          <button
            onClick={() => navigate("/jewellery/list")}
            style={{
              marginTop: "15px",
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              border: "none",
              borderRadius: "8px",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Back to List
          </button>
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
        <div style={jewelleryStyles.navTitle}>Jewellery Details</div>
        <button
          onClick={() => navigate(`/jewellery/edit/${id}`)}
          style={{
            ...jewelleryStyles.navButton,
            fontSize: "0.9rem",
            padding: "6px 10px",
          }}
          title="Edit"
        >
          Edit
        </button>
      </div>

      {/* Content */}
      <div style={jewelleryStyles.formContainer}>
        {/* Image Preview */}
        {item.imageUrl && (
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <img
              src={item.imageUrl}
              alt={item.description}
              style={{
                maxWidth: "100%",
                maxHeight: "300px",
                borderRadius: "8px",
              }}
            />
          </div>
        )}

        {/* Details Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "15px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              Code
            </div>
            <div style={{ fontWeight: "600", fontSize: "16px" }}>
              {item.code}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              Weight
            </div>
            <div
              style={{ fontWeight: "600", fontSize: "16px", color: "#4285f4" }}
            >
              {item.weight}g
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              Location
            </div>
            <div style={{ fontWeight: "500", fontSize: "14px" }}>
              {item.location}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              Bought For
            </div>
            <div style={{ fontWeight: "500", fontSize: "14px" }}>
              {item.boughtFor}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              Purchase Date
            </div>
            <div style={{ fontWeight: "500", fontSize: "14px" }}>
              {formatDate(item.purchaseDate)}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              Status
            </div>
            <div>
              <span
                style={jewelleryStyles.statusBadge(item.verificationStatus)}
              >
                {item.verificationStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginTop: "20px" }}>
          <div
            style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}
          >
            Description
          </div>
          <div style={{ fontSize: "14px", lineHeight: "1.5" }}>
            {item.description}
          </div>
        </div>

        {/* Verification Details */}
        {item.verificationNotes && (
          <div style={{ marginTop: "20px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              Verification Notes
            </div>
            <div style={{ fontSize: "14px", lineHeight: "1.5" }}>
              {item.verificationNotes}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                marginTop: "4px",
              }}
            >
              Last verified: {formatDate(item.lastVerified)}
            </div>
          </div>
        )}

        {/* Active Status */}
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            backgroundColor: item.active ? "#f0fdf4" : "#f3f4f6",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: item.active ? "#10b981" : "#6b7280",
              borderRadius: "50%",
            }}
          ></div>
          <div style={{ fontSize: "14px", fontWeight: "500" }}>
            {item.active ? "Active Item" : "Inactive Item"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JewelleryDetail;
