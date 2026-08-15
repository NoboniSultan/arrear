import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxies /api to the Express server so the client can use plain relative
// fetch('/api/...') calls with no CORS setup needed in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
