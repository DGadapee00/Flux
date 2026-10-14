/**
 * Dependency direction: courses → shells → subjects → core.
 * Core never imports a subject, a shell, or a course. A subject never imports a shell or a course.
 * A shell never imports a course. The site and tools may import courses.
 * Nothing in core or a shell may name a course. A shell names no chapter either.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECKS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(CHECKS_DIR, '../..');

const LAYER_DIRS = [
  ['core', 'packages/core'],
  ['subjects', 'packages/subjects'],
  ['shells', 'packages/shells'],
  ['checks', 'packages/checks'],
  ['courses', 'courses'],
  ['site', 'site'],
  ['tools', 'tools'],
];

/** What each layer is allowed to import. External packages are always allowed. */
const ALLOWED = {
  core: new Set(['core']),
  subjects: new Set(['core', 'subjects']),
  shells: new Set(['core', 'subjects', 'shells']),
  checks: new Set(['core', 'subjects', 'shells', 'checks', 'courses', 'site', 'tools']),
  courses: new Set(['core', 'subjects', 'shells', 'courses']),
  site: new Set(['core', 'subjects', 'courses', 'site']),
  tools: new Set(['core', 'subjects', 'courses', 'tools']),
};

/** A quoted unit id, or a chapter number written out. Course data stays in the course. */
const CHAPTER_LITERAL = /(?:['"`]ch\d+['"`]|\bChapter\s+\d+|\bCh\s+\d+)/;

/**
 * Names that would mean core knows which course it is serving.
 * The word "course" itself is fine. A course id, code, or text author is not.
 */
const COURSE_MARKERS = [
  /phy2049/i,
  /mac2313/i,
  /sta3032/i,
  /statics-sim/i,
  /PHY\s*2049/,
  /MAC\s*2313/,
  /STA\s*3032/,
  /Hibbeler/,
  /Walpole/,
  /Merino/,
  /Montgomery/,
];

const IMPORT_FROM = /\b(?:import|export)\b[\s\S]*?\bfrom\s*['"]([^'"]+)['"]/g;
const IMPORT_BARE = /\bimport\s*['"]([^'"]+)['"]/g;
const IMPORT_DYNAMIC = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

const SKIP_DIRS = new Set(['node_modules', 'dist', 'reference']);

/**
 * @param {string} rel Path relative to the repo root.
 * @returns {string|null}
 */
export function layerOf(rel) {
  const normalized = rel.split(path.sep).join('/');
  for (const [name, dir] of LAYER_DIRS) {
    if (normalized === dir || normalized.startsWith(`${dir}/`)) return name;
  }
  return null;
}

/**
 * @param {string} root
 * @returns {Map<string, string>}
 */
export function packageLayers(root) {
  const map = new Map();
  for (const file of walk(root, (name) => name === 'package.json')) {
    const rel = path.relative(root, file);
    const layer = layerOf(rel);
    if (!layer) continue;
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (typeof json.name === 'string') map.set(json.name, layer);
  }
  return map;
}

/**
 * @param {string} spec
 * @param {string} fromFile Absolute path of the importing file.
 * @param {string} root
 * @param {Map<string, string>} names
 * @returns {string|null} Layer imported, or null when the specifier is external.
 */
export function layerForSpecifier(spec, fromFile, root, names) {
  if (spec.startsWith('.') || spec.startsWith('/')) {
    const resolved = path.resolve(path.dirname(fromFile), spec);
    const rel = path.relative(root, resolved);
    if (rel.startsWith('..')) return null;
    return layerOf(rel);
  }
  let best = null;
  for (const [name, layer] of names) {
    if (spec === name || spec.startsWith(`${name}/`)) {
      if (!best || name.length > best.name.length) best = { name, layer };
    }
  }
  return best ? best.layer : null;
}

/**
 * @param {string} source
 * @returns {string[]}
 */
export function importSpecifiers(source) {
  const code = stripComments(source);
  const specs = new Set();
  for (const re of [IMPORT_FROM, IMPORT_BARE, IMPORT_DYNAMIC]) {
    re.lastIndex = 0;
    for (const match of code.matchAll(re)) specs.add(match[1]);
  }
  return [...specs];
}

/**
 * @param {string} source
 * @returns {string|null} The marker that matched, if any.
 */
export function courseMarker(source) {
  for (const re of COURSE_MARKERS) {
    const match = source.match(re);
    if (match) return match[0];
  }
  return null;
}

/**
 * @param {string} source
 * @returns {string|null} The chapter literal that matched, if any.
 */
export function chapterMarker(source) {
  const match = source.match(CHAPTER_LITERAL);
  return match ? match[0] : null;
}

/**
 * @param {string} root
 * @returns {{ file: string, message: string }[]}
 */
export function scan(root = ROOT) {
  const names = packageLayers(root);
  const violations = [];
  for (const file of walk(root, (name) => /\.(js|mjs|cjs)$/.test(name))) {
    const rel = path.relative(root, file);
    const fromLayer = layerOf(rel);
    if (!fromLayer) continue;
    const source = fs.readFileSync(file, 'utf8');
    if (fromLayer === 'core' || fromLayer === 'shells') {
      const marker = courseMarker(source);
      if (marker) {
        const who = fromLayer === 'core' ? 'core' : 'shell';
        violations.push({ file: rel, message: `${who} names a course (${marker})` });
      }
    }
    if (fromLayer === 'shells') {
      const chapter = chapterMarker(source);
      if (chapter) violations.push({ file: rel, message: `shell names a chapter (${chapter})` });
    }
    for (const spec of importSpecifiers(source)) {
      const toLayer = layerForSpecifier(spec, file, root, names);
      if (!toLayer || toLayer === fromLayer) continue;
      if (!ALLOWED[fromLayer]?.has(toLayer)) {
        violations.push({
          file: rel,
          message: `${fromLayer} imports ${toLayer} via '${spec}'`,
        });
      }
    }
  }
  return violations;
}

/**
 * @param {string} root
 * @param {(name: string) => boolean} include
 * @returns {string[]}
 */
function walk(root, include, dir = root, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(root, include, path.join(dir, ent.name), out);
    } else if (include(ent.name)) {
      out.push(path.join(dir, ent.name));
    }
  }
  return out;
}

/**
 * @param {string} source
 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const violations = scan(ROOT);
  if (violations.length === 0) {
    console.log('dependency direction ok');
  } else {
    for (const v of violations) console.error(`${v.file}: ${v.message}`);
    process.exit(1);
  }
}
