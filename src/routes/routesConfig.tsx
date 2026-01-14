// src/routes/routesConfig.ts
import { bankingRoutes } from "./moduleRoutes/banking";
import { jewelleryRoutes } from "./moduleRoutes/jewellery";
//import { propertiesRoutes } from './moduleRoutes/properties';
//import { onlineRoutes } from './moduleRoutes/online';
import { commonRoutes } from "./moduleRoutes/common";
import { RouteConfig, NavigationItem } from "./types";

// Combine all routes
export const allRoutes: RouteConfig[] = [
  ...commonRoutes,
  ...bankingRoutes,
  ...jewelleryRoutes,
  // ...propertiesRoutes,
  // ...onlineRoutes,
  // Add catch-all route
  {
    path: "*",
    element: <div>404 - Page Not Found</div>, // Create a proper 404 component
    requiresAuth: false,
  },
];

// Create navigation items for menus/sidebars
export const navigationItems: NavigationItem[] = allRoutes
  .filter((route) => route.title && route.icon && route.requiresAuth)
  .map((route) => ({
    path: route.path,
    title: route.title!,
    icon: route.icon!,
    module: route.path.split("/")[1] || "home",
    requiresAuth: route.requiresAuth,
  }));

// Helper function to get route by path
export const getRouteByPath = (path: string): RouteConfig | undefined => {
  return allRoutes.find((route) => route.path === path);
};

// Helper to check if route exists
export const routeExists = (path: string): boolean => {
  return allRoutes.some((route) => route.path === path);
};
