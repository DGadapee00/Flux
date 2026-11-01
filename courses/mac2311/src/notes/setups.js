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

SETUPS.c1.s11 = [
 {tag:'a close camera subject',lab:'focus',scenario:'close',read:c=>({v:[c.v,56.25],sensitivity:[c.sensitivity,-.015625]})},
 {tag:'sensitivity is not image distance',lab:'focus',scenario:'close',setup:s=>{s.u=850;},read:c=>({v:[c.v,53.125],sensitivity:[c.sensitivity,-.00390625]})},
 {tag:'the tangent makes a local prediction',lab:'focus',scenario:'portrait',read:c=>({v:[c.v,52.63157894736842],sensitivity:[c.sensitivity,-1/361]})},
];

(SETUPS.c1.s7??=[]).push({tag:'two tangents through the origin',lab:'secant',scenario:'tangent1',setup:s=>{s.x0=Math.sqrt(2);},read:c=>({slope:[c.fp,2*(Math.sqrt(2)-1)]})});
