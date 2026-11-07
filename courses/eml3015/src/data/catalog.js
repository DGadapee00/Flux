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
  {
    id: 'u2',
    n: 2,
    title: 'Pressure on walls and in moving tanks',
    chapters: '4',
    date: 'Unit 2',
    labs: ['gate', 'rigid-tank'],
    coming: ['Buoyancy and stability'],
  },
  {
    id: 'u3',
    n: 3,
    title: 'Following the flow',
    chapters: '6',
    date: 'Unit 3',
    labs: ['nozzle', 'bend', 'continuity', 'transport', 'pipe', 'model', 'layer'],
    coming: [],
  },
];

export const LAB_META = {
  viscosity: { id: 'viscosity', exam: 'u1', title: 'Viscosity' },
  gate: { id: 'gate', exam: 'u2', title: 'Gate' },
  'rigid-tank': { id: 'rigid-tank', exam: 'u2', title: 'Accelerating tank' },
  nozzle: { id: 'nozzle', exam: 'u3', title: 'Nozzle' },
  bend: { id: 'bend', exam: 'u3', title: 'Bend' },
  continuity: { id: 'continuity', exam: 'u3', title: 'Continuity' },
  transport: { id: 'transport', exam: 'u3', title: 'Transport' },
  pipe: { id: 'pipe', exam: 'u3', title: 'Pipe' },
  model: { id: 'model', exam: 'u3', title: 'Model' },
  layer: { id: 'layer', exam: 'u3', title: 'Boundary layer' },
};

export const CHAPTER_TITLES = {
  4: 'Effects of pressure',
  5: 'Effects of shear',
  6: 'Prediction of fluid flows',
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
