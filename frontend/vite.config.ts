import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_URL || `http://localhost:${process.env.BACKEND_PORT || env.BACKEND_PORT || env.PORT || 3000}`

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Le backend expose ses routes sous /api ; le proxy conserve ce préfixe.
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
