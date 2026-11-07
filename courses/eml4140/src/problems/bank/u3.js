/**
 * Unit 3 bank: convection. Original problems, written for the Thermal layer lab, with staged hints
 * and named traps (../coaching/u3.js), each checked against the lab (`sim`).
 */
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The streams by name: speed (m/s), conductivity (W/m·K), kinematic viscosity (m²/s), Pr. Near 300 K. */
export const STREAMS = {
  air: { U: 5, k: 0.0263, nu: 1.57e-5, Pr: 0.707 },
  water: { U: 0.5, k: 0.613, nu: 8.57e-7, Pr: 5.83 },
};
export const DT_PLATE = 40; // K, plate above the stream
/** The local heat flux with θ′(0) given, W/m². */
export const fluxWith = ($, wall) => {
  const S = STREAMS[$.fluid];
  return S.k * DT_PLATE * wall * Math.sqrt(S.U / (S.nu * $.x));
};
export const corrWall = ($) => 0.332 * STREAMS[$.fluid].Pr ** (1 / 3);

export default [
  problem({
    id: 'u3.1.flux',
    title: 'Heat leaving a warm plate',
    exam: 'u3',
    ch: '6',
    lab: 'thermal',
    src: 'Flux, written for the Thermal layer lab',
    topics: ['wall-flux'],
    principles: ['thermal-layer'],
    vars: {
      fluid: choice(
        ['air', 'air at 5 m/s (k = 0.0263 W/m·K, ν = 1.57 × 10⁻⁵ m²/s, Pr = 0.707)'],
        ['water', 'water at 0.5 m/s (k = 0.613 W/m·K, ν = 8.57 × 10⁻⁷ m²/s, Pr = 5.83)'],
      ),
      x: range(0.1, 0.5, 0.05, 'm'),
    },
    text: (T) => `A flat plate, held 40 K above the stream, sits edge-on in ${T.fluid}. The layer is laminar. Using θ′(0) ≈ 0.332 Pr^(1/3), what heat flux leaves the plate ${T.x} m from its leading edge, in W/m²?`,
    parts: [num('q', ($) => fluxWith($, corrWall($)), 'W/m²', { label: 'q″', tol: 0.03 })],
    level: 2,
    hints: [
      'At the wall the fluid is still, so heat leaves by conduction: q″ = −k ∂T/∂y there.',
      'With η = y√(U/νx), ∂T/∂y at the wall is (T∞ − Ts) θ′(0) √(U/νx). So q″ = k ΔT θ′(0) √(U/νx).',
    ],
    steps: ($) => {
      const S = STREAMS[$.fluid];
      const w = corrWall($);
      return [
        String.raw`$\theta'(0) \approx 0.332(${S.Pr})^{1/3} = ${Number(w.toPrecision(3))}$, and $\sqrt{U/\nu x} = ${Number(Math.sqrt(S.U / (S.nu * $.x)).toPrecision(4))}$ m⁻¹`,
        String.raw`$q'' = ${S.k}(40)(${Number(w.toPrecision(3))})(${Number(Math.sqrt(S.U / (S.nu * $.x)).toPrecision(4))}) = ${Number(fluxWith($, w).toPrecision(3))}$ W/m²`,
      ];
    },
    sim: {
      scenario: 'air',
      setup(s, $) {
        s.lp = Math.log10(STREAMS[$.fluid].Pr);
      },
      read: (c, s, $) => ({ q: fluxWith($, c.wall) }),
    },
    cases: [kase('water, 0.3 m along', { fluid: 'water', x: 0.3 }, { q: 20430 })],
  }),

  problem({
    id: 'u3.2.which-layer',
    title: 'Which layer is thicker?',
    exam: 'u3',
    ch: '6',
    kind: 'conceptual',
    lab: 'thermal',
    src: 'Flux, written for the Thermal layer lab',
    topics: ['thermal-layer'],
    principles: ['thermal-layer'],
    vars: { fluid: choice(['mercury', 'liquid mercury, Pr ≈ 0.025'], ['air', 'air, Pr ≈ 0.7'], ['oil', 'an engine oil, Pr in the hundreds or more']) },
    text: (T) => `A heated plate sits in a laminar stream of ${T.fluid}. How does the thermal layer compare with the velocity layer?`,
    parts: [
      pick('d', 'the thermal layer', [
        ['thicker', 'it is several times thicker', 'Where heat diffuses much faster than momentum, Pr ≪ 1, it spreads far beyond the velocity layer.'],
        ['same', 'it is about as thick', 'Near Pr = 1 heat and momentum diffuse at about the same rate.'],
        ['thinner', 'it is a thin skin inside it', 'Where momentum diffuses much faster than heat, Pr ≫ 1, the thermal layer is about Pr^(−1/3) of the velocity layer.'],
      ], ($) => ({ mercury: 'thicker', air: 'same', oil: 'thinner' })[$.fluid]),
    ],
    level: 1,
    hints: ['Pr = ν/α: momentum diffusivity over heat diffusivity.', 'The layer that diffuses faster spreads farther from the wall in the same time.'],
    steps: ($) => [
      {
        mercury: 'Pr = 0.025: heat diffuses 40 times faster than momentum, so the thermal layer is about five times thicker.',
        air: 'Pr = 0.7: the two diffuse at nearly the same rate, and the thermal layer is about 1.14 times the velocity layer.',
        oil: 'Pr in the hundreds: the thermal layer is a tenth of the velocity layer or less.',
      }[$.fluid],
    ],
    sim: {
      scenario: 'air',
      setup(s, $) {
        s.lp = Math.log10({ mercury: 0.025, air: 0.71, oil: 500 }[$.fluid]);
      },
      read: (c) => ({ d: c.ratio > 2 ? 'thicker' : c.ratio > 0.6 ? 'same' : 'thinner' }),
    },
    cases: [kase('mercury', { fluid: 'mercury' }, { d: 'thicker' })],
  }),
];
