/**
 * The learner's practice record, read from each course app's own store. The hub and the course
 * apps share one origin, so the record a course app writes is the record the hub reads. Nothing
 * here writes.
 */
import { EXAMS, examDay } from '@flux/phy2049/src/data/catalog.js';
import { backupParts } from '../backup.js';

/**
 * Every course's Leitner items, keyed `<course>:<problem id>` like map/problems.mjs.
 * @param {{ courseId: string, store: { readJSON: (name: string) => any } }[]} [parts]
 */
export function readItems(parts = backupParts()) {
  /** @type {Record<string, any>} */
  const items = {};
  for (const { courseId, store } of parts) {
    if (courseId === 'applications') continue;
    const data = store.readJSON('problems');
    if (!data || data.v !== 1 || !data.items || typeof data.items !== 'object') continue;
    for (const [id, it] of Object.entries(data.items)) {
      if (it && typeof it.box === 'number' && typeof it.due === 'number') items[`${courseId}:${id}`] = it;
    }
  }
  return items;
}

/**
 * PHY 2049's exams with their dates in `year`, each matched to the unit of its course path that
 * names it ("Exam 6: EM waves"). The final, and an exam with no unit on the path, are left out.
 * @param {Record<string, { units: { title: string, concepts: string[] }[] }>} paths
 * @param {number} year
 */
export function phyExams(paths, year) {
  const units = paths.phy2049?.units || [];
  return EXAMS.filter((e) => !e.final).map((e) => {
    const unit = units.find((u) => u.title.startsWith(`Exam ${e.n}:`));
    return { course: 'phy2049', n: e.n, title: e.title.replace(/&/g, 'and'), day: examDay(e, year), concepts: unit?.concepts || [] };
  }).filter((e) => e.day && e.concepts.length);
}
