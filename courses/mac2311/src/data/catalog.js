/** Six units in 18.01SC order, with sequences and convergence from OpenStax (D28). */
export const EXAMS = [
  {
    id: 'c1',
    n: 1,
    title: 'Differentiation',
    chapters: 'Vol 1 Ch 1\u20133',
    date: null,
    labs: ['limits', 'secant', 'focus'],
  },
  {
    id: 'c2',
    n: 2,
    title: 'Applications of differentiation',
    chapters: 'Vol 1 Ch 4',
    date: null,
    labs: ['rates', 'box'],
  },
  {
    id: 'c3',
    n: 3,
    title: 'The definite integral and its applications',
    chapters: 'Vol 1 Ch 5\u20136; Vol 2 Ch 2',
    date: null,
    labs: ['riemann', 'accum', 'solids', 'numint'],
  },
  {
    id: 'c4',
    n: 4,
    title: 'Techniques of integration',
    chapters: 'Vol 2 Ch 2\u20133',
    date: null,
    labs: ['arc'],
  },
  {
    id: 'c5',
    n: 5,
    title: 'Parametric equations and polar coordinates',
    chapters: 'Vol 2 Ch 7',
    date: null,
    labs: ['parametric', 'polar'],
  },
  {
    id: 'c6',
    n: 6,
    title: 'Exploring the infinite',
    chapters: 'Vol 1 \u00a74.8; Vol 2 Ch 3, 5\u20136',
    date: null,
    labs: ['improper', 'taylor', 'series'],
  },
];
export const LAB_META = {
  focus: { id: 'focus', exam: 'c1', title: 'Camera focus', app: true },
  limits: {
    id: 'limits',
    exam: 'c1',
    title: 'Limits',
  },
  secant: {
    id: 'secant',
    exam: 'c1',
    title: 'Secant',
  },
  rates: {
    id: 'rates',
    exam: 'c2',
    title: 'Ladder',
  },
  box: {
    id: 'box',
    exam: 'c2',
    title: 'Open box',
  },
  riemann: {
    id: 'riemann',
    exam: 'c3',
    title: 'Riemann',
  },
  accum: {
    id: 'accum',
    exam: 'c3',
    title: 'FTC',
  },
  solids: {
    id: 'solids',
    exam: 'c3',
    title: 'Solids',
  },
  numint: {
    id: 'numint',
    exam: 'c3',
    title: 'Numerical',
  },
  arc: {
    id: 'arc',
    exam: 'c4',
    title: 'Arc length',
  },
  parametric: {
    id: 'parametric',
    exam: 'c5',
    title: 'Parametric',
  },
  polar: {
    id: 'polar',
    exam: 'c5',
    title: 'Polar',
  },
  improper: {
    id: 'improper',
    exam: 'c6',
    title: 'Improper',
  },
  taylor: {
    id: 'taylor',
    exam: 'c6',
    title: 'Taylor',
  },
  series: {
    id: 'series',
    exam: 'c6',
    title: 'Series',
  },
};
export const CHAPTER_TITLES = {
  2: 'Vol 1 · Limits',
  3: 'Vol 1 · Derivatives',
  4: 'Vol 1 · Applications',
  5: 'Vol 1 · Integration',
  'v2.2': 'Vol 2 · Integral applications',
  'v2.3': 'Vol 2 · Integration techniques',
  'v2.5': 'Vol 2 · Sequences and series',
  'v2.6': 'Vol 2 · Power series',
  'v2.7': 'Vol 2 · Parametric and polar',
};
export const examById = (id) => EXAMS.find((e) => e.id === id) || EXAMS[0];
export const examForLab = (id) => examById(LAB_META[id]?.exam);
export const examLabel = (exam) => (exam ? `Unit ${exam.n} · ${exam.title}` : 'Unit');
