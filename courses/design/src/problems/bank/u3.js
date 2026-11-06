/**
 * Unit 3 bank: choosing a design. Original problems, written for the Decision lab, with staged hints
 * and named traps (../coaching/u3.js), each checked against the lab (`sim`).
 */
import { choice, kase, num, problem, range } from '../kit.js';

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
const NAMES = { machined: 'machined aluminium', sheet: 'bent steel sheet' };

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
];
