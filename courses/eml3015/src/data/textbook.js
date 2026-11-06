/**
 * Every citation the course shows, in one place. Problems and notes name a topic and ask this file
 * for its citation. Nothing is copied from any source: entries are chapter numbers and titles.
 */

export const BOOKS = Object.freeze({
  cleynen: Object.freeze({
    short: 'Cleynen',
    author: 'Olivier Cleynen',
    title: 'Fluid Dynamics for Engineers',
    publisher: 'fluidmech.ninja',
    year: 2021,
    license: 'CC-BY-SA, stated on the book’s site',
    url: 'https://fluidmech.ninja/',
  }),
});

/** topic → where to read about it. */
export const SECTIONS = Object.freeze({
  viscosity: { book: 'cleynen', section: '5', title: 'Effects of shear' },
  diffusion: { book: 'cleynen', section: '5', title: 'Effects of shear' },
});

export function citation(topic) {
  const s = SECTIONS[topic];
  if (!s) return null;
  const b = BOOKS[s.book];
  return `${b.short} ch. ${s.section}`;
}
