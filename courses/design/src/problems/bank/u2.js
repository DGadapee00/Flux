/**
 * Unit 2 bank: position and process. Original problems, written for the Position and Capability
 * labs, with staged hints and named traps (../coaching/u2.js), each checked against its lab (`sim`).
 */
import { capability, positionYield } from '@flux/subjects/design/tolerancing.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const T = 0.1;
const diaFor = (zone) => (zone === 'circle' ? 2 * Math.SQRT2 * T : 2 * T);
const yieldOf = ($) => {
  const y = positionYield({ t: T, sigma: $.sigma, dia: diaFor('circle') });
  return $.zone === 'box' ? y.box : y.circle;
};
const TOL = 0.03;
const cap = ($) => capability({ mu: 10 + $.offset, sigma: $.sigma, lsl: 10 - TOL, usl: 10 + TOL });

/** Holes for the conceptual problem, mm from true position. */
const HOLES = { corner: [0.09, 0.09], edge: [0.12, 0], far: [0.105, 0.105] };

export default [
  problem({
    id: 'u2.1.position-yield',
    title: 'How many holes pass',
    exam: 'u2',
    ch: '2',
    lab: 'position',
    src: 'Flux, written for the Position lab',
    topics: ['position'],
    principles: ['position-zone'],
    vars: { zone: choice(['box', 'a square box ±0.1 mm in x and y'], ['circle', 'a round position zone ⌀0.283 mm, through the corners of that box']), sigma: range(0.045, 0.08, 0.005, 'mm') },
    text: (T_, $) => String.raw`A drill places holes about their true position with a round scatter, $\sigma = ${$.sigma}$ mm in x and in y. Holes are inspected against ${T_.zone}. What share passes?`,
    parts: [num('y', ($) => yieldOf($) * 100, '%', { tol: 0.005, label: 'holes that pass' })],
    level: 2,
    hints: ['Box: x and y must each land within ±t, and they scatter independently, so square one axis’s share.', 'Circle: the distance from true position follows a Rayleigh law, so the share within r is $1 - e^{-r^2/2\\sigma^2}$.'],
    steps: ($, sig) => [$.zone === 'box'
      ? String.raw`One axis: $2\Phi(0.1/${sig($.sigma)}) - 1$. Both axes: square it, $${sig(yieldOf($) * 100)}\%$.`
      : String.raw`$r = 0.1414$ mm, so $1 - e^{-0.1414^2/(2 \times ${sig($.sigma)}^2)} = ${sig(yieldOf($) * 100)}\%$.`],
    sim: {
      scenario: 'loose',
      setup(s, $) {
        Object.assign(s, { t: T, sigma: $.sigma, zone: $.zone });
      },
      read: (c) => ({ y: c.accepted * 100 }),
    },
    cases: [kase('The notes’ example: σ = 0.05 mm, the box', { zone: 'box', sigma: 0.05 }, { y: 91.1 })],
  }),

  problem({
    id: 'u2.2.which-zone',
    title: 'Box or circle?',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'position',
    src: 'Flux, written for the Position lab',
    topics: ['position'],
    principles: ['position-zone'],
    vars: { hole: choice(['corner', '0.09 mm right and 0.09 mm up'], ['edge', '0.12 mm right, on the line'], ['far', '0.105 mm right and 0.105 mm up']) },
    text: (T_) => `A hole lands ${T_.hole} of its true position. It is checked against a ±0.1 mm square box and against a ⌀0.283 mm position zone. Which accepts it?`,
    parts: [
      pick('verdict', 'accepted by', [
        ['both', 'both', 'Within ±0.1 mm in x and in y, and within 0.141 mm of true position.'],
        ['circle', 'the circle only', 'Outside the box along one axis, yet closer to true position than the box’s own corners.'],
        ['box', 'the box only', 'The circle passes through the box’s corners, so it holds the whole box.'],
        ['neither', 'neither', 'Outside the box and further than 0.141 mm from true position.'],
      ], ($) => ({ corner: 'both', edge: 'circle', far: 'neither' }[$.hole])),
    ],
    level: 1,
    hints: ['The box checks x and y separately against ±0.1 mm.', 'The circle checks the distance $\\sqrt{x^2 + y^2}$ against its radius, 0.141 mm.'],
    steps: ($) => [{ corner: 'Distance 0.127 mm: inside both.', edge: 'x = 0.12 is outside the box, but 0.12 mm < 0.141 mm: the circle accepts it.', far: 'Outside the box, and 0.148 mm from true position: outside the circle too.' }[$.hole]],
    sim: {
      scenario: 'circle',
      setup(s) {
        Object.assign(s, { t: T, zone: 'circle' });
      },
      read: (c, s, $) => {
        const [x, y] = HOLES[$.hole];
        const inBox = Math.abs(x) <= s.t && Math.abs(y) <= s.t;
        const inCircle = Math.hypot(x, y) <= c.dia / 2;
        return { verdict: inBox && inCircle ? 'both' : inCircle ? 'circle' : inBox ? 'box' : 'neither' };
      },
    },
    cases: [kase('On the line, past the box', { hole: 'edge' }, { verdict: 'circle' })],
  }),

  problem({
    id: 'u2.3.cp-cpk',
    title: 'Cp and Cpk',
    exam: 'u2',
    ch: '2',
    lab: 'capability',
    src: 'Flux, written for the Capability lab',
    topics: ['capability'],
    principles: ['capability'],
    vars: { part: choice(['pin', 'pins'], ['bore', 'bores'], ['spacer', 'spacers']), offset: range(0.0025, 0.015, 0.0025, 'mm'), sigma: range(0.005, 0.01, 0.0005, 'mm') },
    text: (T_, $) => String.raw`A lathe makes ${T_.part} to 10 ± 0.03 mm. Its mean is ${$.offset} mm above nominal and its spread $\sigma = ${$.sigma}$ mm. Find $C_p$ and $C_{pk}$.`,
    parts: [
      num('cp', ($) => cap($).cp, '', { label: 'Cp' }),
      num('cpk', ($) => cap($).cpk, '', { label: 'Cpk' }),
    ],
    level: 2,
    hints: ['$C_p$ compares the band, 0.06 mm, with $6\\sigma$.', '$C_{pk}$ takes the nearer limit: $(\\text{USL} - \\mu)/3\\sigma$ here, since the mean sits high.'],
    steps: ($, sig) => {
      const c = cap($);
      return [String.raw`$C_p = 0.06/(6 \times ${sig($.sigma)}) = ${sig(c.cp)}$, and $C_{pk} = (0.03 - ${sig($.offset)})/(3 \times ${sig($.sigma)}) = ${sig(c.cpk)}$.`];
    },
    sim: {
      scenario: 'centred',
      setup(s, $) {
        Object.assign(s, { offset: $.offset, sigma: $.sigma, tol: TOL, drift: 0 });
      },
      read: (c) => ({ cp: c.cp, cpk: c.cpk }),
    },
    cases: [kase('The notes’ example: 15 μm high, σ = 7.5 μm', { part: 'pin', offset: 0.015, sigma: 0.0075 }, { cp: 1.333, cpk: 0.6667 })],
  }),

  problem({
    id: 'u2.4.parts-out',
    title: 'Parts out of limits',
    exam: 'u2',
    ch: '2',
    lab: 'capability',
    src: 'Flux, written for the Capability lab',
    topics: ['capability'],
    principles: ['capability'],
    vars: { part: choice(['pin', 'pins'], ['bore', 'bores'], ['spacer', 'spacers']), offset: range(0.005, 0.015, 0.0025, 'mm'), sigma: range(0.006, 0.009, 0.0005, 'mm') },
    text: (T_, $) => String.raw`A lathe makes ${T_.part} to 10 ± 0.03 mm, with its mean ${$.offset} mm above nominal and $\sigma = ${$.sigma}$ mm. How many in a million fall outside the limits?`,
    parts: [num('ppm', ($) => cap($).out * 1e6, 'ppm', { label: 'out of limits per million' })],
    level: 2,
    hints: ['Find how many σ each limit is from the mean.', 'Add the two tail areas, $\\Phi(-z_\\text{low}) + \\Phi(-z_\\text{high})$, and multiply by a million.'],
    steps: ($, sig) => [String.raw`The upper limit is $${sig((TOL - $.offset) / $.sigma)}\sigma$ away and the lower $${sig((TOL + $.offset) / $.sigma)}\sigma$, so ${sig(cap($).out * 1e6)} per million fall out.`],
    sim: {
      scenario: 'centred',
      setup(s, $) {
        Object.assign(s, { offset: $.offset, sigma: $.sigma, tol: TOL, drift: 0 });
      },
      read: (c) => ({ ppm: c.ppm }),
    },
    cases: [kase('15 μm high, σ = 7.5 μm', { part: 'pin', offset: 0.015, sigma: 0.0075 }, { ppm: 22750 })],
  }),
];
