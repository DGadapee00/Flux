/**
 * Links from the map into a course app. Hrefs are relative to the hub, like the course folders.
 *
 * Most courses route `#/<course>/<unit>/<lab>`, with `?n=<section>` to open a notes section.
 * STA 3032 routes its labs through its Explore mode: `#/<course>/<unit>/explore/<lab>`.
 */
const MODES = new Set(['sta3032']);

/**
 * @param {{ course: string, unit: string, lab: string, notes?: string|null }} ref
 * @returns {string}
 */
export function labHref({ course, unit, lab, notes = null }) {
  const tail = MODES.has(course) ? `${unit}/explore/${lab}` : `${unit}/${lab}`;
  const query = notes ? `?n=${encodeURIComponent(notes)}` : '';
  return `${course}/#/${course}/${tail}${query}`;
}
