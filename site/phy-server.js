/**
 * Serves the PHY app at /phy2049/ from the hub's dev server.
 * PHY's own `npm run dev` stays on port 5174 for its smoke and gallery scripts.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const siteDir = path.dirname(fileURLToPath(import.meta.url));

export function phyDevServer() {
  const phyRoot = path.resolve(siteDir, '../courses/phy2049');
  return {
    name: 'phy2049-dev',
    async configureServer(server) {
      const phy = await createServer({
        root: phyRoot,
        configFile: path.join(phyRoot, 'vite.config.js'),
        base: '/phy2049/',
        appType: 'spa',
        server: {
          middlewareMode: true,
          hmr: false,
        },
      });
      // PHY's dev middleware answers every URL, including the hub's `/`.
      // Only hand it the /phy2049 prefix. The base stays on the URL so Vite resolves assets there.
      server.middlewares.use((req, res, next) => {
        const pathOnly = (req.url || '').split('?')[0];
        if (pathOnly !== '/phy2049' && !pathOnly.startsWith('/phy2049/')) return next();
        phy.middlewares(req, res, next);
      });
      const close = () => {
        phy.close();
      };
      server.httpServer?.on('close', close);
    },
  };
}
