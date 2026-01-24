interface NavItem {
  path: string;
  label: string;
  icon: string;
  requiresAuth: boolean;
}

export const navItems: NavItem[] = [
  //{ path: "/", label: "Home", icon: "🏠", requiresAuth: true },
  { path: "/banking", label: "Banking", icon: "🏦", requiresAuth: true },
  { path: "/jewellery", label: "Jewellery", icon: "💎", requiresAuth: true },
  { path: "/online", label: "Online", icon: "🌐", requiresAuth: true },
];
