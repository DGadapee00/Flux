/**
 * Unit 3 bank: convection. Original problems, written for the Thermal layer lab, with staged hints
 * and named traps (../coaching/u3.js), each checked against the lab (`sim`).
 */
import { plateConvection } from '@flux/subjects/heat/convection.js';
import { choice, kase, num, problem, range } from '../kit.js';
import { TUBE, WATER } from '@flux/subjects/heat/tube.js';
import { AIR, PLATE as PLUME, gFit, plateClosed } from '@flux/subjects/heat/plume.js';
import { LIQ, SAT, WALL } from '@flux/subjects/heat/boiling.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The streams by name: speed (m/s), conductivity (W/m·K), kinematic viscosity (m²/s), Pr. Near 300 K. */
export const STREAMS = {
  air: { U: 5, k: 0.0263, nu: 1.57e-5, Pr: 0.707 },
  water: { U: 0.5, k: 0.613, nu: 8.57e-7, Pr: 5.83 },
};
/** The average-h problem's streams: speed (m/s) and properties. */
export const PLATE = {
  air: { U: 5, k: 0.0263, nu: 1.57e-5, Pr: 0.707 },
  water: { U: 0.2, k: 0.613, nu: 8.57e-7, Pr: 5.83 },
};
export const avgH = ($, c = 0.664, pr = 1 / 3) => {
  const S = PLATE[$.fluid];
  return (c * Math.sqrt((S.U * $.L) / S.nu) * S.Pr ** pr * S.k) / $.L;
};
export const DT_PLATE = 40; // K, plate above the stream
/** The local heat flux with θ′(0) given, W/m². */
export const fluxWith = ($, wall) => {
  const S = STREAMS[$.fluid];
  return S.k * DT_PLATE * wall * Math.sqrt(S.U / (S.nu * $.x));
};
export const corrWall = ($) => 0.332 * STREAMS[$.fluid].Pr ** (1 / 3);

/** Outlet temperature of laminar water at m g/s, with the heated area per metre `per(D)`. */
export const outletT = ($, per = (D) => Math.PI * D) => {
  const h = (3.66 * WATER.k) / TUBE.D;
  const mcp = (Number($.m) / 1000) * WATER.cp;
  return TUBE.Ts - (TUBE.Ts - TUBE.Ti) * Math.exp((-h * per(TUBE.D) * TUBE.L) / mcp);
};
/** The same water if it kept warming at its first rate. */
export const steadyRate = ($) => {
  const h = (3.66 * WATER.k) / TUBE.D;
  return TUBE.Ti + (h * Math.PI * TUBE.D * TUBE.L * (TUBE.Ts - TUBE.Ti)) / ((Number($.m) / 1000) * WATER.cp);
};

/** Average h on the plate at Ts, with β from `beta(Tf °C)` and the factor `avg` (4/3 for the average). */
export const plumeH = ($, beta = (Tf) => 1 / (Tf + 273.15), avg = 4 / 3) => {
  const dT = Number($.Ts) - AIR.Tinf;
  const Gr = (AIR.g * beta((Number($.Ts) + AIR.Tinf) / 2) * dT * PLUME.L ** 3) / AIR.nu ** 2;
  return (avg * (Gr / 4) ** 0.25 * gFit(AIR.Pr) * AIR.k) / PLUME.L;
};

