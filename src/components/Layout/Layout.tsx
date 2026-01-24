// components/Layout/Layout.tsx
import React from "react";
import Header from "./Header";
import "./Layout.css";
import BottomNav from "../Navigation/BottomNav";

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  hideHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  hideFooter = false,
  hideHeader = false,
}) => {
  return (
    <div className="layout">
      {!hideHeader && <Header />}

      <main className="layout-content">{children}</main>

      {!hideFooter && <BottomNav />}
    </div>
  );
};

export default Layout;
