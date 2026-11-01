/** Build both routes and serve their production files on one origin, as the hub does. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const course = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vite = path.join(
  path.dirname(createRequire(import.meta.url).resolve('vite/package.json')),
  'bin/vite.js',
);
const run = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(Error(`${args.join(' ')} exited ${code}`))));
  });
for (const cwd of [course, path.resolve(course, '../mac2312')])
  await run(process.execPath, [vite, 'build'], { cwd });
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const [id, ...parts] = decodeURIComponent(url.pathname).split('/').filter(Boolean);
  if (!['mac2311', 'mac2312'].includes(id)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const root = path.resolve(course, '..', id, 'dist');
  const file = path.resolve(root, parts.join('/') || 'index.html');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
try {
  for (const name of process.argv.slice(2).length ? process.argv.slice(2) : ['smoke', 'verify'])
    await run(process.execPath, [`scripts/${name.replace(/\.mjs$/, '')}.mjs`], {
      cwd: course,
      env: { ...process.env, SMOKE_URL: `${origin}/mac2311/`, LEGACY_URL: `${origin}/mac2312/` },
    });
} finally {
  await new Promise((resolve) => server.close(resolve));
}
