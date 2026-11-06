import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_BACKEND_ORIGIN || 'http://127.0.0.1:8000'
  return {
    plugins: [vue()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)), '@lib': fileURLToPath(new URL('./node_modules/@itpmining/vue-basic-components/dist/public', import.meta.url)) } },
    base: env.VITE_BASE_PATH || '/',
    build: { assetsDir: 'toir-static' },
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
