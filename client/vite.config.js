import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      // Proxy API requests during local dev to your Express server
      '/api': 'http://localhost:3000',
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate React libs
          react: ['react', 'react-dom'],

          // Example: if you’re using Chart.js
          chart: ['chart.js'],

          // Add more here if you include other heavy libs (e.g. lodash, three.js, etc.)
        },
      },
    },
    // Raise warning limit (optional, doesn’t affect performance)
    chunkSizeWarningLimit: 1000,
  },
})
