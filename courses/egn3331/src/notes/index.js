/**
 * Notes, one file per unit. Flux writes the text; citations come from src/data/textbook.js.
 * Math is \( \) and \[ \]. A dollar sign is not a delimiter in these files.
 */
export const NOTES = {
  u1: {
    exam: 'u1',
    title: 'Stress',
    chapters: '1',
    file: 'u1-stress.html',
    load: () => import('./content/u1-stress.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Internal loads', lab: null, ch: ['1'], topics: ['internal-loads'] },
      { id: 's2', n: 2, title: 'Average normal stress', lab: 'cut', ch: ['1'], topics: ['normal-stress', 'english'] },
      { id: 's3', n: 3, title: 'Stress on an inclined plane', lab: 'cut', ch: ['1'], topics: ['inclined-plane'], home: true },
      { id: 's4', n: 4, title: 'Stress in truss members', lab: 'truss-stress', ch: ['1'], topics: ['trusses'] },
      { id: 's5', n: 5, title: 'Shear and bearing in connections', lab: 'pins', ch: ['1'], topics: ['shear-stress', 'bearing'] },
      { id: 's6', n: 6, title: 'A rated shackle', lab: 'shackle', ch: ['1'], topics: ['shear-stress', 'english'] },
      { id: 's7', n: 7, title: 'Allowable stress and the factor of safety', lab: 'truss-stress', ch: ['1'], topics: ['factor-of-safety'] },
      { id: 's8', n: 8, title: 'Formula sheet', lab: null, ch: [] },
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
