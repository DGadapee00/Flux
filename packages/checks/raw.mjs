/**
 * Rule 9: no raw course files under courses/.
 * A PDF, pptx, docx, or doc fails the build, and so does anything under a
 * path named incoming. Generated lessons/*.docx stay out of the tree.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECKS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(CHECKS_DIR, '../..');

const RAW_EXT = new Set(['.pdf', '.pptx', '.docx', '.doc']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'reference', '.git']);

/**
 * @param {string} rel Path relative to the repo root, using `/`.
 * @returns {string|null}
 */
export function rawReason(rel) {
  const parts = rel.split('/');
  if (parts.some((part) => part.toLowerCase() === 'incoming')) return 'under incoming';
  const ext = path.posix.extname(rel).toLowerCase();
  if (RAW_EXT.has(ext)) return ext;
  return null;
}

/**
 * @param {string} root
 * @returns {{ file: string, message: string }[]}
 */
export function scan(root = ROOT) {
  const courses = path.join(root, 'courses');
  const violations = [];
  walk(courses, (file) => {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const reason = rawReason(rel);
    if (reason) violations.push({ file: rel, message: reason });
  });
  return violations;
}

/**
 * @param {string} dir
 * @param {(file: string) => void} visit
 */
function walk(dir, visit) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(path.join(dir, ent.name), visit);
    } else if (ent.isFile()) {
      visit(path.join(dir, ent.name));
    }
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const violations = scan(ROOT);
  if (violations.length === 0) {
    console.log('raw course files ok');
  } else {
    for (const v of violations) console.error(`${v.file}: ${v.message}`);
    process.exit(1);
  }
}
