// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Markdown from 'vite-plugin-markdown' // ÄNDRAD: Använder det nya pluginet

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Markdown() // ÄNDRAD: Använder det nya pluginet
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
