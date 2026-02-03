// components/Layout/Layout.tsx
import React from "react";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
  noPadding?: boolean;
  noFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  hideHeader = false,
  noPadding = false,
  noFooter = false,
}) => {
  return (
    <div className="flex flex-col min-h-screen w-full bg-white">
      {!hideHeader && <Header />}

      <main
        className={`flex-1 w-full max-w-2xl mx-auto ${
          noPadding ? "p-0" : "p-6"
        } ${hideHeader ? (noPadding ? "pt-0" : "pt-6") : ""} ${
          noFooter ? (noPadding ? "pb-0" : "pb-6") : ""
        } bg-white`}
      >
        {children}
      </main>

      {/* Optional footer can be added here */}
    </div>
  );
};

export default Layout;
