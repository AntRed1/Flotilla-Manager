import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-query':  ['@tanstack/react-query'],
          'vendor-ui':     ['@radix-ui/react-select', '@radix-ui/react-dialog', '@radix-ui/react-label'],
          'vendor-charts': ['recharts'],
          'vendor-misc':   ['date-fns', 'sonner', 'lucide-react'],
        },
      },
    },
  },
})