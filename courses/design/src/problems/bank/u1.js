/**
 * Unit 1 bank: fits and stack-ups. Original problems, written for the Fits and Stack-up labs, with
 * staged hints and named traps (../coaching/u1.js), each checked against its lab (`sim`).
 */
import { fitLimits, interferenceChance, spread, stackClosed } from '@flux/subjects/design/tolerancing.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

/** 50 mm hole-basis fits, deviations in μm (Wikipedia, Engineering fit). */
export const FITS = {
  'close-running': { code: 'H8/f7', holeLo: 0, holeHi: 39, shaftLo: -50, shaftHi: -25 },
  sliding: { code: 'H7/g6', holeLo: 0, holeHi: 25, shaftLo: -25, shaftHi: -9 },
  location: { code: 'H7/h6', holeLo: 0, holeHi: 25, shaftLo: -16, shaftHi: 0 },
  transition: { code: 'H7/k6', holeLo: 0, holeHi: 25, shaftLo: 2, shaftHi: 18 },
  press: { code: 'H7/p6', holeLo: 0, holeHi: 25, shaftLo: 26, shaftHi: 42 },
  wide: { code: 'wide bands', holeLo: 0, holeHi: 60, shaftLo: -50, shaftHi: 10 },
};
const F = ($) => FITS[$.fit];
const signed = (v) => (v > 0 ? `+${v}` : String(v).replace('-', '−'));
const band = (f) => `hole ${signed(f.holeLo)} to ${signed(f.holeHi)} μm, shaft ${signed(f.shaftLo)} to ${signed(f.shaftHi)} μm`;
const fitSetup = (s, $) => Object.assign(s, { holeLo: F($).holeLo, holeHi: F($).holeHi, shaftLo: F($).shaftLo, shaftHi: F($).shaftHi, cp: $.cp ?? 1 });
const chance = ($) => {
  const f = F($);
  return interferenceChance(spread(f.holeLo, f.holeHi, { cp: $.cp }), spread(f.shaftLo, f.shaftHi, { cp: $.cp }));
};

