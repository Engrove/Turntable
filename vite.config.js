import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // <-- Lägg till denna import för att hantera sökvägar

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Lägg till denna sektion för att definiera sökvägs-alias
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
})
