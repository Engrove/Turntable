// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import TonearmCalculatorView from '../views/TonearmCalculatorView.vue';
import ComplianceEstimatorView from '../views/ComplianceEstimatorView.vue';
import HomeView from '../views/HomeView.vue'; // Importera den nya vyn

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // Den nya startsidan
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Home' } // Text för menyn
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
    }
  ]
});

export default router;
