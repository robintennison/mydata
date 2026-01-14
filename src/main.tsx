// src/main.tsx or src/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {" "}
    {/* Wrap App with BrowserRouter */}
    <App />
  </React.StrictMode>
);
