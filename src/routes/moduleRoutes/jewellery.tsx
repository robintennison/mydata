// src/routes/moduleRoutes/jewellery.ts
import React from 'react';
import JewelleryViewer from '../../modules/Jewellery/JewelleryViewer';
import { RouteConfig } from '../types';

export const jewelleryRoutes: RouteConfig[] = [
  {
    path: '/jewellery',
    element: <JewelleryViewer />,
    title: 'Jewellery',
    icon: '💎',
    requiresAuth: true,
  },
];