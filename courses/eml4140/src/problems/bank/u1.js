/**
 * Unit 1 bank: the heat equation on a rod. Original problems, written for the Rod lab, with staged
 * hints and named traps (../coaching/u1.js), each checked against the lab (`sim`).
 */
import { ALPHA } from '@flux/subjects/heat/rod.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
export const HALF = Math.log(2) / Math.PI ** 2;
export const NAME = { copper: 'copper', aluminum: 'aluminum', steel: 'carbon steel', glass: 'Pyrex glass' };
/** The middle of the rod, θ, for the two profiles the problems use. */
export const midTheta = (profile, Fo) => Math.exp(-(Math.PI ** 2) * Fo) + (profile === 'wiggle' ? Math.exp(-25 * Math.PI ** 2 * Fo) / 3 : 0);

export default [
  problem({
    id: 'u1.1.half-time',
    title: 'How long to cool halfway',
    exam: 'u1',
    ch: '1',
    lab: 'rod',
    src: 'Flux, written for the Rod lab',
    topics: ['heat-equation'],
    principles: ['diffusion-time'],
    vars: { material: choice(['copper', 'copper, α = 117 mm²/s'], ['aluminum', 'aluminum, α = 97.1 mm²/s'], ['steel', 'carbon steel, α = 17.7 mm²/s']), L: range(5, 30, 1, 'cm', 0.01) },
    text: (T) => String.raw`A rod of ${T.material}, ${T.L} cm long, has its ends held at a fixed temperature. Its excess temperature starts as a half sine, $\theta_0 = \sin(\pi x/L)$. How long until the middle has lost half its excess?`,
    parts: [num('t', ($) => (HALF * $.L ** 2) / ALPHA[$.material], 's', { label: 't' })],
    level: 1,
    hints: ['A half sine keeps its shape and fades as exp(−π²αt/L²).', 'Set exp(−π²αt/L²) = ½: t = (ln 2/π²) L²/α. Put L in metres and α in m²/s.'],
    steps: ($) => [String.raw`$t = \dfrac{\ln 2}{\pi^2}\,\dfrac{L^2}{\alpha} = 0.0702\times\dfrac{(${$.L})^2}{${ALPHA[$.material]}} = ${Number(((HALF * $.L ** 2) / ALPHA[$.material]).toPrecision(3))}$ s`],
    sim: {
      scenario: 'copper',
      setup(s, $) {
        Object.assign(s, { profile: 'hump', material: $.material, L: $.L, Fo: HALF });
      },
      read: (c) => ({ t: c.t }),
    },
    cases: [kase('a 10 cm copper rod', { material: 'copper', L: 10 }, { t: 6.003 })],
  }),

  problem({
    id: 'u1.2.middle',
    title: 'The middle of the rod',
    exam: 'u1',
    ch: '1',
    lab: 'rod',
    src: 'Flux, written for the Rod lab',
    topics: ['fourier-series'],
    principles: ['modes'],
    vars: { profile: choice(['hump', 'a half sine, θ₀ = sin(πx/L)'], ['wiggle', 'a half sine with a ripple, θ₀ = sin(πx/L) + ⅓ sin(5πx/L)']), t: range(1, 10, 0.5, 's') },
    text: (T) => String.raw`A copper rod 10 cm long ($\alpha = 117$ mm²/s) has its ends held at 20 °C. Its excess temperature starts as ${T.profile}, times 80 °C. What is the temperature at the middle after ${T.t} s?`,
    parts: [num('T', ($) => 20 + 80 * midTheta($.profile, (ALPHA.copper * $.t) / 0.01), '°C', { label: 'T' })],
    level: 2,
    hints: ['Find Fo = αt/L², with L = 0.1 m.', 'Each sine fades on its own: mode n by exp(−(nπ)²Fo). At the middle, sin(π/2) = sin(5π/2) = 1. Then add the ends’ 20 °C.'],
    steps: ($) => {
      const Fo = (ALPHA.copper * $.t) / 0.01;
      return [String.raw`$\mathrm{Fo} = \dfrac{(1.17\times10^{-4})(${$.t})}{0.1^2} = ${Number(Fo.toPrecision(3))}$`, String.raw`$\theta = ${Number(midTheta($.profile, Fo).toPrecision(3))}$, so $T = 20 + 80\theta = ${Number((20 + 80 * midTheta($.profile, Fo)).toPrecision(3))}$ °C`];
    },
    sim: {
      scenario: 'copper',
      setup(s, $) {
        Object.assign(s, { profile: $.profile, material: 'copper', L: 0.1, Fo: (ALPHA.copper * $.t) / 0.01 });
      },
      read: (c) => ({ T: c.midC }),
    },
    cases: [kase('a half sine after 4 s', { profile: 'hump', t: 4 }, { T: 70.41 })],
  }),

  problem({
    id: 'u1.3.scale',
    title: 'Another rod, the same profile',
    exam: 'u1',
    ch: '1',
    lab: 'rod',
    src: 'Flux, written for the Rod lab',
    topics: ['diffusion-scale'],
    principles: ['diffusion-time'],
    vars: { material: choice(['aluminum', 'aluminum (97.1 mm²/s)'], ['steel', 'carbon steel (17.7 mm²/s)'], ['glass', 'Pyrex glass (0.75 mm²/s)']), t1: range(2, 20, 1, 's'), L2: range(5, 30, 1, 'cm', 0.01) },
    text: (T) => String.raw`A copper rod 10 cm long ($\alpha = 117$ mm²/s) reaches some temperature profile ${T.t1} s after it starts. A rod of ${T.material}, ${T.L2} cm long, starts from the same shape. How long does it take to reach the same profile?`,
    parts: [num('t2', ($) => $.t1 * ($.L2 / 0.1) ** 2 * (ALPHA.copper / ALPHA[$.material]), 's', { label: 't₂' })],
    level: 2,
    hints: ['The profile depends on time only through Fo = αt/L². Same profile, same Fo.', 't₂ = t₁ (L₂/L₁)² (α₁/α₂).'],
    steps: ($) => [String.raw`$t_2 = t_1\left(\dfrac{L_2}{L_1}\right)^2\dfrac{\alpha_1}{\alpha_2} = ${$.t1}\left(\dfrac{${$.L2}}{0.1}\right)^2\dfrac{117}{${ALPHA[$.material] * 1e6}} = ${Number(($.t1 * ($.L2 / 0.1) ** 2 * (ALPHA.copper / ALPHA[$.material])).toPrecision(3))}$ s`],
    sim: {
      scenario: 'copper',
      setup(s, $) {
        Object.assign(s, { material: $.material, L: $.L2, Fo: (ALPHA.copper * $.t1) / 0.01 });
      },
      read: (c) => ({ t2: c.t }),
    },
    cases: [kase('a 20 cm steel rod', { material: 'steel', t1: 5, L2: 20 }, { t2: 132.2 })],
  }),

  problem({
    id: 'u1.4.what-lasts',
    title: 'What is left',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'rod',
    src: 'Flux, written for the Rod lab',
    topics: ['fourier-series'],
    principles: ['modes'],
    vars: { ripple: choice(['fine', 'a fine ripple, five bumps along the rod'], ['coarse', 'a coarser ripple, three bumps along the rod']) },
    text: (T) => String.raw`A rod with its ends held at a fixed temperature starts with a broad hump of heat and ${T.ripple} on top of it. After a while, what is left of the starting shape?`,
    parts: [
      pick('left', 'what is left', [
        ['hump', 'mostly the broad hump', 'Mode n fades as exp(−(nπ)²Fo). The hump is n = 1; the ripple is n = 3 or 5, which fades 9 or 25 times faster.'],
        ['ripple', 'mostly the ripple', 'The ripple has the steepest gradients, so heat flows across it fastest: it goes first, not last.'],
        ['both', 'both, in the same proportion', 'Each sine fades at its own rate, and the rate grows as n². The proportions change.'],
      ], () => 'hump'),
    ],
    level: 2,
    hints: ['Write the start as a sum of sines that fit between the ends.', 'Which fades faster, sin(πx/L) or sin(5πx/L)?'],
    steps: () => ['The hump is the first mode and fades as exp(−π²Fo). A ripple of n bumps fades as exp(−n²π²Fo), n² times faster, so the hump is what remains.'],
    sim: {
      scenario: 'wiggle',
      setup(s) {
        s.Fo = 0.02;
      },
      read: (c) => ({ left: c.rippleShare < c.humpShare ? 'hump' : 'ripple' }),
    },
    cases: [kase('a fine ripple', { ripple: 'fine' }, { left: 'hump' })],
  }),
];
