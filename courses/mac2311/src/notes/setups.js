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

(SETUPS.c3.s1 ??= []).push(
  {
    tag: 'checking the cubic right sum',
    lab: 'riemann',
    scenario: 'cube',
    setup: (s) => {
      s.n = 4;
      s.sample = 'right';
    },
    read: (c) => ({ sum: [c.sum, 25 / 64], integral: [c.exact, 0.25] }),
  },
  {
    tag: 'checking the cubic left sum',
    lab: 'riemann',
    scenario: 'cube',
    setup: (s) => {
      s.n = 4;
      s.sample = 'left';
    },
    read: (c) => ({ sum: [c.sum, 9 / 64] }),
  },
);
(SETUPS.c3.s4 ??= []).push(
  {
    tag: 'a rising inlet is a triangular area',
    lab: 'barrel',
    scenario: 'ramp',
    read: (c) => ({ rate: [c.flow, 10], delivered: [c.delivered, 50], stored: [c.stored, 50] }),
  },
  {
    tag: 'doubling time can quadruple delivery',
    lab: 'barrel',
    scenario: 'ramp',
    setup: (s) => {
      s.t = 5;
    },
    read: (c) => ({ delivered: [c.delivered, 12.5] }),
  },
  {
    tag: 'a full barrel still receives rain',
    lab: 'barrel',
    scenario: 'full',
    read: (c) => ({
      delivered: [c.delivered, 300],
      stored: [c.stored, 189.2705892],
      spill: [c.spill, 110.7294108],
      rate: [c.storageRate, 0],
    }),
  },
  {
    tag: 'integrating a curved storm profile',
    lab: 'barrel',
    scenario: 'sine',
    read: (c) => ({ delivered: [c.delivered, 800 / Math.PI], spill: [c.spill, 800 / Math.PI - 189.2705892] }),
  },
  {
    tag: 'average inflow is not the peak',
    lab: 'barrel',
    scenario: 'sine',
    read: (c, s) => ({ average: [c.delivered / s.T, 40 / Math.PI] }),
  },
);
(SETUPS.c3.s7 ??= []).push({
  tag: 'slicing an oblate spheroid',
  lab: 'spheroid',
  scenario: 'oblate',
  read: (c) => ({ volume: [c.volume, (16 * Math.PI) / 3] }),
});
(SETUPS.c3.s10 ??= []).push({
  tag: 'two weighted-coordinate profiles',
  lab: 'riemann',
  scenario: 'quad',
  setup: (s) => {
    s.graphId = 'weightParabola';
    s.a = -1;
    s.b = 3;
    s.n = 8;
  },
  read: (c) => ({ total: [c.exact, 32 / 3] }),
});

for (const [section, tag, scenario, value] of [
  ['s1', 'x times e to the x', 'exp', 1],
  ['s1', 'a logarithm alone', 'log', 1],
  ['s1', 'closing the cycle', 'cycle', 1.3780246135473637],
  ['s2', 'an odd power of sine', 'odd', 2 / 15],
  ['s2', 'an even power', 'even', Math.PI / 2],
  ['s3', 'part of a circle', 'circle', Math.PI / 3 + Math.sqrt(3) / 2],
  ['s4', 'two linear factors', 'fractions', Math.log(2) + 2 * Math.log(4 / 3)],
  ['s4', 'integrating the repeated factor', 'repeated', 2 * Math.log(4 / 3) + 1 / 6],
  ['s5', 'one line makes two cones', 'cone', (Math.PI * Math.sqrt(5)) / 2],
])
  (SETUPS.c4[section] ??= []).push({
    tag,
    lab: 'technique',
    scenario,
    read: (c) => ({ integral: [c.integral, value] }),
  });
(SETUPS.c4.s5 ??= []).push(
  {
    tag: 'main span with assumed shallow sag',
    lab: 'bridge',
    scenario: 'shallow',
    read: (c) => ({ length: [c.length, 1285.3487802963207], extra: [c.extra, 5.188780296320601] }),
  },
  {
    tag: 'doubling assumed sag',
    lab: 'bridge',
    scenario: 'deep',
    read: (c) => ({ length: [c.length, 1300.6958269151703], extra: [c.extra, 20.53582691517022] }),
  },
  {
    tag: 'refining cable chords',
    lab: 'bridge',
    scenario: 'deep',
    setup: (s) => {
      s.n = 32;
    },
    read: (c) => ({ length: [c.length, 1300.6958269151703] }),
  },
  {
    tag: 'a geometrically similar small model',
    lab: 'bridge',
    scenario: 'model',
    read: (c) => ({ length: [c.length, 10.260606304268446] }),
  },
);

for (const [section, tag, scenario, setup, read] of [
  [
    's1',
    'a quarter turn on an LP',
    'lp',
    null,
    (c) => ({ theta: [c.theta, Math.PI / 2], distance: [c.distance, (0.14 * Math.PI) / 2] }),
  ],
  [
    's2',
    'a faster record at the same point',
    'single',
    null,
    (c) => ({ speed: [c.speed, 0.14 * 1.5 * Math.PI], period: [c.period, 4 / 3] }),
  ],
  [
    's2',
    'moving the mark inward',
    'inner',
    null,
    (c) => ({ speed: [c.speed, (0.07 * 10 * Math.PI) / 9], period: [c.period, 1.8] }),
  ],
  [
    's2',
    'a tangent at sixty degrees',
    'lp',
    (s) => {
      s.t = 0.3;
    },
    (c) => ({ slope: [c.slope, -1 / Math.sqrt(3)], x: [c.x, 0.07] }),
  ],
  ['s4', 'the mark sweeps a sector', 'lp', null, (c) => ({ area: [c.area, (Math.PI * 0.14 ** 2) / 4] })],
  [
    's4',
    'one complete revolution',
    'lp',
    (s) => {
      s.t = 1.8;
    },
    (c) => ({ area: [c.area, Math.PI * 0.14 ** 2], distance: [c.distance, 2 * Math.PI * 0.14] }),
  ],
])
  (SETUPS.c5[section] ??= []).push({ tag, lab: 'record', scenario, setup, read });

for (const [tag, scenario, setup, read] of [
  [
    'calibrating an effective length',
    'small',
    (s) => {
      s.angle = 0;
    },
    (c) => ({ period: [c.period, 4], series: [c.series, 4] }),
  ],
  ['a small assumed swing', 'small', null, (c) => ({ period: [c.period, 4.001904689943947] })],
  [
    'a wide assumed swing',
    'wide',
    null,
    (c) => ({
      period: [c.period, 4.721362396064385],
      series: [c.series, 4.689453125],
      bound: [c.tailBound, 0.037384033203124965],
    }),
  ],
  [
    'improving the calculation',
    'wide',
    (s) => {
      s.n = 8;
    },
    (c) => ({ series: [c.series, 4.720267184078693], bound: [c.tailBound, 0.0012051670637447363] }),
  ],
  [
    'near the upright limit',
    'slow',
    null,
    (c) => ({ period: [c.period, 9.757450878695543], series: [c.series, 7.305015657094492] }),
  ],
  [
    'quartering effective length',
    'wide',
    (s) => {
      s.L /= 4;
    },
    (c) => ({ period: [c.period, 2.3606811980321925] }),
  ],
])
  (SETUPS.c6.s10 ??= []).push({ tag, lab: 'clock', scenario, setup, read });
