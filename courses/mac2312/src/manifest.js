import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';

export const TRACK = [
  { id: 'mac2311', label: 'MAC 2311', href: '../mac2311/' },
  { id: 'mac2312', label: 'MAC 2312', href: '../mac2312/' },
  { id: 'mac2313', label: 'MAC 2313', href: '../mac2313/' },
];

export const course = defineCourse({
  id: 'mac2312',
  code: 'MAC 2312',
  title: 'Calculus II',
  subject: 'math',
  track: 'math',
  order: 2,
  term: null,
  text: 'OpenStax, Calculus Volume 2',
  units: EXAMS.map((exam) => ({
    id: exam.id,
    title: exam.title,
    chapters: [exam.chapters],
    date: exam.date,
    labs: exam.labs,
  })),
  chapters: {
    2: 'Applications of integration',
    3: 'Techniques of integration',
    5: 'Sequences and series',
    6: 'Power series',
    7: 'Parametric and polar',
  },
  labs: () => import('./labs/load.js'),
  problems: () => import('./problems/index.js'),
  prereqs: [],
});
