/**
 * Calculus II notes, one file per unit, rewritten from the section list of OpenStax Calculus Volume 2.
 * Math is \( \) and \[ \]. A dollar sign is not a delimiter in these files.
 */
export const NOTES = {
  u1: {
    exam: 'u1',
    title: 'Applications of integration',
    chapters: '2',
    file: 'u1-applications.html',
    load: () => import('./content/u1-applications.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Area between curves', lab: null, ch: ['2'], topics: ['area'] },
      { id: 's2', n: 2, title: 'Volumes by slicing', lab: 'solids', ch: ['2'], topics: ['volumes'], home: true },
      { id: 's3', n: 3, title: 'Volumes by shells', lab: 'solids', ch: ['2'], topics: ['volumes'] },
      { id: 's4', n: 4, title: 'Arc length and surface area', lab: 'arc', ch: ['2'], topics: ['arc length'], home: true },
      { id: 's5', n: 5, title: 'Work', lab: null, ch: ['2'], topics: ['work'] },
      { id: 's6', n: 6, title: 'Centres of mass', lab: null, ch: ['2'] },
      { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u2: {
    exam: 'u2',
    title: 'Techniques of integration',
    chapters: '3',
    file: 'u2-techniques.html',
    load: () => import('./content/u2-techniques.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Integration by parts', lab: null, ch: ['3'], topics: ['parts', 'symbolic'] },
      { id: 's2', n: 2, title: 'Trigonometric integrals', lab: null, ch: ['3'], topics: ['trig integrals'] },
      { id: 's3', n: 3, title: 'Trigonometric substitution', lab: null, ch: ['3'], topics: ['trig sub'] },
      { id: 's4', n: 4, title: 'Partial fractions', lab: null, ch: ['3'], topics: ['partial fractions'] },
      { id: 's5', n: 5, title: 'Numerical integration', lab: 'numint', ch: ['3'], topics: ['numerical'], home: true },
      { id: 's6', n: 6, title: 'Improper integrals', lab: 'improper', ch: ['3'], topics: ['improper'], home: true },
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
