import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your backend URL
        changeOrigin: true,
        secure: false, // For dev (if using HTTPS in prod, set to true)
        ws: true, // If using WebSockets (e.g., Socket.IO)
      },
    },
  },
});