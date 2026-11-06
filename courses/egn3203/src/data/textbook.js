/**
 * Every citation the course shows, in one place. Problems and notes name a topic and ask this file
 * for its citation. Nothing is copied from any source: entries are titles and links.
 */

export const BOOKS = Object.freeze({
  ila: Object.freeze({ short: 'Margalit and Rabinoff', author: 'Dan Margalit and Joseph Rabinoff', title: 'Interactive Linear Algebra', publisher: 'Georgia Institute of Technology', year: 2019, license: 'GFDL', url: 'https://textbooks.math.gatech.edu/ila/' }),
  hefferon: Object.freeze({ short: 'Hefferon', author: 'Jim Hefferon', title: 'Linear Algebra', publisher: 'hefferon.net', year: 2020, license: 'CC BY-SA', url: 'https://hefferon.net/linearalgebra/' }),
});

/** topic → where to read about it. */
export const SECTIONS = Object.freeze({
  matrix: { book: 'ila', section: 'Matrix transformations', title: 'Matrix transformations' },
  elimination: { book: 'ila', section: 'Row reduction', title: 'Row reduction' },
});

export function citation(topic) {
  const s = SECTIONS[topic];
  if (!s) return null;
  const b = BOOKS[s.book];
  return `${b.short}, ${s.title}`;
}
