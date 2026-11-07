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
];

export const LAB_META = {
  kepler: { id: 'kepler', exam: 'u1', title: 'Kepler' },
};

export const CHAPTER_TITLES = {
  1: 'Orbit',
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
