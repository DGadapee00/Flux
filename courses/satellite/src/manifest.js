import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';

export const course = defineCourse({
  id: 'satellite',
  code: 'SAT',
  title: 'Build a satellite',
  subject: 'mechanics',
  track: 'projects',
  order: 3,
  term: '',
  text: 'MIT 16.07 Dynamics lecture notes, cited by link, beside MIT 16.851 Satellite Engineering',
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
