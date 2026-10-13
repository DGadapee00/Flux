/**
 * One origin serves every course, so a storage key may belong to only one of them.
 *
 *   node packages/checks/storage.mjs
 *
 * A storage key is a `const` whose name is `KEY` or ends in `_KEY`, assigned a
 * string that starts with `flux`. Two courses using the same string fail.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECKS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(CHECKS_DIR, '../..');

const SKIP_DIRS = new Set(['node_modules', 'dist', 'reference', '.git']);
const KEY_ASSIGN = /(?:export\s+)?(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(['"])(flux[^'"\n]*)\2/g;

/**
 * @param {string} name
 */
export function isStorageKeyName(name) {
  return name === 'KEY' || name.endsWith('_KEY');
}

/**
 * @param {string} root
 * @returns {{ course: string, file: string, name: string, value: string }[]}
 */
export function collectKeys(root = ROOT) {
  const found = [];
  const courses = path.join(root, 'courses');
  walk(courses, (file) => {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const course = rel.split('/')[1];
    if (!course) return;
    const source = fs.readFileSync(file, 'utf8');
    KEY_ASSIGN.lastIndex = 0;
    for (const match of source.matchAll(KEY_ASSIGN)) {
      const name = match[1];
      if (!isStorageKeyName(name)) continue;
      found.push({ course, file: rel, name, value: match[3] });
    }
  });
  return found;
}

/**
 * @param {{ course: string, file: string, name: string, value: string }[]} keys
 * @returns {{ value: string, uses: { course: string, file: string, name: string }[] }[]}
 */
export function collisions(keys) {
  const byValue = new Map();
  for (const key of keys) {
    const uses = byValue.get(key.value) || [];
    uses.push({ course: key.course, file: key.file, name: key.name });
    byValue.set(key.value, uses);
  }
  const shared = [];
  for (const [value, uses] of byValue) {
    const courses = new Set(uses.map((use) => use.course));
    if (courses.size > 1) shared.push({ value, uses });
  }
  return shared;
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
    } else if (ent.isFile() && /\.(js|mjs)$/.test(ent.name)) {
      visit(path.join(dir, ent.name));
    }
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const shared = collisions(collectKeys(ROOT));
  if (shared.length === 0) {
    console.log('storage keys ok');
  } else {
    for (const hit of shared) {
      const where = hit.uses.map((use) => `${use.file} (${use.name})`).join(', ');
      console.error(`${hit.value} is used by more than one course: ${where}`);
    }
    process.exit(1);
  }
}
