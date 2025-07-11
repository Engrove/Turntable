// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import TonearmCalculatorView from '../views/TonearmCalculatorView.vue';
import ComplianceEstimatorView from '../views/ComplianceEstimatorView.vue';
import DataExplorerView from '../views/DataExplorerView.vue'; // Importera den nya vyn

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Home' }
    },
    {
      path: '/tonearm-calculator',
      name: 'tonearm-calculator',
      component: TonearmCalculatorView,
      meta: { title: 'Tonearm Calculator' }
    },
    {
      path: '/compliance-estimator',
      name: 'compliance-estimator',
      component: ComplianceEstimatorView,
      meta: { title: 'Compliance Estimator' }
    },
    {
      // Den nya vyn för Data Explorer
      path: '/data-explorer',
      name: 'data-explorer',
      component: DataExplorerView,
      meta: { title: 'Data Explorer' }
    }
  ]
});

export default router;
