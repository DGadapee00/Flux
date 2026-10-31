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
  {
    tag: 'a close camera subject',
    lab: 'focus',
    scenario: 'close',
    read: (c) => ({ v: [c.v, 56.25], sensitivity: [c.sensitivity, -0.015625] }),
  },
  {
    tag: 'sensitivity is not image distance',
    lab: 'focus',
    scenario: 'close',
    setup: (s) => {
      s.u = 850;
    },
    read: (c) => ({ v: [c.v, 53.125], sensitivity: [c.sensitivity, -0.00390625] }),
  },
  {
    tag: 'the tangent makes a local prediction',
    lab: 'focus',
    scenario: 'portrait',
    read: (c) => ({ v: [c.v, 52.63157894736842], sensitivity: [c.sensitivity, -1 / 361] }),
  },
];

(SETUPS.c1.s7 ??= []).push({
  tag: 'two tangents through the origin',
  lab: 'secant',
  scenario: 'tangent1',
  setup: (s) => {
    s.x0 = Math.sqrt(2);
  },
  read: (c) => ({ slope: [c.fp, 2 * (Math.sqrt(2) - 1)] }),
});

(SETUPS.c2.s1 ??= []).push({
  tag: 'a can-area approximation',
  lab: 'can',
  scenario: 'closed',
  setup: (s) => {
    s.r = 3;
  },
  read: (c) => ({ area: [c.area, 276.54866776461625], slope: [c.slope, -35.63422149025581] }),
});
(SETUPS.c2.s3 ??= []).push({
  tag: 'a matching design sensitivity',
  lab: 'can',
  scenario: 'closed',
  setup: (s) => {
    s.r = 3.4743122160529527;
  },
  read: (c) => ({ slope: [c.slope, -11.017702849742875] }),
});
(SETUPS.c2.s6 ??= []).push(
  {
    tag: 'the least-area closed can',
    lab: 'can',
    scenario: 'closed',
    setup: (s) => {
      s.r = Math.cbrt(330 / (2 * Math.PI));
    },
    read: (c) => ({ height: [c.h, 7.489877008078427], area: [c.area, 264.35681091484054] }),
  },
  {
    tag: 'removing one end changes the answer',
    lab: 'can',
    scenario: 'open',
    setup: (s) => {
      s.r = Math.cbrt(330 / Math.PI);
    },
    read: (c) => ({ height: [c.h, 4.718326851800821], area: [c.area, 209.8201398705881] }),
  },
);
(SETUPS.c2.s7 ??= []).push({
  tag: 'Newton searches for the best radius',
  lab: 'can',
  scenario: 'closed',
  setup: (s) => {
    s.r = 3.5798400621572912;
  },
  read: (c) => ({ slope: [c.slope, -6.515524683504005] }),
});
(SETUPS.c2.s8 ??= []).push({
  tag: 'sensitivity along a fixed-volume family',
  lab: 'can',
  scenario: 'closed',
  read: (c) => ({ height: [c.h, 9.645754126781537], sensitivity: [c.heightSlope, -5.84591159198881] }),
});
