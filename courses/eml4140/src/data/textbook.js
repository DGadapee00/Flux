/**
 * Every citation the course shows, in one place. Problems and notes name a topic and ask this file
 * for its citation. Nothing is copied from any source: entries are titles and links.
 */

export const BOOKS = Object.freeze({
  ahtt: Object.freeze({ short: 'Lienhard and Lienhard', author: 'John H. Lienhard IV and John H. Lienhard V', title: 'A Heat Transfer Textbook', publisher: 'Phlogiston Press', year: 2020, license: 'free to download', url: 'https://ahtt.mit.edu' }),
});

/** topic → where to read about it. */
export const SECTIONS = Object.freeze({
  'heat-equation': { book: 'ahtt', section: 'Chapter 2', title: 'Heat conduction concepts' },
});

export function citation(topic) {
  const s = SECTIONS[topic];
  if (!s) return null;
  const b = BOOKS[s.book];
  return `${b.short}, ${s.section}: ${s.title}`;
}
