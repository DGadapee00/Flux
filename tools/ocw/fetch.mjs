#!/usr/bin/env node
/**
 * tools/ocw/fetch.mjs
 *
 * Downloads MIT OpenCourseWare course packages into reference/ocw/<slug>/.
 *
 * Two rules govern this script (D15):
 *  1. Downloaded OCW files are NEVER committed. reference/ is git-ignored and
 *     skipped by packages/checks/raw.mjs. This script only writes there.
 *  2. The committed outputs of the OCW task are this script, tools/ocw/courses.json,
 *     and docs/ocw/<slug>.md indexes (titles and links only, no OCW text).
 *
 * Usage: node tools/ocw/fetch.mjs [slug ...] [--force]
 *   no slugs -> every course in courses.json
 *   --force  -> re-download even when reference/ocw/<slug>/FILES.json exists
 *
 * Plain Node 22. No npm dependencies (uses the system curl and unzip binaries).
 */
import { execFile } from 'node:child_process';
import { existsSync, promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const REF = join(ROOT, 'reference', 'ocw');
const COURSES = JSON.parse(await fs.readFile(join(HERE, 'courses.json'), 'utf8'));

const MAX_BYTES = 50 * 1024 * 1024;
const MEDIA_EXT = new Set(['.mp4', '.m4v', '.mov', '.mp3', '.srt', '.vtt']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function curlText(url) {
  const { stdout } = await execFileAsync('curl', ['-sSL', '--max-time', '60', '--retry', '2', url]);
  return stdout;
}

async function curlToFile(url, outPath) {
  await execFileAsync('curl', ['-sSL', '--max-time', '300', '--retry', '2', '-o', outPath, url]);
  const st = await fs.stat(outPath);
  if (st.size === 0) throw new Error('empty download');
}

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

/**
 * Classify from OCW's own resource titles and folder names.
 * "other" when unsure; a file is only a solution when OCW's own
 * filename says so (never guessed).
 *
 * Scholar (SC) courses use a compact convention inside MIT<course><term>_ names:
 *   ps<N>_s<M>q / new_s<M>q -> problem-set questions,
 *   ps<N>_s<M>s / new_s<M>s -> problem-set solutions,
 *   *quizq / *quizc -> exam questions / self-check, *quiza -> exam answers,
 *   ex<N>[s], prex<N>, *final[q|s] -> exam / exam-solution,
 *   *_sol -> solutions, *_text / *_intro -> session notes.
 */
function classify(relPath) {
  const s = relPath.toLowerCase();
  const base = basename(s);
  if (/quizq\.pdf$/.test(base)) return 'exam';
  if (/quiza\.pdf$/.test(base)) return 'exam-solution';
  if (/quizc\.pdf$/.test(base)) return 'exam';
  if (/finals\.pdf$/.test(base)) return 'exam-solution';
  if (/final\.pdf$/.test(base)) return 'exam';
  if (/ex\d+s\.pdf$/.test(base)) return 'exam-solution';
  if (/ex\d+\.pdf$/.test(base)) return 'exam';
  if (/prex\d*\.pdf$/.test(base)) return 'exam';
  if (/_sol\.pdf$/.test(base)) return 'solution';
  if (/text\.pdf$/.test(base)) return 'lecture-notes';
  if (/intro\.pdf$/.test(base)) return 'lecture-notes';
  if (/q\.pdf$/.test(base) && (/(^|[_-])ps\d/.test(base) || /_s\d/.test(base))) return 'problem-set';
  if (/s\.pdf$/.test(base) && (/(^|[_-])ps\d/.test(base) || /_s\d/.test(base))) return 'solution';
  const exam = /\bexams?\b|midterm|\bfinal\b|\bfinals\b|\bquiz\b|\bquizzes\b/.test(s);
  const sol = /\bsolutions?\b|[_-]sols?\b|\bsols?[_-]/i.test(s);
  const pset = /problem.?sets?|\bpsets?\b|assignments?|homework/.test(s);
  const lecture = /\blectures?\b|\bnotes?\b|\bsessions?\b|\bchapters?\b|\brecitations?\b/.test(s);
  const reading = /\breadings?\b/.test(s);
  if (exam && sol) return 'exam-solution';
  if (exam) return 'exam';
  if (sol) return 'solution';
  if (pset) return 'problem-set';
  if (lecture) return 'lecture-notes';
  if (reading) return 'reading';
  return 'other';
}

function findZipUrl(downloadHtml, pageUrl) {
  const re = /href="([^"]*?\.zip)"/gi;
  let m;
  while ((m = re.exec(downloadHtml))) {
    try {
      const u = new URL(m[1], pageUrl).toString();
      if (u.startsWith('https://ocw.mit.edu/')) return u;
    } catch { /* ignore */ }
  }
  return null;
}

