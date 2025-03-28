import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: true,
    emptyOutDir: true
  },
  server: {
    port: 3000,
    strictPort: true,
    open: true,
    host: true,
    hmr: {
      protocol: 'wss',
      host: 'secretplace.su',
      clientPort: 443
    },
    allowedHosts: ['secretplace.su'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
}); 