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
import HistoryListPage from "../modules/Banking/pages/HistoryListPage"; // Add this import
import EditHistoryPage from "../modules/Banking/pages/EditHistoryPage"; // Add this import

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
  hideFooter?: boolean; // Add this field to optionally hide footer
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
    hideFooter: true, // Hide footer on login page
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

  // History Routes
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

  // Other Module Routes (Currently placeholders)
  {
    path: "/online",
    element: <div style={{ padding: '20px', textAlign: 'center' }}><h2>🌐 Online Module</h2><p>Coming Soon</p></div>,
    title: "Online",
    icon: "🌐",
    requiresAuth: true,
  },
  {
    path: "/jewellery",
    element: <div style={{ padding: '20px', textAlign: 'center' }}><h2>💎 Jewellery Module</h2><p>Coming Soon</p></div>,
    title: "Jewellery",
    icon: "💎",
    requiresAuth: true,
  },
  {
    path: "/properties",
    element: <div style={{ padding: '20px', textAlign: 'center' }}><h2>🏠 Properties Module</h2><p>Coming Soon</p></div>,
    title: "Properties",
    icon: "🏠",
    requiresAuth: true,
  },
];

// Helper function to get current route
const getCurrentRoute = (pathname: string): RouteConfig | undefined => {
  return allRoutes.find((route) => {
    // Exact match
    if (route.path === pathname) return true;

    // Check for parameterized routes (like /edit/:id)
    if (route.path.includes(":")) {
      const routeParts = route.path.split("/");
      const pathParts = pathname.split("/");

      if (routeParts.length === pathParts.length) {
        return routeParts.every((part, index) => {
          return part.startsWith(":") || part === pathParts[index];
        });
      }
    }
    return false;
  });
};

// ==================== NAVIGATION ITEMS ====================
const navigationItems = allRoutes
  .filter(
    (route: RouteConfig) =>
      route.title &&
      route.icon &&
      !route.path.includes(":") &&
      route.path !== "/login"
  )
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
  const [currentPath, setCurrentPath] = React.useState(
    window.location.pathname
  );

  // Update current path on location change
  React.useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  const currentRoute = getCurrentRoute(currentPath);

  return (
    <Layout 
      title={currentRoute?.title} 
      hideHeader={currentRoute?.path === '/login'}
      hideFooter={currentRoute?.hideFooter}
    >
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
    </Layout>
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
