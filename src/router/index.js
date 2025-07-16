// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

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
      // Dynamisk import för lazy loading
      component: () => import('../views/TonearmCalculatorView.vue'),
      meta: { title: 'Resonance Calculator' }
    },
    {
      path: '/compliance-estimator',
      name: 'compliance-estimator',
      // Dynamisk import för lazy loading
      component: () => import('../views/ComplianceEstimatorView.vue'),
      meta: { title: 'Compliance Estimator' }
    },
    {
      path: '/alignment-calculator',
      name: 'alignment-calculator',
      // Dynamisk import för lazy loading
      component: () => import('../views/AlignmentCalculatorView.vue'),
      meta: { title: 'Alignment Calculator' }
    },
    {
      path: '/data-explorer',
      name: 'data-explorer',
      // Dynamisk import för lazy loading
      component: () => import('../views/DataExplorerView.vue'),
      meta: { title: 'Data Explorer' }
    },
    {
      path: '/report',
      name: 'report',
      // Dynamisk import för lazy loading
      component: () => import('../views/ReportView.vue'),
      meta: { isReportPage: true } // Ingen titel, visas ej i menyn
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

export default router;
