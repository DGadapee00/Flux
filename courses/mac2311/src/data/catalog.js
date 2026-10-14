/** Units follow OpenStax Calculus Volume 1. `labs` are built. `coming` is the rest of the unit. */

export const EXAMS = [
  {
    id: 'u1',
    n: 1,
    title: 'Functions and limits',
    chapters: '1–2',
    date: null,
    labs: ['limits'],
  },
  {
    id: 'u2',
    n: 2,
    title: 'Derivatives',
    chapters: '3',
    date: null,
    labs: ['secant'],
    coming: ['Related rates'],
  },
  {
    id: 'u3',
    n: 3,
    title: 'Applications',
    chapters: '4',
    date: null,
    labs: [],
    coming: ['Optimization', "L'Hôpital"],
  },
  {
    id: 'u4',
    n: 4,
    title: 'Integration',
    chapters: '5',
    date: null,
    labs: ['riemann'],
    coming: ['FTC'],
  },
];

export const LAB_META = {
  limits: { id: 'limits', exam: 'u1', title: 'Limits' },
  secant: { id: 'secant', exam: 'u2', title: 'Secant' },
  riemann: { id: 'riemann', exam: 'u4', title: 'Riemann' },
};

export const CHAPTER_TITLES = {
  2: 'Limits',
  3: 'Derivatives',
  4: 'Applications',
  5: 'Integration',
};

export function examById(id) {
  return EXAMS.find((e) => e.id === id) || EXAMS[1];
}

export function examForLab(labId) {
  const meta = LAB_META[labId];
  return meta ? examById(meta.exam) : examById('u2');
}
