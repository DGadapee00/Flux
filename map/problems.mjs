/**
 * Which practice problems belong to which lab, read from each course's own problem bank.
 *
 * The hub uses this to join the map to a learner's record: a concept lists its labs, a lab has
 * problems, and each course stores a Leitner box per problem. The banks are large and run code, so
 * the hub does not import them; its build asks this module once and ships the result.
 *
 * Keys are `<course>:<problem id>`, because problem ids are unique only within a course.
 * A problem with no `lab` field is not on the map yet and is left out.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './load.mjs';

/** Courses with a problem bank, by folder. MAC 2312 practises inside MAC 2311's app. */
export const BANK_COURSES = ['bench', 'design', 'egn3321', 'egn3331', 'eml3015', 'eml3100', 'mac2311', 'mac2313', 'map2302', 'phy2048', 'phy2049', 'sta3032', 'statics'];

/**
 * @returns {Promise<{ byLab: Record<string, string[]>, titles: Record<string, string>, unlinked: Record<string, number> }>}
 */
export async function problemIndex() {
  /** @type {Record<string, string[]>} */
  const byLab = {};
  /** @type {Record<string, string>} */
  const titles = {};
  /** @type {Record<string, number>} */
  const unlinked = {};
  for (const course of BANK_COURSES) {
    const file = path.join(ROOT, 'courses', course, 'src/problems/index.js');
    const { PROBLEMS } = await import(pathToFileURL(file).href);
    for (const p of PROBLEMS) {
      if (!p.lab) {
        unlinked[course] = (unlinked[course] || 0) + 1;
        continue;
      }
      const key = `${course}:${p.id}`;
      (byLab[`${course}/${p.lab}`] ||= []).push(key);
      titles[key] = String(p.title || p.id);
    }
  }
  return { byLab, titles, unlinked };
}
