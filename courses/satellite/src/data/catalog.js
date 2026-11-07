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
    labs: ['kepler'],
    coming: ['Rocket equation', 'Orbit transfers'],
  },
  {
    id: 'u2',
    n: 2,
    title: 'Communications',
    chapters: '2',
    date: 'Unit 2',
    labs: ['noise', 'link'],
    coming: [],
  },
  {
    id: 'u3',
    n: 3,
    title: 'Attitude control',
    chapters: '3',
    date: 'Unit 3',
    labs: ['attitude', 'spin', 'pointing'],
    coming: ['Transfer functions'],
  },
];

export const LAB_META = {
  kepler: { id: 'kepler', exam: 'u1', title: 'Kepler' },
  noise: { id: 'noise', exam: 'u2', title: 'Noise' },
  link: { id: 'link', exam: 'u2', title: 'Link budget' },
  attitude: { id: 'attitude', exam: 'u3', title: 'Attitude' },
  spin: { id: 'spin', exam: 'u3', title: 'Spin' },
  pointing: { id: 'pointing', exam: 'u3', title: 'Pointing' },
};

export const CHAPTER_TITLES = {
  1: 'Orbit',
  2: 'Communications',
  3: 'Attitude control',
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
