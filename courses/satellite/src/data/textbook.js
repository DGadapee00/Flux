/**
 * Every citation the course shows, in one place. Problems and notes name a topic and ask this file
 * for its citation. Nothing is copied from any source: entries are titles and links.
 */

export const BOOKS = Object.freeze({
  mit1607: Object.freeze({ short: 'MIT 16.07', author: 'MIT OpenCourseWare', title: '16.07 Dynamics, Fall 2009, lecture notes', publisher: 'MIT OpenCourseWare', year: 2009, license: 'CC BY-NC-SA, cited by link only', url: 'https://ocw.mit.edu/courses/16-07-dynamics-fall-2009/' }),
  mit16851: Object.freeze({ short: 'MIT 16.851', author: 'MIT OpenCourseWare', title: '16.851 Satellite Engineering, Fall 2003, lecture notes', publisher: 'MIT OpenCourseWare', year: 2003, license: 'CC BY-NC-SA, cited by link only', url: 'https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/' }),
  nasaSoa: Object.freeze({ short: 'NASA SoA', author: 'NASA Small Spacecraft Systems Virtual Institute', title: 'State-of-the-Art of Small Spacecraft Technology, 2026 edition', publisher: 'NASA', year: 2026, license: 'NASA publication, cited by link only', url: 'https://www.nasa.gov/smallsat-institute/sst-soa/' }),
  nasaSeh: Object.freeze({ short: 'NASA SE Handbook', author: 'NASA', title: 'NASA Systems Engineering Handbook, NASA/SP-2016-6105 Rev 2', publisher: 'NASA', year: 2016, license: 'NASA publication, cited by link only', url: 'https://www.nasa.gov/reference/systems-engineering-handbook/' }),
});

/**
 * The SoA report's chapters, each with the satellite unit that covers its subsystem. `unit` is
 * null where no unit covers it yet. courses/satellite/COVERAGE.md has the detail.
 */
const SOA = 'https://www.nasa.gov/smallsat-institute/sst-soa/';
export const SOA_CHAPTERS = Object.freeze([
  { n: 1, title: 'Introduction', url: `${SOA}introduction`, unit: null },
  { n: 2, title: 'Complete Spacecraft Platforms', url: `${SOA}platforms`, unit: 'u7' },
  { n: 3, title: 'Power', url: `${SOA}power-subsystems`, unit: 'u5' },
  { n: 4, title: 'In-Space Propulsion', url: `${SOA}in-space_propulsion`, unit: 'u14' },
  { n: 5, title: 'Guidance, Navigation, and Control', url: `${SOA}guidance-navigation-and-control`, unit: 'u3' },
  { n: 6, title: 'Structures, Materials, and Mechanisms', url: `${SOA}structures-materials-and-mechanisms`, unit: 'u4' },
  { n: 7, title: 'Thermal Control', url: `${SOA}thermal-control`, unit: 'u6' },
  { n: 8, title: 'Small Spacecraft Avionics', url: `${SOA}small-spacecraft-avionics`, unit: 'u10' },
  { n: 9, title: 'Communications', url: `${SOA}soa-communications`, unit: 'u2' },
  { n: 10, title: 'Integration, Launch, and Deployment', url: `${SOA}integration-launch-and-deployment`, unit: 'u4' },
  { n: 11, title: 'Ground Data Systems and Mission Operations', url: `${SOA}ground-data-systems-and-mission-operations`, unit: 'u12' },
  { n: 12, title: 'Identification and Tracking Systems', url: `${SOA}identification-and-tracking-systems`, unit: 'u17' },
  { n: 13, title: 'Deorbit Systems', url: `${SOA}deorbit-systems`, unit: null },
]);

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
