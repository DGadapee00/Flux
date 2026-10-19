#!/usr/bin/env node
/**
 * Download free/open-licensed textbooks for OCW courses whose own material is
 * thin (no problem sets / exams on OCW). Manifest: tools/ocw/textbooks.json.
 *
 *   node tools/ocw/fetch-textbooks.mjs [slug...] [--force]
 *
 * Downloads each book's PDF into the git-ignored reference/textbooks/<slug>/
 * directory. The PDFs are never committed — same rule as the OCW downloads.
 * The index files (docs/ocw/<slug>.md) list only the title, link, and license.
 */
import { execFile } from 'node:child_process';
import { mkdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = join(ROOT, 'reference', 'textbooks');

function sh(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts, (err, stdout, stderr) => {
      if (err) reject(new Error(`${cmd} ${args.join(' ')}: ${stderr || err.message}`));
      else resolve(stdout);
    });
  });
}

async function download(url, dest) {
  // Follow redirects; fail on HTTP errors; retry once on transient failure.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await sh('curl', ['-sSL', '--fail', '--max-time', '300', '-o', dest, url]);
      return;
    } catch (e) {
      if (attempt === 2) throw e;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = args.filter((a) => a !== '--force');
  const books = JSON.parse(await readFile(join(ROOT, 'tools', 'ocw', 'textbooks.json'), 'utf8'));
  let total = 0;
  let n = 0;
  for (const b of books) {
    if (only.length && !only.includes(b.slug)) continue;
    const dest = join(REF, b.slug);
    const pdf = join(dest, 'textbook.pdf');
    if (existsSync(pdf) && !force) {
      const mb = statSync(pdf).size / 1048576;
      console.log(`${b.slug}: already downloaded (${mb.toFixed(1)} MB), skipping (use --force)`);
      continue;
    }
    mkdirSync(dest, { recursive: true });
    console.log(`${b.slug}: ${b.title}`);
    console.log(`  ${b.pdf}`);
    await download(b.pdf, pdf);
    const mb = statSync(pdf).size / 1048576;
    // Sanity: must be a real PDF, not an HTML error page.
    const head = (await readFile(pdf)).subarray(0, 5).toString();
    if (!head.startsWith('%PDF')) throw new Error(`${b.slug}: download is not a PDF`);
    writeFileSync(
      join(dest, 'SOURCE.json'),
      JSON.stringify(
        { title: b.title, authors: b.authors, source: b.source, license: b.license, note: b.note },
        null,
        2
      ) + '\n'
    );
    console.log(`  kept textbook.pdf, ${mb.toFixed(1)} MB (${b.license})`);
    total += mb;
    n++;
  }
  console.log(`\ndone: ${n} textbooks, ${total.toFixed(1)} MB total (in reference/textbooks/, not committed)`);
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
