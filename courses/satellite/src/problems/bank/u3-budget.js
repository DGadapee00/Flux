/**
 * Unit 3 bank, part two: attitude sensors and the pointing budget. Original problems, with staged
 * hints and named traps (../coaching/u3-budget.js). Budget problems are checked against the Pointing
 * budget lab (`sim`); the conceptual ones against a second rule (`second`).
 */
import { choice, kase, num, problem } from '../kit.js';
import { SENSORS, budgetTotals } from '@flux/subjects/mechanics/pointingbudget.js';
import { normSf } from '@flux/subjects/stats/dist.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const fmt = (x, n = 3) => Number(x.toPrecision(n));
const MISALIGN = 0.03;
const THERMAL = 0.01;

/** The linear budget b + 3σ in degrees; `how` names the traps. */
export function linearBudget($, how = 'right') {
  const s = SENSORS[$.sensor].sigma;
  const j = Number($.jitter);
  if (how === 'straight') return MISALIGN + THERMAL + 3 * (s + j);
  if (how === 'noBias') return 3 * Math.hypot(s, j);
  return MISALIGN + THERMAL + 3 * Math.hypot(s, j);
}

/** The chance of landing inside a cone with no bias; `how` names the traps. */
export function insideNoBias($, how = 'right') {
  const s = Math.hypot(SENSORS.star.sigma, Number($.jitter));
  const k = Number($.R) / s;
  if (how === 'oneAxis') return 1 - 2 * normSf(k);
  if (how === 'noSquare') return 1 - Math.exp(-k / 2);
  return 1 - Math.exp((-k * k) / 2);
}

/** How many independent directions each sensor measures toward full attitude (three axes). */
const AXES = { star: 3, sun: 2, horizon: 2, magnetometer: 2 };
const NAMES = { star: 'a star tracker', sun: 'a fine Sun sensor', horizon: 'a horizon sensor', magnetometer: 'a magnetometer' };

