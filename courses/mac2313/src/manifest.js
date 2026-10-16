import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';

export const course = defineCourse({
  id: 'mac2313',
  code: 'MAC 2313',
  title: 'Calculus III',
  subject: 'math',
  track: 'math',
  order: 3,
  term: 'Spring 2026',
  units: EXAMS.map((exam) => ({
    id: exam.id,
    title: exam.title,
    chapters: [exam.chapters],
    date: exam.date,
    labs: exam.labs,
  })),
  chapters: {},
  labs: () => import('./labs/load.js'),
  problems: () => import('./problems/index.js'),
  prereqs: [],
});
