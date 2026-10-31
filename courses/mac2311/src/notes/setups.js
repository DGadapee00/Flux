import { SETUPS as I } from './setups-i.js';
import { SETUPS as II } from './setups-ii.js';
import { CALCULUS_SECTIONS } from '@flux/tracks/calculus';
export { exampleTag, applyExample } from './setups-i.js';
import { exampleTag } from './setups-i.js';
export const SETUPS = {};
for (const [source, sets] of [
  ['mac2311', I],
  ['mac2312', II],
])
  for (const [unit, sections] of Object.entries(sets))
    for (const [id, examples] of Object.entries(sections)) {
      const target = CALCULUS_SECTIONS[source][unit][id];
      if (!target) throw Error(`Unmapped setup ${source}/${unit}/${id}`);
      ((SETUPS[target.unit] ??= {})[target.section] ??= []).push(...examples);
    }
export const setupsFor = (unit, section) => SETUPS[unit]?.[section] || [];
export function matchExamples(unit, section, tags) {
  const list = setupsFor(unit, section);
  let untagged = -1;
  return tags.map((raw) => {
    const tag = exampleTag(raw);
    if (!tag) untagged++;
    return list.findIndex((ex) => (tag ? ex.tag === tag : ex.tag == null && ex.n === untagged));
  });
}
