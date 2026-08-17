import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Dev-only workaround for the live backend's CORS_ALLOWED_ORIGINS not
    // yet including this frontend's origin (see render.yaml — it's waiting
    // on a deployed Vercel URL). Proxying makes requests same-origin from
    // the browser's point of view, so no CORS involved. This does NOT fix
    // the real gap for the deployed site — Render's CORS_ALLOWED_ORIGINS
    // still needs the actual Vercel origin added once deployed.
    proxy: {
      '/api': {
        target: 'https://acrev360-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'https://acrev360-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
