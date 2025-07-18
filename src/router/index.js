// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Home', isReportPage: false }
    },
    {
      path: '/tonearm-calculator',
      name: 'tonearm-calculator',
      component: () => import('../views/TonearmCalculatorView.vue'),
      meta: { title: 'Resonance Calculator', isReportPage: false }
    },
    {
      path: '/compliance-estimator',
      name: 'compliance-estimator',
      component: () => import('../views/ComplianceEstimatorView.vue'),
      meta: { title: 'Compliance Estimator', isReportPage: false }
    },
    // --- NY ROUTE TILLAGD HÄR ---
    {
      path: '/alignment-calculator',
      name: 'alignment-calculator',
      component: () => import('../views/AlignmentCalculatorView.vue'),
      meta: { title: 'Alignment Calculator', isReportPage: false }
    },
    // --- SLUT PÅ NY ROUTE ---
    {
      path: '/data-explorer',
      name: 'data-explorer',
      component: () => import('../views/DataExplorerView.vue'),
      meta: { title: 'Data Explorer', isReportPage: false }
    },
    {
      path: '/report',
      name: 'report',
      component: () => import('../views/ReportView.vue'),
      meta: { title: 'Generated Report', isReportPage: true }
    }
  ],
  // Funktion för att scrolla till toppen vid sidbyte
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

export default router
