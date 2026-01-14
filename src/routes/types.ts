// src/routes/types.ts
export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  title?: string;
  icon?: string;
  requiresAuth: boolean;
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
