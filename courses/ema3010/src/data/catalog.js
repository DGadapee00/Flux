/**
 * Course map for EMA 3010 Materials Science, one entry per unit. `labs` are built; `coming` is the
 * rest of that unit, still to be written. Units follow the map's EMA 3010 path (map/paths/ema3010.js),
 * which follows MIT 3.091's recitations for the first half.
 */

export const EXAMS = [
  {
    id: 'u1',
    n: 1,
    title: 'Bonding and structure',
    chapters: '1',
    date: 'Unit 1',
    labs: ['bond', 'crystal'],
    coming: ['X-ray diffraction'],
  },
];

export const LAB_META = {
  bond: { id: 'bond', exam: 'u1', title: 'Bond' },
  crystal: { id: 'crystal', exam: 'u1', title: 'Crystal' },
};

export const CHAPTER_TITLES = {
  1: 'Bonding and structure',
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
