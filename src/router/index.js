import { createRouter, createWebHistory } from 'vue-router'
import TonearmCalculatorView from '../views/TonearmCalculatorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'tonearm-calculator',
      component: TonearmCalculatorView,
      meta: { title: 'Tonearm Calculator' }
    },
    {
      path: '/compliance-estimator',
      name: 'compliance-estimator',
      // Lazy-load the component for better performance.
      // It won't be downloaded by the browser until the user navigates to it.
      component: () => import('../views/ComplianceEstimatorView.vue'),
      meta: { title: 'Compliance Estimator' }
    }
  ]
})

export default router
