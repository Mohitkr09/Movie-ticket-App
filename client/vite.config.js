import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      // Proxy API requests during local dev to your Express backend
      '/api': 'http://localhost:3000',
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React into its own chunk for better caching
          react: ['react', 'react-dom'],
        },
      },
    },
    // Increase warning threshold (optional)
    chunkSizeWarningLimit: 1000,
  },
})


