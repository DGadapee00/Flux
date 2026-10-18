import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';
import { BOOKS } from './data/textbook.js';

export const course = defineCourse({
  id: 'eml3100',
  code: 'EML 3100',
  title: 'Thermodynamics',
  subject: 'thermo',
  track: 'thermal',
  order: 1,
  term: '',
  text: `${BOOKS.yan.author}, ${BOOKS.yan.title}; ${BOOKS.up2.publisher} ${BOOKS.up2.title}`,
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
  prereqs: ['phy2048', 'mac2311'],
});
