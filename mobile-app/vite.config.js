import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    // Fecha y hora exacta del momento en que corres `npm run build`
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __APP_VERSION__: JSON.stringify('1.0.0'),
  },
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