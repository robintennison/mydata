// src/routes/moduleRoutes/banking.ts
import React from 'react';
import BankingHomePage from '../../modules/Banking/BankingHomePage';
import AccountsPage from '../../modules/Banking/pages/AccountsPage';
import AddAccountPage from '../../modules/Banking/pages/AddAccountPage';  // NO braces
import EditAccountPage from '../../modules/Banking/pages/EditAccountPage'; // NO braces
import { RouteConfig } from '../types';

export const bankingRoutes: RouteConfig[] = [
  {
    path: '/banking',
    element: <BankingHomePage />,
    title: 'Banking',
    icon: '🏦',
    requiresAuth: true,
  },
  {
    path: '/banking/accounts',
    element: <AccountsPage />,
    title: 'Accounts',
    icon: '💳',
    requiresAuth: true,
  },
  {
    path: '/banking/accounts/add',
    element: <AddAccountPage />,
    title: 'Add Account',
    icon: '➕',
    requiresAuth: true,
  },
  {
    path: '/banking/accounts/edit/:id',
    element: <EditAccountPage />,
    title: 'Edit Account',
    requiresAuth: true,
  },
];