import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5182,
    strictPort: true,
    open: false,
  },
  build: {
    target: 'esnext',
  },
});
