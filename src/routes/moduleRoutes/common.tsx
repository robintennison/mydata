// src/routes/moduleRoutes/common.ts
import React from 'react';
import LoginForm from '../../components/Auth/LoginForm';
import MyDataHomepage from '../../MyDataHomepage';
import { RouteConfig } from '../types';

export const commonRoutes: RouteConfig[] = [
  {
    path: '/',
    element: <MyDataHomepage />,
    title: 'Home',
    icon: '🏠',
    requiresAuth: true,
    isIndex: true,
  },
  {
    path: '/login',
    element: <LoginForm />,
    title: 'Login',
    requiresAuth: false,
  },
  {
    path: '/settings',
    element: <div>Settings Page</div>, // Replace with actual component
    title: 'Settings',
    icon: '⚙️',
    requiresAuth: true,
  },
];