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
    labs: ['rod', 'resistance'],
    coming: ["Fourier's law"],
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
  {
    id: 'u3',
    n: 3,
    title: 'Convection',
    chapters: '6',
    date: 'Unit 3',
    labs: ['thermal', 'nusselt'],
    coming: ['Flow in tubes', 'Natural convection'],
  },
];

export const LAB_META = {
  rod: { id: 'rod', exam: 'u1', title: 'Rod' },
  resistance: { id: 'resistance', exam: 'u1', title: 'Resistance' },
  radiation: { id: 'radiation', exam: 'u2', title: 'Radiation' },
  thermal: { id: 'thermal', exam: 'u3', title: 'Thermal layer' },
  nusselt: { id: 'nusselt', exam: 'u3', title: 'Nusselt' },
};

export const CHAPTER_TITLES = {
  1: 'Modes and conduction',
  2: 'Radiation',
  6: 'Laminar and turbulent boundary layers',
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
