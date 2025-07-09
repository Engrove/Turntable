import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './assets/main.css'

// 1. Skapa Vue-applikationen
const app = createApp(App)

// 2. Installera Pinia (State Management).
//    Detta måste ske INNAN routern och INNAN appen monteras.
app.use(createPinia())

// 3. Installera Vue Router.
//    Detta gör routern tillgänglig globalt via `useRouter()`.
app.use(router)

// 4. Montera appen till HTML-sidan.
//    Detta är det absolut sista steget.
app.mount('#app')
