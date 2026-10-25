import { defineCourse } from '@flux/core';
import { CHAPTERS, UNITS } from './catalog.js';

export const course = defineCourse({
  id: 'phy2048',
  code: 'PHY 2048',
  title: 'Physics I',
  subject: 'mechanics',
  track: 'physics',
  order: 1,
  term: '',
  text: 'OpenStax, University Physics Volume 1',
  units: UNITS.map((unit) => ({
    id: unit.id,
    title: unit.title,
    chapters: unit.chapters,
    date: unit.date,
    labs: unit.labs,
  })),
  chapters: CHAPTERS,
  // Numbers are computed here. The scene is drawn after the physics shell moves.
  // Measured by `npm run scorecard` against docs/COURSE-STANDARD.md. Set true only once it passes.
  standard: false,
  labs: () => import('./labs/load.js'),
  problems: () => import('./problems/index.js'),
  notes: () => import('./notes/index.js'),
});
