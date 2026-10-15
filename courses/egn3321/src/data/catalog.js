/** Course map. `labs` are built. `coming` is the rest of that unit, still to be written. */

export const EXAMS = [
  {
    id: 'u1',
    n: 1,
    title: 'Particle kinematics',
    chapters: '1, 12',
    date: 'Ch 12',
    labs: ['rectilinear', 'path-nt', 'relative'],
    coming: [],
  },
  {
    id: 'u2',
    n: 2,
    title: 'Force and acceleration',
    chapters: '13',
    date: 'Ch 13',
    labs: ['fma', 'curve'],
    coming: [],
  },
  {
    id: 'u3',
    n: 3,
    title: 'Work and energy',
    chapters: '14',
    date: 'Ch 14',
    labs: ['collar', 'paths'],
    coming: [],
  },
  {
    id: 'u4',
    n: 4,
    title: 'Impulse and momentum',
    chapters: '15',
    date: 'Ch 15',
    labs: ['impulse', 'impact', 'rocket'],
    coming: [],
  },
  {
    id: 'u5',
    n: 5,
    title: 'Rigid-body kinematics',
    chapters: '16',
    date: 'Ch 16',
    labs: ['ic', 'slider-crank', 'rolling'],
    coming: [],
  },
  {
    id: 'u6',
    n: 6,
    title: 'Rigid-body kinetics',
    chapters: '17',
    date: 'Ch 17',
    labs: ['inertia', 'pendulum', 'roll-slip'],
    coming: [],
  },
  {
    id: 'u7',
    n: 7,
    title: 'Rigid-body energy',
    chapters: '18',
    date: 'Ch 18',
    labs: ['race', 'linkage'],
    coming: [],
  },
];

export const LAB_META = {
  rectilinear: { id: 'rectilinear', exam: 'u1', title: 'Rectilinear' },
  'path-nt': { id: 'path-nt', exam: 'u1', title: 'Path' },
  relative: { id: 'relative', exam: 'u1', title: 'Relative' },
  fma: { id: 'fma', exam: 'u2', title: 'F = ma' },
  curve: { id: 'curve', exam: 'u2', title: 'Curve' },
  collar: { id: 'collar', exam: 'u3', title: 'Collar' },
  paths: { id: 'paths', exam: 'u3', title: 'Paths' },
  impulse: { id: 'impulse', exam: 'u4', title: 'Impulse' },
  impact: { id: 'impact', exam: 'u4', title: 'Impact' },
  rocket: { id: 'rocket', exam: 'u4', title: 'Rocket' },
  ic: { id: 'ic', exam: 'u5', title: 'Centre' },
  'slider-crank': { id: 'slider-crank', exam: 'u5', title: 'Slider-crank' },
  rolling: { id: 'rolling', exam: 'u5', title: 'Rolling' },
  inertia: { id: 'inertia', exam: 'u6', title: 'Inertia' },
  pendulum: { id: 'pendulum', exam: 'u6', title: 'Pendulum' },
  'roll-slip': { id: 'roll-slip', exam: 'u6', title: 'Roll or slip' },
  race: { id: 'race', exam: 'u7', title: 'Race' },
  linkage: { id: 'linkage', exam: 'u7', title: 'Linkage' },
};

export const CHAPTER_TITLES = {
  1: 'Units and significant figures',
  12: 'Kinematics of a particle',
  13: 'Kinetics of a particle: force and acceleration',
  14: 'Kinetics of a particle: work and energy',
  15: 'Kinetics of a particle: impulse and momentum',
  16: 'Planar kinematics of a rigid body',
  17: 'Planar kinetics of a rigid body: force and acceleration',
  18: 'Planar kinetics of a rigid body: work and energy',
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
