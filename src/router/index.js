import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TonearmCalculatorView from '../views/TonearmCalculatorView.vue'
import ComplianceEstimatorView from '../views/ComplianceEstimatorView.vue'
import AlignmentCalculatorView from '../views/AlignmentCalculatorView.vue'
import DataExplorerView from '../views/DataExplorerView.vue'
import ReportView from '../views/ReportView.vue' // Importera rapportvyn

const routes = [
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
    path: '/alignment-calculator',
    name: 'alignment-calculator',
    component: AlignmentCalculatorView,
    meta: { title: 'Alignment Calculator' }
  },
  {
    path: '/data-explorer',
    name: 'data-explorer',
    component: DataExplorerView,
    meta: { title: 'Data Explorer' }
  },
  {
    // Denna route har ett meta-fält för att indikera att den inte ska använda standardlayouten.
    path: '/report',
    name: 'report',
    component: ReportView,
    meta: { isReportPage: true } 
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

export default router
