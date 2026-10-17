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
  u2: {
    exam: 'u2',
    title: 'Derivatives',
    chapters: '3',
    file: 'u2-derivatives.html',
    load: () => import('./content/u2-derivatives.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'The derivative as a limit', lab: 'secant', ch: ['3'], topics: ['derivatives'], home: true },
      { id: 's2', n: 2, title: 'Power, product, and quotient rules', lab: 'secant', ch: ['3'], topics: ['derivatives', 'symbolic'] },
      { id: 's3', n: 3, title: 'Rates of change on a line', lab: null, ch: ['3'], topics: ['derivatives'] },
      { id: 's4', n: 4, title: 'Sine and cosine', lab: 'secant', ch: ['3'], topics: ['derivatives'] },
      { id: 's5', n: 5, title: 'The chain rule', lab: null, ch: ['3'], topics: ['derivatives', 'symbolic'] },
      { id: 's6', n: 6, title: 'Implicit differentiation and related rates', lab: 'rates', ch: ['3'], topics: ['related rates'], problems: ['u2.rates', 'u2.implicit'], home: true },
      { id: 's7', n: 7, title: 'Inverses, exponentials, and logarithms', lab: null, ch: ['3'], topics: ['derivatives'] },
      { id: 's8', n: 8, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u3: {
    exam: 'u3',
    title: 'Applications of derivatives',
    chapters: '4',
    file: 'u3-applications.html',
    load: () => import('./content/u3-applications.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Linear approximation', lab: null, ch: ['4'], topics: ['linear approximation'] },
      { id: 's2', n: 2, title: 'Extreme values', lab: null, ch: ['4'], topics: ['extrema'] },
      { id: 's3', n: 3, title: 'The Mean Value Theorem', lab: null, ch: ['4'], topics: ['mean value theorem'] },
      { id: 's4', n: 4, title: 'The shape of a graph', lab: null, ch: ['4'], topics: ['curve sketching'] },
      { id: 's5', n: 5, title: 'Limits at infinity', lab: null, ch: ['4'], topics: ['curve sketching'] },
      { id: 's6', n: 6, title: 'Optimization', lab: 'box', ch: ['4'], topics: ['optimization'], home: true },
      { id: 's7', n: 7, title: "L'Hôpital's rule", lab: null, ch: ['4'], topics: ["l'hôpital"] },
      { id: 's8', n: 8, title: "Newton's method", lab: null, ch: ['4'], topics: ["newton's method"] },
      { id: 's9', n: 9, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  u4: {
    exam: 'u4',
    title: 'Integration',
    chapters: '5',
    file: 'u4-integration.html',
    load: () => import('./content/u4-integration.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Antiderivatives', lab: null, ch: ['5'], topics: ['antiderivatives'] },
      { id: 's2', n: 2, title: 'Area as a limit of sums', lab: 'riemann', ch: ['5'], topics: ['integration'], home: true },
      { id: 's3', n: 3, title: 'The definite integral', lab: 'riemann', ch: ['5'], topics: ['definite integral'] },
      { id: 's4', n: 4, title: 'The Fundamental Theorem', lab: 'accum', ch: ['5'], topics: ['fundamental theorem'], home: true },
      { id: 's5', n: 5, title: 'Net change', lab: null, ch: ['5'], topics: ['definite integral'] },
      { id: 's6', n: 6, title: 'Substitution', lab: null, ch: ['5'], topics: ['substitution', 'symbolic'] },
      { id: 's7', n: 7, title: 'Exponentials and logarithms', lab: null, ch: ['5'], topics: ['antiderivatives'] },
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
