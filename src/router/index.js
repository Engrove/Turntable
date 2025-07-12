// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TonearmCalculatorView from '../views/TonearmCalculatorView.vue'
import ComplianceEstimatorView from '../views/ComplianceEstimatorView.vue'
import DataExplorerView from '../views/DataExplorerView.vue'
// NYTT (1g): Importera den nya rapportvyn
import ReportView from '../views/ReportView.vue'

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
      meta: { title: 'Resonance Calculator' }
    },
    {
      path: '/compliance-estimator',
      name: 'compliance-estimator',
      component: ComplianceEstimatorView,
      meta: { title: 'Compliance Estimator' }
    },
    {
      path: '/data-explorer',
      name: 'data-explorer',
      component: DataExplorerView,
      meta: { title: 'Data Explorer' }
    },
    // NYTT (1g): Lägg till en dold route för rapporten
    {
      path: '/report',
      name: 'report',
      component: ReportView,
      // 'meta' utelämnas avsiktligt så att den inte visas i huvudmenyn
    },
  ]
})

export default router
