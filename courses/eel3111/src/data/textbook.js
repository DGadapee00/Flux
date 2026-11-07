/**
 * Every citation the course shows, in one place. Problems and notes name a topic and ask this file
 * for its citation. Nothing is copied from any source: entries are titles and links.
 */

export const BOOKS = Object.freeze({
  kuphaldt: Object.freeze({ short: 'Kuphaldt', author: 'Tony R. Kuphaldt', title: 'Lessons in Electric Circuits, Vol. I: DC', publisher: 'All About Circuits', year: 2006, license: 'Design Science License', url: 'https://www.allaboutcircuits.com/textbook/direct-current/' }),
});

/** topic → where to read about it. */
export const SECTIONS = Object.freeze({
  nodal: { book: 'kuphaldt', section: 'DC network analysis', title: 'Node voltage and mesh current methods' },
});

export function citation(topic) {
  const s = SECTIONS[topic];
  if (!s) return null;
  const b = BOOKS[s.book];
  return `${b.short}, ${s.section}`;
}
