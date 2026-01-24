// components/Layout/Layout.tsx
import React from "react";
import Header from "./Header";
import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  hideHeader = false,
}) => {
  return (
    <div className="layout">
      {!hideHeader && <Header />}

      <main className="layout-content">{children}</main>
    </div>
  );
};

export default Layout;
