// routes/index.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/Auth/ProtectedRoute";
import PublicRoute from "../components/Auth/PublicRoute";

// Import all page components
import AddEditDepositPage from "../modules/Banking/pages/AddEditDepositPage";
import BankingHomePage from "../modules/Banking/pages/BankingHomePage";
import AddAccountPage from "../modules/Banking/pages/AddAccountPage";
import EditAccountPage from "../modules/Banking/pages/EditAccountPage";
import SettingsPage from "../modules/SettingsPage";
import Layout from "../components/Layout/Layout";
import LoginForm from "../components/Auth/Login";
import MyDataHomepage from "../MyDataHomepage";

// Import History pages
import EditHistoryPage from "../modules/Banking/pages/EditHistoryPage";

// Import Jewellery pages
import JewelleryHome from "../modules/Jewellery/index";
import JewelleryList from "../modules/Jewellery/pages/JewelleryList";
import BillsList from "../modules/Jewellery/pages/BillsList";
import BillForm from "../modules/Jewellery/pages/BillForm";
import JewelleryDetail from "../modules/Jewellery/pages/JewelleryDetail";
import JewelleryFormWrapper from "../modules/Jewellery/pages/JewelleryFormWrapper";
import JewelleryForBill from "../modules/Jewellery/pages/JewelleryForBill";
import BatchEditPage from "../modules/Jewellery/pages/BatchEditPage";

// Import Online pages
import CategoryForm from "../modules/Online/pages/CategoryForm";
import OnlineForm from "../modules/Online/pages/OnlineForm";
import RenewalForm from "../modules/Online/pages/RenewalForm";
import OnlineHomepage from "../modules/Online/pages/OnlineHomepage";

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
  noLayoutPadding?: boolean;
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
    noLayoutPadding: true,
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

  // Jewellery Module Routes
  {
    path: "/jewellery",
    element: <JewelleryHome />,
    title: "Jewellery",
    icon: "💎",
    requiresAuth: true,
    noLayoutPadding: true,
  },
  {
    path: "/jewellery/list",
    element: <JewelleryList />,
    title: "Jewellery Items",
    icon: "💎",
    requiresAuth: true,
    noLayoutPadding: true,
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
    noLayoutPadding: true,
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
  {
    path: "/jewellery/bills/:billId/linked-jewellery",
    element: <JewelleryForBill />,
    title: "Linked Jewellery",
    requiresAuth: true,
  },

  {
    path: "/jewellery/batch-edit",
    element: <BatchEditPage />,
    title: "Batch Edit",
    icon: "🔄",
    requiresAuth: true,
  },

  // Online Module Routes
  // Main online page - this should be the tabbed interface
  {
    path: "/online",
    element: <OnlineHomepage />, // This is your tabbed homepage
    title: "Online",
    icon: "🌐",
    requiresAuth: true,
    noLayoutPadding: true,
  },
  {
    path: "/online/categories/add",
    element: <CategoryForm />,
    title: "Add Category",
    icon: "➕",
    requiresAuth: true,
  },
  {
    path: "/online/categories/edit/:id",
    element: <CategoryForm />,
    title: "Edit Category",
    icon: "✏️",
    requiresAuth: true,
  },
  {
    path: "/online/items/add",
    element: <OnlineForm />,
    title: "Add Item",
    icon: "➕",
    requiresAuth: true,
  },
  {
    path: "/online/items/edit/:id",
    element: <OnlineForm />,
    title: "Edit Item",
    icon: "✏️",
    requiresAuth: true,
  },
  {
    path: "/online/items/view/:id",
    element: <OnlineForm />, // Use OnlineForm with view mode
    title: "View Item",
    requiresAuth: true,
  },
  {
    path: "/online/renewals/add",
    element: <RenewalForm />,
    title: "Add Renewal",
    icon: "➕",
    requiresAuth: true,
  },
  {
    path: "/online/renewals/edit/:id",
    element: <RenewalForm />,
    title: "Edit Renewal",
    icon: "✏️",
    requiresAuth: true,
  },
  {
    path: "/online/renewals/view/:id",
    element: <RenewalForm />,
    title: "View Renewal",
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
      !route.path.includes("/jewellery/") &&
      !route.path.includes("/online/") &&
      route.path !== "/settings" &&
      route.requiresAuth,
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

  online: allRoutes
    .filter(
      (route: RouteConfig) =>
        route.title &&
        route.icon &&
        route.path.startsWith("/online") &&
        !route.path.includes(":") &&
        route.path !== "/online",
    )
    .map((route: RouteConfig) => ({
      path: route.path,
      title: route.title!,
      icon: route.icon!,
      module: "online",
      requiresAuth: route.requiresAuth,
    })),
};

// ==================== HELPER FUNCTIONS ====================
const getRouteByPath = (path: string) =>
  allRoutes.find((route) => route.path === path);

const routeExists = (path: string) =>
  allRoutes.some((route) => route.path === path);

// ==================== APP ROUTES COMPONENT ====================
interface AppRoutesProps {
  // Remove isAuthenticated and user props since we use AuthContext
}

const AppRoutes: React.FC<AppRoutesProps> = () => {
  // Helper function to render routes with children
  const renderRoute = (route: RouteConfig) => {
    if (route.path === "/login") {
      return (
        <Route
          key={route.path}
          path={route.path}
          element={
            <PublicRoute>
              <Layout>{route.element}</Layout>
            </PublicRoute>
          }
        />
      );
    }

    const routeElement = route.requiresAuth ? (
      <ProtectedRoute>
        <Layout noPadding={route.noLayoutPadding}>{route.element}</Layout>
      </ProtectedRoute>
    ) : (
      <Layout noPadding={route.noLayoutPadding}>{route.element}</Layout>
    );

    // Handle routes with children (nested routes)
    if (route.children && route.children.length > 0) {
      return (
        <Route key={route.path} path={route.path} element={routeElement}>
          {route.children.map((childRoute) => (
            <Route
              key={childRoute.path || "index"}
              index={childRoute.isIndex}
              path={childRoute.path}
              element={childRoute.element}
            />
          ))}
        </Route>
      );
    }

    return <Route key={route.path} path={route.path} element={routeElement} />;
  };

  return (
    <Routes>
      {allRoutes.map(renderRoute)}

      {/* 404 Route - Show layout for authenticated users */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <Layout>
              <div style={{ padding: "40px", textAlign: "center" }}>
                <h1>404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <button
                  onClick={() => (window.location.href = "/")}
                  style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    backgroundColor: "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Go Home
                </button>
              </div>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

// ==================== EXPORTS ====================
export {
  AppRoutes,
  allRoutes,
  navigationItems,
  moduleNavigationItems,
  getRouteByPath,
  routeExists,
};
