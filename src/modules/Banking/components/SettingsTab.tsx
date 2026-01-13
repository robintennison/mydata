import React from "react";
import { cardStyles } from "../../../styles/components/cards";

const SettingsTab: React.FC = () => {
  return (
    <div>
      <h3>Module Settings</h3>
      <div style={cardStyles.settingsCard}>
        <h4>Configuration</h4>
        <p style={{ color: "#6c757d" }}>
          Settings are managed globally in the Settings Context. Edit/Delete
          functionality can be toggled from there.
        </p>
        <div style={cardStyles.infoBox}>
          <p>ℹ️ To change settings:</p>
          <ol style={{ marginLeft: "20px", marginTop: "8px" }}>
            <li>Navigate to the main Settings page</li>
            <li>Toggle "Enable Edit/Delete" for banking module</li>
            <li>Configure other global settings as needed</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
