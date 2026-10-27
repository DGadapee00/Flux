import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';

export const course = defineCourse({
  id: 'bench',
  code: 'BENCH',
  title: 'Electronics on the bench',
  subject: 'em',
  track: 'projects',
  order: 1,
  term: '',
  text: 'Kuphaldt, Lessons in Electric Circuits, and the parts\' datasheets',
  units: EXAMS.map((exam) => ({
    id: exam.id,
    title: exam.title,
    chapters: [exam.chapters],
    date: exam.date,
    labs: exam.labs,
  })),
  chapters: {},
  // Measured by `npm run scorecard` against docs/COURSE-STANDARD.md. Set true only once it passes.
  standard: false,
  labs: () => import('./labs/load.js'),
  problems: () => import('./problems/index.js'),
  notes: () => import('./notes/index.js'),
  prereqs: ['phy2049'],
});
