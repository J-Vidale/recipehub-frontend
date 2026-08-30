// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Explicit rather than relying on the default: production builds must
    // never ship .map files, which would expose readable source.
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split the rarely-changing vendor code out of the app bundle so a
        // deploy that only touches app code doesn't invalidate the cached
        // React/router chunk for returning visitors.
        //
        // Matched by module path rather than by package name: React is
        // pulled in through `react/jsx-runtime` by the automatic JSX
        // transform, which a bare `['react']` entry does not capture (it
        // produces an empty chunk instead).
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router')) return 'router-vendor';
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
