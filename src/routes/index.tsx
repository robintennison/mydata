// src/routes/index.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Import all page components
import BankingHomePage from "../modules/Banking/pages/BankingHomePage";
import AccountsPage from "../modules/Banking/pages/AccountsPage";
import AddAccountPage from "../modules/Banking/pages/AddAccountPage";
import EditAccountPage from "../modules/Banking/pages/EditAccountPage";
import SettingsPage from "../modules/SettingsPage"; // Updated import
import LoginForm from "../components/Auth/LoginForm";
import MyDataHomepage from "../MyDataHomepage";

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
    element: <SettingsPage />, // Updated: Using actual SettingsPage
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
// Export everything at the end (ONCE)
export {
  AppRoutes,
  PrivateRoute,
  allRoutes,
  navigationItems,
  getRouteByPath,
  routeExists,
};
