/**
 * Calculus I notes, one file per unit, rewritten from the section list of OpenStax Calculus Volume 1.
 * Math is \( \) and \[ \]. A dollar sign is not a delimiter in these files.
 */
export const NOTES = {
  u1: {
    exam: 'u1',
    title: 'Functions and limits',
    chapters: '1–2',
    file: 'u1-limits.html',
    load: () => import('./content/u1-limits.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Functions, briefly', lab: null, ch: [] },
      { id: 's2', n: 2, title: 'The idea of a limit', lab: 'limits', ch: ['2'], topics: ['limits'], home: true },
      { id: 's3', n: 3, title: 'Limit laws and the 0/0 form', lab: 'limits', ch: ['2'], topics: ['limits'] },
      { id: 's4', n: 4, title: 'Continuity', lab: 'limits', ch: ['2'], topics: ['continuity'] },
      { id: 's5', n: 5, title: 'The precise definition', lab: 'limits', ch: ['2'], topics: ['epsilon-delta'] },
      { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
};

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