/** Nusselt's film on a vertical wall, h̄ for ΔT = 100 − Ts; `kpow` is the power on k. */
export const condenseH = ($, kpow = 3) => {
  const dT = SAT.T - Number($.Ts);
  const hp = SAT.hfg + 0.68 * LIQ.cp * dT;
  return 0.943 * ((SAT.g * SAT.rl * (SAT.rl - SAT.rv) * hp * LIQ.k ** kpow) / (LIQ.mu * dT * WALL.L)) ** 0.25;
};

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

  problem({
    id: 'u3.3.average',
    title: 'The average h on a plate',
    exam: 'u3',
    ch: '6',
    lab: 'nusselt',
    src: 'Flux, written for the Nusselt lab',
    topics: ['plate-h'],
    principles: ['convection'],
    vars: {
      fluid: choice(
        ['air', 'air at 5 m/s (k = 0.0263 W/m·K, ν = 1.57 × 10⁻⁵ m²/s, Pr = 0.707)'],
        ['water', 'water at 0.2 m/s (k = 0.613 W/m·K, ν = 8.57 × 10⁻⁷ m²/s, Pr = 5.83)'],
      ),
      L: range(0.5, 1.5, 0.25, 'm'),
    },
    text: (T) => `A smooth plate ${T.L} m long sits edge-on in ${T.fluid}, and the layer stays laminar over all of it. What is the average heat transfer coefficient over the plate, in W/m²·K?`,
    parts: [num('h', ($) => avgH($), 'W/m²·K', { label: 'h̄' })],
    level: 2,
    hints: ['Find Re_L = UL/ν and check it is below 5 × 10⁵.', 'Average over a laminar plate: N̄u = 0.664 Re_L^(1/2) Pr^(1/3), then h̄ = N̄u k/L.'],
    steps: ($) => {
      const S = PLATE[$.fluid];
      const Re = (S.U * $.L) / S.nu;
      return [
        String.raw`$\mathrm{Re}_L = ${Number(Re.toPrecision(3))}$, laminar`,
        String.raw`$\overline{\mathrm{Nu}} = 0.664\sqrt{${Number(Re.toPrecision(3))}}\,(${S.Pr})^{1/3} = ${Number(((avgH($) * $.L) / S.k).toPrecision(3))}$, so $\bar h = ${Number(avgH($).toPrecision(3))}$ W/m²·K`,
      ];
    },
    sim: {
      scenario: 'air',
      setup(s, $) {
        Object.assign(s, { fluid: $.fluid, lU: Math.log10(PLATE[$.fluid].U), L: $.L });
      },
      read: (c) => ({ h: c.hBar }),
    },
    cases: [kase('air on a 1 m plate', { fluid: 'air', L: 1 }, { h: 8.779 })],
  }),

  problem({
    id: 'u3.4.what-changes-h',
    title: 'Is h a property of the fluid?',
    exam: 'u3',
    ch: '6',
    kind: 'conceptual',
    lab: 'nusselt',
    src: 'Flux, written for the Nusselt lab',
    topics: ['plate-h'],
    principles: ['convection'],
    vars: { change: choice(['speed', 'the stream speed doubles'], ['longer', 'the plate is made twice as long'], ['wider', 'the plate is made twice as wide, across the stream']) },
    text: (T) => `Oil flows along a heated plate and the layer stays laminar. Nothing about the oil changes. What happens to the average heat transfer coefficient if ${T.change}?`,
    parts: [
      pick('d', 'the average h', [
        ['up', 'it rises', 'A faster stream thins the layer everywhere: h̄ ∝ √U.'],
        ['down', 'it falls', 'A longer plate adds length where the layer is thick and h is low: h̄ ∝ 1/√L.'],
        ['same', 'it does not change', 'Across the stream nothing varies: every strip of the plate sees the same layer, so h̄ stays.'],
      ], ($) => ({ speed: 'up', longer: 'down', wider: 'same' })[$.change]),
    ],
    level: 1,
    hints: ['Write h̄ = 0.664 (k/L) √(UL/ν) Pr^(1/3) and see what each change does.', 'Which of U, L and the width appear in it?'],
    steps: ($) => [{ speed: 'h̄ ∝ √U: up by √2.', longer: 'h̄ ∝ √(UL)/L = √(U/L): down by √2.', wider: 'Width does not appear: h̄ is unchanged.' }[$.change]],
    sim: {
      scenario: 'oil',
      read: (c, s, $) => {
        if ($.change === 'wider') return { d: 'same' };
        const other = plateConvection({ fluid: s.fluid, U: $.change === 'speed' ? 2 * c.U : c.U, L: $.change === 'longer' ? 2 * s.L : s.L });
        const r = other.hBar / c.hBar;
        return { d: r > 1.05 ? 'up' : r < 0.95 ? 'down' : 'same' };
      },
    },
    cases: [kase('a faster stream', { change: 'speed' }, { d: 'up' })],
  }),
  problem({
    id: 'u3.5.outlet',
    title: 'Water out of a heated tube',
    exam: 'u3',
    ch: '6',
    lab: 'tube',
    src: 'Flux, written for the Tube lab',
    topics: ['tubes'],
    principles: ['tubes'],
    vars: { m: choice(['2', '2 g/s'], ['4', '4 g/s'], ['6', '6 g/s'], ['8', '8 g/s']) },
    text: (T) => `Water flows at ${T.m} through a tube 10 mm across and 5 m long, laminar and fully developed, with its wall at 80 °C. It enters at 20 °C. Take Nu_D = 3.66, k = 0.63 W/(m·K) and c_p = 4180 J/(kg·K). At what temperature does it leave, in °C?`,
    parts: [num('To', ($) => outletT($), '°C', { label: 'T_out' })],
    level: 2,
    hints: ['h = Nu k/D.', 'The difference to the wall decays as exp(−hPL/ṁc_p), with P = πD.'],
    steps: ($) => [String.raw`$h = 3.66 \times 0.63/0.01 = 231$ W/(m²·K)`, String.raw`$T_\text{out} = 80 - 60\,e^{-hPL/\dot m c_p} = ${Number(outletT($).toPrecision(3))}$ °C`],
    sim: { scenario: 'laminar', setup(s, $) { s.mdot = Number($.m); }, read: (c) => ({ To: c.To }) },
    cases: [kase('4 g/s', { m: '4' }, { To: 73.12 })],
  }),

  problem({
    id: 'u3.6.half',
    title: 'Half the tube',
    exam: 'u3',
    ch: '6',
    kind: 'conceptual',
    lab: 'tube',
    src: 'Flux, written for the Tube lab',
    topics: ['tubes'],
    principles: ['tubes'],
    vars: { m: choice(['2', 'a trickle of 2 g/s'], ['6', '6 g/s']) },
    text: (T) => `Water at ${T.m} runs laminar through a 5 m tube with its wall at 80 °C. How much of its temperature rise happens in the first half of the tube?`,
    parts: [
      pick('a', 'the first half’s share', [
        ['more', 'more than half', 'The difference to the wall drives the heat, and it is largest at the inlet.'],
        ['half', 'half', 'That would need the same heat in every metre, but the driving difference shrinks along the tube.'],
        ['less', 'less than half', 'The water is coldest, and gains fastest, near the inlet.'],
      ], () => 'more'),
    ],
    level: 1,
    hints: ['The heat into a slice is hP(T_s − T_m)dx.', 'T_s − T_m falls along the tube.'],
    steps: () => ['The difference to the wall decays exponentially, so each metre adds less than the one before: the first half does more than half.'],
    sim: { scenario: 'slow', setup(s, $) { s.mdot = Number($.m); }, read: (c) => ({ a: c.Tm(TUBE.L / 2) - TUBE.Ti > 0.52 * (c.To - TUBE.Ti) ? 'more' : c.Tm(TUBE.L / 2) - TUBE.Ti < 0.48 * (c.To - TUBE.Ti) ? 'less' : 'half' }) },
    cases: [kase('2 g/s', { m: '2' }, { a: 'more' })],
  }),
  problem({
    id: 'u3.7.plume',
    title: 'A warm plate in still air',
    exam: 'u3',
    ch: '6',
    lab: 'plume',
    src: 'Flux, written for the Plume lab',
    topics: ['buoyancy'],
    principles: ['buoyancy'],
    vars: { Ts: choice(['40', '40 °C'], ['60', '60 °C'], ['100', '100 °C'], ['140', '140 °C']) },
    text: (T) => `A vertical plate 0.3 m tall at ${T.Ts} stands in still air at 20 °C. Take ν = 1.6 × 10⁻⁵ m²/s, k = 0.026 W/(m·K), Pr = 0.71, β = 1/T_film in kelvin, and Nu_L = (4/3)(Gr_L/4)^{1/4} g with g = 0.502. What is the average h, in W/(m²·K)?`,
    parts: [num('h', ($) => plumeH($), 'W/(m²·K)', { label: 'h' })],
    level: 2,
    hints: ['The film temperature is the average of plate and air, in kelvin.', 'Gr_L = gβΔT L³/ν², then h = Nu k/L.'],
    steps: ($) => [String.raw`$\beta = 1/${((Number($.Ts) + 20) / 2 + 273.15).toFixed(1)}$ K⁻¹`, String.raw`$h = \tfrac{4}{3}(\text{Gr}_L/4)^{1/4}(0.502)(0.026/0.3) = ${Number(plumeH($).toPrecision(3))}$`],
    sim: { scenario: 'hot', setup(s, $) { s.Ts = Number($.Ts); }, read: (c) => ({ h: c.h }) },
    cases: [kase('60 °C', { Ts: '60' }, { h: 4.396 })],
  }),

  problem({
    id: 'u3.8.still',
    title: 'Is still air one h?',
    exam: 'u3',
    ch: '6',
    kind: 'conceptual',
    lab: 'plume',
    src: 'Flux, written for the Plume lab',
    topics: ['buoyancy'],
    principles: ['buoyancy'],
    vars: { Ts: choice(['60', 'from 30 °C to 60 °C'], ['180', 'from 30 °C to 180 °C']) },
    text: (T) => `A vertical plate in still air at 20 °C is heated ${T.Ts}. What happens to its h?`,
    parts: [
      pick('a', 'h', [
        ['grows', 'it grows', 'A hotter plate makes lighter air, which rises faster and thins the layer: h ∝ ΔT^{1/4}.'],
        ['same', 'it stays the same', 'In forced flow the fan sets h; here the plate’s own buoyancy does, so h follows ΔT.'],
        ['falls', 'it falls', 'A larger ΔT drives a faster flow, not a slower one.'],
      ], () => 'grows'),
    ],
    level: 1,
    hints: ['What drives the flow here?', 'Gr grows with ΔT.'],
    steps: () => ['Gr ∝ ΔT and Nu ∝ Gr^{1/4}, so h grows as ΔT^{1/4}.'],
    sim: { scenario: 'warm', setup(s, $) { s.Ts = Number($.Ts); }, read: (c) => ({ a: c.h > plateClosed({ Ts: 30 }).h * 1.01 ? 'grows' : c.h < plateClosed({ Ts: 30 }).h * 0.99 ? 'falls' : 'same' }) },
    cases: [kase('to 180 °C', { Ts: '180' }, { a: 'grows' })],
  }),
  problem({
    id: 'u3.9.condense',
    title: 'Steam on a cold wall',
    exam: 'u3',
    ch: '6',
    lab: 'boil',
    src: 'Flux, written for the Boil lab',
    topics: ['phase-change'],
    principles: ['phase-change'],
    vars: { Ts: choice(['90', '90 °C'], ['80', '80 °C'], ['70', '70 °C'], ['60', '60 °C']) },
    text: (T) => `Saturated steam at 100 °C condenses on a vertical wall 0.1 m tall held at ${T.Ts}. Take ρ_l = 957.9 kg/m³, ρ_v = 0.596 kg/m³, h_fg = 2257 kJ/kg, c_p,l = 4217 J/(kg·K), k_l = 0.68 W/(m·K) and μ_l = 2.79 × 10⁻⁴ Pa·s, with h′_fg = h_fg + 0.68c_p,lΔT. What is the average h, in W/(m²·K)?`,
    parts: [num('h', ($) => condenseH($), 'W/(m²·K)', { label: 'h̄' })],
    level: 3,
    hints: ['ΔT = T_sat − T_s.', 'h̄ = 0.943[gρ_l(ρ_l − ρ_v)h′_fg k_l³/(μ_l ΔT L)]^{1/4}.'],
    steps: ($) => [String.raw`$h'_{fg} = ${((SAT.hfg + 0.68 * LIQ.cp * (100 - Number($.Ts))) / 1e6).toFixed(3)}$ MJ/kg`, String.raw`$\overline{h} = ${Number(condenseH($).toPrecision(3))}$ W/(m²·K)`],
    sim: { scenario: 'condense', setup(s, $) { s.side = 'condense'; s.le = Math.log10(100 - Number($.Ts)); }, read: (c) => ({ h: c.h }) },
    cases: [kase('wall at 90 °C', { Ts: '90' }, { h: 11635 })],
  }),

  problem({
    id: 'u3.10.burnout',
    title: 'Hotter and slower',
    exam: 'u3',
    ch: '6',
    kind: 'conceptual',
    lab: 'boil',
    src: 'Flux, written for the Boil lab',
    topics: ['phase-change'],
    principles: ['phase-change'],
    vars: { dT: choice(['30', '30 K'], ['50', '50 K']) },
    text: (T) => `A wall boiling water at 1 atm runs 20 K above saturation, just below the critical flux. It is pushed to ${T.dT} above. What happens to the heat flux?`,
    parts: [
      pick('a', 'the flux', [
        ['falls', 'it falls', 'Past the critical flux, vapour patches cover the wall and insulate it.'],
        ['rises', 'it rises, as ΔT³', 'That holds only in nucleate boiling, up to the critical flux.'],
        ['same', 'it stays at the critical flux', 'The critical flux is a peak, not a plateau.'],
      ], () => 'falls'),
    ],
    level: 1,
    hints: ['Where is the critical flux on the boiling curve?', 'What covers the wall past it?'],
    steps: () => ['Past ΔT_e ≈ 21 K the boiling curve falls, through transition boiling, to the Leidenfrost point.'],
    sim: { scenario: 'peak', setup(s, $) { s.le = Math.log10(Number($.dT)); }, read: (c) => ({ a: c.q < 0.99 * c.qc ? 'falls' : 'rises' }) },
    cases: [kase('30 K', { dT: '30' }, { a: 'falls' })],
  }),
];
