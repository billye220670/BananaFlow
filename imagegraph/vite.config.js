import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/banana-api': {
        target: 'https://api.wuyinkeji.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/banana-api/, ''),
      },
      '/upload-proxy': {
        target: 'https://tmpfiles.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/upload-proxy/, ''),
      },
    },
  },
})
