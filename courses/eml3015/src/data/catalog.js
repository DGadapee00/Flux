/**
 * Course map for EML 3015 Fluids, one entry per unit. `labs` are built; `coming` is the rest of that
 * unit, still to be written. Units follow the map's EML 3015 path (map/paths/eml3015.js).
 */

export const EXAMS = [
  {
    id: 'u1',
    n: 1,
    title: 'Viscosity and shear',
    chapters: '5',
    date: 'Unit 1',
    labs: ['viscosity'],
    coming: ['Couette and Poiseuille flow', 'Pipe flow'],
  },
];

export const LAB_META = {
  viscosity: { id: 'viscosity', exam: 'u1', title: 'Viscosity' },
};

export const CHAPTER_TITLES = {
  5: 'Effects of shear',
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
