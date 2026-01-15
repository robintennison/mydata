import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Import all page components
import DepositsListPage from "../modules/Banking/pages/DepositsListPage";
import AddEditDepositPage from "../modules/Banking/pages/AddEditDepositPage";
import BankingHomePage from "../modules/Banking/pages/BankingHomePage";
import AccountsPage from "../modules/Banking/pages/AccountsPage";
import AddAccountPage from "../modules/Banking/pages/AddAccountPage";
import EditAccountPage from "../modules/Banking/pages/EditAccountPage";
import SettingsPage from "../modules/SettingsPage";
import LoginForm from "../components/Auth/LoginForm";
import MyDataHomepage from "../MyDataHomepage";

// Import History pages
import HistoryListPage from "../modules/Banking/pages/HistoryListPage"; // Add this import
import EditHistoryPage from "../modules/Banking/pages/EditHistoryPage"; // Add this import
import HistoryChartPage from "../modules/Banking/pages/HistoryChartPage";

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
}

export interface ModuleRoute {
  moduleName: string;
  basePath: string;
  routes: RouteConfig[];
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

  // Deposit Routes
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

  // History Routes - ADD THESE
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
    path: "/banking/history/chart",
    element: <HistoryChartPage />,
    title: "History Chart",
    icon: "📊",
    requiresAuth: true,
    needsUserData: true,
  },
];

// ==================== NAVIGATION ITEMS ====================
const navigationItems = allRoutes
  .filter((route: RouteConfig) => route.title && route.icon)
  .map((route: RouteConfig) => ({
    path: route.path,
    title: route.title!,
    icon: route.icon!,
    module: "main",
    requiresAuth: route.requiresAuth,
  }));

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

      {/* 404 Route - Catch all unmatched routes */}
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
  );
};

// ==================== EXPORTS ====================
export {
  AppRoutes,
  PrivateRoute,
  allRoutes,
  navigationItems,
  getRouteByPath,
  routeExists,
};
