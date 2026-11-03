/**
 * Course map, one entry per unit in the OCW program's order (DECISIONS.md, D23). `labs` are built;
 * `coming` is the rest of that unit, still to be written. EXAMPLE: replace with the spine's units.
 */

export const EXAMS = [
  {
    id: 'u1',
    n: 1,
    title: 'Example unit',
    chapters: '1, 2',
    date: null,
    labs: ['tank'],
    // Labs planned in the spine but not built yet go here; the unit lists them as coming.
    coming: ['Second lab'],
  },
];

export const LAB_META = {
  tank: { id: 'tank', exam: 'u1', title: 'Tank', app: false },
};

export const CHAPTER_TITLES = {
  1: 'Rates',
  2: 'Accumulation',
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