function collectPdfs(html, base, into) {
  const re = /href="([^"]*?\.pdf)"/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const u = new URL(m[1], base).toString().split('#')[0];
      if (u.startsWith('https://ocw.mit.edu/')) into.add(u);
    } catch { /* ignore */ }
  }
}

/** Map kept-file basenames to OCW's own learning_resource_types, read from
 *  resources/<name>/data.json inside a downloaded course package.
 *  Returns Map<basename, string[]> (empty when the course has no such metadata). */
async function buildMetaMap(dest) {
  const map = new Map();
  let dirs;
  try {
    dirs = await fs.readdir(join(dest, 'resources'), { withFileTypes: true });
  } catch {
    return map;
  }
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const metaPath = join(dest, 'resources', d.name, 'data.json');
    let meta;
    try {
      meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
    } catch {
      continue;
    }
    const fileField = meta.file;
    const types = meta.learning_resource_types;
    if (typeof fileField === 'string' && Array.isArray(types) && types.length) {
      map.set(basename(fileField), types);
    }
  }
  return map;
}

/** Kind from OCW's learning_resource_types. Null when the types say nothing
 *  we map (caller falls back to filename rules). */
function kindFromTypes(types) {
  if (types.includes('Problem Set Solutions')) return 'solution';
  if (types.includes('Exam Solutions')) return 'exam-solution';
  if (types.includes('Problem Sets')) return 'problem-set';
  if (types.includes('Exams')) return 'exam';
  if (types.includes('Lecture Notes')) return 'lecture-notes';
  if (types.includes('Problem-solving Notes')) return 'lecture-notes';
  if (types.includes('Readings')) return 'reading';
  if (types.includes('Activity Assignments')) return 'problem-set';
  if (types.includes('Activity Assignments with Examples')) return 'problem-set';
  if (types.includes('Open Textbooks')) return 'reading';
  return null;
}
/** Fallback when the /download/ zip is missing: crawl the course's resource
 *  pages and download the PDFs they link, one at a time, 1s apart. */
async function fallbackPdfs(course, dest) {
  const courseUrl = course.url.endsWith('/') ? course.url : course.url + '/';
  const coursePath = new URL(courseUrl).pathname;
  const rootHtml = await curlText(courseUrl);
  const pdfs = new Set();
  collectPdfs(rootHtml, courseUrl, pdfs);
  const pages = new Set();
  const hrefRe = /href="([^"]+)"/gi;
  let m;
  while ((m = hrefRe.exec(rootHtml))) {
    try {
      const u = new URL(m[1], courseUrl).toString().split('#')[0];
      const p = new URL(u).pathname;
      if (u.startsWith('https://ocw.mit.edu/courses/') && p.startsWith(coursePath) && p !== coursePath) {
        pages.add(u);
      }
    } catch { /* ignore */ }
  }
  console.log(`  scanning ${pages.size} resource pages for PDFs...`);
  let n = 0;
  for (const page of [...pages].slice(0, 80)) {
    try {
      collectPdfs(await curlText(page), page, pdfs);
    } catch { /* skip unreadable pages */ }
    n++;
    if (n % 20 === 0) console.log(`    ...${n} pages scanned`);
    await sleep(1000);
  }
  console.log(`  found ${pdfs.size} PDFs; downloading one at a time`);
  let i = 0;
  for (const pdf of pdfs) {
    const name = basename(new URL(pdf).pathname) || `file-${i}.pdf`;
    const out = join(dest, 'pdfs', name);
    await fs.mkdir(dirname(out), { recursive: true });
    try {
      await curlToFile(pdf, out);
      i++;
    } catch (e) {
      console.log(`    skip ${pdf}: ${e.message}`);
    }
    await sleep(1000);
  }
}

