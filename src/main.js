import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/main.css' // Importerar vår nya CSS-fil

const app = createApp(App)

app.use(createPinia()) // Aktiverar Pinia
app.mount('#app')
