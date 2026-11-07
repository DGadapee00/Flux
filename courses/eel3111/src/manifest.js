import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';

export const course = defineCourse({
  id: 'eel3111',
  code: 'EEL 3111',
  title: 'Circuit Analysis I',
  subject: 'circuits',
  track: 'circuits',
  order: 3,
  term: '',
  text: 'Kuphaldt, Lessons in Electric Circuits, Vol. I, cited by topic, beside MIT 6.002',
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
  prereqs: [],
});
