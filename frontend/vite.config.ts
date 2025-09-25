import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@primevue') || id.includes('primeicons')) {
              return 'primevue-assets'
            }
            if (id.includes('primevue')) {
              return 'primevue'
            }
            if (id.includes('vue')) {
              return 'vue-core'
            }
            if (id.includes('pinia')) {
              return 'vue-core'
            }
            if (id.includes('@vueuse')) {
              return 'vueuse'
            }
            if (id.includes('axios')) {
              return 'axios'
            }
            if (id.includes('dompurify')) {
              return 'dompurify'
            }
            return 'vendor'
          }
          return undefined
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
})
