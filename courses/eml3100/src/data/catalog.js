/**
 * Course map. `labs` are built. `coming` is the rest of that unit, still to be written.
 * Chapter numbers are Yan's (src/data/textbook.js), so "Ch 2" in the practice list is the chapter
 * a student reads. The course pack sets which topics are covered and in what order (PLAN.md, D11).
 */

export const EXAMS = [
  {
    id: 'u1',
    n: 1,
    title: 'Pure substances and ideal gases',
    chapters: '2, 3',
    date: 'Yan Ch 2–3',
    labs: ['phase'],
    coming: [],
  },
  {
    id: 'u2',
    n: 2,
    title: 'First law for closed systems',
    chapters: '4',
    date: 'Yan Ch 4',
    labs: ['piston'],
    coming: [],
  },
];

export const LAB_META = {
  phase: { id: 'phase', exam: 'u1', title: 'Phase diagram' },
  piston: { id: 'piston', exam: 'u2', title: 'Boundary work' },
};

export const CHAPTER_TITLES = {
  2: 'Properties of a pure substance',
  3: 'Ideal and real gases',
  4: 'The first law for closed systems',
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
