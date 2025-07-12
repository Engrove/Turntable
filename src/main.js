// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useExplorerStore } from './store/explorerStore' // Importera storen

import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// NYTT (1e): Hämta data när appen startar
const explorerStore = useExplorerStore()
explorerStore.initialize()

app.mount('#app')
