/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The only chunk above 500 KB is three.js, which loads lazily on pages with 3D scenes.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // three.js is large; keeping it in its own file means pages without 3D load faster.
        manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : undefined),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
