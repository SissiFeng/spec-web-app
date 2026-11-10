import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// API_TARGET lets the dev server proxy to a backend on another port
const api = process.env.API_TARGET || 'http://localhost:3001'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': api,
      '/ws': {
        target: api.replace(/^http/, 'ws'),
        ws: true,
      },
    },
  },
})
