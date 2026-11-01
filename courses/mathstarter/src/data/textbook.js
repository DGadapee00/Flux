/**
 * Every citation the course shows, in one place (DECISIONS.md, D7, D13, D14, D21). Problems and
 * notes name a topic and ask this file for its citation, so changing books changes this file only.
 * Nothing is copied from any source: entries are section numbers and titles. EXAMPLE: replace.
 */

export const BOOKS = Object.freeze({
  example: Object.freeze({
    short: 'Example',
    author: 'Author',
    title: 'Open textbook title',
    publisher: 'Publisher',
    year: 2026,
    license: 'Licence, verified on the publisher page',
    url: 'https://example.org/',
  }),
});

/** topic → where to read about it. */
export const SECTIONS = Object.freeze({
  'net-rate': { book: 'example', section: '1.1', title: 'Rates' },
  accumulation: { book: 'example', section: '2.1', title: 'Accumulation' },
});

export function citation(topic) {
  const s = SECTIONS[topic];
  if (!s) return null;
  const b = BOOKS[s.book];
  return `${b.short} §${s.section}`;
}
