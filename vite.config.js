import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import markdown from 'vite-plugin-markdown'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Konfigurerar pluginet att behandla Markdown-filer och exportera deras
    // innehåll som en 'html'-egenskap. Detta är nyckeln till att lösa byggfelet.
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
