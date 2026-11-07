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
    labs: ['nodes'],
    coming: ['Dependent sources'],
  },
];

export const LAB_META = {
  nodes: { id: 'nodes', exam: 'u1', title: 'Nodes' },
};

export const CHAPTER_TITLES = {
  1: 'Methods of analysis',
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
