/**
 * Course map. `labs` are built. `coming` is the rest of that unit, still to be written.
 * The eleven-unit order is the spine confirmed by the owner (D23, D29, D31). Readings are
 * cited from Roylance through src/data/textbook.js (D14). Chapter labels are Hibbeler's.
 */

export const EXAMS = [
  { id: 'u1', n: 1, title: 'Stress', chapters: '1', date: 'Ch 1', labs: ['cut', 'truss-stress', 'pins', 'shackle'], coming: [] },
  { id: 'u2', n: 2, title: 'Strain and material behaviour', chapters: '2, 3', date: 'Ch 2–3', labs: ['tension-test', 'poisson', 'brace'], coming: [] },
  { id: 'u3', n: 3, title: 'Axial load', chapters: '4', date: 'Ch 4', labs: ['axial', 'indeterminate', 'rail'], coming: [] },
  { id: 'u4', n: 4, title: 'Multiaxial stress and pressure vessels', chapters: '8, 10', date: 'Ch 8, 10', labs: ['strain3', 'vessel', 'tank'], coming: [] },
  { id: 'u5', n: 5, title: 'Stress transformation and failure', chapters: '8, 9', date: 'Ch 8–9', labs: [], coming: ['Mohr', 'Combined'] },
  { id: 'u6', n: 6, title: 'Bending', chapters: '6', date: 'Ch 6', labs: [], coming: ['Diagrams', 'Flexure'] },
  { id: 'u7', n: 7, title: 'Transverse shear', chapters: '7', date: 'Ch 7', labs: [], coming: ['Shear', 'Built-up'] },
  { id: 'u8', n: 8, title: 'Beam deflection', chapters: '12', date: 'Ch 12', labs: [], coming: ['Deflection', 'Propped'] },
  { id: 'u9', n: 9, title: 'Torsion', chapters: '5', date: 'Ch 5', labs: [], coming: ['Torsion', 'Twist'] },
  { id: 'u10', n: 10, title: 'Energy methods', chapters: '14', date: 'Ch 14', labs: [], coming: ['Castigliano', 'Drop load'] },
  { id: 'u11', n: 11, title: 'Buckling of columns', chapters: '13', date: 'Ch 13', labs: [], coming: ['Buckling'] },
];

export const LAB_META = {
  cut: { id: 'cut', exam: 'u1', title: 'Inclined cut' },
  'truss-stress': { id: 'truss-stress', exam: 'u1', title: 'Truss stress' },
  pins: { id: 'pins', exam: 'u1', title: 'Pins' },
  shackle: { id: 'shackle', exam: 'u1', title: 'Shackle', app: true },
  'tension-test': { id: 'tension-test', exam: 'u2', title: 'Tension test' },
  poisson: { id: 'poisson', exam: 'u2', title: 'Poisson' },
  brace: { id: 'brace', exam: 'u2', title: 'Brace rod', app: true },
  axial: { id: 'axial', exam: 'u3', title: 'Axial bar' },
  indeterminate: { id: 'indeterminate', exam: 'u3', title: 'Indeterminate bar' },
  rail: { id: 'rail', exam: 'u3', title: 'Welded rail', app: true },
  strain3: { id: 'strain3', exam: 'u4', title: 'Three-dimensional Hooke' },
  vessel: { id: 'vessel', exam: 'u4', title: 'Thin-walled vessel' },
  tank: { id: 'tank', exam: 'u4', title: 'Propane cylinder', app: true },
};

export const CHAPTER_TITLES = {
  1: 'Stress',
  2: 'Strain',
  3: 'Mechanical properties',
  4: 'Axial load',
  8: 'Pressure vessels',
  10: 'Multiaxial strain',
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
