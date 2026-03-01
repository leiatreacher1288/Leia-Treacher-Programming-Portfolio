// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  esbuild: {
    target: 'esnext',
  },
  server: {
    host: true, // so Docker (or your LAN) can reach it
    port: 5173, // your existing dev port
    proxy: {
      // whenever your code does axiosInstance.post('/auth/token/', …),
      // Vite will forward it to Django on localhost:8000
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // If your Django URLs already start with /api/, leave it as-is.
        // If not, you can strip the /api prefix:
        // rewrite: path => path.replace(/^\/api/, '')
      },
    },
  },
  // Ensure Vite handles base URL correctly when behind proxy
  base: '/',
});
