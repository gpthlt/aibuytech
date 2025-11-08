import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Expose to network
    proxy: {
      '/api': {
        target: 'http://api.aibuytech.store',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    host: true, // Important for Railway
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
