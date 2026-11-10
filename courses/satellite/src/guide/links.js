/**
 * Links from the guide into course apps. The guide is a page inside this course, so a hub-relative
 * href (`phy2048/#/…`) becomes a sibling one (`../phy2048/#/…`).
 */
import { TRACKS, siblingHref } from '@flux/tracks';
import { labHref, notesHref } from '@flux/tracks/routes.js';
import { FOUNDATIONS } from './foundations.js';

const CARDS = Object.fromEntries(TRACKS.flatMap((track) => track.courses.map((course) => [course.id, course])));

/** A course's code as the hub prints it: `PHY 2048`, `BENCH`. */
export const courseCode = (id) => CARDS[id]?.code || id.toUpperCase();

/** @param {{ course: string, unit: string, lab: string }} ref */
export const labLink = (ref) => siblingHref(labHref(ref));

/**
 * The lab with its notes section open, or null when the reference names no section.
 * @param {{ course: string, unit: string, lab: string, notes?: string }} ref
 */
export function notesLink(ref) {
  const href = notesHref(ref, ref.unit);
  return href ? siblingHref(href) : null;
}

/**
 * A foundation: its title, and where it is taught when a Flux lab shows it.
 * @param {string} id
 * @returns {{ id: string, title: string, href: string | null, code: string | null }}
 */
export function foundation(id) {
  const f = FOUNDATIONS[id];
  if (!f) throw new Error(`No foundation named ${id}`);
  if (!f.course) return { id, title: f.title, href: null, code: null };
  return { id, title: f.title, href: notesLink(f) || labLink(f), code: courseCode(f.course) };
}
