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
    labs: ['viscosity', 'capillary'],
    coming: ['Couette and Poiseuille flow'],
  },
  {
    id: 'u2',
    n: 2,
    title: 'Pressure on walls and in moving tanks',
    chapters: '4',
    date: 'Unit 2',
    labs: ['gate', 'rigid-tank', 'float'],
    coming: [],
  },
  {
    id: 'u3',
    n: 3,
    title: 'Following the flow',
    chapters: '6',
    date: 'Unit 3',
    labs: ['nozzle', 'bend', 'continuity', 'transport', 'vane', 'pipe', 'headloss', 'network', 'model', 'layer', 'drag'],
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
  vane: { id: 'vane', exam: 'u3', title: 'Vane' },
  pipe: { id: 'pipe', exam: 'u3', title: 'Pipe' },
  headloss: { id: 'headloss', exam: 'u3', title: 'Head loss' },
  network: { id: 'network', exam: 'u3', title: 'Network' },
  model: { id: 'model', exam: 'u3', title: 'Model' },
  layer: { id: 'layer', exam: 'u3', title: 'Boundary layer' },
  capillary: { id: 'capillary', exam: 'u1', title: 'Capillary' },
  float: { id: 'float', exam: 'u2', title: 'Floating' },
  drag: { id: 'drag', exam: 'u3', title: 'Drag' },
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
