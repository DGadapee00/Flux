/**
 * Unit 3 bank: choosing a design. Original problems, written for the Decision lab, with staged hints
 * and named traps (../coaching/u3.js), each checked against the lab (`sim`).
 */
import { choice, kase, num, problem, range } from '../kit.js';
import { AL6061, bracketClosed } from '@flux/subjects/design/verify.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

/** Scores of the two concepts that pass the production run's requirements, 1 to 5 (the lab computes the same). */
export const SCORES = {
  machined: { mass: 5, cost: 1, defl: 5, lead: 5, temp: 1 },
  sheet: { mass: 1, cost: 5, defl: 1, lead: 1, temp: 5 },
};
const KEYS = ['mass', 'cost', 'defl', 'lead', 'temp'];
const W = ($) => ({ mass: $.wm, cost: $.wc, defl: $.wd, lead: $.wl, temp: $.wt });
export const weighted = ($) => {
  const w = W($);
  const sum = KEYS.reduce((a, k) => a + w[k], 0);
  return KEYS.reduce((a, k) => a + w[k] * SCORES[$.concept][k], 0) / sum;
};
export const LOGK = { stiff: 8, sheet: 6.2, thinner: 5.8, boss: 5.5 };
export const KTHETA = Object.fromEntries(Object.entries(LOGK).map(([k, v]) => [k, 10 ** v]));
export const bracket = ($) => bracketClosed({ P: $.P, L: 100, b: 20, h: $.h ?? 8, FS: 1.5, limit: 1, ktheta: KTHETA[$.mount] ?? 1e8 });

