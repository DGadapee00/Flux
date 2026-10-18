import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';
import { BOOKS } from './data/textbook.js';

export const course = defineCourse({
  id: 'egn3331',
  code: 'EGN 3331',
  title: 'Mechanics of Materials',
  subject: 'mechanics',
  track: 'mechanics',
  order: 3,
  term: '',
  text: `${BOOKS.roylance.author}, ${BOOKS.roylance.title} (${BOOKS.roylance.publisher})`,
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
  prereqs: ['statics', 'mac2311'],
});
