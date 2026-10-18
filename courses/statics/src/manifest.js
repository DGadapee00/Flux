import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';

export const course = defineCourse({
  id: 'statics',
  code: 'EGN 3311',
  title: 'Statics',
  subject: 'mechanics',
  track: 'mechanics',
  order: 1,
  term: '',
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
  review: true,
  labs: () => import('./labs/load.js'),
  problems: () => import('./problems/index.js'),
  prereqs: [],
});
