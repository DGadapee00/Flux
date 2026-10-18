import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';

export const course = defineCourse({
  id: 'mac2311',
  code: 'MAC 2311',
  title: 'Calculus I',
  subject: 'math',
  track: 'math',
  order: 1,
  term: null,
  text: 'OpenStax, Calculus Volume 1',
  units: EXAMS.map((exam) => ({
    id: exam.id,
    title: exam.title,
    chapters: [exam.chapters],
    date: exam.date,
    labs: exam.labs,
  })),
  chapters: {
    2: 'Limits',
    3: 'Derivatives',
    4: 'Applications of differentiation',
    5: 'Integration',
  },
  // Measured by `npm run scorecard` against docs/COURSE-STANDARD.md. Set true only once it passes.
  standard: false,
  review: true,
  labs: () => import('./labs/load.js'),
  problems: () => import('./problems/index.js'),
  notes: () => import('./notes/index.js'),
  prereqs: [],
});
