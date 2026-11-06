/**
 * Every citation the course shows, in one place. Problems and notes name a topic and ask this file
 * for its citation. Nothing is copied from any source: entries are titles and links.
 * A project has no textbook, so each topic cites the reference the map's concept cites.
 */

export const BOOKS = Object.freeze({
  wikipedia: Object.freeze({ short: 'Wikipedia', author: 'Wikipedia contributors', title: 'Wikipedia', publisher: 'Wikimedia Foundation', year: 2026, license: 'CC BY-SA 4.0', url: 'https://en.wikipedia.org/' }),
  mit2008: Object.freeze({ short: 'MIT 2.008', author: 'MIT OpenCourseWare', title: '2.008 Design and Manufacturing II, Spring 2025', publisher: 'MIT OpenCourseWare', year: 2025, license: 'CC BY-NC-SA 4.0', url: 'https://ocw.mit.edu/courses/2-008-design-and-manufacturing-ii-spring-2025/' }),
  mit272: Object.freeze({ short: 'MIT 2.72', author: 'MIT OpenCourseWare', title: '2.72 Elements of Mechanical Design, Spring 2009', publisher: 'MIT OpenCourseWare', year: 2009, license: 'CC BY-NC-SA 4.0', url: 'https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/' }),
  mit2007: Object.freeze({ short: 'MIT 2.007', author: 'MIT OpenCourseWare', title: '2.007 Design and Manufacturing I, Spring 2009', publisher: 'MIT OpenCourseWare', year: 2009, license: 'CC BY-NC-SA 4.0', url: 'https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/' }),
});

/** topic → where to read about it. */
export const SECTIONS = Object.freeze({
  fits: { book: 'wikipedia', section: 'Engineering fit', title: 'Engineering fit' },
  stackup: { book: 'wikipedia', section: 'Tolerance analysis', title: 'Tolerance analysis' },
  position: { book: 'wikipedia', section: 'Geometric dimensioning and tolerancing', title: 'Geometric dimensioning and tolerancing' },
  capability: { book: 'mit2008', section: 'Lecture 11', title: 'Variation and quality' },
  decision: { book: 'mit2007', section: 'Lecture 2', title: 'Problem definition and design' },
  intent: { book: 'mit2007', section: 'Lecture 4', title: 'Sketching and drawings' },
  verify: { book: 'wikipedia', section: 'Factor of safety', title: 'Factor of safety' },
  bolted: { book: 'mit272', section: 'Lecture 10', title: 'Bolted joints' },
  mount: { book: 'mit272', section: 'Lecture 6', title: 'Constraints, exact constraint design' },
});

export function citation(topic) {
  const s = SECTIONS[topic];
  if (!s) return null;
  const b = BOOKS[s.book];
  return `${b.short}, ${s.title}`;
}
