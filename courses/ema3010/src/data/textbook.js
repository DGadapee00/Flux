/**
 * Every citation the course shows, in one place. Problems and notes name a topic and ask this file
 * for its citation. Nothing is copied from any source: entries are titles and links.
 */

export const BOOKS = Object.freeze({
  chem: Object.freeze({ short: 'OpenStax Chemistry 2e', author: 'Paul Flowers, Klaus Theopold, Richard Langley and William R. Robinson', title: 'Chemistry 2e', publisher: 'OpenStax', year: 2019, license: 'CC BY 4.0', url: 'https://openstax.org/details/books/chemistry-2e' }),
});

/** topic → where to read about it. */
export const SECTIONS = Object.freeze({
  bonding: { book: 'chem', section: '7.5', title: 'Strengths of ionic and covalent bonds' },
});

export function citation(topic) {
  const s = SECTIONS[topic];
  if (!s) return null;
  const b = BOOKS[s.book];
  return `${b.short}, §${s.section} ${s.title}`;
}
