import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';

export const course = defineCourse({
  id: 'egn3321',
  code: 'EGN 3321',
  title: 'Dynamics',
  subject: 'mechanics',
  track: 'mechanics',
  order: 2,
  term: '',
  text: 'Hibbeler, Engineering Mechanics: Dynamics',
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
  notes: () => import('./notes/index.js'),
  prereqs: ['phy2048', 'statics'],
});
