import { defineCourse } from '@flux/core';
import { EXAMS, CHAPTER_TITLES } from './data/catalog.js';

export const course = defineCourse({
  id: 'mac2311',
  code: 'MAC 2311–2312',
  title: 'Calculus I and II',
  subject: 'math',
  track: 'math',
  order: 1,
  term: null,
  text: 'OpenStax, Calculus Volumes 1 and 2',
  units: EXAMS.map((exam) => ({
    id: exam.id,
    title: exam.title,
    chapters: [exam.chapters],
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
