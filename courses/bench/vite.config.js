import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5196,
    strictPort: true,
    open: false,
  },
  build: {
    target: 'esnext',
  },
});
