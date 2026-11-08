/**
 * Unit 2 bank: compressible flow. Original problems, written for the Nozzle lab, with staged hints
 * and named traps (../coaching/u2.js), each checked against the lab (`sim`) or a second route.
 */
import { choice, kase, num, problem, range } from '../kit.js';
import { GAMMA, R_AIR, shockMach, shockPressure, shockStagnation } from '@flux/subjects/thermo/nozzle.js';
import { areaRatio, machFromArea, pressureRatio } from '@flux/subjects/thermo/isentropic.js';
import { jetClosed } from '@flux/subjects/thermo/jet.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const g = GAMMA;
export const CHOKE = (2 / (g + 1)) ** ((g + 1) / (2 * (g - 1)));
/** Choked mass flow, kg/s, for p₀ in kPa, T₀ in K and a throat in cm². */
export const choked = ($, factor = CHOKE, root = true) => {
  const k = g / (R_AIR * $.T0);
  return Number($.At) * 1e-4 * $.p0 * 1000 * (root ? Math.sqrt(k) : k) * factor;
};
/** Across a normal shock from M₁: M₂, p₂/p₁ or p₀₂/p₀₁. */
export const across = ($) => ({ M2: shockMach($.M1), p: shockPressure($.M1), p0: shockStagnation($.M1) })[$.ask];
const p3 = (x) => Number(x.toPrecision(3));

/** Propulsive efficiency from jet and flight speeds; `how` reproduces the traps. */
export const propEff = ($, how = 'right') => {
  const r = Number($.Ve) / Number($.V0);
  if (how === 'ratio') return 1 / r;
  if (how === 'half') return 1 / (1 + r);
  return 2 / (1 + r);
};
/** The same from energy: thrust power over the jet power added, per kilogram of air. */
export const propEffEnergy = ($) => {
  const Ve = Number($.Ve);
  const V0 = Number($.V0);
  return ((Ve - V0) * V0) / (0.5 * (Ve * Ve - V0 * V0));
};

