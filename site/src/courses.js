/**
 * Courses the hub lists. PHY 2049 is first. Every href is the app that is live
 * today. Phase 1 points PHY at the copy inside this repo. The others stay
 * external until their own ports.
 *
 * Statics has no official course code in its repo, and MAC 2313 has no term.
 * Those stay blank until someone confirms them (PLAN.md, D5).
 */
export const COURSES = [
  {
    id: 'phy2049',
    code: 'PHY 2049',
    title: 'Calculus Physics II',
    term: 'Fall 2026',
    blurb: 'Montgomery',
    href: 'https://flux-phy2049.pages.dev',
  },
  {
    id: 'mac2313',
    code: 'MAC 2313',
    title: 'Calculus III',
    term: null,
    blurb: 'Merino',
    href: 'https://flux-mac2313.pages.dev',
  },
  {
    id: 'statics',
    code: 'Statics',
    title: 'Engineering Mechanics',
    term: null,
    blurb: 'Hibbeler, chapters 2–10',
    href: 'https://dgadapee00.github.io/statics-sim/',
  },
  {
    id: 'sta3032',
    code: 'STA 3032',
    title: 'Probability and Statistics',
    term: 'Fall 2026',
    blurb: 'Walpole',
    href: 'https://flux-stats.pages.dev',
  },
];

/**
 * The lines a course card shows. `detail` drops a missing term rather than
 * leaving a stray separator.
 * @param {{ code: string, title: string, term: string|null, blurb: string }} course
 */
export function courseLines(course) {
  return {
    code: course.code,
    title: course.title,
    detail: [course.term, course.blurb].filter(Boolean).join(' · '),
  };
}
