/**
 * Notes, one set per unit, in PHY 2049's structure (courses/phy2049/src/notes/content/).
 * Math is \( \) and \[ \]. A dollar sign is not a delimiter in the notes files.
 */
import u1 from './units/u1.js';
import u2 from './units/u2.js';
import u3 from './units/u3.js';
import u4 from './units/u4.js';
import u5 from './units/u5.js';
import u6 from './units/u6.js';
import u7 from './units/u7.js';
import u8 from './units/u8.js';
import u9 from './units/u9.js';
import u10 from './units/u10.js';
import u11 from './units/u11.js';
import u12 from './units/u12.js';
import u13 from './units/u13.js';
import u14 from './units/u14.js';

/** One file per unit in ./units/, so each unit's sections change without touching the others. */
export const NOTES = { u1, u2, u3, u4, u5, u6, u7, u8, u9, u10, u11, u12, u13, u14 };

export const notesForExam = (examId) => NOTES[examId] || null;

export const allNotes = () => Object.values(NOTES);

/** The section a practice problem draws on, by shared topics, then by lab. */
export function sectionForProblem(tpl) {
  const topics = new Set(tpl.topics || []);
  for (const set of allNotes()) {
    const named = set.sections.find((s) => s.problems?.includes(tpl.id));
    if (named) return { set, section: named };
    const inCh = set.sections.filter((s) => s.ch.includes(tpl.ch));
    if (!inCh.length) continue;
    const score = (s) => 10 * (s.topics || []).filter((t) => topics.has(t)).length + (s.lab && s.lab === tpl.lab ? 1 : 0);
    const best = inCh.reduce((a, s) => (score(s) > score(a) ? s : a), inCh[0]);
    return { set, section: best };
  }
  return null;
}

