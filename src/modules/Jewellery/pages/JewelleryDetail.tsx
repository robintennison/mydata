import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Jewellery, VerificationStatus } from "../models/types";
import { jewelleryStyles } from "../styles/jewelleryStyles";

const JewelleryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Jewellery | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJewellery = async () => {
      if (!id) {
        console.error("No ID provided");
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore();
        const docRef = doc(db, "jewellery", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Create a proper Jewellery object with the id
          const jewellery: Jewellery = {
            id: docSnap.id, // Use docSnap.id which is guaranteed to be a string
            code: data.code || "",
            description: data.description || "",
            weight: data.weight || 0,
            location: data.location || "",
            boughtFor: data.boughtFor || "",
            purchaseDate: data.purchaseDate || 0,
            imageUrl: data.imageUrl || "",
            active: data.active !== false,
            billId: data.billId,
            lastVerified: data.lastVerified || 0,
            verificationStatus:
              data.verificationStatus || VerificationStatus.NOT_VERIFIED,
            verificationNotes: data.verificationNotes || "",
          };
          setItem(jewellery);
        } else {
          console.log("No such document!");
          setItem(null);
        }
      } catch (error) {
        console.error("Error fetching jewellery:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJewellery();
  }, [id]);

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
        <div style={jewelleryStyles.topNav}>
          <button
            onClick={() => navigate("/jewellery/list")}
            style={jewelleryStyles.navButton}
            title="Back to Jewellery"
          >
            ←
          </button>
          <div style={jewelleryStyles.navTitle}>Jewellery Not Found</div>
          <div style={{ width: "40px" }}></div>
        </div>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>The requested jewellery item was not found.</p>
          <button
            onClick={() => navigate("/jewellery/list")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Back to Jewellery List
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
          title="Back to Jewellery"
        >
          ←
        </button>
        <div style={jewelleryStyles.navTitle}>Jewellery Details</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate(`/jewellery/edit/${item.id}`)}
            style={{
              ...jewelleryStyles.navButton,
              padding: "6px 12px",
              fontSize: "14px",
            }}
            title="Edit"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "15px" }}>
        <div style={jewelleryStyles.statsCard}>
          <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>{item.code}</h3>

          {item.imageUrl && (
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <img
                src={item.imageUrl}
                alt={item.code}
                style={{
                  maxWidth: "100%",
                  maxHeight: "300px",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div>
              <strong>Code:</strong> {item.code}
            </div>
            <div>
              <strong>Description:</strong> {item.description}
            </div>
            <div>
              <strong>Weight:</strong> {item.weight}g
            </div>
            <div>
              <strong>Location:</strong> {item.location}
            </div>
            <div>
              <strong>Bought For:</strong> {item.boughtFor}
            </div>
            <div>
              <strong>Purchase Date:</strong>{" "}
              {item.purchaseDate
                ? new Date(item.purchaseDate).toLocaleDateString()
                : "Not specified"}
            </div>
            <div>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  backgroundColor:
                    item.verificationStatus === VerificationStatus.VERIFIED
                      ? "#10b981"
                      : item.verificationStatus === VerificationStatus.MISSING
                        ? "#ef4444"
                        : "#6b7280",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              >
                {item.verificationStatus}
              </span>
            </div>
            {item.verificationNotes && (
              <div>
                <strong>Verification Notes:</strong> {item.verificationNotes}
              </div>
            )}
            {item.lastVerified > 0 && (
              <div>
                <strong>Last Verified:</strong>{" "}
                {new Date(item.lastVerified).toLocaleDateString()}
              </div>
            )}
            <div>
              <strong>Active:</strong> {item.active ? "Yes" : "No"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JewelleryDetail;
