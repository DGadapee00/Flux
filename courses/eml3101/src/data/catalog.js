/**
 * Course map for EML 3101 Thermodynamics II, one entry per unit. `labs` are built; `coming` is the
 * rest of that unit, still to be written. Units follow the map's EML 3101 path (map/paths/eml3101.js),
 * starting where its first lab is.
 */

export const EXAMS = [
  {
    id: 'u1',
    n: 1,
    title: 'Gas mixtures and combustion',
    chapters: '1',
    date: 'Unit 1',
    labs: ['mixture'],
    coming: ['Combustion'],
  },
  {
    id: 'u2',
    n: 2,
    title: 'Compressible flow',
    chapters: '2',
    date: 'Unit 2',
    labs: ['nozzle'],
    coming: [],
  },
];

export const LAB_META = {
  mixture: { id: 'mixture', exam: 'u1', title: 'Mixture' },
  nozzle: { id: 'nozzle', exam: 'u2', title: 'Nozzle' },
};

export const CHAPTER_TITLES = {
  1: 'Gas mixtures and combustion',
  2: 'Compressible flow',
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
