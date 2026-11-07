/**
 * Course map for EML 4140 Heat Transfer, one entry per unit. `labs` are built; `coming` is the rest
 * of that unit, still to be written. Units follow the map's EML 4140 path (map/paths/eml4140.js),
 * which follows MIT 2.51 and Lienhard's A Heat Transfer Textbook.
 */

export const EXAMS = [
  {
    id: 'u1',
    n: 1,
    title: 'Modes and conduction',
    chapters: '1',
    date: 'Unit 1',
    labs: ['rod'],
    coming: ["Fourier's law", 'Thermal resistance'],
  },
  {
    id: 'u2',
    n: 2,
    title: 'Radiation',
    chapters: '2',
    date: 'Unit 2',
    labs: ['radiation'],
    coming: ['View factors', 'Radiation networks'],
  },
];

export const LAB_META = {
  rod: { id: 'rod', exam: 'u1', title: 'Rod' },
  radiation: { id: 'radiation', exam: 'u2', title: 'Radiation' },
};

export const CHAPTER_TITLES = {
  1: 'Modes and conduction',
  2: 'Radiation',
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