export default [
  problem({
    id: 'u3.1.weighted-score',
    title: 'A weighted score',
    exam: 'u3',
    ch: '3',
    lab: 'decision',
    src: 'Flux, written for the Decision lab',
    topics: ['decision'],
    principles: ['requirements-first'],
    vars: { concept: choice(['machined', 'machined aluminium'], ['sheet', 'bent steel sheet']), wm: range(0, 5, 1, ''), wc: range(1, 5, 1, ''), wd: range(0, 5, 1, ''), wl: range(0, 5, 1, ''), wt: range(0, 5, 1, '') },
    valid: ($) => Math.abs(weighted({ ...$, concept: 'machined' }) - weighted({ ...$, concept: 'sheet' })) > 0.05,
    text: (T, $) => {
      const s = SCORES[$.concept];
      return String.raw`For a run of 1,000 brackets the printed part fails the stiffness requirement, leaving machined aluminium and bent sheet. On mass, cost, deflection, lead time and heat limit, ${T.concept} scores ${s.mass}, ${s.cost}, ${s.defl}, ${s.lead} and ${s.temp} out of 5. The weights are ${$.wm}, ${$.wc}, ${$.wd}, ${$.wl} and ${$.wt}. Find its weighted score out of 5.`;
    },
    parts: [num('S', ($) => weighted($), '', { label: 'weighted score' })],
    level: 1,
    hints: ['Multiply each score by its weight and add.', 'Divide by the sum of the weights, so the result stays on the 1 to 5 scale.'],
    steps: ($, sig) => {
      const w = W($);
      const sum = KEYS.reduce((a, k) => a + w[k], 0);
      const top = KEYS.reduce((a, k) => a + w[k] * SCORES[$.concept][k], 0);
      return [String.raw`$\sum w s = ${top}$ and $\sum w = ${sum}$, so the score is $${top}/${sum} = ${sig(weighted($))}$.`];
    },
    sim: {
      scenario: 'production',
      setup(s, $) {
        Object.assign(s, { w_mass: $.wm, w_cost: $.wc, w_defl: $.wd, w_lead: $.wl, w_temp: $.wt });
      },
      read: (c, s, $) => ({ S: c.totals[$.concept] }),
    },
    cases: [kase('The production weights: 1, 5, 2, 1, 1', { concept: 'sheet', wm: 1, wc: 5, wd: 2, wl: 1, wt: 1 }, { S: 3.4 })],
  }),

  problem({
    id: 'u3.2.ruled-out',
    title: 'Out before the scoring',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'decision',
    src: 'Flux, written for the Decision lab',
    topics: ['decision'],
    principles: ['requirements-first'],
    vars: { need: choice(['prototype', 'one test rig needed this week, deflection at most 1 mm'], ['production', 'a run of 1,000, deflection at most 0.3 mm'], ['flight', 'a small satellite, deflection at most 0.2 mm and a heat limit of at least 100 °C']) },
    text: (T) => `A sensor bracket can be machined aluminium (deflects 0.05 mm, good to 150 °C), bent steel sheet (0.12 mm, 400 °C) or printed nylon (0.6 mm, 70 °C). The need: ${T.need}. Which concept is out before any weighting?`,
    parts: [
      pick('out', 'ruled out', [
        ['none', 'none of them', 'Every concept meets every requirement, so all three go on to be scored.'],
        ['printed', 'printed nylon', 'It misses at least one requirement, so no weight can bring it back.'],
        ['machined', 'machined aluminium', 'It is the stiffest and handles 150 °C.'],
        ['sheet', 'bent steel sheet', 'It deflects 0.12 mm and handles 400 °C.'],
      ], ($) => ($.need === 'prototype' ? 'none' : 'printed')),
    ],
    level: 1,
    hints: ['A requirement is pass or fail. Check each concept against each one.', 'Only what passes every requirement is scored.'],
    steps: ($) => [$.need === 'prototype' ? 'All three deflect less than 1 mm: none is out.' : 'Printed nylon deflects 0.6 mm, more than the limit, so it is out whatever the weights.'],
    sim: {
      scenario: 'prototype',
      setup(s, $) {
        s.scenarioId = $.need;
      },
      read: (c) => {
        const out = Object.entries(c.fails).filter(([, f]) => f.length).map(([id]) => id);
        return { out: out.length ? out[0] : 'none' };
      },
    },
    cases: [kase('A run of 1,000', { need: 'production' }, { out: 'printed' })],
  }),

  problem({
    id: 'u3.3.intent-edit',
    title: 'Does it still bolt on?',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'intent',
    src: 'Flux, written for the Design intent lab',
    topics: ['intent'],
    principles: ['design-intent'],
    vars: {
      scheme: choice(['intent', 'centred on the plate and spaced S apart'], ['chained', '20 mm from the left edge, then 40 mm to the next'], ['eye', '20 mm and 60 mm from the left edge']),
      edit: choice(['wider', 'the plate is widened from 80 to 100 mm'], ['spacing', 'the sensor changes to one with 50 mm bolt spacing']),
    },
    text: (T) => `An 80 mm plate holds a sensor with two bolts 40 mm apart, centred. In the sketch the holes are dimensioned ${T.scheme}. Then ${T.edit}. Do the holes still line up with the sensor?`,
    parts: [
      pick('fits', 'after the edit', [
        ['yes', 'yes, the holes follow', 'The dimensions state the reason for the holes, so they move with the plate and the sensor.'],
        ['no', 'no, the holes stay put', 'Typed numbers keep the holes where they were, whatever changed around them.'],
      ], ($) => ($.scheme === 'intent' ? 'yes' : 'no')),
    ],
    level: 1,
    hints: ['Which dimensions mention the plate’s width or the sensor’s spacing?', 'A typed number from the left edge cannot know the plate grew or the sensor changed.'],
    steps: ($) => [$.scheme === 'intent' ? 'Centred and spaced S: the holes move to wherever the plate and sensor need them.' : 'The holes are tied to typed numbers, so they stay at 20 and 60 mm and miss the sensor.'],
    sim: {
      scenario: 'intent',
      setup(s, $) {
        Object.assign(s, { scheme: $.scheme, W: $.edit === 'wider' ? 100 : 80, S: $.edit === 'spacing' ? 50 : 40 });
      },
      read: (c) => ({ fits: c.misalign < 0.5 ? 'yes' : 'no' }),
    },
    cases: [kase('Chained, then the plate widens', { scheme: 'chained', edit: 'wider' }, { fits: 'no' })],
  }),

  problem({
    id: 'u3.4.strength-margin',
    title: 'Margin of safety',
    exam: 'u3',
    ch: '3',
    lab: 'verify',
    src: 'Flux, written for the Verification lab',
    topics: ['verify'],
    principles: ['margins'],
    vars: { what: choice(['sensor', 'a sensor bracket'], ['antenna', 'an antenna arm'], ['clamp', 'a cable clamp arm']), P: range(50, 150, 10, 'N'), h: range(5, 9, 0.5, 'mm') },
    text: (T, $) => String.raw`${T.what.replace(/^a/, 'A')} is a 6061-T6 arm 100 mm long, 20 mm wide and ${T.h} thick, with ${T.P} at its tip. With a minimum yield of 241 MPa and a factor of safety of 1.5, find the root's bending stress and the strength margin of safety.`,
    parts: [
      num('stress', ($) => bracket($).stress, 'MPa', { label: 'root stress' }),
      num('ms', ($) => bracket($).msStrength, '', { label: 'margin of safety' }),
    ],
    level: 2,
    hints: ['The root moment is PL; a rectangle’s section modulus is $bh^2/6$, so $\\sigma = 6PL/(bh^2)$.', 'MS = allowable/(FS × applied) − 1. A negative margin fails.'],
    steps: ($, sig) => {
      const c = bracket($);
      return [String.raw`$\sigma = 6(${$.P})(100)/(20 \times ${sig($.h)}^2) = ${sig(c.stress)}$ MPa, so MS $= 241/(1.5 \times ${sig(c.stress)}) - 1 = ${sig(c.msStrength)}$.`];
    },
    sim: {
      scenario: 'block',
      setup(s, $) {
        Object.assign(s, { P: $.P, h: $.h, FS: 1.5, logk: 8 });
      },
      read: (c) => ({ stress: c.stress, ms: c.msStrength }),
    },
    cases: [kase('The notes’ example: 100 N, 8 mm', { what: 'sensor', P: 100, h: 8 }, { stress: 46.88, ms: 2.427 })],
  }),

  problem({
    id: 'u3.5.tested-deflection',
    title: 'What the test sees',
    exam: 'u3',
    ch: '3',
    lab: 'verify',
    src: 'Flux, written for the Verification lab',
    topics: ['verify'],
    principles: ['margins'],
    vars: { mount: choice(['sheet', 'a steel sheet, k_θ = 1.58 × 10⁶ N·mm/rad'], ['thinner', 'a thinner sheet, k_θ = 6.31 × 10⁵ N·mm/rad'], ['boss', 'a plastic boss, k_θ = 3.16 × 10⁵ N·mm/rad']), P: range(50, 150, 10, 'N') },
    text: (T, $) => String.raw`A 6061-T6 arm (E = 68 GPa) 100 mm long, 20 mm wide and 8 mm thick carries ${T.P} at its tip. It is bolted to ${T.mount}, which turns by $PL/k_\theta$ under the root moment. How far does the tip move in a test?`,
    parts: [num('tip', ($) => bracket($).tipTest, 'mm', { label: 'tip deflection' })],
    level: 3,
    hints: ['The arm bends: $PL^3/(3EI)$ with $I = bh^3/12$.', 'The root also turns by $\\theta = PL/k_\\theta$, which moves the tip by $\\theta L$. Add the two.'],
    steps: ($, sig) => {
      const c = bracket($);
      return [String.raw`Bending gives ${sig(c.tipRigid)} mm and the root's turn ${sig(c.tipTest - c.tipRigid)} mm, so the tip moves ${sig(c.tipTest)} mm.`];
    },
    sim: {
      scenario: 'block',
      setup(s, $) {
        Object.assign(s, { P: $.P, h: 8, logk: LOGK[$.mount] });
      },
      read: (c) => ({ tip: c.tipTest }),
    },
    cases: [kase('The notes’ example: thin sheet, 100 N', { mount: 'sheet', P: 100 }, { tip: 1.206 })],
  }),
];
