/**
 * Tracks the hub shows, courses in degree order.
 * A course with href is built and opens that app. href null is not built yet.
 * A relative href is the copy in this repo. An absolute href is that course's own site.
 * Statics is EGN 3311 and MAC 2313 was Spring 2026 (PLAN.md, D5).
 * Codes for courses that are not built yet are the Florida common numbers from the plan.
 * Dynamics has no code until that course is started.
 */
export const TRACKS = [
  {
    id: 'physics',
    name: 'Physics',
    courses: [
      { id: 'phy2048', code: 'PHY 2048', title: 'Physics I', term: null, href: null },
      {
        id: 'phy2049',
        code: 'PHY 2049',
        title: 'Physics II',
        term: 'Fall 2026',
        href: 'phy2049/',
      },
    ],
  },
  {
    id: 'math',
    name: 'Math',
    courses: [
      { id: 'mac2311', code: 'MAC 2311', title: 'Calculus I', term: null, href: null },
      { id: 'mac2312', code: 'MAC 2312', title: 'Calculus II', term: null, href: null },
      {
        id: 'mac2313',
        code: 'MAC 2313',
        title: 'Calculus III',
        term: 'Spring 2026',
        href: 'mac2313/',
      },
      { id: 'map2302', code: 'MAP 2302', title: 'Differential equations', term: null, href: null },
    ],
  },
  {
    id: 'mechanics',
    name: 'Mechanics',
    courses: [
      {
        id: 'statics',
        code: 'EGN 3311',
        title: 'Statics',
        term: null,
        href: 'statics/',
      },
      { id: 'dynamics', code: null, title: 'Dynamics', term: null, href: null },
    ],
  },
  {
    id: 'stats',
    name: 'Statistics',
    courses: [
      {
        id: 'sta3032',
        code: 'STA 3032',
        title: 'Probability and Statistics',
        term: 'Fall 2026',
        href: 'sta3032/',
      },
    ],
  },
];

/**
 * The last built course in degree order. The card opens this one.
 * @param {{ courses: { href: string|null }[] }} track
 */
export function latestBuilt(track) {
  let found = null;
  for (const course of track.courses) {
    if (course.href) found = course;
  }
  return found;
}

/**
 * @param {{ courses: { href: string|null }[] }[]} tracks
 */
export function builtCourses(tracks = TRACKS) {
  return tracks.flatMap((track) => track.courses.filter((course) => course.href));
}
