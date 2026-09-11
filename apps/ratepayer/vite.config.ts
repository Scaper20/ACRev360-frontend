import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Same local-backend proxy setup as apps/portal and apps/field — see
// apps/portal/vite.config.ts's comment for why a proxy exists at all.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
