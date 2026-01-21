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

        // Try without any filters first
        const allItemsRef = collection(db, "jewellery");
        const allSnapshot = await getDocs(allItemsRef);

        console.log(`Found ${allSnapshot.size} total documents in collection`);

        if (allSnapshot.size === 0) {
          console.log("Collection is empty");
          setJewelleryItems([]);
          setLoading(false);
          return;
        }

        // Log first few documents - FIXED: forEach takes only one parameter
        let logCount = 0;
        allSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          if (logCount < 3) {
            console.log(`Document ${logCount + 1}:`, {
              id: doc.id,
              data: doc.data(),
            });
            logCount++;
          }
        });

        // Now try with filters
        let q = query(collection(db, "jewellery"));

        // Check if documents have 'active' field
        const firstDoc = allSnapshot.docs[0];
        const firstData = firstDoc.data();
        const hasActiveField = "active" in firstData;
        console.log("Documents have 'active' field:", hasActiveField);

        if (!showInactive && hasActiveField) {
          q = query(q, where("active", "==", true));
        }

        // Try without orderBy first to avoid index errors
        try {
          q = query(q, orderBy("code"));
        } catch (orderError) {
          console.log("Could not order by code, will fetch unordered");
          // Continue without ordering
        }

        const snapshot = await getDocs(q);
        console.log(`Filtered query returned ${snapshot.size} items`);

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
        setError(`Failed to load: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchJewellery();
  }, [showInactive]);

  // Simple refresh function
  const handleRefresh = () => {
    setLoading(true);
    fetchJewellery();
  };

  // Re-fetch function
  const fetchJewellery = async () => {
    try {
      const db = getFirestore();
      const jewelleryRef = collection(db, "jewellery");
      const snapshot = await getDocs(jewelleryRef);

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
            padding: "10px",
            backgroundColor: "#fee2e2",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            color: "#991b1b",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Filter Toggle */}
      <div style={{ padding: "15px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive items
        </label>
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
            <div
              style={{
                marginBottom: "24px",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Check browser console (F12) for debugging information.
            </div>
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
              }}
            >
              Add your first item
            </button>
            <div style={{ marginTop: "20px" }}>
              <button
                onClick={handleRefresh}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6b7280",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Try refreshing
              </button>
            </div>
          </div>
        ) : (
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
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "16px" }}>
                      {item.code}
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
                      <span>{item.weight}g</span>
                      <span>{item.location}</span>
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
                    }}
                  >
                    {item.verificationStatus}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <JewelleryNavigation />
      <div style={{ height: "20px" }}></div>
    </div>
  );
};

export default JewelleryList;
