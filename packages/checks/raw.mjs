/**
 * Rule 9: raw course files (PDF, slides, Word, Canvas exports) never ship.
 *
 * In the repo they may live only in a course's own `courses/<id>/incoming/` folder, where the
 * weekly Canvas ingest puts them for the notes run to read (PHY 2049's instructor has allowed
 * this; see courses/phy2049/PROVENANCE.md). Anywhere else under courses/ a raw file fails.
 *
 * In the built site (`site/dist`) nothing raw and nothing from an incoming folder may appear.
 *
 *   node packages/checks/raw.mjs          repo scan (runs before the build and in npm test)
 *   node packages/checks/raw.mjs --dist   built-site scan (runs after the build)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECKS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(CHECKS_DIR, '../..');

const RAW_EXT = new Set(['.pdf', '.pptx', '.ppt', '.docx', '.doc']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'reference', '.git']);

/** `courses/<id>/incoming/...`: the one place raw course files may sit in the repo. */
export function inCourseIncoming(rel) {
  const parts = rel.split('/');
  return parts.length >= 4 && parts[0] === 'courses' && parts[2] === 'incoming';
}

/**
 * Why a repo path breaks rule 9, or null.
 * @param {string} rel Path relative to the repo root, using `/`.
 * @returns {string|null}
 */
export function rawReason(rel) {
  if (inCourseIncoming(rel)) return null;
  const parts = rel.split('/');
  if (parts.some((part) => part.toLowerCase() === 'incoming')) return 'incoming folder outside courses/<id>/incoming';
  const ext = path.posix.extname(rel).toLowerCase();
  if (RAW_EXT.has(ext)) return `${ext} outside courses/<id>/incoming`;
  return null;
}

/**
 * Why a path in the built site breaks rule 9, or null. Nothing raw ships, from anywhere.
 * @param {string} rel Path relative to the dist root, using `/`.
 * @returns {string|null}
 */
export function distReason(rel) {
  const parts = rel.split('/');
  if (parts.some((part) => part.toLowerCase() === 'incoming')) return 'incoming folder in the built site';
  const ext = path.posix.extname(rel).toLowerCase();
  if (RAW_EXT.has(ext)) return `${ext} in the built site`;
  return null;
}

/**
 * @param {string} root
 * @returns {{ file: string, message: string }[]}
 */
export function scan(root = ROOT) {
  const violations = [];
  walk(path.join(root, 'courses'), SKIP_DIRS, (file) => {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const reason = rawReason(rel);
    if (reason) violations.push({ file: rel, message: reason });
  });
  return violations;
}

/**
 * @param {string} distDir
 * @returns {{ file: string, message: string }[]}
 */
export function scanDist(distDir = path.join(ROOT, 'site/dist')) {
  const violations = [];
  walk(distDir, new Set(), (file) => {
    const rel = path.relative(distDir, file).split(path.sep).join('/');
    const reason = distReason(rel);
    if (reason) violations.push({ file: `site/dist/${rel}`, message: reason });
  });
  return violations;
}

/**
 * @param {string} dir
 * @param {Set<string>} skip
 * @param {(file: string) => void} visit
 */
function walk(dir, skip, visit) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (skip.has(ent.name)) continue;
      walk(path.join(dir, ent.name), skip, visit);
    } else if (ent.isFile()) {
      visit(path.join(dir, ent.name));
    }
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const dist = process.argv.includes('--dist');
  if (dist && !fs.existsSync(path.join(ROOT, 'site/dist'))) {
    console.error('site/dist does not exist: run the build first');
    process.exit(1);
  }
  const violations = dist ? scanDist() : scan(ROOT);
  if (violations.length === 0) {
    console.log(dist ? 'built site has no raw course files' : 'raw course files ok');
  } else {
    for (const v of violations) console.error(`${v.file}: ${v.message}`);
    process.exit(1);
  }
}
