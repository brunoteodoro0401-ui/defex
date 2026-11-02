import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy de desenvolvimento: redireciona /api/* para o back-end em :3001
// Em produção os arquivos são compilados em ../backend/public e servidos
// pelo próprio Express — sem necessidade de proxy.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Firebase Hosting serve os arquivos de frontend/dist (configurado em firebase.json)
    outDir: 'dist',
    emptyOutDir: true,
  },
});

