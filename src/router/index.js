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
  ]
})

export default router
