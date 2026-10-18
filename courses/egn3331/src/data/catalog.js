/**
 * Course map. `labs` are built. `coming` is the rest of that unit, still to be written.
 * Units and chapter numbers follow the course pack (DECISIONS.md, D11), which is the order the class
 * works in. Readings are cited from Roylance through src/data/textbook.js (D14).
 */

export const EXAMS = [
  { id: 'u1', n: 1, title: 'Stress', chapters: '1', date: 'Ch 1', labs: ['cut', 'truss-stress', 'pins'], coming: [] },
  { id: 'u2', n: 2, title: 'Strain and material behaviour', chapters: '2, 3', date: 'Ch 2–3', labs: [], coming: ['Tension test', 'Poisson'] },
  { id: 'u3', n: 3, title: 'Axial load', chapters: '4', date: 'Ch 4', labs: [], coming: ['Axial', 'Indeterminate', 'Thermal'] },
  { id: 'u4', n: 4, title: 'Torsion', chapters: '5', date: 'Ch 5', labs: [], coming: ['Torsion', 'Twist'] },
  { id: 'u5', n: 5, title: 'Bending', chapters: '6', date: 'Ch 6', labs: [], coming: ['Diagrams', 'Flexure'] },
  { id: 'u6', n: 6, title: 'Transverse shear', chapters: '7', date: 'Ch 7', labs: [], coming: ['Shear', 'Built-up'] },
  { id: 'u7', n: 7, title: 'Pressure vessels and combined loading', chapters: '8', date: 'Ch 8', labs: [], coming: ['Vessel', 'Combined'] },
  { id: 'u8', n: 8, title: 'Stress transformation', chapters: '9', date: 'Ch 9', labs: [], coming: ['Mohr'] },
  { id: 'u9', n: 9, title: 'Deflection of beams', chapters: '12', date: 'Ch 12', labs: [], coming: ['Deflection', 'Propped'] },
  { id: 'u10', n: 10, title: 'Buckling of columns', chapters: '13', date: 'Ch 13', labs: [], coming: ['Buckling'] },
];

export const LAB_META = {
  cut: { id: 'cut', exam: 'u1', title: 'Inclined cut' },
  'truss-stress': { id: 'truss-stress', exam: 'u1', title: 'Truss stress' },
  pins: { id: 'pins', exam: 'u1', title: 'Pins' },
};

export const CHAPTER_TITLES = {
  1: 'Stress',
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
