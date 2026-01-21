import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { Jewellery } from "../models/types";
import { jewelleryStyles } from "../styles/jewelleryStyles";
import JewelleryNavigation from "../components/JewelleryNavigation";

const JewelleryList: React.FC = () => {
  const navigate = useNavigate();
  const [jewelleryItems, setJewelleryItems] = useState<Jewellery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJewellery = async () => {
      try {
        console.log("Starting to fetch jewellery...");
        setError(null);

        const db = getFirestore();

        let q = query(collection(db, "jewellery"));

        if (!showInactive) {
          q = query(q, where("active", "==", true));
        }

        q = query(q, orderBy("code", "desc"));

        const snapshot = await getDocs(q);
        console.log(`Query returned ${snapshot.size} items`);

        const items: Jewellery[] = [];
        snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          const item: Jewellery = {
            id: doc.id,
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
            verificationStatus: data.verificationStatus || "Not Verified",
            verificationNotes: data.verificationNotes || "",
          };
          items.push(item);
        });

        console.log(`Parsed ${items.length} items`);
        setJewelleryItems(items);
      } catch (error: any) {
        console.error("Error fetching jewellery:", error);

        if (
          error.code === "failed-precondition" &&
          error.message.includes("index")
        ) {
          setError(`Index required. Please create a Firestore composite index for:
            Collection: jewellery
            Fields: active (ascending), code (descending)
            
            Or click the link in the browser console to create it automatically.`);
        } else {
          setError(`Failed to load: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJewellery();
  }, [showInactive]);

  const handleRefresh = () => {
    setLoading(true);
    setJewelleryItems([]);
    setError(null);

    setTimeout(() => {
      fetchJewellery();
    }, 100);
  };

  const fetchJewellery = async () => {
    try {
      const db = getFirestore();

      let q = query(collection(db, "jewellery"));

      if (!showInactive) {
        q = query(q, where("active", "==", true));
      }

      q = query(q, orderBy("code", "desc"));

      const snapshot = await getDocs(q);

      const items: Jewellery[] = [];
      snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        items.push({
          id: doc.id,
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
          verificationStatus: data.verificationStatus || "Not Verified",
          verificationNotes: data.verificationNotes || "",
        });
      });

      setJewelleryItems(items);
      setError(null);
    } catch (error: any) {
      console.error("Refresh error:", error);
      setError(`Refresh failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={jewelleryStyles.container}>
        <div style={jewelleryStyles.loading}>
          <div style={jewelleryStyles.spinner}></div>
          <p>Loading jewellery items...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={jewelleryStyles.container}>
      {/* Top Navigation */}
      <div style={jewelleryStyles.topNav}>
        <button
          onClick={() => navigate("/jewellery")}
          style={jewelleryStyles.navButton}
          title="Back to Jewellery"
        >
          ←
        </button>
        <div style={jewelleryStyles.navTitle}>Jewellery Items</div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={handleRefresh}
            style={{
              ...jewelleryStyles.navButton,
              padding: "6px",
              fontSize: "14px",
            }}
            title="Refresh"
          >
            🔄
          </button>
          <button
            onClick={() => navigate("/jewellery/add")}
            style={{
              ...jewelleryStyles.navButton,
              padding: "6px",
              fontSize: "14px",
            }}
            title="Add New"
          >
            ➕
          </button>
          <button
            onClick={() => navigate("/settings")}
            style={{
              ...jewelleryStyles.navButton,
              padding: "6px",
              fontSize: "14px",
            }}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* ALL CONTENT INSIDE SCROLLABLE WRAPPER */}
      <div style={jewelleryStyles.contentWrapper}>
        {/* Error Display */}
        {error && (
          <div
            style={{
              margin: "10px 0",
              padding: "10px",
              backgroundColor: "#fef3c7",
              border: "1px solid #f59e0b",
              borderRadius: "6px",
              color: "#92400e",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>⚠️</span>
              <strong>Index Required</strong>
            </div>
            <div style={{ margin: "6px 0" }}>
              Create Firestore index for: jewellery, active, code
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => {
                  setShowInactive(true);
                  setError("Showing all items without sorting.");
                }}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
              >
                Show All
              </button>
              <button
                onClick={handleRefresh}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Items Count - Compact */}
        {!error && jewelleryItems.length > 0 && (
          <div
            style={{
              fontSize: "11px",
              color: "#6b7280",
              padding: "6px 12px 2px",
              textAlign: "right",
            }}
          >
            {jewelleryItems.length} items
          </div>
        )}

        {/* Items List - Compact 2-Line Design */}
        <div style={{ padding: "0 0 5px 0" }}>
          {jewelleryItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#9ca3af",
                fontSize: "13px",
                margin: "10px",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>📦</div>
              <p>No jewellery items found.</p>
              <button
                onClick={() => navigate("/jewellery/add")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  marginTop: "8px",
                }}
              >
                Add First Item
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {jewelleryItems.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "white",
                    padding: "6px 10px",
                    minHeight: "50px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderBottom:
                      index < jewelleryItems.length - 1
                        ? "1px solid #e5e7eb"
                        : "none",
                  }}
                  onClick={() => navigate(`/jewellery/detail/${item.id}`)}
                >
                  {/* Item Image */}
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      flexShrink: 0,
                      backgroundColor: "#f3f4f6",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.code}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: "16px", color: "#9ca3af" }}>
                        💎
                      </div>
                    )}
                  </div>

                  {/* Item Details - EXACTLY 2 ROWS */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* ROW 1: Code + Description + Weight */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "6px",
                        marginBottom: "2px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "600",
                          fontSize: "13px",
                          color: "#111827",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.code}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          flex: 1,
                        }}
                      >
                        {item.description}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#374151",
                          fontWeight: "500",
                          whiteSpace: "nowrap",
                          marginLeft: "4px",
                        }}
                      >
                        {item.weight}g
                      </div>
                    </div>

                    {/* ROW 2: Location • Bought For */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: "10px",
                        color: "#9ca3af",
                        gap: "4px",
                      }}
                    >
                      {item.location && (
                        <>
                          <span>{item.location}</span>
                          {item.boughtFor && <span>•</span>}
                        </>
                      )}
                      {item.boughtFor && <span>{item.boughtFor}</span>}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor:
                        item.verificationStatus === "Verified"
                          ? "#10b981"
                          : item.verificationStatus === "Missing"
                            ? "#ef4444"
                            : "#d1d5db",
                      flexShrink: 0,
                    }}
                    title={item.verificationStatus}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Jewellery Navigation */}
        <JewelleryNavigation />

        {/* Minimal bottom spacing */}
        <div style={{ height: "5px" }}></div>
      </div>
    </div>
  );
};

export default JewelleryList;
