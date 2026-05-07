import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split heavy deps into their own chunks so the vendor bundle can be
        // cached across deploys — only the app chunk re-downloads on update.
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          socket: ['socket.io-client'],
          axios: ['axios'],
        },
      },
    },
  },
  server: {
    watch: {
      usePolling: true
    }
  }
})
