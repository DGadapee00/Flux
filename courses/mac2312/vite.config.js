import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

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

export default defineConfig({
  base: './',
  define: {
    __BUILD__: JSON.stringify(info),
  },
  plugins: [
    {
      name: 'version-stamp',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(info, null, 2) + '\n' });
      },
    },
  ],
  server: {
    port: 5179,
    strictPort: true,
    open: false,
  },
  build: {
    target: 'esnext',
  },
});
