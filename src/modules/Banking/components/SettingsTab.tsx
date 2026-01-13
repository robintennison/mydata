import React, { useEffect, useState } from "react";
import { cardStyles } from "../../../styles/components/cards";
import { useSettings } from "../../../contexts/SettingsContext"; // Import SettingsContext

const SettingsTab: React.FC = () => {
  // Mobile state for better UX
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Get settings from context to show current state
  const { settings } = useSettings();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        overflowX: "hidden",
        padding: isMobile ? "0" : "4px",
      }}
    >
      <h3
        style={{
          fontSize: isMobile ? "1.25rem" : "1.5rem",
          margin: isMobile ? "0 0 16px 0" : "0 0 20px 0",
          color: "#212529",
        }}
      >
        ⚙️ Module Settings
      </h3>

      {/* Settings Overview Card */}
      <div
        style={{
          ...cardStyles.settingsCard,
          padding: isMobile ? "16px" : "20px",
          marginBottom: isMobile ? "16px" : "20px",
        }}
      >
        <h4
          style={{
            fontSize: isMobile ? "1.1rem" : "1.25rem",
            margin: "0 0 12px 0",
            color: "#212529",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "1.2em" }}>⚙️</span>
          Configuration
        </h4>

        <p
          style={{
            color: "#6c757d",
            fontSize: isMobile ? "0.9rem" : "1rem",
            lineHeight: "1.5",
            marginBottom: "16px",
          }}
        >
          Settings are managed globally in the Settings Context. Edit/Delete
          functionality can be toggled from there.
        </p>

        {/* Current Status */}
        <div
          style={{
            backgroundColor: settings.enableEditDelete ? "#e8f5e9" : "#fff3cd",
            padding: isMobile ? "12px" : "16px",
            borderRadius: "8px",
            border: `1px solid ${
              settings.enableEditDelete ? "#c8e6c9" : "#ffeaa7"
            }`,
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: isMobile ? "wrap" : "nowrap",
              gap: isMobile ? "8px" : "0",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  fontWeight: "600",
                  color: settings.enableEditDelete ? "#2e7d32" : "#e65100",
                  marginBottom: "4px",
                }}
              >
                {settings.enableEditDelete
                  ? "✅ Edit/Delete Enabled"
                  : "❌ Edit/Delete Disabled"}
              </div>
              <div
                style={{
                  fontSize: isMobile ? "0.8rem" : "0.85rem",
                  color: settings.enableEditDelete ? "#4caf50" : "#ff9800",
                }}
              >
                {settings.enableEditDelete
                  ? "You can edit and delete records in this module"
                  : "Edit and delete functions are currently disabled"}
              </div>
            </div>
            <div
              style={{
                backgroundColor: settings.enableEditDelete
                  ? "#4caf50"
                  : "#ff9800",
                color: "white",
                padding: isMobile ? "6px 10px" : "8px 12px",
                borderRadius: "20px",
                fontSize: isMobile ? "0.75rem" : "0.8rem",
                fontWeight: "600",
              }}
            >
              {settings.enableEditDelete ? "ACTIVE" : "INACTIVE"}
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div
          style={{
            ...cardStyles.infoBox,
            padding: isMobile ? "16px" : "20px",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              marginBottom: isMobile ? "12px" : "16px",
            }}
          >
            <div
              style={{
                fontSize: isMobile ? "1.2rem" : "1.4rem",
                color: "#4285f4",
                flexShrink: 0,
              }}
            >
              ℹ️
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: isMobile ? "0.95rem" : "1rem",
                  fontWeight: "600",
                  color: "#212529",
                }}
              >
                To change settings:
              </p>
              <ol
                style={{
                  margin: isMobile ? "0 0 0 16px" : "0 0 0 20px",
                  padding: 0,
                  fontSize: isMobile ? "0.85rem" : "0.9rem",
                  color: "#495057",
                  lineHeight: "1.6",
                }}
              >
                <li style={{ marginBottom: "8px" }}>
                  Navigate to the main Settings page
                </li>
                <li style={{ marginBottom: "8px" }}>
                  Toggle "Enable Edit/Delete" for banking module
                </li>
                <li>Configure other global settings as needed</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Guide Section */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: isMobile ? "16px" : "20px",
          borderRadius: "12px",
          border: "1px solid #e9ecef",
          marginBottom: isMobile ? "16px" : "20px",
        }}
      >
        <h4
          style={{
            fontSize: isMobile ? "1.05rem" : "1.15rem",
            margin: "0 0 12px 0",
            color: "#212529",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "1.1em" }}>📱</span>
          Mobile Guide
        </h4>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? "12px" : "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #e9ecef",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                color: "#4285f4",
                fontWeight: "600",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>📊</span>
              Viewing Data
            </div>
            <ul
              style={{
                margin: "8px 0 0 16px",
                padding: 0,
                fontSize: "0.8rem",
                color: "#666",
                lineHeight: "1.5",
              }}
            >
              <li>Tables scroll horizontally</li>
              <li>Tap cards for details</li>
              <li>Pull to refresh data</li>
            </ul>
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #e9ecef",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                color: "#4285f4",
                fontWeight: "600",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>✏️</span>
              Editing Data
            </div>
            <ul
              style={{
                margin: "8px 0 0 16px",
                padding: 0,
                fontSize: "0.8rem",
                color: "#666",
                lineHeight: "1.5",
              }}
            >
              <li>Full-width forms</li>
              <li>Large touch targets</li>
              <li>Auto-focus on inputs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Feature Status */}
      <div
        style={{
          backgroundColor: "white",
          padding: isMobile ? "16px" : "20px",
          borderRadius: "12px",
          border: "1px solid #e9ecef",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <h4
          style={{
            fontSize: isMobile ? "1.05rem" : "1.15rem",
            margin: "0 0 16px 0",
            color: "#212529",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "1.1em" }}>✅</span>
          Module Features
        </h4>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: isMobile ? "10px" : "12px",
          }}
        >
          {[
            { name: "Accounts Management", enabled: true, icon: "🏦" },
            { name: "Deposits Tracking", enabled: true, icon: "💰" },
            { name: "Summary Dashboard", enabled: true, icon: "📊" },
            { name: "History Charts", enabled: true, icon: "📈" },
            { name: "Mobile Responsive", enabled: true, icon: "📱" },
            { name: "Data Export", enabled: false, icon: "📤" },
            { name: "Notifications", enabled: false, icon: "🔔" },
            { name: "Multi-Currency", enabled: false, icon: "💱" },
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px",
                backgroundColor: feature.enabled ? "#f8f9fa" : "#f8f9fa",
                borderRadius: "8px",
                border: `1px solid ${feature.enabled ? "#dee2e6" : "#e9ecef"}`,
                opacity: feature.enabled ? 1 : 0.7,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span style={{ fontSize: "1.2rem" }}>{feature.icon}</span>
                <span
                  style={{
                    fontSize: isMobile ? "0.85rem" : "0.9rem",
                    fontWeight: "500",
                    color: feature.enabled ? "#212529" : "#6c757d",
                  }}
                >
                  {feature.name}
                </span>
              </div>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: feature.enabled ? "#34a853" : "#ea4335",
                }}
              />
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid #e9ecef",
            fontSize: isMobile ? "0.8rem" : "0.85rem",
            color: "#666",
            textAlign: "center",
          }}
        >
          <span style={{ color: "#34a853", fontWeight: "500" }}>● Enabled</span>
          {" • "}
          <span style={{ color: "#ea4335", fontWeight: "500" }}>
            ● Disabled
          </span>
        </div>
      </div>

      {/* Mobile Quick Actions */}
      {isMobile && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#e3f2fd",
            borderRadius: "10px",
            border: "1px solid #bbdefb",
          }}
        >
          <h4
            style={{
              fontSize: "1rem",
              margin: "0 0 12px 0",
              color: "#1565c0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>⚡</span>
            Quick Tip
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              color: "#0d47a1",
              lineHeight: "1.5",
            }}
          >
            This module is fully responsive. On mobile: • Tables scroll
            horizontally • Cards expand for details • Forms are optimized for
            touch • Charts are interactive
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;
