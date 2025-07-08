import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router' // <-- Importera vår nya router

import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router) // <-- Tala om för appen att använda routern

app.mount('#app')
