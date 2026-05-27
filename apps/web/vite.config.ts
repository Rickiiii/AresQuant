import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/dashboard': 'http://localhost:3000',
      '/strategies': 'http://localhost:3000',
      '/data': 'http://localhost:3000',
      '/backtests': 'http://localhost:3000',
      '/research': 'http://localhost:3000',
      '/portfolio': 'http://localhost:3000',
    },
  },
});
