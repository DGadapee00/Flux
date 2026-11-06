/**
 * Courses the map names, in degree order, with where the owner stands in each.
 *
 * `status` is one of STATUSES. `app` is the course's folder on the hub when Flux has an app for
 * it, and null when it does not. An entry with `kind: 'project'` is a personal project, not a
 * course: it has no status, and the hub shows it without one. Codes and apps follow packages/tracks/tracks.js; map/check.mjs
 * keeps the two in step.
 *
 * Where the status comes from:
 * - taken: MAC 2311–2312, MAC 2313, PHY 2048 and EGN 3311 are the courses the old plan reviewed as
 *   already taken (owner, 18 October 2026, archived as D22). EMA 3010 is taken too (D22); it has no
 *   app, so its concepts have candidates instead of labs.
 * - taking now: PHY 2049 and STA 3032 are Fall 2026 in tracks.js.
 * - next term: EML 3100, EGN 3321 and EGN 3331, Spring 2027 (owner, 15 October 2026, archived as D8).
 * - later: MAP 2302, EML 3015 and EML 4140, as the prototype has them. EML 3101 Thermodynamics II
 *   follows EML 3100 in the thermal track (archived plan, D19); it has no app yet. EEL 3111 Circuit
 *   Analysis I and EGN 3203 Modern Computation Methods are not taken yet (archived plans); no apps.
 * - Bench is a personal project (archived D35), so it has no status.
 * - Build a satellite is the application in map/applications/ taken as a project (6 November 2026).
 */
export const STATUSES = ['taken', 'taking now', 'next term', 'later'];

export const COURSES = [
  { id: 'mac2311', code: 'MAC 2311–2312', title: 'Calculus I and II', status: 'taken', app: 'mac2311/' },
  { id: 'mac2313', code: 'MAC 2313', title: 'Calculus III', status: 'taken', app: 'mac2313/' },
  { id: 'phy2048', code: 'PHY 2048', title: 'Physics I', status: 'taken', app: 'phy2048/' },
  { id: 'statics', code: 'EGN 3311', title: 'Statics', status: 'taken', app: 'statics/' },
  { id: 'ema3010', code: 'EMA 3010', title: 'Materials Science', status: 'taken', app: 'ema3010/' },
  { id: 'phy2049', code: 'PHY 2049', title: 'Physics II', status: 'taking now', app: 'phy2049/' },
  { id: 'sta3032', code: 'STA 3032', title: 'Probability and Statistics', status: 'taking now', app: 'sta3032/' },
  { id: 'eml3100', code: 'EML 3100', title: 'Thermodynamics', status: 'next term', app: 'eml3100/' },
  { id: 'map2302', code: 'MAP 2302', title: 'Differential Equations', status: 'later', app: 'map2302/' },
  { id: 'egn3321', code: 'EGN 3321', title: 'Dynamics', status: 'next term', app: 'egn3321/' },
  { id: 'egn3331', code: 'EGN 3331', title: 'Mechanics of Materials', status: 'next term', app: 'egn3331/' },
  { id: 'eml3101', code: 'EML 3101', title: 'Thermodynamics II', status: 'later', app: null },
  { id: 'eml3015', code: 'EML 3015', title: 'Fluids', status: 'later', app: 'eml3015/' },
  { id: 'eml4140', code: 'EML 4140', title: 'Heat Transfer', status: 'later', app: null },
  { id: 'eel3111', code: 'EEL 3111', title: 'Circuit Analysis I', status: 'later', app: null },
  { id: 'egn3203', code: 'EGN 3203', title: 'Modern Computation Methods', status: 'later', app: 'egn3203/' },
  { id: 'bench', code: 'BENCH', title: 'Electronics on the bench', kind: 'project', app: 'bench/' },
  // The satellite application as a project: the aerospace concepts it needs that no course on the
  // map teaches yet. A real course (controls, astrodynamics) joins a concept's list when it is added.
  { id: 'satellite', code: 'SAT', title: 'Build a satellite', kind: 'project', app: null },
  // Design practice: designing, making and testing parts, and the sensors, actuators and boards in
  // them. A project until the owner's design and measurement courses join the map (6 November 2026).
  { id: 'design', code: 'DES', title: 'Design practice', kind: 'project', app: 'design/' },
];
