import { defineConfig } from 'vite';

/** The practice-loop fixture: one page per shell, for test/practice-smoke.mjs. */
export default defineConfig({
  base: './',
  server: { port: 5190, strictPort: true, open: false },
  build: { target: 'esnext' },
});