export default [
  problem({
    id: 'u2.1.choked',
    title: 'How much gets through',
    exam: 'u2',
    ch: '2',
    lab: 'nozzle',
    src: 'Flux, written for the Nozzle lab',
    topics: ['choke'],
    principles: ['choke'],
    vars: { At: choice(['5', '5 cm²'], ['10', '10 cm²'], ['20', '20 cm²']), p0: range(200, 1000, 100, 'kPa'), T0: range(250, 600, 50, 'K') },
    text: (T) => `Air (γ = 1.4, R = 287 J/(kg·K)) flows from a tank at ${T.p0} and ${T.T0} through a converging–diverging nozzle with a throat of ${T.At}. The back pressure is low enough that the throat is sonic. What is the mass flow, in kg/s?`,
    parts: [num('m', ($) => choked($), 'kg/s', { label: 'ṁ' })],
    level: 2,
    hints: ['With a sonic throat, the mass flow depends only on the tank and the throat.', 'ṁ = A_t p₀ √(γ/(RT₀)) (2/(γ+1))^((γ+1)/(2(γ−1))), and the last factor is 0.579 for γ = 1.4.'],
    steps: ($) => [String.raw`$\dot m = ${$.At}\times10^{-4} \times ${$.p0 * 1000} \times \sqrt{1.4/(287 \times ${$.T0})} \times 0.579 = ${p3(choked($))}$ kg/s`],
    sim: {
      scenario: 'shock',
      setup() {},
      // The lab's nozzle: 10 cm², 500 kPa, 300 K. ṁ scales with A_t p₀/√T₀.
      read: (c, s, $) => ({ m: c.mdotChoked * (Number($.At) / 10) * ($.p0 / 500) * Math.sqrt(300 / $.T0) }),
    },
    cases: [kase('the notes’ nozzle', { At: '10', p0: 500, T0: 300 }, { m: 1.167 })],
  }),

  problem({
    id: 'u2.2.shock',
    title: 'Across a normal shock',
    exam: 'u2',
    ch: '2',
    lab: 'nozzle',
    src: 'Flux, written for the Nozzle lab',
    topics: ['shock'],
    principles: ['shock'],
    vars: { ask: choice(['M2', 'the Mach number behind it, M₂'], ['p', 'the static pressure ratio p₂/p₁'], ['p0', 'the stagnation pressure ratio p₀₂/p₀₁']), M1: range(1.3, 3, 0.1, '') },
    text: (T) => `Air (γ = 1.4) meets a normal shock at Mach ${T.M1}. Find ${T.ask}.`,
    parts: [num('v', ($) => across($), '', { label: 'value', abs: 1e-6 })],
    level: 2,
    hints: ['M₂² = (1 + (γ−1)M₁²/2)/(γM₁² − (γ−1)/2).', 'p₂/p₁ = 1 + 2γ(M₁² − 1)/(γ+1). For p₀₂/p₀₁, take p₂/p₁ and the isentropic ratio p₀/p on each side.'],
    steps: ($) => [String.raw`$M_2 = ${p3(shockMach($.M1))}$, $p_2/p_1 = ${p3(shockPressure($.M1))}$, $p_{02}/p_{01} = ${p3(shockStagnation($.M1))}$`],
    // Another route: mass across the shock fixes A*₂/A*₁ = p₀₁/p₀₂, so M₂ is the subsonic Mach number
    // for A/A* = (A/A*)(M₁) · p₀₂/p₀₁; the pressure ratio then follows from the isentropic ratios.
    second: ($) => {
      const r0 = (shockPressure($.M1) * pressureRatio($.M1)) / pressureRatio(shockMach($.M1));
      const M2 = machFromArea(areaRatio($.M1) * r0, 'subsonic');
      return { v: ({ M2, p: (r0 * pressureRatio(M2)) / pressureRatio($.M1), p0: r0 })[$.ask] };
    },
    cases: [kase('the notes’ shock, its loss', { ask: 'p0', M1: 1.66 }, { v: 0.874 })],
  }),

  problem({
    id: 'u2.3.lower',
    title: 'Pull harder?',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'nozzle',
    src: 'Flux, written for the Nozzle lab',
    topics: ['choke'],
    principles: ['choke'],
    vars: { state: choice(['choked', 'the throat is already at Mach 1'], ['sub', 'the flow is subsonic everywhere, Mach 0.5 at the throat']) },
    text: (T) => `Air flows from a tank through a converging–diverging nozzle, and ${T.state}. The back pressure is lowered a little. What happens to the mass flow?`,
    parts: [
      pick('m', 'the mass flow', [
        ['more', 'it rises', 'A lower back pressure draws more through, but only while the throat is below Mach 1.'],
        ['same', 'it stays the same', 'With a sonic throat, no pressure signal from downstream can reach the tank: the mass flow is fixed.'],
        ['less', 'it falls', 'A lower back pressure never draws less through.'],
      ], ($) => ($.state === 'choked' ? 'same' : 'more')),
    ],
    level: 1,
    hints: ['Is the throat at Mach 1?', 'Pressure signals travel at the speed of sound.'],
    steps: ($) => [$.state === 'choked' ? 'Choked: the mass flow is set by p₀, T₀ and the throat. It stays the same.' : 'Not choked: the lower back pressure draws more gas through.'],
    sim: {
      scenario: 'shock',
      setup(s, $) {
        if ($.state === 'sub') s.pb = 485;
      },
      read: (c) => ({ m: c.choked ? 'same' : 'more' }),
    },
    cases: [kase('a choked nozzle', { state: 'choked' }, { m: 'same' })],
  }),

  problem({
    id: 'u2.4.what-changes',
    title: 'What a shock does',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'nozzle',
    src: 'Flux, written for the Nozzle lab',
    topics: ['shock'],
    principles: ['shock'],
    vars: { q: choice(['speed', 'the flow speed'], ['p', 'the static pressure'], ['p0', 'the stagnation pressure'], ['T0', 'the stagnation temperature']) },
    text: (T) => `A supersonic flow of air passes through a normal shock. What happens to ${T.q}?`,
    parts: [
      pick('d', 'across the shock', [
        ['up', 'it rises', 'The pressure, temperature and density jump up as the flow is compressed.'],
        ['down', 'it falls', 'The flow slows to subsonic, and entropy rises, so the stagnation pressure falls.'],
        ['same', 'it stays the same', 'No heat or work crosses a shock, so the stagnation temperature is unchanged.'],
      ], ($) => ({ speed: 'down', p: 'up', p0: 'down', T0: 'same' })[$.q]),
    ],
    level: 1,
    hints: ['A shock compresses the gas suddenly.', 'Energy is conserved; entropy is not.'],
    steps: ($) => [({ speed: 'It falls: supersonic to subsonic.', p: 'It rises, by 1 + 2γ(M₁² − 1)/(γ+1).', p0: 'It falls: the shock is irreversible.', T0: 'It stays the same: no heat or work crosses the shock.' })[$.q]],
    sim: {
      scenario: 'shock',
      setup() {},
      read: (c, s, $) => {
        const k = c.xs.findIndex((x) => x > c.shock.x);
        const before = { M: c.M[k - 1], p: c.p[k - 1] };
        const after = { M: c.M[k], p: c.p[k] };
        const dir = (a, b) => (b > a * (1 + 1e-6) ? 'up' : b < a * (1 - 1e-6) ? 'down' : 'same');
        return { d: ({ speed: dir(before.M, after.M), p: dir(before.p, after.p), p0: dir(1, c.shock.p0ratio), T0: 'same' })[$.q] };
      },
    },
    cases: [kase('the stagnation pressure', { q: 'p0' }, { d: 'down' })],
  }),
  problem({
    id: 'u2.5.propulsive',
    title: 'Propulsive efficiency',
    exam: 'u2',
    ch: '2',
    lab: 'jet',
    src: 'Flux, written for the Bypass lab',
    topics: ['propulsion'],
    principles: ['propulsion'],
    vars: { V0: choice(['230', '230 m/s'], ['250', '250 m/s']), Ve: choice(['350', '350 m/s'], ['600', '600 m/s'], ['900', '900 m/s']) },
    text: (T) => `An aircraft flies at ${T.V0}; its engine’s jet leaves at ${T.Ve} relative to it. What is the propulsive efficiency?`,
    parts: [num('eta', ($) => propEff($), '', { label: 'η_p' })],
    level: 1,
    hints: ['Useful power is FV₀; power added is ½ṁ(V_e² − V₀²).', 'η_p = 2/(1 + V_e/V₀).'],
    steps: ($) => [String.raw`$\eta_p = \frac{2}{1 + ${$.Ve}/${$.V0}} = ${Number(propEff($).toPrecision(3))}$`],
    second: ($) => ({ eta: propEffEnergy($) }),
    cases: [kase('250 and 600', { V0: '250', Ve: '600' }, { eta: 0.5882 })],
  }),

  problem({
    id: 'u2.6.bigger-fan',
    title: 'A bigger fan',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'jet',
    src: 'Flux, written for the Bypass lab',
    topics: ['propulsion'],
    principles: ['propulsion'],
    vars: { B: choice(['5', 'a bypass ratio of 5'], ['10', 'a bypass ratio of 10']) },
    text: (T) => `A turbojet core is given a fan with ${T.B}, and the same jet power. What happens to the thrust at cruise?`,
    parts: [
      pick('a', 'the thrust', [
        ['up', 'it rises', 'More air at a lower jet speed: less energy is wasted in the wake.'],
        ['down', 'it falls', 'The jet is slower, but far more air is pushed: F = ṁ(V_e − V₀) rises.'],
        ['same', 'no change: same power, same thrust', 'Thrust is not fixed by power; the share left in the wake changes.'],
      ], () => 'up'),
    ],
    level: 1,
    hints: ['F V₀ = η_p P.', 'How does η_p change as V_e approaches V₀?'],
    steps: () => ['η_p rises as V_e falls toward V₀, so F = η_p P/V₀ rises.'],
    sim: { scenario: 'turbojet', setup(s, $) { s.B = Number($.B); }, read: (c) => ({ a: c.F > jetClosed({ B: 0 }).F ? 'up' : 'down' }) },
    cases: [kase('bypass 5', { B: '5' }, { a: 'up' })],
  }),
];
