/**
 * Course map for EEL 3111 Circuit Analysis I, one entry per unit. `labs` are built; `coming` is the
 * rest of that unit, still to be written. Units follow the map's EEL 3111 path (map/paths/eel3111.js).
 */

export const EXAMS = [
  {
    id: 'u1',
    n: 1,
    title: 'Methods of analysis',
    chapters: '1',
    date: 'Unit 1',
    labs: ['nodes', 'dependent'],
    coming: [],
  },
  {
    id: 'u2',
    n: 2,
    title: 'Sinusoidal steady state',
    chapters: '2',
    date: 'Unit 2',
    labs: ['phasors', 'filter', 'power'],
    coming: [],
  },
  {
    id: 'u3',
    n: 3,
    title: 'Circuit theorems',
    chapters: '3',
    date: 'Unit 3',
    labs: ['superpose', 'thevenin'],
    coming: [],
  },
  {
    id: 'u4',
    n: 4,
    title: 'First-order circuits',
    chapters: '4',
    date: 'Unit 4',
    labs: ['switch'],
    coming: ['Second-order circuits'],
  },
  {
    id: 'u5',
    n: 5,
    title: 'Operational amplifiers',
    chapters: '5',
    date: 'Unit 5',
    labs: ['opamp'],
    coming: [],
  },
];

export const LAB_META = {
  nodes: { id: 'nodes', exam: 'u1', title: 'Nodes' },
  dependent: { id: 'dependent', exam: 'u1', title: 'Dependent' },
  phasors: { id: 'phasors', exam: 'u2', title: 'Phasors' },
  filter: { id: 'filter', exam: 'u2', title: 'Filter' },
  power: { id: 'power', exam: 'u2', title: 'Power factor' },
  superpose: { id: 'superpose', exam: 'u3', title: 'Superpose' },
  thevenin: { id: 'thevenin', exam: 'u3', title: 'Thévenin' },
  switch: { id: 'switch', exam: 'u4', title: 'Switch' },
  opamp: { id: 'opamp', exam: 'u5', title: 'Op amp' },
};

export const CHAPTER_TITLES = {
  1: 'Methods of analysis',
  2: 'Sinusoidal steady state',
  3: 'Circuit theorems',
  4: 'First-order circuits',
  5: 'Operational amplifiers',
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
