// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ✅ Vite HTTP config for avoiding CORS with backend
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,       
    https: false       
  }
});