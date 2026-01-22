import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Import all page components
import DepositsListPage from "../modules/Banking/pages/DepositsListPage";
import AddEditDepositPage from "../modules/Banking/pages/AddEditDepositPage";
import BankingHomePage from "../modules/Banking/pages/BankingHomePage";
import AccountsPage from "../modules/Banking/pages/AccountsPage";
import AddAccountPage from "../modules/Banking/pages/AddAccountPage";
import EditAccountPage from "../modules/Banking/pages/EditAccountPage";
import DepositSummaryPage from "../modules/Banking/pages/DepositSummaryPage";
import SettingsPage from "../modules/SettingsPage";
import Layout from "../components/Layout/Layout";
import LoginForm from "../components/Auth/LoginForm";
import MyDataHomepage from "../MyDataHomepage";

// Import History pages
import HistoryListPage from "../modules/Banking/pages/HistoryListPage";
import EditHistoryPage from "../modules/Banking/pages/EditHistoryPage";

// Import Jewellery pages
import JewelleryHome from "../modules/Jewellery/index";
import JewelleryList from "../modules/Jewellery/pages/JewelleryList";
import BillsList from "../modules/Jewellery/pages/BillsList";
import BillForm from "../modules/Jewellery/pages/BillForm";
import JewelleryDetail from "../modules/Jewellery/pages/JewelleryDetail";
import VerificationPageWrapper from "../modules/Jewellery/pages/VerificationPageWrapper";
import JewelleryFormWrapper from "../modules/Jewellery/pages/JewelleryFormWrapper";
import GalleryPage from "../modules/Jewellery/pages/GalleryPage";
// Import the new component for viewing jewellery linked to a bill
import JewelleryForBill from "../modules/Jewellery/pages/JewelleryForBill";
// Import the new BatchEditPage component
import BatchEditPage from "../modules/Jewellery/pages/BatchEditPage"; // Add this import

// ==================== TYPES ====================
export interface RouteConfig {
  path: string;
  element: React.ReactElement;
  title?: string;
  icon?: string;
  requiresAuth: boolean;
  needsUserData?: boolean;
  children?: RouteConfig[];
  isIndex?: boolean;
  hideFooter?: boolean;
}

export interface NavigationItem {
  path: string;
  title: string;
  icon: string;
  module: string;
  requiresAuth: boolean;
}

// ==================== ROUTE CONFIGURATION ====================
const allRoutes: RouteConfig[] = [
  // Common Routes
  {
    path: "/",
    element: <MyDataHomepage />,
    title: "Home",
    icon: "🏠",
    requiresAuth: true,
    isIndex: true,
  },
  {
    path: "/login",
    element: <LoginForm />,
    title: "Login",
    requiresAuth: false,
    hideFooter: true,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
    title: "Settings",
    icon: "⚙️",
    requiresAuth: true,
  },

  // Banking Routes
  {
    path: "/banking",
    element: <BankingHomePage />,
    title: "Banking",
    icon: "🏦",
    requiresAuth: true,
    needsUserData: true,
  },
  {
    path: "/banking/accounts",
    element: <AccountsPage />,
    title: "Accounts",
    icon: "💳",
    requiresAuth: true,
    needsUserData: true,
  },
  {
    path: "/banking/accounts/add",
    element: <AddAccountPage />,
    title: "Add Account",
    icon: "➕",
    requiresAuth: true,
    needsUserData: true,
  },
  {
    path: "/banking/accounts/edit/:id",
    element: <EditAccountPage />,
    title: "Edit Account",
    requiresAuth: true,
    needsUserData: true,
  },
  {
    path: "/banking/deposits",
    element: <DepositsListPage />,
    title: "Deposits",
    icon: "💰",
    requiresAuth: true,
    needsUserData: true,
  },
  {
    path: "/banking/deposits/list",
    element: <DepositsListPage />,
    title: "Deposits List",
    icon: "📋",
    requiresAuth: true,
    needsUserData: true,
  },
  {
    path: "/banking/deposits/add",
    element: <AddEditDepositPage />,
    title: "Add Deposit",
    icon: "➕",
    requiresAuth: true,
    needsUserData: true,
  },
  {
    path: "/banking/deposits/edit/:depositId",
    element: <AddEditDepositPage isEdit={true} />,
    title: "Edit Deposit",
    icon: "✏️",
    requiresAuth: true,
    needsUserData: true,
  },
  {
    path: "/banking/history",
    element: <HistoryListPage />,
    title: "History",
    icon: "📅",
    requiresAuth: true,
    needsUserData: true,
  },
  {
    path: "/banking/history/add",
    element: <EditHistoryPage />,
    title: "Add History",
    icon: "➕",
    requiresAuth: true,
    needsUserData: true,
  },
  {
    path: "/banking/history/edit/:month",
    element: <EditHistoryPage />,
    title: "Edit History",
    icon: "✏️",
    requiresAuth: true,
    needsUserData: true,
  },
  {
    path: "/banking/summary",
    element: <DepositSummaryPage />,
    title: "Summary",
    icon: "📊",
    requiresAuth: true,
    needsUserData: true,
  },

  // Jewellery Module Routes
  {
    path: "/jewellery",
    element: <JewelleryHome />,
    title: "Jewellery",
    icon: "💎",
    requiresAuth: true,
  },
  {
    path: "/jewellery/list",
    element: <JewelleryList />,
    title: "Jewellery Items",
    icon: "💎",
    requiresAuth: true,
  },
  {
    path: "/jewellery/add",
    element: <JewelleryFormWrapper />,
    title: "Add Jewellery",
    icon: "➕",
    requiresAuth: true,
  },
  {
    path: "/jewellery/edit/:id",
    element: <JewelleryFormWrapper isEditing={true} />,
    title: "Edit Jewellery",
    icon: "✏️",
    requiresAuth: true,
  },
  {
    path: "/jewellery/detail/:id",
    element: <JewelleryDetail />,
    title: "Jewellery Detail",
    requiresAuth: true,
  },
  {
    path: "/jewellery/bills",
    element: <BillsList />,
    title: "Bills & Documents",
    icon: "📄",
    requiresAuth: true,
  },
  {
    path: "/jewellery/bills/add",
    element: <BillForm />,
    title: "Add Bill",
    icon: "➕",
    requiresAuth: true,
  },
  {
    path: "/jewellery/bills/edit/:id",
    element: <BillForm />,
    title: "Edit Bill",
    icon: "✏️",
    requiresAuth: true,
  },
  // New route for viewing jewellery linked to a bill
  {
    path: "/jewellery/bills/:billId/linked-jewellery",
    element: <JewelleryForBill />,
    title: "Linked Jewellery",
    requiresAuth: true,
  },
  {
    path: "/jewellery/gallery",
    element: <GalleryPage />,
    title: "Gallery",
    icon: "🖼️",
    requiresAuth: true,
  },
  {
    path: "/jewellery/verification",
    element: <VerificationPageWrapper />,
    title: "Stock Verification",
    icon: "✅",
    requiresAuth: true,
  },
  // New route for batch editing locations
  {
    path: "/jewellery/batch-edit",
    element: <BatchEditPage />,
    title: "Batch Edit",
    icon: "🔄",
    requiresAuth: true,
  },

  // Other Module Routes
  {
    path: "/online",
    element: (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>🌐 Online Module</h2>
        <p>Coming Soon</p>
      </div>
    ),
    title: "Online",
    icon: "🌐",
    requiresAuth: true,
  },
  {
    path: "/properties",
    element: (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>🏠 Properties Module</h2>
        <p>Coming Soon</p>
      </div>
    ),
    title: "Properties",
    icon: "🏠",
    requiresAuth: true,
  },
];

