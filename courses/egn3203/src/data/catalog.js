/**
 * Course map for EGN 3203 Modern Computation Methods, one entry per unit. `labs` are built; `coming`
 * is the rest of that unit, still to be written. Units follow the map's EGN 3203 path
 * (map/paths/egn3203.js), linear algebra first because the map's largest gaps are there.
 */

export const EXAMS = [
  {
    id: 'u1',
    n: 1,
    title: 'Matrices and elimination',
    chapters: '1',
    date: 'Unit 1',
    labs: ['matrix', 'elimination', 'inverse', 'rank'],
    coming: ['Least squares'],
  },
];

export const LAB_META = {
  matrix: { id: 'matrix', exam: 'u1', title: 'Matrix map' },
  elimination: { id: 'elimination', exam: 'u1', title: 'Elimination' },
  inverse: { id: 'inverse', exam: 'u1', title: 'Inverse' },
  rank: { id: 'rank', exam: 'u1', title: 'Rank' },
};

export const CHAPTER_TITLES = {
  1: 'Matrices and elimination',
};

export function examById(id) {
  return EXAMS.find((e) => e.id === id) || EXAMS[0];
}

export function examForLab(labId) {
  const meta = LAB_META[labId];
  return meta ? examById(meta.exam) : EXAMS[0];
}

export function examIndex(id) {
  const i = EXAMS.findIndex((e) => e.id === id);
  return i < 0 ? 0 : i;
}

export function examLabel(exam) {
  return exam ? `Unit ${exam.n}` : 'Unit';
}
