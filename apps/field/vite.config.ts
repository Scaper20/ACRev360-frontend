import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Same local-backend proxy setup as apps/portal/vite.config.ts — see that
// file's comment for why a proxy exists at all (the live Render deployment's
// CORS_ALLOWED_ORIGINS doesn't list any frontend origin yet).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
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
