import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';
import { BOOKS } from './data/textbook.js';

export const course = defineCourse({
  id: 'egn3321',
  code: 'EGN 3321',
  title: 'Dynamics',
  subject: 'mechanics',
  track: 'mechanics',
  order: 2,
  term: '',
  text: `${BOOKS.dynamics.short}, ${BOOKS.dynamics.title}`,
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
  prereqs: ['phy2048', 'statics'],
});
