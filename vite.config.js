import { defineConfig } from 'vite';

// Vite is used for the dev server (HMR + fast reload).
// Production build is handled by `node scripts/build-prod.js` (custom terser bundler)
// because vanilla scripts use the override pattern (last declaration wins),
// which Rollup's strict mode rejects.
export default defineConfig({
  root: '.',
  base: './',
  publicDir: false,
  server: {
    port: 5173,
    open: true,
    fs: { strict: false }
  },
  // Build is delegated — see scripts/build-prod.js
  build: { outDir: 'dist' }
});
