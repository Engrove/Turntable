// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Markdown from 'vite-plugin-markdown' // Importen är korrekt

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // KORRIGERING: Ta bort parenteserna. Pluginet är ett objekt, inte en funktion.
    Markdown.plugin() 
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
