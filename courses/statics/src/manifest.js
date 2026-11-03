import { defineCourse } from '@flux/core';
import { EXAMS, CHAPTER_TITLES } from './data/catalog.js';

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
    chapters: { u1: ['2'], u2: ['3', '4'], u3: ['5', '6'], u4: ['8', '7', '9', '10'] }[exam.id],
    date: exam.date,
    labs: exam.labs,
  })),
  chapters: CHAPTER_TITLES,
  // Measured by `npm run scorecard` against docs/COURSE-STANDARD.md. Set true only once it passes.
  standard: false,
  review: true,
  labs: () => import('./labs/load.js'),
  problems: () => import('./problems/index.js'),
  notes: () => import('./notes/index.js'),
  prereqs: [],
});
