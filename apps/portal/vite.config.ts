import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Points at the local Docker Compose backend (C:\Users\Star2knb\Documents\
    // ACRev360-backend — `docker compose up -d`, seeded via `seed_kuje`) so
    // testing doesn't touch the live, non-reseedable Render deployment. To
    // point back at live: target: 'https://acrev360-backend.onrender.com'
    // (that one's CORS_ALLOWED_ORIGINS still doesn't list any frontend
    // origin, which is the reason this proxy pattern exists in the first
    // place — proxying keeps requests same-origin from the browser's point
    // of view either way).
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
