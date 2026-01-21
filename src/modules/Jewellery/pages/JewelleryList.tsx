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

        // EXACT SAME QUERY AS KOTLIN
        let q = query(collection(db, "jewellery"));

        if (!showInactive) {
          q = query(q, where("active", "==", true));
        }

        // Newest purchases first (actually newest by code in descending order)
        q = query(q, orderBy("code", "desc"));

        console.log("Executing query:", {
          collection: "jewellery",
          filter: showInactive ? "all items" : "active only",
          orderBy: "code desc",
        });

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

        // If it's an index error, show helpful message
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

  // Refresh function
  const handleRefresh = () => {
    setLoading(true);
    setJewelleryItems([]);
    setError(null);

    // Re-fetch after a short delay
    setTimeout(() => {
      fetchJewellery();
    }, 100);
  };

  // Re-fetch function
  const fetchJewellery = async () => {
    try {
      const db = getFirestore();

      // EXACT SAME QUERY AS KOTLIN
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
        <div style={jewelleryStyles.navTitle}>
          Jewellery Items ({jewelleryItems.length})
          <div
            style={{ fontSize: "12px", color: "#6b7280", fontWeight: "normal" }}
          >
            Sorted by code (newest first)
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleRefresh}
            style={{
              ...jewelleryStyles.navButton,
              padding: "6px 12px",
              fontSize: "14px",
              backgroundColor: "#10b981",
            }}
            title="Refresh"
          >
            🔄
          </button>
          <button
            onClick={() => navigate("/jewellery/add")}
            style={{
              ...jewelleryStyles.navButton,
              padding: "6px 12px",
              fontSize: "14px",
            }}
            title="Add New"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            margin: "15px",
            padding: "15px",
            backgroundColor: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: "8px",
            color: "#92400e",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <strong>Index Required</strong>
          </div>
          <div style={{ fontSize: "14px", marginBottom: "12px" }}>
            This query needs a Firestore composite index. The mobile app may
            have created it automatically.
          </div>
          <div
            style={{
              fontSize: "13px",
              backgroundColor: "#fef9c3",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "12px",
            }}
          >
            <strong>Index needed:</strong>
            <div>
              • Collection: <code>jewellery</code>
            </div>
            <div>
              • Fields: <code>active</code> (ascending), <code>code</code>{" "}
              (descending)
            </div>
          </div>
          <div style={{ fontSize: "13px" }}>
            <strong>Quick fix:</strong> Click any link in the browser console
            error, or go to Firebase Console → Firestore → Indexes.
          </div>
          <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => {
                // Try without orderBy as fallback
                setShowInactive(true); // Show all items
                setError(
                  "Showing all items without sorting. Create index for proper sorting.",
                );
              }}
              style={{
                padding: "8px 16px",
                backgroundColor: "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Show All Items (No Sort)
            </button>
            <button
              onClick={handleRefresh}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Filter Toggle */}
      <div style={{ padding: "15px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
          }}
        >
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive items ({showInactive ? "showing all" : "active only"})
        </label>
        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
          Filter: {showInactive ? "All items" : "Active items only"}
        </div>
      </div>

      {/* Items List */}
      <div style={{ padding: "0 15px 15px 15px" }}>
        {jewelleryItems.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#9ca3af",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
            <p style={{ marginBottom: "16px", fontSize: "16px" }}>
              No jewellery items found.
            </p>
            {!showInactive && (
              <p
                style={{
                  marginBottom: "16px",
                  fontSize: "14px",
                  color: "#6b7280",
                }}
              >
                Try checking "Show inactive items" to see all items.
              </p>
            )}
            <button
              onClick={() => navigate("/jewellery/add")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              Add your first item
            </button>
            <div>
              <button
                onClick={handleRefresh}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6b7280",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "13px",
                }}
              >
                Refresh list
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "10px",
                paddingLeft: "4px",
              }}
            >
              Showing {jewelleryItems.length} items sorted by code (Z → A)
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {jewelleryItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "15px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    opacity: item.active ? 1 : 0.7,
                    cursor: "pointer",
                    borderLeft: item.active
                      ? "4px solid #10b981"
                      : "4px solid #9ca3af",
                  }}
                  onClick={() => navigate(`/jewellery/detail/${item.id}`)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: "600",
                          fontSize: "16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {item.code}
                        {!item.active && (
                          <span
                            style={{
                              fontSize: "11px",
                              backgroundColor: "#9ca3af",
                              color: "white",
                              padding: "2px 6px",
                              borderRadius: "10px",
                            }}
                          >
                            Inactive
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          color: "#6b7280",
                          fontSize: "14px",
                          marginTop: "4px",
                        }}
                      >
                        {item.description}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "15px",
                          marginTop: "8px",
                          fontSize: "13px",
                        }}
                      >
                        <span>Weight: {item.weight}g</span>
                        {item.location && (
                          <span>Location: {item.location}</span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div
                      style={{
                        backgroundColor:
                          item.verificationStatus === "Verified"
                            ? "#10b981"
                            : item.verificationStatus === "Missing"
                              ? "#ef4444"
                              : "#6b7280",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "500",
                        minWidth: "90px",
                        textAlign: "center",
                      }}
                    >
                      {item.verificationStatus}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <JewelleryNavigation />
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default JewelleryList;
