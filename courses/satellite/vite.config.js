import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const page = (name) => fileURLToPath(new URL(`./${name}`, import.meta.url));

export default defineConfig({
  base: './',
  server: {
    port: 5191,
    strictPort: true,
    open: false,
  },
  build: {
    target: 'esnext',
    // Two pages: the labs (index.html) and the project guide (guide.html).
    rollupOptions: {
      input: { main: page('index.html'), guide: page('guide.html') },
    },
  },
});
