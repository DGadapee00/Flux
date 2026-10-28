/**
 * Notes, one set per unit. The HTML is rewritten from Hibbeler's section list.
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

/** One file per unit in ./units/, so each unit's sections change without touching the others. */
export const NOTES = { u1, u2, u3, u4, u5, u6, u7, u8 };

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

