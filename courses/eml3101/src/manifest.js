import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';

export const course = defineCourse({
  id: 'eml3101',
  code: 'EML 3101',
  title: 'Thermodynamics II',
  subject: 'thermo',
  track: 'thermal',
  order: 2,
  term: '',
  text: 'Cleynen, Engineering Thermodynamics, cited by topic, beside MIT 16.050',
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
