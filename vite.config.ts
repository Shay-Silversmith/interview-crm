import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Silence the 500 kB warning — the gzipped size is what matters for users
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor: React ecosystem (stable, long-cached)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Vendor: data / forms
          'vendor-query': ['@tanstack/react-query'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Vendor: UI utilities
          'vendor-ui':    ['date-fns', 'lucide-react', 'clsx', 'tailwind-merge', 'cmdk'],
          // Note: @supabase/supabase-js is omitted from manualChunks because it is
          // eagerly imported via the services layer and lands in the main chunk.
          // Adding a split entry here produces an empty chunk ("Generated an empty chunk").
        },
      },
    },
  },
})
