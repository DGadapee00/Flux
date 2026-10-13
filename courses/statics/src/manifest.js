import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';

export const TRACK = [
  { id: 'phy2049', label: 'PHY 2049', href: '../phy2049/' },
  { id: 'mac2313', label: 'MAC 2313', href: '../mac2313/' },
  { id: 'statics', label: 'EGN 3311', href: '../statics/' },
  { id: 'sta3032', label: 'STA 3032', href: '../sta3032/' },
];

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
    chapters: [exam.chapters],
    date: exam.date,
    labs: exam.labs,
  })),
  chapters: {},
  labs: () => import('./labs/load.js'),
  problems: () => import('./problems/index.js'),
  prereqs: [],
});
