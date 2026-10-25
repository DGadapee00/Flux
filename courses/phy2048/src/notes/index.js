/**
 * Notes, one set per unit, in PHY 2049's structure (courses/phy2049/src/notes/content/).
 * Math is \( \) and \[ \]. A dollar sign is not a delimiter in the notes files.
 * Each section names the lab that shows it and the chapters and topics its practice problems use,
 * so a section links to its lab and its problems, and a problem and a lab link back.
 */
import u1 from './units/u1.js';
import u2 from './units/u2.js';

/** One file per unit in ./units/, so each unit's sections change without touching the others. */
export const NOTES = { u1, u2 };

export const notesForExam = (examId) => NOTES[examId] || null;

/** Every set of notes, in unit order. */
export const allNotes = () => Object.values(NOTES);

/**
 * The section a practice problem draws on, among those covering its chapter: the one sharing most
 * of its topics, then the one showing its lab, then the first. A section can claim problems by id
 * (`problems`) where the tags are too broad to tell. Null when no notes cover the chapter.
 */
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

/** The first section a lab illustrates, in the notes for the unit on screen. `home` picks another. */
export function sectionForLab(labId, examId) {
  const set = NOTES[examId];
  const mine = set?.sections.filter((s) => s.lab === labId) || [];
  const hit = mine.find((s) => s.home) || mine[0];
  return hit ? { set, section: hit } : null;
}
