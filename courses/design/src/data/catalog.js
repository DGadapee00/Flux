/**
 * Course map for Design practice, one entry per unit. `labs` are built; `coming` is the rest of that
 * unit, still to be written. Units follow the map's design path (map/paths/design.js). A project has
 * no textbook chapters, so each unit is its own chapter.
 */

export const EXAMS = [
  {
    id: 'u1',
    n: 1,
    title: 'Fits and stack-ups',
    chapters: '1',
    date: 'Unit 1',
    labs: ['fits', 'stackup'],
    coming: [],
  },
  {
    id: 'u2',
    n: 2,
    title: 'Position and process',
    chapters: '2',
    date: 'Unit 2',
    labs: ['position', 'capability'],
    coming: ['Design for manufacture'],
  },
  {
    id: 'u3',
    n: 3,
    title: 'Choosing a design',
    chapters: '3',
    date: 'Unit 3',
    labs: ['decision', 'intent', 'verify'],
    coming: [],
  },
  {
    id: 'u4',
    n: 4,
    title: 'Joints and mounts',
    chapters: '4',
    date: 'Unit 4',
    labs: ['bolted', 'mount'],
    coming: [],
  },
];

export const LAB_META = {
  fits: { id: 'fits', exam: 'u1', title: 'Fits' },
  stackup: { id: 'stackup', exam: 'u1', title: 'Stack-up' },
  position: { id: 'position', exam: 'u2', title: 'Position' },
  capability: { id: 'capability', exam: 'u2', title: 'Capability' },
  decision: { id: 'decision', exam: 'u3', title: 'Decision' },
  intent: { id: 'intent', exam: 'u3', title: 'Design intent' },
  verify: { id: 'verify', exam: 'u3', title: 'Verification' },
  bolted: { id: 'bolted', exam: 'u4', title: 'Bolted joint' },
  mount: { id: 'mount', exam: 'u4', title: 'Mount' },
};

export const CHAPTER_TITLES = {
  1: 'Fits and stack-ups',
  2: 'Position and process',
  3: 'Choosing a design',
  4: 'Joints and mounts',
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
