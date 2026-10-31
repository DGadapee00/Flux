import { PROBLEMS } from '../problems/index.js';
import { build } from '../problems/engine.js';
import { EXAMPLES } from './examples.js';
const applications = {
  bridle: {
    lab: 'bridle',
    scenario: 'empty',
    values: {},
    read: (c) => [
      [c.T, 245.25],
      [c.H, 212.3927303],
    ],
  },
  shelf: {
    lab: 'shelf',
    scenario: 'edge',
    values: {},
    read: (c) => [
      [c.H, 196.2],
      [c.R, 219.3582686],
    ],
  },
  gantry: {
    lab: 'gantry',
    scenario: 'standard',
    values: {},
    read: (c) => [
      [c.chord, 348.3864],
      [c.R, 174.1932],
    ],
  },
  jack: {
    lab: 'jack',
    scenario: 'raised',
    values: {},
    read: (c) => [
      [c.C, 11120.554],
      [c.Q, 17792.886],
    ],
  },
  bookcase: {
    lab: 'bookcase',
    scenario: 'high',
    values: {},
    read: (c) => [
      [c.tip, 37.333333],
      [c.slip, 120],
    ],
  },
};
export const SETUPS = Object.fromEntries(
  Object.entries(EXAMPLES).map(([unit, sections]) => [
    unit,
    Object.fromEntries(
      Object.entries(sections).map(([section, examples]) => [
        section,
        examples.map((ex) => {
          if (ex.template.startsWith('@')) {
            const a = applications[ex.template.slice(1)];
            return { ...a, tag: ex.tag, setup: (s) => Object.assign(s, a.values) };
          }
          const tpl = PROBLEMS.find((t) => t.id === ex.template);
          const kase = tpl.cases[ex.case];
          const inst = build(tpl, kase.v);
          return {
            tag: ex.tag,
            lab: tpl.lab,
            scenario: tpl.sim?.scenario,
            setup(s) {
              tpl.sim?.setup?.(s, inst.$);
            },
            read(c, s) {
              const got = tpl.sim?.read?.(c, s, inst.$) || {};
              return Object.entries(got)
                .filter(([k]) => Object.hasOwn(kase.want, k))
                .map(([k, v]) => [v, kase.want[k]])
                .filter(([v]) => typeof v === 'number');
            },
          };
        }),
      ]),
    ),
  ]),
);
export const exampleTag = (text) => text.replace(/^\s*Worked examples?\s*(·\s*)?/, '').trim();
export const setupsFor = (unit, section) => SETUPS[unit]?.[section] || [];
export const matchExamples = (unit, section, tags) =>
  tags.map((tag) => setupsFor(unit, section).findIndex((ex) => ex.tag === exampleTag(tag)));
export function applyExample(lab, s, ex) {
  lab.applyScenario?.(ex.scenario, s);
  ex.setup?.(s);
  s.dirty = true;
}
