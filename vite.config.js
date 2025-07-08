import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url' // <-- Importera moderna verktyg

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Använd den robusta metoden för att peka på src-mappen
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
