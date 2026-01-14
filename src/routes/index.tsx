// src/routes/index.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import { PrivateRoute } from "./PrivateRoute";
import { allRoutes } from "./routesConfig";

interface AppRoutesProps {
  isAuthenticated: boolean;
  user: any; // or your User type
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
  isAuthenticated,
  user,
}) => {
  return (
    <Routes>
      {allRoutes.map((route) => {
        const routeElement = route.requiresAuth ? (
          <PrivateRoute isAuthenticated={isAuthenticated} redirectTo="/login">
            {/* Pass user prop to components that need it */}
            {React.cloneElement(route.element as React.ReactElement, {
              userId: user?.uid,
            })}
          </PrivateRoute>
        ) : (
          route.element
        );

        return (
          <Route key={route.path} path={route.path} element={routeElement} />
        );
      })}
    </Routes>
  );
};

// Export navigation for use in components
export { navigationItems, getRouteByPath, routeExists } from "./routesConfig";
