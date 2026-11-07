import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';

export const course = defineCourse({
  id: 'eml4140',
  code: 'EML 4140',
  title: 'Heat Transfer',
  subject: 'heat',
  track: 'thermal',
  order: 3,
  term: '',
  text: 'Lienhard and Lienhard, A Heat Transfer Textbook, cited by topic, beside MIT 2.51',
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
