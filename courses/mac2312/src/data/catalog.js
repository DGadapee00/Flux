/** Units follow OpenStax Calculus Volume 2. `labs` are built. `coming` is the rest of the unit. */

export const EXAMS = [
  {
    id: 'u1',
    n: 1,
    title: 'Applications of integration',
    chapters: '2',
    date: null,
    labs: ['solids'],
  },
  {
    id: 'u2',
    n: 2,
    title: 'Techniques',
    chapters: '3',
    date: null,
    labs: ['numint', 'improper'],
  },
  {
    id: 'u3',
    n: 3,
    title: 'Sequences and series',
    chapters: '5–6',
    date: null,
    labs: ['taylor', 'series'],
  },
  {
    id: 'u4',
    n: 4,
    title: 'Parametric and polar',
    chapters: '7',
    date: null,
    labs: ['parametric', 'polar'],
  },
];

export const LAB_META = {
  solids: { id: 'solids', exam: 'u1', title: 'Solids' },
  numint: { id: 'numint', exam: 'u2', title: 'Numerical' },
  improper: { id: 'improper', exam: 'u2', title: 'Improper' },
  taylor: { id: 'taylor', exam: 'u3', title: 'Taylor' },
  series: { id: 'series', exam: 'u3', title: 'Series' },
  parametric: { id: 'parametric', exam: 'u4', title: 'Parametric' },
  polar: { id: 'polar', exam: 'u4', title: 'Polar' },
};

export const CHAPTER_TITLES = {
  2: 'Applications of integration',
  3: 'Techniques of integration',
  5: 'Sequences and series',
  6: 'Power series',
  7: 'Parametric and polar',
};

export function examById(id) {
  return EXAMS.find((e) => e.id === id) || EXAMS[0];
}

export function examForLab(labId) {
  const meta = LAB_META[labId];
  return meta ? examById(meta.exam) : examById('u1');
}
