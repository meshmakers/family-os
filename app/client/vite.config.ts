import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Dev-mode stand-in for the app server's /api proxy: forward to the
    // port-forwarded Mesh Adapter (kubectl port-forward ... 5020:80).
    proxy: {
      '/api': {
        target: 'http://localhost:5020',
        changeOrigin: true,
        rewrite: path => '/familyos' + path.replace(/^\/api/, ''),
      },
    },
  },
})
