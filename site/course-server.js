/**
 * Serves each imported course at /<id>/ from the hub's dev server.
 * A course's own `npm run dev` stays on its port for smoke and gallery.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { COURSE_IDS } from './courses.js';

const siteDir = path.dirname(fileURLToPath(import.meta.url));

export function courseDevServer() {
  return {
    name: 'course-dev',
    async configureServer(server) {
      const courses = await Promise.all(COURSE_IDS.map((id) => courseMiddleware(id)));
      server.middlewares.use((req, res, next) => {
        const pathOnly = (req.url || '').split('?')[0];
        for (const course of courses) {
          if (pathOnly === `/${course.id}` || pathOnly.startsWith(`/${course.id}/`)) {
            course.vite.middlewares(req, res, next);
            return;
          }
        }
        next();
      });
      const close = () => {
        for (const course of courses) course.vite.close();
      };
      server.httpServer?.on('close', close);
    },
  };
}

/**
 * @param {string} id
 */
async function courseMiddleware(id) {
  const root = path.resolve(siteDir, `../courses/${id}`);
  const vite = await createServer({
    root,
    configFile: path.join(root, 'vite.config.js'),
    base: `/${id}/`,
    appType: 'spa',
    server: {
      middlewareMode: true,
      hmr: false,
    },
  });
  return { id, vite };
}
