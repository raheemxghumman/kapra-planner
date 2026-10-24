/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Each release puts its files in its own folder (assets/<release>/...). A CDN in front of the
 * site (Cloudflare on Alternate Clouds) can then never serve a stale file, or a 404 it cached
 * while a deployment was starting, to the next release.
 */
const release = (process.env.RELEASE ?? 'dev').slice(0, 12);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    assetsDir: `assets/${release}`,
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
