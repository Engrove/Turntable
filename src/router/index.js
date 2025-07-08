import { createRouter, createWebHistory } from 'vue-router'
import TonearmCalculatorView from '../views/TonearmCalculatorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'tonearm-calculator',
      component: TonearmCalculatorView,
      // Vi kan lägga till meta-data för menyn
      meta: { title: 'Tonearm Calculator', icon: 'fas fa-ruler-combined' } 
    },
    // Här kommer vi att lägga till framtida verktyg
    // {
    //   path: '/vibration-isolator',
    //   name: 'vibration-isolator',
    //   component: () => import('../views/VibrationIsolatorView.vue'),
    //   meta: { title: 'Vibration Isolator', icon: 'fas fa-wave-square' }
    // }
  ]
})

export default router
