/**
 * Course map for Build a satellite, one entry per unit, in the order of the map's satellite path
 * (map/paths/satellite.js): the aerospace concepts the satellite's subsystems need that no course on
 * the degree teaches. `labs` are built; `coming` is the rest of that unit, still to be written.
 */

export const EXAMS = [
  {
    id: 'u1',
    n: 1,
    title: 'Orbit',
    chapters: '1',
    date: 'Unit 1',
    labs: ['kepler', 'transfer', 'passes'],
    coming: [],
  },
  {
    id: 'u2',
    n: 2,
    title: 'Communications',
    chapters: '2',
    date: 'Unit 2',
    labs: ['noise', 'link', 'doppler'],
    coming: [],
  },
  {
    id: 'u3',
    n: 3,
    title: 'Attitude control',
    chapters: '3',
    date: 'Unit 3',
    labs: ['attitude', 'spin', 'pointing', 'poles', 'wheel', 'budget'],
    coming: [],
  },
  {
    id: 'u4',
    n: 4,
    title: 'Structure',
    chapters: '4',
    date: 'Unit 4',
    labs: ['shake', 'random'],
    coming: [],
  },
  {
    id: 'u5',
    n: 5,
    title: 'Power',
    chapters: '5',
    date: 'Unit 5',
    labs: ['power', 'ageing'],
    coming: [],
  },
  {
    id: 'u6',
    n: 6,
    title: 'Thermal control',
    chapters: '6',
    date: 'Unit 6',
    labs: ['balance', 'nodes'],
    coming: [],
  },
  {
    id: 'u7',
    n: 7,
    title: 'Payload and integration',
    chapters: '7',
    date: 'Unit 7',
    labs: ['mission'],
    coming: ['Payload lab'],
  },
  {
    id: 'u8',
    n: 8,
    title: 'Mission and requirements',
    chapters: '8',
    date: 'Unit 8',
    labs: ['margin'],
    coming: [],
  },
  {
    id: 'u9',
    n: 9,
    title: 'Space environment and radiation',
    chapters: '9',
    date: 'Unit 9',
    labs: ['decay', 'upsets'],
    coming: [],
  },
  {
    id: 'u10',
    n: 10,
    title: 'Avionics, flight software and data',
    chapters: '10',
    date: 'Unit 10',
    labs: ['tasks', 'data'],
    coming: [],
  },
  {
    id: 'u11',
    n: 11,
    title: 'Optical payloads and laser links',
    chapters: '11',
    date: 'Unit 11',
    labs: ['imager', 'laser'],
    coming: [],
  },
  {
    id: 'u12',
    n: 12,
    title: 'Ground systems and operations',
    chapters: '12',
    date: 'Unit 12',
    labs: ['coverage'],
    coming: [],
  },
  {
    id: 'u13',
    n: 13,
    title: 'Environmental test and verification',
    chapters: '13',
    date: 'Unit 13',
    labs: ['levels', 'tvac'],
    coming: [],
  },
  {
    id: 'u14',
    n: 14,
    title: 'In-space propulsion',
    chapters: '14',
    date: 'Unit 14',
    labs: ['propellant', 'spiral'],
    coming: [],
  },
];

export const LAB_META = {
  spiral: { id: 'spiral', exam: 'u14', title: 'Electric spiral' },
  propellant: { id: 'propellant', exam: 'u14', title: 'Propellant budget' },
  tvac: { id: 'tvac', exam: 'u13', title: 'Thermal vacuum' },
  levels: { id: 'levels', exam: 'u13', title: 'Test levels' },
  mission: { id: 'mission', exam: 'u7', title: 'Mission design' },
  coverage: { id: 'coverage', exam: 'u12', title: 'Station coverage' },
  laser: { id: 'laser', exam: 'u11', title: 'Laser link' },
  imager: { id: 'imager', exam: 'u11', title: 'Imager' },
  doppler: { id: 'doppler', exam: 'u2', title: 'Doppler' },
  data: { id: 'data', exam: 'u10', title: 'Data budget' },
  tasks: { id: 'tasks', exam: 'u10', title: 'Flight software' },
  budget: { id: 'budget', exam: 'u3', title: 'Pointing budget' },
  upsets: { id: 'upsets', exam: 'u9', title: 'Memory upsets' },
  decay: { id: 'decay', exam: 'u9', title: 'Orbital decay' },
  margin: { id: 'margin', exam: 'u8', title: 'Mass margin' },
  kepler: { id: 'kepler', exam: 'u1', title: 'Kepler' },
  transfer: { id: 'transfer', exam: 'u1', title: 'Transfer' },
  noise: { id: 'noise', exam: 'u2', title: 'Noise' },
  link: { id: 'link', exam: 'u2', title: 'Link budget' },
  attitude: { id: 'attitude', exam: 'u3', title: 'Attitude' },
  spin: { id: 'spin', exam: 'u3', title: 'Spin' },
  pointing: { id: 'pointing', exam: 'u3', title: 'Pointing' },
  poles: { id: 'poles', exam: 'u3', title: 'Poles' },
  shake: { id: 'shake', exam: 'u4', title: 'Shake' },
  power: { id: 'power', exam: 'u5', title: 'Power' },
  balance: { id: 'balance', exam: 'u6', title: 'Thermal balance' },
  passes: { id: 'passes', exam: 'u1', title: 'Passes' },
  nodes: { id: 'nodes', exam: 'u6', title: 'Two faces' },
  random: { id: 'random', exam: 'u4', title: 'Random vibration' },
  wheel: { id: 'wheel', exam: 'u3', title: 'Wheel' },
  ageing: { id: 'ageing', exam: 'u5', title: 'Ageing' },
};

export const CHAPTER_TITLES = {
  1: 'Orbit',
  2: 'Communications',
  3: 'Attitude control',
  4: 'Structure',
  5: 'Power',
  6: 'Thermal control',
  7: 'Payload and integration',
  8: 'Mission and requirements',
  9: 'Space environment and radiation',
  10: 'Avionics, flight software and data',
  11: 'Optical payloads and laser links',
  12: 'Ground systems and operations',
  13: 'Environmental test and verification',
  14: 'In-space propulsion',
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
