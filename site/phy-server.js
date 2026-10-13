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
      server.middlewares.use(phy.middlewares);
      const close = () => {
        phy.close();
      };
      server.httpServer?.on('close', close);
    },
  };
}
