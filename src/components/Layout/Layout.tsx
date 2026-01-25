// components/Layout/Layout.tsx
import React from "react";
import Header from "./Header";
import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
  noPadding?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  hideHeader = false,
  noPadding = false,
}) => {
  return (
    <div className="layout">
      {!hideHeader && <Header />}

      <main className={`layout-content ${noPadding ? "no-padding" : ""}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
