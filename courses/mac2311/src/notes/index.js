/**
 * Unit 1 notes. The HTML is rewritten from the OpenStax section list.
 * Math is \( \) and \[ \]. A dollar sign is not a delimiter in this file.
 */
export const NOTES = {
  u1: {
    exam: 'u1',
    title: 'Functions and limits',
    chapters: '1–2',
    file: 'u1-functions-and-limits.html',
    load: () => import('./content/u1-functions-and-limits.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'The limit of a function', lab: null, ch: ['2'], topics: ['limits'] },
      { id: 's2', n: 2, title: 'One-sided limits', lab: 'limits', ch: ['2'], topics: ['limits'], home: true },
      { id: 's3', n: 3, title: 'Limit laws', lab: null, ch: ['2'], topics: ['limits'] },
      { id: 's4', n: 4, title: 'Continuity', lab: null, ch: ['2'], topics: ['continuity'] },
      { id: 's5', n: 5, title: 'Epsilon and delta', lab: 'limits', ch: ['2'], topics: ['epsilon-delta'] },
      { id: 's6', n: 6, title: 'The squeeze theorem', lab: null, ch: ['2'], topics: ['limits'] },
      { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
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
