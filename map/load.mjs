/**
 * Node-side loading: the concept files, and each course's notes index.
 * The hub reads concepts through Vite's import.meta.glob instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const MAP_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(MAP_DIR, '..');

/**
 * @param {string} [dir]
 * @returns {Promise<{ file: string, concept: any }[]>}
 */
export async function loadConcepts(dir = path.join(MAP_DIR, 'concepts')) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
  const out = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(dir, file)).href);
    out.push({ file, concept: mod.default });
  }
  return out;
}

/**
 * Each course's notes sections, by unit: `{ [unit]: [{ id, title, lab }] }`.
 * A course with no notes index is absent.
 * @param {string[]} courseIds
 */
export async function loadNotesIndexes(courseIds) {
  /** @type {Record<string, Record<string, { id: string, title: string, lab: string|null }[]>>} */
  const out = {};
  for (const id of courseIds) {
    const file = path.join(ROOT, 'courses', id, 'src/notes/index.js');
    if (!fs.existsSync(file)) continue;
    const { NOTES } = await import(pathToFileURL(file).href);
    out[id] = Object.fromEntries(
      Object.entries(NOTES || {}).map(([unit, set]) => [
        unit,
        (set.sections || []).map((s) => ({ id: s.id, title: s.title, lab: s.lab ?? null })),
      ]),
    );
  }
  return out;
}
