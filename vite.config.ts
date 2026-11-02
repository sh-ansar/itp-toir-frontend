import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_BACKEND_ORIGIN || 'http://127.0.0.1:8000'
  return {
    plugins: [vue()],
    base: env.VITE_BASE_PATH || '/',
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/sanctum': { target: backend, changeOrigin: true }
      }
    }
  }
})