export default [
  problem({
    id: 'u3.12.budget',
    title: 'The linear pointing budget',
    exam: 'u3',
    ch: '3',
    lab: 'budget',
    src: 'Flux, written for the Pointing budget lab',
    topics: ['budget'],
    principles: ['budget'],
    vars: { sensor: choice(['star', 'a star tracker, 0.0028° per axis'], ['sun', 'a fine Sun sensor, 0.1° per axis']), jitter: choice(['0.02', '0.02°'], ['0.05', '0.05°']) },
    variety: ['sensor and jitter'],
    text: (T) => `A craft's attitude comes from ${T.sensor}, 1σ. Control jitter adds ${T.jitter} per axis, 1σ. The sensor is mounted 0.03° off and the frame bends 0.01° with heat; take both biases as leaning the same way. What is the linear budget, bias + 3σ, in degrees?`,
    parts: [num('L', ($) => linearBudget($), '°', { label: 'b + 3σ' })],
    level: 2,
    hints: ['Random terms add in quadrature: σ = √(σ_sensor² + σ_jitter²).', 'Biases add straight. Then b + 3σ.'],
    steps: ($) => {
      const t = budgetTotals({ sensor: $.sensor, jitter: Number($.jitter), misalign: MISALIGN, thermal: THERMAL });
      return [String.raw`$\sigma = \sqrt{${fmt(SENSORS[$.sensor].sigma, 2)}^2 + ${$.jitter}^2} = ${fmt(t.sigma)}^\circ$, $b = 0.04^\circ$`, String.raw`$b + 3\sigma = ${fmt(linearBudget($))}^\circ$`];
    },
    sim: { scenario: 'star', setup(s, $) { Object.assign(s, { sensor: $.sensor, jitter: Number($.jitter), misalign: MISALIGN, thermal: THERMAL }); }, read: (c) => ({ L: c.threeSigma }) },
    cases: [kase('star tracker, 0.02°', { sensor: 'star', jitter: '0.02' }, { L: 0.1006 })],
  }),

  problem({
    id: 'u3.13.inside',
    title: 'Inside the cone',
    exam: 'u3',
    ch: '3',
    lab: 'budget',
    src: 'Flux, written for the Pointing budget lab',
    topics: ['budget'],
    principles: ['budget'],
    vars: { jitter: choice(['0.02', '0.02°'], ['0.03', '0.03°']), R: choice(['0.05', '0.05°'], ['0.06', '0.06°']) },
    variety: ['jitter and cone'],
    text: (T) => `A star-tracked craft has no bias left after calibration. Its tracker gives 0.0028° and its control jitter ${T.jitter} per axis, both 1σ and independent. What is the chance its boresight lands within a ${T.R} cone of the target?`,
    parts: [num('p', ($) => insideNoBias($), '', { label: 'P', tol: 0.005 })],
    level: 3,
    hints: ['Combine the two in quadrature for σ per axis.', 'With no bias the distance from the target is Rayleigh: P = 1 − e^(−R²/2σ²).'],
    steps: ($) => {
      const s = Math.hypot(SENSORS.star.sigma, Number($.jitter));
      return [String.raw`$\sigma = ${fmt(s)}^\circ$, $R/\sigma = ${fmt(Number($.R) / s)}$`, String.raw`$P = 1 - e^{-(R/\sigma)^2/2} = ${fmt(insideNoBias($))}$`];
    },
    sim: { scenario: 'star', setup(s, $) { Object.assign(s, { sensor: 'star', jitter: Number($.jitter), misalign: 0, thermal: 0, R: Number($.R) }); }, read: (c) => ({ p: c.p }) },
    cases: [kase('0.02°, 0.05° cone', { jitter: '0.02', R: '0.05' }, { p: 0.9559 })],
  }),

  problem({
    id: 'u3.14.vectors',
    title: 'Enough for three axes?',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    src: 'Flux, after NASA’s small spacecraft report, 5.2',
    topics: ['sensors'],
    principles: ['sensors'],
    vars: { sensor: choice(['star', 'star'], ['sun', 'sun'], ['horizon', 'horizon'], ['magnetometer', 'magnetometer']) },
    variety: ['which sensor'],
    text: (T, $) => `A craft carries only ${NAMES[$.sensor]} for attitude. What more does it need to know its attitude about all three axes?`,
    parts: [
      pick('n', 'it needs', [
        ['none', 'nothing more', 'A star tracker matches a whole star field, which fixes all three axes at once.'],
        ['second', 'a second direction, not parallel to the first', 'One measured direction leaves the craft free to turn about it; a second, independent direction pins that turn.'],
        ['faster', 'a faster update rate', 'Speed does not add an axis. A single direction never says how the craft is turned about it.'],
      ], ($) => (AXES[$.sensor] >= 3 ? 'none' : 'second')),
    ],
    level: 1,
    hints: ['How many axes does one measured direction fix?', 'A star field is many directions at once.'],
    steps: ($) => [AXES[$.sensor] >= 3 ? 'A star field fixes all three axes.' : 'One direction fixes two axes; the turn about it needs a second direction.'],
    second: ($) => ({ n: AXES[$.sensor] < 3 ? 'second' : 'none' }),
    cases: [kase('a Sun sensor', { sensor: 'sun' }, { n: 'second' })],
  }),

  problem({
    id: 'u3.15.largest',
    title: 'Which term to improve?',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'budget',
    src: 'Flux, written for the Pointing budget lab',
    topics: ['budget'],
    principles: ['budget'],
    vars: { sensor: choice(['sun', 'a fine Sun sensor, 0.1° per axis'], ['star', 'a star tracker, 0.0028° per axis']) },
    variety: ['which sensor'],
    text: (T) => `A craft's random pointing errors are ${T.sensor} and 0.02° of control jitter, both 1σ. You can halve one of them. Which halving narrows the spread more?`,
    parts: [
      pick('h', 'halve', [
        ['sensor', 'the sensor error', 'The larger term dominates a root sum of squares, so halving it gains the most.'],
        ['jitter', 'the control jitter', 'The larger term dominates a root sum of squares, so halving it gains the most.'],
        ['same', 'either: they gain the same', 'They would only gain the same if the two terms were equal.'],
      ], ($) => (SENSORS[$.sensor].sigma > 0.02 ? 'sensor' : 'jitter')),
    ],
    level: 2,
    hints: ['Random terms add in quadrature.', 'Compute √(a² + b²) with each halved in turn.'],
    steps: ($) => [SENSORS[$.sensor].sigma > 0.02 ? 'The sensor term is the larger: halve it.' : 'The jitter is the larger: halve it.'],
    second: ($) => {
      const s = SENSORS[$.sensor].sigma;
      const a = Math.hypot(s / 2, 0.02);
      const b = Math.hypot(s, 0.01);
      return { h: Math.abs(a - b) < 1e-12 ? 'same' : a < b ? 'sensor' : 'jitter' };
    },
    cases: [kase('a Sun sensor', { sensor: 'sun' }, { h: 'sensor' })],
  }),
];
