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
  // Labs arrive with the physics shell, after 23 Oct 2026.
  labs: () => Promise.resolve({}),
  problems: () => import('./problems/index.js'),
});
