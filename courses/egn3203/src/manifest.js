import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';

export const course = defineCourse({
  id: 'egn3203',
  code: 'EGN 3203',
  title: 'Modern Computation Methods',
  subject: 'linalg',
  track: 'math',
  order: 4,
  term: '',
  text: 'Margalit and Rabinoff, Interactive Linear Algebra, and Hefferon, Linear Algebra, cited by topic',
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
