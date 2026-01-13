import React from "react";

interface JewelleryViewerProps {
  userId: string;
}

const JewelleryViewer: React.FC<JewelleryViewerProps> = ({ userId }) => {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "white",
        borderRadius: "10px",
        textAlign: "center" as const,
      }}
    >
      <h2>💎 Jewellery Module</h2>
      <p>Waiting for repository files to build this module</p>
      <p>User ID: {userId}</p>
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "15px",
          borderRadius: "8px",
          marginTop: "20px",
        }}
      >
        <p>
          Please share your <code>JewelleryRepository.kt</code> file
        </p>
      </div>
    </div>
  );
};

// Make sure this line is exactly this:
export default JewelleryViewer;