async function fetchCourse(course, force) {
  const dest = join(REF, course.slug);
  const manifestPath = join(dest, 'FILES.json');
  if (!force && existsSync(manifestPath)) {
    console.log(`${course.slug}: already downloaded, skipping (use --force)`);
    return null;
  }
  if (force && existsSync(dest)) {
    await fs.rm(dest, { recursive: true, force: true });
  }
  await fs.mkdir(dest, { recursive: true });
  console.log(`${course.slug}: ${course.title} (${course.term})`);

  let viaZip = false;
  try {
    const dlHtml = await curlText(course.url.replace(/\/?$/, '/') + 'download/');
    const zipUrl = findZipUrl(dlHtml, course.url);
    if (zipUrl) {
      console.log(`  zip: ${zipUrl}`);
      const tmp = join(tmpdir(), `ocw-${course.slug}.zip`);
      await curlToFile(zipUrl, tmp);
      const fh = await fs.open(tmp, 'r');
      const { buffer } = await fh.read({ buffer: Buffer.alloc(2), length: 2 });
      await fh.close();
      if (buffer.toString('binary') !== 'PK') throw new Error('download is not a zip file');
      await execFileAsync('unzip', ['-q', '-o', tmp, '-d', dest]);
      await fs.unlink(tmp).catch(() => {});
      viaZip = true;
    } else {
      console.log('  no zip link on the download page');
    }
  } catch (e) {
    console.log(`  zip path failed: ${e.message}`);
  }
  if (!viaZip) {
    console.log('  falling back to resource pages');
    await fallbackPdfs(course, dest);
  }

  // Delete video/audio and anything over 50 MB. We need PDFs and HTML.
  let deleted = 0;
  for (const f of await walk(dest)) {
    const st = await fs.stat(f);
    if (MEDIA_EXT.has(extname(f).toLowerCase()) || st.size > MAX_BYTES) {
      await fs.unlink(f);
      deleted++;
    }
  }

  const kept = await walk(dest);
  const metaMap = await buildMetaMap(dest);
  if (metaMap.size) console.log(`  resource metadata: ${metaMap.size} files typed by OCW`);
  const entries = [];
  for (const f of kept) {
    const rel = relative(dest, f);
    if (rel === 'FILES.json') continue;
    const st = await fs.stat(f);
    const fromMeta = kindFromTypes(metaMap.get(basename(f)) || []);
    entries.push({ path: rel, size: st.size, kind: fromMeta || classify(rel) });
  }
  entries.sort((a, b) => (a.path < b.path ? -1 : 1));
  await fs.writeFile(manifestPath, JSON.stringify(entries, null, 1) + '\n');

  const bytes = entries.reduce((a, e) => a + e.size, 0);
  const counts = {};
  for (const e of entries) counts[e.kind] = (counts[e.kind] || 0) + 1;
  const byKind = Object.entries(counts)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
  console.log(
    `  kept ${entries.length} files, ${(bytes / 1048576).toFixed(1)} MB, deleted ${deleted}: ${byKind}`
  );
  return { slug: course.slug, files: entries.length, mb: bytes / 1048576, counts };
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const slugs = args.filter((a) => a !== '--force');
const unknown = slugs.filter((s) => !COURSES.some((c) => c.slug === s));
if (unknown.length) {
  console.error(`unknown course slug(s): ${unknown.join(', ')}`);
  console.error(`known: ${COURSES.map((c) => c.slug).join(', ')}`);
  process.exit(1);
}
const picked = slugs.length ? COURSES.filter((c) => slugs.includes(c.slug)) : COURSES;

const results = [];
for (const course of picked) {
  try {
    const r = await fetchCourse(course, force);
    if (r) results.push(r);
  } catch (e) {
    console.error(`${course.slug}: FAILED: ${e.message}`);
  }
}
const totalMb = results.reduce((a, r) => a + r.mb, 0);
console.log(`\ndone: ${results.length}/${picked.length} courses, ${totalMb.toFixed(1)} MB total`);
