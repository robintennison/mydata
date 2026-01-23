// components/Layout/Layout.tsx
import React from "react";
import Header from "./Header";
import BottomNav from "../Navigation/BottomNav";
import "./Layout.css";

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
