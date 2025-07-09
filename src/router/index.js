import { createRouter, createWebHistory } from 'vue-router'
import TonearmCalculatorView from '../views/TonearmCalculatorView.vue'
// NY RAD: Importera den nya vyn direkt
import ComplianceEstimatorView from '../views/ComplianceEstimatorView.vue'

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
      // ÄNDRAD RAD: Använd den direktimporterade komponenten
      component: ComplianceEstimatorView,
      meta: { title: 'Compliance Estimator' }
    }
  ]
})

export default router
