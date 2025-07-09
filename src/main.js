import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './assets/main.css'

// Skapa en app-instans
const app = createApp(App)

// Installera Pinia för state management.
// Detta måste ske INNAN vi använder några stores.
app.use(createPinia())

// Installera Vue Router.
// Detta måste ske INNAN vi monterar appen.
app.use(router)

// Montera appen till DOM-elementet med id="app".
// Detta är det absolut sista steget.
app.mount('#app')
