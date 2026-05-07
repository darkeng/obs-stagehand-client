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
        // Function form: split node_modules into named chunks so the vendor
        // bundle gets cached across deploys — only the app chunk re-downloads.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('vue-router') || id.includes('/vue/') || id.includes('pinia')) {
            return 'vendor'
          }
          if (id.includes('socket.io-client')) return 'socket'
          if (id.includes('axios')) return 'axios'
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
