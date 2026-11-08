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
    labs: ['rod', 'resistance', 'fin', 'quench', 'touch', 'grid'],
    coming: ["Fourier's law"],
  },
  {
    id: 'u2',
    n: 2,
    title: 'Radiation',
    chapters: '2',
    date: 'Unit 2',
    labs: ['radiation', 'viewfactor', 'shield'],
    coming: [],
  },
  {
    id: 'u3',
    n: 3,
    title: 'Convection',
    chapters: '6',
    date: 'Unit 3',
    labs: ['thermal', 'nusselt', 'tube', 'plume', 'boil'],
    coming: [],
  },
  {
    id: 'u4',
    n: 4,
    title: 'Exchangers and mass transfer',
    chapters: '4',
    date: 'Unit 4',
    labs: ['exchanger', 'wetbulb'],
    coming: [],
  },
];

export const LAB_META = {
  rod: { id: 'rod', exam: 'u1', title: 'Rod' },
  resistance: { id: 'resistance', exam: 'u1', title: 'Resistance' },
  radiation: { id: 'radiation', exam: 'u2', title: 'Radiation' },
  viewfactor: { id: 'viewfactor', exam: 'u2', title: 'View factor' },
  thermal: { id: 'thermal', exam: 'u3', title: 'Thermal layer' },
  nusselt: { id: 'nusselt', exam: 'u3', title: 'Nusselt' },
  fin: { id: 'fin', exam: 'u1', title: 'Fin' },
  quench: { id: 'quench', exam: 'u1', title: 'Quench' },
  touch: { id: 'touch', exam: 'u1', title: 'Touch' },
  grid: { id: 'grid', exam: 'u1', title: 'Grid' },
  shield: { id: 'shield', exam: 'u2', title: 'Shields' },
  tube: { id: 'tube', exam: 'u3', title: 'Tube' },
  plume: { id: 'plume', exam: 'u3', title: 'Plume' },
  boil: { id: 'boil', exam: 'u3', title: 'Boil' },
  exchanger: { id: 'exchanger', exam: 'u4', title: 'Exchanger' },
  wetbulb: { id: 'wetbulb', exam: 'u4', title: 'Wet bulb' },
};

export const CHAPTER_TITLES = {
  1: 'Modes and conduction',
  2: 'Radiation',
  6: 'Laminar and turbulent boundary layers',
  4: 'Exchangers and mass transfer',
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
