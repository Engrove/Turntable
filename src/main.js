import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue'
import piniaPluginPersistedState from 'pinia-plugin-persistedstate' // Importera pluginet

import App from './App.vue'
import router from './router'

const app = createApp(App)
const head = createHead()
const pinia = createPinia()

// Använd pluginet
pinia.use(piniaPluginPersistedState)

app.use(pinia) // Använd den konfigurerade Pinia-instansen
app.use(router)
app.use(head)

app.mount('#app')
