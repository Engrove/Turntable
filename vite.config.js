import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// KORREKT IMPORT: Importera den namngivna exporten 'plugin' och döp om den till 'markdown'.
import { plugin as markdown } from 'vite-plugin-markdown'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Använd den nu korrekt importerade funktionen för att konfigurera Markdown-hantering.
    markdown({
      mode: ['html'] 
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
