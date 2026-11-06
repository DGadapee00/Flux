/**
 * Unit 1 bank: bonding. Original problems, written for the Bond lab, with staged hints and named
 * traps (../coaching/u1.js), each checked against the lab (`sim`).
 */
import { KE2, bond, mie } from '@flux/subjects/matsci/bonding.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The two well shapes the problems use, by the lab's names. */
export const SHAPE = { ionic: { n: 1, m: 9 }, narrow: { n: 2, m: 6 } };
/** Gas-phase bond lengths of three alkali halide ion pairs, in ångströms. */
export const PAIR = { nacl: 2.36, kcl: 2.67, lif: 1.56 };
const DEEP = bond({ E0: 4, r0: 2.5, n: 1, m: 3, r: 2.5 });
const SHALLOW = bond({ E0: 2, r0: 2.5, n: 2, m: 6, r: 2.5 });

export default [
  problem({
    id: 'u1.1.stiffness',
    title: 'How stiff is the bond?',
    exam: 'u1',
    ch: '1',
    lab: 'bond',
    src: 'Flux, written for the Bond lab',
    topics: ['bond-stiffness'],
    principles: ['curvature'],
    vars: { shape: choice(['ionic', 'n = 1 and m = 9'], ['narrow', 'n = 2 and m = 6']), E0: range(1, 6, 0.5, 'eV'), r0: range(2, 3.5, 0.1, 'Å') },
    text: (T) => String.raw`A bond's energy is $U = -A/r^n + B/r^m$ with ${T.shape}. Its well is ${T.E0} eV deep at $r_0 = ${T.r0}$ Å. What is the bond's spring constant, in eV/Å²?`,
    parts: [num('k', ($) => (SHAPE[$.shape].n * SHAPE[$.shape].m * $.E0) / $.r0 ** 2, 'eV/Å²', { label: 'k' })],
    level: 1,
    hints: ['The spring constant is the curvature at the bottom of the well, U″(r₀).', 'For this curve it comes out as k = nmE₀/r₀².'],
    steps: ($) => [String.raw`$k = \dfrac{n m E_0}{r_0^2} = \dfrac{${SHAPE[$.shape].n}\cdot${SHAPE[$.shape].m}\cdot${$.E0}}{${$.r0}^2} = ${Number(((SHAPE[$.shape].n * SHAPE[$.shape].m * $.E0) / $.r0 ** 2).toPrecision(3))}$ eV/Å²`],
    sim: {
      scenario: 'deep',
      setup(s, $) {
        Object.assign(s, { shape: $.shape, E0: $.E0, r0: $.r0, x: 1 });
      },
      read: (c) => ({ k: c.numeric.k }),
    },
    cases: [kase('the ion pair’s shape', { shape: 'ionic', E0: 5.5, r0: 2.4 }, { k: 8.594 })],
  }),

  problem({
    id: 'u1.2.ion-pair',
    title: 'The energy of an ion pair',
    exam: 'u1',
    ch: '1',
    lab: 'bond',
    src: 'Flux, written for the Bond lab',
    topics: ['bond-energy'],
    principles: ['coulomb-pair'],
    vars: { pair: choice(['nacl', 'Na⁺ and Cl⁻, 2.36 Å apart'], ['kcl', 'K⁺ and Cl⁻, 2.67 Å apart'], ['lif', 'Li⁺ and F⁻, 1.56 Å apart']) },
    text: (T) => String.raw`An ion pair, ${T.pair}, is held by Coulomb attraction, $-ke^2/r$, and a repulsion $B/r^9$. With $ke^2 = 14.40$ eV·Å, how much energy does it take to pull the pair apart into separate ions?`,
    parts: [num('E0', ($) => (KE2 / PAIR[$.pair]) * (1 - 1 / 9), 'eV', { label: 'E₀' })],
    level: 2,
    hints: ['At r₀ the force is zero. That fixes B in terms of ke² and r₀.', 'Put B back into U(r₀): the repulsion takes back one ninth of the Coulomb energy, so E₀ = (ke²/r₀)(1 − 1/9).'],
    steps: ($) => [String.raw`$\dfrac{ke^2}{r_0} = \dfrac{14.40}{${PAIR[$.pair]}} = ${Number((KE2 / PAIR[$.pair]).toPrecision(3))}$ eV, so $E_0 = ${Number((KE2 / PAIR[$.pair]).toPrecision(3))}\left(1 - \tfrac19\right) = ${Number(((KE2 / PAIR[$.pair]) * (8 / 9)).toPrecision(3))}$ eV`],
    sim: {
      scenario: 'nacl',
      setup(s, $) {
        Object.assign(s, { shape: 'ionic', r0: PAIR[$.pair], E0: (KE2 / PAIR[$.pair]) * (1 - 1 / 9), x: 1 });
      },
      read: (c) => ({ E0: c.numeric.depth }),
    },
    cases: [kase('Na⁺Cl⁻', { pair: 'nacl' }, { E0: 5.424 })],
  }),

  problem({
    id: 'u1.3.force',
    title: 'The force at a stretch',
    exam: 'u1',
    ch: '1',
    lab: 'bond',
    src: 'Flux, written for the Bond lab',
    topics: ['bond-force'],
    principles: ['well'],
    vars: { shape: choice(['ionic', 'n = 1 and m = 9'], ['narrow', 'n = 2 and m = 6']), where: choice(['in', 'squeezed to 0.9 r₀'], ['out', 'stretched to 1.2 r₀']), E0: range(2, 6, 0.5, 'eV'), r0: range(2, 3, 0.1, 'Å') },
    text: (T) => String.raw`A bond's energy is $U = -A/r^n + B/r^m$ with ${T.shape}, a well ${T.E0} eV deep at $r_0 = ${T.r0}$ Å. The atoms are ${T.where}. How large is the force on each atom, in eV/Å, and which way does it point?`,
    parts: [
      num('F', ($) => Math.abs(force($)), 'eV/Å', { label: '|F|' }),
      pick('dir', 'the force', [['apart', 'pushes the atoms apart', 'Inside r₀ the curve climbs as r shrinks, so −dU/dr is positive.'], ['together', 'pulls the atoms together', 'Outside r₀ the curve climbs toward zero as r grows, so −dU/dr is negative.']], ($) => ($.where === 'in' ? 'apart' : 'together')),
    ],
    level: 2,
    hints: ['Find A and B from the well: A = m E₀ r₀ⁿ/(m − n), B = n E₀ r₀ᵐ/(m − n).', 'F = −dU/dr = −nA/rⁿ⁺¹ + mB/rᵐ⁺¹. Positive means apart.'],
    steps: ($) => {
      const { n, m } = SHAPE[$.shape];
      const w = mie({ E0: $.E0, r0: $.r0, n, m });
      const r = R($);
      return [String.raw`$A = ${Number(w.A.toPrecision(4))}$, $B = ${Number(w.B.toPrecision(4))}$, and $r = ${Number(r.toPrecision(4))}$ Å`, String.raw`$F = -\dfrac{${n}A}{r^{${n + 1}}} + \dfrac{${m}B}{r^{${m + 1}}} = ${Number(force($).toPrecision(3))}$ eV/Å`];
    },
    sim: {
      scenario: 'nacl',
      setup(s, $) {
        Object.assign(s, { shape: $.shape, E0: $.E0, r0: $.r0, x: $.where === 'in' ? 0.9 : 1.2 });
      },
      read: (c) => ({ F: Math.abs(c.Fr), dir: c.Fr > 0 ? 'apart' : 'together' }),
    },
    cases: [kase('an ion pair squeezed', { shape: 'ionic', where: 'in', E0: 5.5, r0: 2.4 }, { F: 4.211, dir: 'apart' })],
  }),

  problem({
    id: 'u1.4.depth-or-curvature',
    title: 'Deep or stiff?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'bond',
    src: 'Flux, written for the Bond lab',
    topics: ['bond-stiffness'],
    principles: ['curvature'],
    vars: { ask: choice(['stiff', 'stretches less under the same load'], ['melt', 'takes more energy to break apart']) },
    text: (T) => String.raw`Two solids have bonds of the same length, 2.5 Å. Bond P has a well 4 eV deep with $n = 1$, $m = 3$. Bond Q has a well 2 eV deep with $n = 2$, $m = 6$. Which bond ${T.ask}?`,
    parts: [
      pick('which', 'the bond', [
        ['P', 'P, the deeper well', 'Depth is the energy to break the bond. P’s is twice Q’s.'],
        ['Q', 'Q, the shallower well', 'Stiffness is the curvature, k = nmE₀/r₀². Q’s n·m is four times P’s, which beats half the depth.'],
      ], ($) => ($.ask === 'stiff' ? 'Q' : 'P')),
    ],
    level: 2,
    hints: ['Which property of the curve does each question ask about: its depth, or its curvature at the bottom?', 'k = nmE₀/r₀²: compare 1·3·4 with 2·6·2.'],
    steps: ($) => [$.ask === 'stiff' ? 'k_P = 1·3·4/2.5² = 1.92 eV/Å² and k_Q = 2·6·2/2.5² = 3.84 eV/Å². Q is twice as stiff.' : 'Breaking a bond takes its depth: 4 eV for P, 2 eV for Q. P takes more.'],
    sim: {
      scenario: 'shallow',
      setup() {},
      read: (c, s, $) => ({ which: $.ask === 'stiff' ? (c.k > DEEP.k ? 'Q' : 'P') : (c.E0 > DEEP.E0 ? 'Q' : 'P') }),
    },
    cases: [kase('which is stiffer', { ask: 'stiff' }, { which: 'Q' })],
  }),
];

function R($) {
  return ($.where === 'in' ? 0.9 : 1.2) * $.r0;
}

function force($) {
  const { n, m } = SHAPE[$.shape];
  return mie({ E0: $.E0, r0: $.r0, n, m }).F(R($));
}

export { SHALLOW };
