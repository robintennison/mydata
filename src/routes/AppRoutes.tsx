// src/routes/AppRoutes.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import { PrivateRoute } from "./PrivateRoute";
import { allRoutes } from "./routesConfig";

interface AppRoutesProps {
  isAuthenticated: boolean;
  user: any;
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
            {/* DO NOT pass userId here */}
            {route.element}
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
