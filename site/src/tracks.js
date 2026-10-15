/**
 * Tracks the hub shows, courses in degree order.
 * A course with href is built and opens that app. href null is not built yet.
 * A relative href is the copy in this repo. An absolute href is that course's own site.
 * Statics is EGN 3311 and MAC 2313 was Spring 2026 (PLAN.md, D5).
 * Codes for courses that are not built yet are the Florida common numbers from the plan.
 * EGN 3321, EGN 3331 and EML 3100 are the codes on the owner's course packs (PLAN.md, Phase 8).
 * A track may have no built course yet. Its card shows the list and opens nothing.
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
      { id: 'mac2311', code: 'MAC 2311', title: 'Calculus I', term: null, href: 'mac2311/' },
      { id: 'mac2312', code: 'MAC 2312', title: 'Calculus II', term: null, href: 'mac2312/' },
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
      { id: 'egn3321', code: 'EGN 3321', title: 'Dynamics', term: null, href: null },
      { id: 'egn3331', code: 'EGN 3331', title: 'Mechanics of Materials', term: null, href: null },
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
  {
    id: 'thermal',
    name: 'Thermal-fluids',
    courses: [{ id: 'eml3100', code: 'EML 3100', title: 'Thermodynamics', term: null, href: null }],
  },
];

/**
 * The last built course in degree order. The card opens this one. Null when none is built.
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
