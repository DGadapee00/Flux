/**
 * Every citation the course shows, in one place. Problems and notes name a topic and ask this file
 * for its citation. Nothing is copied from any source: entries are titles and links.
 */

export const BOOKS = Object.freeze({
  cleynen: Object.freeze({ short: 'Cleynen', author: 'Olivier Cleynen', title: 'Engineering Thermodynamics', publisher: 'thermodynamicsbook.com', license: 'open textbook, terms on the book’s site', url: 'https://thermodynamicsbook.com/' }),
});

/** topic → where to read about it. */
export const SECTIONS = Object.freeze({
  mixtures: { book: 'cleynen', section: 'Perfect gases', title: 'The ideal-gas model that mixtures are built from' },
});

export function citation(topic) {
  const s = SECTIONS[topic];
  if (!s) return null;
  const b = BOOKS[s.book];
  return `${b.short}, ${s.section}`;
}
