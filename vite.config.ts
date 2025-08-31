import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    hmr: {
      overlay: false
    },
    // Optimizaciones del servidor de desarrollo
    cors: true,
    strictPort: false
  },
  build: {
    // Optimizaciones de build
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          auth: ['@auth0/auth0-react'],
          ai: ['@google/genai'],
          audio: ['abcjs'],
          markdown: ['marked']
        }
      }
    },
    // Mejorar la performance de build
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    // Pre-bundling de dependencias críticas
    include: [
      'react', 
      'react-dom', 
      '@auth0/auth0-react', 
      '@google/genai', 
      'abcjs', 
      'marked'
    ],
    // Excluir dependencias que causan problemas
    exclude: []
  },
  // Resolver aliases para imports más rápidos
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  // CSS optimizations
  css: {
    devSourcemap: false,
  }
})
