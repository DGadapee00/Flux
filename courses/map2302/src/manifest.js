import { defineCourse } from '@flux/core';
import { EXAMS, CHAPTER_TITLES } from './data/catalog.js';

export const course = defineCourse({
  id: 'map2302',
  code: 'MAP 2302',
  title: 'Differential Equations',
  subject: 'math',
  track: 'math',
  order: 4,
  term: '',
  text: 'OCW 18.03SC Fall 2011; Lebl, Notes on Diffy Qs',
  units: EXAMS.map((exam) => ({
    id: exam.id,
    title: exam.title,
    chapters: [exam.chapters],
    date: exam.date,
    labs: exam.labs,
  })),
  chapters: CHAPTER_TITLES,
  // Only Dalton may flip this after reviewing a built unit as a student.
  standard: false,
  labs: () => import('./labs/load.js'),
  problems: () => import('./problems/index.js'),
  notes: () => import('./notes/index.js'),
  prereqs: ['mac2311'],
});
