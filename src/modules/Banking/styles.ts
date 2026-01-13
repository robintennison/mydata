import type { CSSProperties } from "react";

export const styles: { [key: string]: CSSProperties } = {
  container: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
  loading: {
    textAlign: "center" as const,
    padding: "50px",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #f3f3f3",
    borderTop: "5px solid #4285f4",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  header: {
    marginBottom: "25px",
  },
  title: {
    color: "#212529",
    margin: "0 0 10px 0",
    fontSize: "1.8rem",
  },
  subtitle: {
    color: "#6c757d",
    margin: 0,
    fontSize: "0.9rem",
  },
  tabs: {
    display: "flex",
    gap: "5px",
    marginBottom: "25px",
    borderBottom: "2px solid #e9ecef",
    paddingBottom: "5px",
    flexWrap: "wrap" as const,
  },
  content: {
    minHeight: "400px",
  },
};

export const tabStyle = {
  default: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px 8px 0 0",
    cursor: "pointer",
    fontSize: "0.95rem",
    transition: "all 0.2s",
  },
  active: {
    backgroundColor: "#4285f4",
    color: "white",
  },
  inactive: {
    backgroundColor: "#f8f9fa",
    color: "#333",
  },
};