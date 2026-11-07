/**
 * Every citation the course shows, in one place. Problems and notes name a topic and ask this file
 * for its citation. Nothing is copied from any source: entries are titles and links.
 */

export const BOOKS = Object.freeze({
  mit1607: Object.freeze({ short: 'MIT 16.07', author: 'MIT OpenCourseWare', title: '16.07 Dynamics, Fall 2009, lecture notes', publisher: 'MIT OpenCourseWare', year: 2009, license: 'CC BY-NC-SA, cited by link only', url: 'https://ocw.mit.edu/courses/16-07-dynamics-fall-2009/' }),
});

/** topic → where to read about it. */
export const SECTIONS = Object.freeze({
  kepler: { book: 'mit1607', section: 'Lecture 15', title: 'Orbit determination and Kepler’s equation' },
});

export function citation(topic) {
  const s = SECTIONS[topic];
  if (!s) return null;
  const b = BOOKS[s.book];
  return `${b.short}, ${s.section}`;
}