// ==================== NAVIGATION ITEMS ====================
const navigationItems = allRoutes
  .filter(
    (route: RouteConfig) =>
      route.title &&
      route.icon &&
      !route.path.includes(":") &&
      route.path !== "/login" &&
      !route.path.includes("/banking/") &&
      !route.path.includes("/jewellery/"),
  )
  .map((route: RouteConfig) => ({
    path: route.path,
    title: route.title!,
    icon: route.icon!,
    module: "main",
    requiresAuth: route.requiresAuth,
  }));

// Add module-specific navigation groups
const moduleNavigationItems = {
  banking: allRoutes
    .filter(
      (route: RouteConfig) =>
        route.title &&
        route.icon &&
        route.path.startsWith("/banking") &&
        !route.path.includes(":") &&
        route.path !== "/banking",
    )
    .map((route: RouteConfig) => ({
      path: route.path,
      title: route.title!,
      icon: route.icon!,
      module: "banking",
      requiresAuth: route.requiresAuth,
    })),

  jewellery: allRoutes
    .filter(
      (route: RouteConfig) =>
        route.title &&
        route.icon &&
        route.path.startsWith("/jewellery") &&
        !route.path.includes(":") &&
        route.path !== "/jewellery",
    )
    .map((route: RouteConfig) => ({
      path: route.path,
      title: route.title!,
      icon: route.icon!,
      module: "jewellery",
      requiresAuth: route.requiresAuth,
    })),
};

// ==================== HELPER FUNCTIONS ====================
const getRouteByPath = (path: string) =>
  allRoutes.find((route) => route.path === path);

const routeExists = (path: string) =>
  allRoutes.some((route) => route.path === path);

// ==================== PRIVATE ROUTE COMPONENT ====================
interface PrivateRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  redirectTo?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  isAuthenticated,
  redirectTo = "/login",
}) => {
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
};

// ==================== APP ROUTES COMPONENT ====================
interface AppRoutesProps {
  isAuthenticated: boolean;
  user?: any;
}

const AppRoutes: React.FC<AppRoutesProps> = ({ isAuthenticated }) => {
  return (
    <Layout hideFooter={false}>
      <Routes>
        {allRoutes.map((route) => {
          const routeElement = route.requiresAuth ? (
            <PrivateRoute isAuthenticated={isAuthenticated} redirectTo="/login">
              {route.element}
            </PrivateRoute>
          ) : (
            route.element
          );

          return (
            <Route key={route.path} path={route.path} element={routeElement} />
          );
        })}

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div style={{ padding: "40px", textAlign: "center" }}>
              <h1>404 - Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
            </div>
          }
        />
      </Routes>
    </Layout>
  );
};

// ==================== EXPORTS ====================
export {
  AppRoutes,
  PrivateRoute,
  allRoutes,
  navigationItems,
  moduleNavigationItems,
  getRouteByPath,
  routeExists,
};
