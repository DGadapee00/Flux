#!/usr/bin/env node
/**
 * Runs the browser checks against a server this script owns.
 *
 * smoke.mjs and verify*.mjs each expect http://localhost:5175 to already be serving, which meant
 * they only ran if you remembered to start one — so a failing assertion in verify.mjs sat
 * unnoticed. This builds, serves `dist/`, runs them all, and shuts the server down again.
 *
 *   node scripts/browser-checks.mjs [name ...]     (default: smoke, verify)
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import path from 'node:path';

/*
 * Run vite through Node against its own entry script rather than through `npx`. On Windows npx is
 * npx.cmd, and spawn() without a shell will not resolve a .cmd — the script died with
 * `spawn npx ENOENT` there while working on Linux. Resolving the package means no shell, no PATH
 * lookup, and no quoting rules that differ between platforms.
 */
const VITE = path.join(
  path.dirname(createRequire(import.meta.url).resolve('vite/package.json')),
  'bin',
  'vite.js',
);

const PORT = 5175;
const wanted = process.argv.slice(2);
const checks = (wanted.length ? wanted : ['smoke', 'verify']).map((n) =>
  n.endsWith('.mjs') ? n : `scripts/${n}.mjs`,
);

const run = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) => {
    const c = spawn(cmd, args, { stdio: 'inherit', ...opts });
    c.on('error', reject);
    c.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`))));
  });

const reachable = async () => {
  try {
    const r = await fetch(`http://localhost:${PORT}/`);
    return r.ok;
  } catch {
    return false;
  }
};

await run(process.execPath, [VITE, 'build']);

const server = spawn(process.execPath, [VITE, 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
server.stdout.resume();

let up = false;
for (let i = 0; i < 60 && !up; i++) {
  up = await reachable();
  if (!up) await new Promise((r) => setTimeout(r, 250));
}
if (!up) {
  server.kill();
  console.error(`browser-checks: nothing serving on ${PORT}`);
  process.exit(1);
}

let failed = 0;
for (const script of checks) {
  console.log(`\n--- ${script} ---`);
  try {
    await run(process.execPath, [script]);
  } catch (e) {
    failed += 1;
    console.error(String(e.message));
  }
}

// Wait for the server to actually go, but never hang on it: if it has already exited, `once` would
// never resolve, which is what left this script warning about an unsettled top-level await.
server.kill();
if (server.exitCode === null && server.signalCode === null) {
  await Promise.race([once(server, 'exit'), new Promise((r) => setTimeout(r, 3000))]).catch(() => {});
}
if (failed) {
  console.error(`\nbrowser-checks: ${failed} failed`);
  process.exit(1);
}
console.log('\nbrowser-checks: all passed');
