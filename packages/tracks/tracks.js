/**
 * Tracks the hub shows, courses in degree order.
 * A course with href is built and opens that app. href null is not built yet.
 * A relative href is the copy in this repo. An absolute href is that course's own site.
 * Statics is EGN 3311 and MAC 2313 was Spring 2026 (DECISIONS.md, D5).
 * Codes for courses that are not built yet are the Florida common numbers from the plan.
 * EGN 3321, EGN 3331 and EML 3100 are the codes on the owner's course packs (docs/history/PLAN-2026-10-18.md, Phase 8).
 * A track with no built course is not a hub card. It stays in this list, and the card
 * appears when one of its courses has an href. Course headers read the same list.
 */
export const TRACKS = [
  {
    id: 'physics',
    name: 'Physics',
    courses: [
      { id: 'phy2048', code: 'PHY 2048', title: 'Physics I', term: null, href: 'phy2048/' },
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
      { id: 'egn3321', code: 'EGN 3321', title: 'Dynamics', term: null, href: 'egn3321/' },
      { id: 'egn3331', code: 'EGN 3331', title: 'Mechanics of Materials', term: null, href: 'egn3331/' },
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
    courses: [{ id: 'eml3100', code: 'EML 3100', title: 'Thermodynamics', term: null, href: 'eml3100/' }],
  },
  {
    // Personal projects outside the degree map (DECISIONS.md, D35).
    id: 'projects',
    name: 'Projects',
    courses: [{ id: 'bench', code: 'BENCH', title: 'Electronics on the bench', term: null, href: 'bench/' }],
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
 * @param {{ courses: { href: string|null }[] }[]} [tracks]
 */
export function builtCourses(tracks = TRACKS) {
  return tracks.flatMap((track) => track.courses.filter((course) => course.href));
}

/**
 * Hub cards. A track with nothing built yet is left off the page.
 * @param {typeof TRACKS} [tracks]
 */
export function visibleTracks(tracks = TRACKS) {
  return tracks.filter((track) => track.courses.some((course) => course.href));
}

/**
 * Path from one course page to another. Hub hrefs are relative to the hub (`mac2311/`).
 * A course page is one directory down, so the sibling is `../mac2311/`.
 * @param {string} href
 */
export function siblingHref(href) {
  if (/^https?:\/\//.test(href)) return href;
  return `../${href.replace(/^\//, '')}`;
}

/**
 * Courses in this course's track, in the hub's order.
 * `href` is null when that course is not built.
 * @param {string} courseId
 * @param {typeof TRACKS} [tracks]
 * @returns {{ id: string, code: string, title: string, href: string|null }[]}
 */
export function trackSiblings(courseId, tracks = TRACKS) {
  const track = tracks.find((item) => item.courses.some((course) => course.id === courseId));
  if (!track) return [];
  return track.courses.map((course) => ({
    id: course.id,
    code: course.code,
    title: course.title,
    href: course.href ? siblingHref(course.href) : null,
  }));
}