export default [
  problem({
    id: 'u1.1.fit-limits',
    title: 'Tightest and loosest pair',
    exam: 'u1',
    ch: '1',
    lab: 'fits',
    src: 'Flux, written for the Fits lab',
    topics: ['fits'],
    principles: ['fit-limits'],
    vars: { fit: choice(['close-running', 'H8/f7'], ['sliding', 'H7/g6'], ['transition', 'H7/k6'], ['press', 'H7/p6']) },
    text: (T, $) => `A 50 mm ${T.fit} fit has these deviations from the basic size: ${band(F($))}. Find the clearance of the tightest pair and of the loosest pair. A negative clearance is interference.`,
    parts: [
      num('cMin', ($) => fitLimits(F($)).cMin, 'μm', { label: 'tightest pair' }),
      num('cMax', ($) => fitLimits(F($)).cMax, 'μm', { label: 'loosest pair' }),
    ],
    level: 1,
    hints: ['Clearance is hole minus shaft.', 'The tightest pair is the smallest hole with the largest shaft; the loosest is the largest hole with the smallest shaft.'],
    steps: ($) => {
      const f = F($);
      const l = fitLimits(f);
      return [String.raw`Tightest: $${f.holeLo} - (${f.shaftHi}) = ${l.cMin}$ μm. Loosest: $${f.holeHi} - (${f.shaftLo}) = ${l.cMax}$ μm.`];
    },
    sim: { scenario: 'sliding', setup: fitSetup, read: (c) => ({ cMin: c.cMin, cMax: c.cMax }) },
    cases: [kase('Wikipedia’s H8/f7 example at 50 mm', { fit: 'close-running' }, { cMin: 25, cMax: 89 })],
  }),

  problem({
    id: 'u1.2.interference-share',
    title: 'How often a pair interferes',
    exam: 'u1',
    ch: '1',
    lab: 'fits',
    src: 'Flux, written for the Fits lab',
    topics: ['fits'],
    principles: ['fit-limits'],
    vars: { part: choice(['hub', 'a gear hub on its shaft'], ['seat', 'a bearing seat'], ['pulley', 'a pulley on its shaft']), cp: range(0.8, 1.6, 0.1, '') },
    derive: () => ({ fit: 'transition' }),
    text: (T, $) => String.raw`For ${T.part}, a 50 mm H7/k6 fit: ${band(F($))}. Holes and shafts come from normal processes, each centred in its band, with the band equal to $\pm 3\sigma/C_p$ and $C_p = ${$.cp}$. What share of random pairs interfere?`,
    parts: [num('p', ($) => chance($).p * 100, '%', { label: 'pairs that interfere' })],
    level: 3,
    hints: ['The clearance hole − shaft is normal, with mean the difference of the band middles.', 'Its spread is $\\sqrt{\\sigma_D^2 + \\sigma_d^2}$, with each $\\sigma$ = band/(6 Cp). The share is $\\Phi(-\\bar c/\\sigma_c)$.'],
    steps: ($, sig) => {
      const c = chance($);
      return [String.raw`$\bar c = ${sig(c.mean)}$ μm and $\sigma_c = ${sig(c.sd)}$ μm, so $P = \Phi(${sig(-c.mean / c.sd)}) = ${sig(c.p * 100)}\%$.`];
    },
    sim: { scenario: 'transition', setup: fitSetup, read: (c) => ({ p: c.chance * 100 }) },
    cases: [kase('The notes’ example: H7/k6 with Cp = 1', { part: 'hub', cp: 1 }, { p: 30.67 })],
  }),

  problem({
    id: 'u1.3.fit-type',
    title: 'Which kind of fit?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'fits',
    src: 'Flux, written for the Fits lab',
    topics: ['fits'],
    principles: ['fit-limits'],
    vars: { fit: choice(['close-running', 'H8/f7'], ['location', 'H7/h6'], ['transition', 'H7/k6'], ['press', 'H7/p6']) },
    text: (T, $) => `A 50 mm ${T.fit} fit: ${band(F($))}. What kind of fit is it?`,
    parts: [
      pick('type', 'the fit', [
        ['clearance', 'clearance: every pair slides', 'The smallest hole is at least as big as the largest shaft.'],
        ['transition', 'transition: some slide, some press', 'The tightest pair interferes and the loosest has room.'],
        ['interference', 'interference: every pair presses', 'The largest hole is smaller than the smallest shaft.'],
      ], ($) => fitLimits(F($)).type),
    ],
    level: 1,
    hints: ['Find the tightest pair: smallest hole minus largest shaft.', 'Then the loosest: largest hole minus smallest shaft. Are both positive, both negative, or one of each?'],
    steps: ($) => {
      const l = fitLimits(F($));
      return [`The clearance runs from ${l.cMin} to ${l.cMax} μm, so it is ${l.type === 'clearance' ? 'a clearance' : l.type === 'interference' ? 'an interference' : 'a transition'} fit.`];
    },
    sim: { scenario: 'sliding', setup: fitSetup, read: (c) => ({ type: c.type }) },
    cases: [kase('H7/h6: zero clearance at worst', { fit: 'location' }, { type: 'clearance' })],
  }),

  problem({
    id: 'u1.4.stack-bands',
    title: 'Worst case and RSS',
    exam: 'u1',
    ch: '1',
    lab: 'stackup',
    src: 'Flux, written for the Stack-up lab',
    topics: ['stackup'],
    principles: ['stack-rss'],
    vars: { what: choice(['spacers', 'spacers on a shaft'], ['plates', 'plates bolted in a stack'], ['shims', 'shims under a bearing']), n: range(3, 8, 1, ''), T: range(0.02, 0.1, 0.01, 'mm') },
    text: (T, $) => String.raw`Stacked end to end, ${$.n} ${T.what} each carry ±${T.T}, each band being $\pm3\sigma$ of its process. Find the stack's worst-case band and its RSS band.`,
    parts: [
      num('worst', ($) => stackClosed({ n: $.n, T: $.T, S: 1, kind: 'normal' }).worst, 'mm', { label: 'worst case ±' }),
      num('rss', ($) => stackClosed({ n: $.n, T: $.T, S: 1, kind: 'normal' }).rss, 'mm', { label: 'RSS ±' }),
    ],
    level: 2,
    hints: ['The worst case puts every part at the same extreme: add the tolerances.', 'Independent errors add as variances: $T_\\text{RSS} = \\sqrt{\\sum T_i^2} = T\\sqrt n$.'],
    steps: ($, sig) => [String.raw`Worst: $${$.n} \times ${sig($.T)} = ${sig($.n * $.T)}$ mm. RSS: $${sig($.T)}\sqrt{${$.n}} = ${sig($.T * Math.sqrt($.n))}$ mm.`],
    sim: {
      scenario: 'five-normal',
      setup(s, $) {
        Object.assign(s, { n: $.n, T: $.T, kind: 'normal' });
      },
      read: (c) => ({ worst: c.worst, rss: c.rss }),
    },
    cases: [kase('The notes’ example: five parts at ±0.1 mm', { what: 'spacers', n: 5, T: 0.1 }, { worst: 0.5, rss: 0.2236 })],
  }),
];
