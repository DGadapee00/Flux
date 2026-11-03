#!/usr/bin/env node
/**
 * `npm run map-sources`: opens every source on the map and prints its HTTP status and page title,
 * so a person can confirm each link is what its concept says. Sources with a `checked` date are
 * skipped unless --all is given. Uses curl, which follows the environment's proxy settings.
 *
 * After reading the output, set `checked: 'YYYY-MM-DD'` on each source you confirmed.
 * It exits 1 when any source fails to load.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { loadConcepts } from './load.mjs';

const run = promisify(execFile);
const all = process.argv.includes('--all');

async function open(url) {
  try {
    const { stdout } = await run('curl', ['-sSL', '-A', 'Mozilla/5.0 (Flux map sources)', '--max-time', '30', '-w', '\n%{http_code}', url], {
      maxBuffer: 32 * 1024 * 1024,
    });
    const code = stdout.slice(stdout.lastIndexOf('\n') + 1);
    const title = (stdout.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim();
    return { ok: code.startsWith('2'), code, title };
  } catch (err) {
    return { ok: false, code: 'ERR', title: String(err.stderr || err.message).trim().split('\n')[0] };
  }
}

const rows = (await loadConcepts()).flatMap(({ concept }) =>
  concept.sources.filter((s) => all || !s.checked).map((s) => ({ id: concept.id, s })),
);
let failed = 0;
for (let i = 0; i < rows.length; i += 6) {
  const batch = rows.slice(i, i + 6);
  const results = await Promise.all(batch.map((r) => open(r.s.url)));
  batch.forEach((r, j) => {
    const res = results[j];
    if (!res.ok) failed += 1;
    console.log(`${res.ok ? 'ok ' : 'BAD'} ${res.code} ${r.id}: ${r.s.title}\n    ${r.s.url}\n    page: ${res.title}`);
  });
}
console.log(`\n${rows.length - failed} of ${rows.length} sources loaded.`);
process.exit(failed ? 1 : 0);
