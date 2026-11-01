/**
 * Worked examples the labs can show. `tag` matches the notes after "Worked example · ".
 * `read` pairs a lab value with the number printed in the notes. notes-check allows 2%.
 */

import u1 from './setups/u1.js';
import u2 from './setups/u2.js';
import u3 from './setups/u3.js';
import u4 from './setups/u4.js';
import u5 from './setups/u5.js';
import u6 from './setups/u6.js';
import u7 from './setups/u7.js';
import u8 from './setups/u8.js';
import u9 from './setups/u9.js';

/** One file per unit in ./setups/, so each unit's examples change without touching the others. */
export const SETUPS = { u1, u2, u3, u4, u5, u6, u7, u8, u9 };

/** An example's tag as the notes write it, without "Worked example · ". */
export function exampleTag(tagText) {
  return tagText.replace(/^\s*Worked examples?\s*(·\s*)?/, '').trim();
}

/** Index of each tag's setup, or −1 when that example has no lab setup. */
export function matchExamples(exam, sectionId, tags) {
  const list = setupsFor(exam, sectionId);
  let untagged = -1;
  return tags.map((raw) => {
    const tag = exampleTag(raw);
    if (!tag) untagged++;
    return list.findIndex((ex) => (tag ? ex.tag === tag : ex.tag == null && ex.n === untagged));
  });
}

export function setupsFor(exam, sectionId) {
  return SETUPS[exam]?.[sectionId] || [];
}

/** Reset the slice to the example's scenario, then write its numbers. */
export function applyExample(lab, slice, ex) {
  const list = typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
  const id = ex.scenario ?? list[0]?.id;
  if (id != null && lab.applyScenario) lab.applyScenario(id, slice);
  ex.setup?.(slice);
  slice.dirty = true;
}

