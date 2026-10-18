import { defineCourse } from '@flux/core';
import { CHAPTER_TITLES, UNITS } from './data/catalog.js';

export const TRACK = [
  { id: 'phy2049', label: 'PHY 2049', href: '../phy2049/' },
  { id: 'mac2313', label: 'MAC 2313', href: '../mac2313/' },
  { id: 'statics', label: 'EGN 3311', href: '../statics/' },
  { id: 'sta3032', label: 'STA 3032', href: '../sta3032/' },
];

export const course = defineCourse({
  id: 'sta3032',
  code: 'STA 3032',
  title: 'Probability and Statistics',
  subject: 'stats',
  track: 'stats',
  order: 1,
  term: 'Fall 2026',
  units: UNITS.map((unit) => ({
    id: unit.id,
    title: unit.title,
    chapters: unit.chapters,
    date: unit.date,
    labs: unit.labs,
  })),
  chapters: CHAPTER_TITLES,
  // Measured by `npm run scorecard` against docs/COURSE-STANDARD.md. Set true only once it passes.
  standard: false,
  labs: () => import('./labs/index.js'),
  problems: () => import('./problems/index.js'),
  prereqs: [],
});
