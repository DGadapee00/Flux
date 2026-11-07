/**
 * Unit 1 bank: bonding. Original problems, written for the Bond lab, with staged hints and named
 * traps (../coaching/u1.js), each checked against the lab (`sim`).
 */
import { KE2, bond, mie } from '@flux/subjects/matsci/bonding.js';
import { STRUCTURES, crystal } from '@flux/subjects/matsci/crystal.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The two well shapes the problems use, by the lab's names. */
export const SHAPE = { ionic: { n: 1, m: 9 }, narrow: { n: 2, m: 6 } };
/** Gas-phase bond lengths of three alkali halide ion pairs, in ångströms. */
export const PAIR = { nacl: 2.36, kcl: 2.67, lif: 1.56 };
/** Three metals for the density problem: structure, atomic radius (nm) and molar mass (g/mol). */
export const METAL = { fe: { st: 'bcc', R: 0.1241, A: 55.85, name: 'Iron' }, cu: { st: 'fcc', R: 0.1278, A: 63.55, name: 'Copper' }, al: { st: 'fcc', R: 0.1431, A: 26.98, name: 'Aluminum' } };
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
  problem({
    id: 'u1.5.lattice',
    title: 'The cell from the atom',
    exam: 'u1',
    ch: '1',
    lab: 'crystal',
    src: 'Flux, written for the Crystal lab',
    topics: ['crystal'],
    principles: ['packing'],
    vars: { st: choice(['bcc', 'body-centred cubic'], ['fcc', 'face-centred cubic']), R: range(0.12, 0.15, 0.001, 'nm') },
    text: (T) => `A metal is ${T.st}, and its atoms have a radius of ${T.R} nm. Treating them as hard spheres that touch, what is the cell edge a, in nm?`,
    parts: [num('a', ($) => STRUCTURES[$.st].aOfR($.R), 'nm', { label: 'a' })],
    level: 1,
    hints: ['Find the line along which the atoms touch: the body diagonal in BCC, a face diagonal in FCC.', 'Four radii fit along it. The body diagonal is √3 a; a face diagonal is √2 a.'],
    steps: ($) => [$.st === 'bcc' ? `√3 a = 4R, so a = 4(${$.R})/√3 = ${Number(STRUCTURES.bcc.aOfR($.R).toPrecision(4))} nm.` : `√2 a = 4R, so a = 2√2(${$.R}) = ${Number(STRUCTURES.fcc.aOfR($.R).toPrecision(4))} nm.`],
    sim: {
      scenario: 'cu',
      setup(s, $) {
        Object.assign(s, { material: 'cu', structure: $.st, grow: 1 });
      },
      read: (c, s, $) => ({ a: (c.a / c.R) * $.R }),
    },
    cases: [kase('copper', { st: 'fcc', R: 0.1278 }, { a: 0.3615 })],
  }),

  problem({
    id: 'u1.6.density',
    title: 'Density from the cell',
    exam: 'u1',
    ch: '1',
    lab: 'crystal',
    src: 'Flux, written for the Crystal lab',
    topics: ['crystal'],
    principles: ['packing'],
    vars: { metal: choice(['fe', 'iron: BCC, R = 0.1241 nm, A = 55.85 g/mol'], ['cu', 'copper: FCC, R = 0.1278 nm, A = 63.55 g/mol'], ['al', 'aluminum: FCC, R = 0.1431 nm, A = 26.98 g/mol']) },
    text: (T) => `Take ${T.metal}. Treating the atoms as touching hard spheres, find the density in g/cm³. Use N_A = 6.022 × 10²³ /mol.`,
    parts: [num('rho', ($) => crystal({ structure: METAL[$.metal].st, R: METAL[$.metal].R, A: METAL[$.metal].A }).density, 'g/cm³', { label: 'ρ' })],
    level: 2,
    hints: ['Find a from R, where the atoms touch, and convert it to cm (1 nm = 10⁻⁷ cm).', 'ρ = N A/(a³ N_A), with N = 2 atoms per BCC cell and 4 per FCC cell.'],
    steps: ($) => {
      const m = METAL[$.metal];
      const c = crystal({ structure: m.st, R: m.R, A: m.A });
      return [`a = ${Number(c.a.toPrecision(4))} nm, so a³ = ${Number((c.V * 1e-21).toPrecision(4))} cm³.`, `ρ = ${c.N}(${m.A})/(a³ N_A) = ${Number(c.density.toPrecision(3))} g/cm³.`];
    },
    sim: {
      scenario: 'cu',
      setup(s, $) {
        Object.assign(s, { material: $.metal, structure: METAL[$.metal].st, grow: 1 });
      },
      read: (c) => ({ rho: c.density }),
    },
    cases: [kase('copper', { metal: 'cu' }, { rho: 8.937 })],
  }),

  problem({
    id: 'u1.7.packing-fraction',
    title: 'How full is the cell?',
    exam: 'u1',
    ch: '1',
    lab: 'crystal',
    src: 'Flux, written for the Crystal lab',
    topics: ['crystal'],
    principles: ['packing'],
    vars: { st: choice(['bcc', 'body-centred cubic'], ['fcc', 'face-centred cubic']) },
    text: (T) => `What fraction of a ${T.st} cell do touching hard-sphere atoms fill?`,
    parts: [num('apf', ($) => crystal({ structure: $.st, R: 1, A: 1 }).apf, '', { label: 'APF', abs: 1e-4 })],
    level: 2,
    hints: ['Count the atoms per cell: a corner is shared by 8 cells, a face by 2, the centre by none.', 'APF = N(4/3)πR³/a³, with a in terms of R from where the atoms touch.'],
    steps: ($) => [$.st === 'bcc' ? 'N = 2 and a = 4R/√3: APF = 2(4/3)π/(4/√3)³ = π√3/8 = 0.680.' : 'N = 4 and a = 2√2 R: APF = 4(4/3)π/(2√2)³ = π/(3√2) = 0.740.'],
    sim: {
      scenario: 'cu',
      setup(s, $) {
        Object.assign(s, { material: 'cu', structure: $.st, grow: 1 });
      },
      read: (c) => ({ apf: c.apf }),
    },
    cases: [kase('BCC', { st: 'bcc' }, { apf: 0.6802 })],
  }),

  problem({
    id: 'u1.8.tightest',
    title: 'As tight as it can?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'crystal',
    src: 'Flux, written for the Crystal lab',
    topics: ['crystal'],
    principles: ['packing'],
    vars: { metal: choice(['fe', 'iron'], ['w', 'tungsten'], ['cr', 'chromium']) },
    text: (T) => `At room temperature ${T.metal} is body-centred cubic. Do its atoms pack as tightly as hard spheres can?`,
    parts: [
      pick('tight', 'its packing', [
        ['yes', 'yes: metals take the densest packing', 'The densest packing of equal spheres is 74%, in FCC and HCP. BCC is not one of them.'],
        ['no', 'no: it fills 68% of space, not 74%', 'BCC leaves 32% empty against 26% for FCC. Bonding, not packing alone, decides the structure.'],
      ], () => 'no'),
    ],
    level: 1,
    hints: ['What fraction does BCC fill? Compare it with FCC.', 'π√3/8 against π/(3√2).'],
    steps: () => ['BCC fills π√3/8 = 0.680 of space; FCC and HCP fill 0.740, the most equal spheres can. So no.'],
    sim: {
      scenario: 'fe',
      setup() {},
      read: (c) => ({ tight: c.apf > 0.73 ? 'yes' : 'no' }),
    },
    cases: [kase('iron', { metal: 'fe' }, { tight: 'no' })],
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
