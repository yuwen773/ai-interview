import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  assetsInclude: ['**/*.glb'],
  resolve: {
    dedupe: ['three'],
  },
  optimizeDeps: {
    include: ['@dimforge/rapier3d-compat'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei', 'meshline'],
          'syntax-highlighter': ['react-syntax-highlighter'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // http-proxy 选项：确保二进制响应完整转发
        timeout: 30000,
      },
    },
  },
});
