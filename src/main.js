// src/main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createHead } from '@unhead/vue'; // NYTT (4a)
import App from './App.vue';
import router from './router';
import { useExplorerStore } from './store/explorerStore';

import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();
const head = createHead(); // NYTT (4a)

app.use(pinia);
app.use(head); // NYTT (4a)
app.use(router);

const explorerStore = useExplorerStore();
explorerStore.initialize();

app.mount('#app');
