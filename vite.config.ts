import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 明确绑定 0.0.0.0，同时支持 127.0.0.1、localhost 与局域网 IP
    port: 5173,
    open: true
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-cytoscape': ['cytoscape'],
          'vendor-layouts': ['cytoscape-dagre', 'cytoscape-cose-bilkent'],
          'vendor-math': ['katex', 'marked'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
});

