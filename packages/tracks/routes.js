/**
 * Links into a course app's labs and notes. Hrefs are relative to the hub, like the course folders;
 * a page inside a course passes them through `siblingHref` (tracks.js).
 *
 * Most courses route `#/<course>/<unit>/<lab>`, with `?n=<section>` to open a notes section.
 * STA 3032 routes its labs through its Explore mode: `#/<course>/<unit>/explore/<lab>`.
 */
const MODES = new Set(['sta3032']);

/**
 * A lab reference's notes sections as a list. `notes` may be one section id or several; the
 * first is the one the "Open the notes" link opens.
 * @param {{ notes?: string|string[]|null }} ref
 * @returns {string[]}
 */
export function notesOf(ref) {
  if (ref.notes === undefined || ref.notes === null) return [];
  return Array.isArray(ref.notes) ? ref.notes : [ref.notes];
}

/**
 * Where a notes id points. A plain id (`s11`) is a section of the lab's own unit. A qualified id
 * (`e6/s20`) is a section of another unit's notes, for a concept whose notes and lab sit in
 * different units.
 * @param {string} id
 * @param {string} labUnit
 */
export function notesTarget(id, labUnit) {
  const at = id.indexOf('/');
  return at === -1 ? { unit: labUnit, section: id } : { unit: id.slice(0, at), section: id.slice(at + 1) };
}

/**
 * The "Open the notes" link for a lab reference: its first notes id. In the lab's unit it opens the
 * lab with that section; in another unit it opens that unit with the section.
 * @param {{ course: string, lab: string, notes?: string|string[]|null }} ref
 * @param {string} labUnit
 * @returns {string|null}
 */
export function notesHref(ref, labUnit) {
  const first = notesOf(ref)[0];
  if (!first) return null;
  const { unit, section } = notesTarget(first, labUnit);
  if (unit === labUnit) return labHref({ course: ref.course, unit, lab: ref.lab, notes: section });
  return `${ref.course}/#/${ref.course}/${unit}?n=${encodeURIComponent(section)}`;
}

/**
 * @param {{ course: string, unit: string, lab: string, notes?: string|null }} ref
 * @returns {string}
 */
export function labHref({ course, unit, lab, notes = null }) {
  const tail = MODES.has(course) ? `${unit}/explore/${lab}` : `${unit}/${lab}`;
  const query = notes ? `?n=${encodeURIComponent(notes)}` : '';
  return `${course}/#/${course}/${tail}${query}`;
}
