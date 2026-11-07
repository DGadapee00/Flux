import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import { courseDevServer } from './course-server.js';

/**
 * Which commit a build came from. Publishing is a manual upload, so the stamp
 * is what says whether the live hub matches this checkout.
 */
function buildInfo() {
  const git = (cmd, fallback) => {
    try {
      return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
      return fallback;
    }
  };
  const commit = git('git rev-parse --short HEAD', 'unknown');
  const dirty = git('git status --porcelain', '') !== '';
  return {
    commit: dirty ? `${commit}+local` : commit,
    subject: git('git log -1 --pretty=%s', ''),
    committed: git('git log -1 --pretty=%cI', ''),
    built: new Date().toISOString(),
  };
}

const info = buildInfo();

/**
 * `virtual:flux-problems`: which practice problems belong to which lab (map/problems.mjs). The
 * banks run code and are large, so the hub ships this index instead of importing them.
 */
function problemIndex() {
  const id = 'virtual:flux-problems';
  return {
    name: 'flux-problems',
    resolveId(source) {
      return source === id ? `\0${id}` : null;
    },
    async load(source) {
      if (source !== `\0${id}`) return null;
      const { problemIndex: build } = await import(new URL('../map/problems.mjs', import.meta.url).href);
      const { byLab, titles } = await build();
      return `export default ${JSON.stringify({ byLab, titles })};`;
    },
  };
}

export default defineConfig({
  base: './',
  define: {
    __BUILD__: JSON.stringify(info),
  },
  plugins: [
    courseDevServer(),
    problemIndex(),
    {
      name: 'version-stamp',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: `${JSON.stringify(info, null, 2)}\n`,
        });
      },
    },
  ],
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
  build: {
    target: 'esnext',
  },
});
