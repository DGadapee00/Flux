/**
 * Unit 14 bank: in-space propulsion. Original problems, with staged hints and named traps
 * (../coaching/u14.js). Numeric templates are checked by a second route (`second`) or by flying the
 * Electric spiral lab (`sim`).
 */
import { choice, kase, num, problem } from '../kit.js';
import { G0, spiralClosed } from '@flux/subjects/mechanics/propulsion.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const fmt = (x, n = 3) => Number(x.toPrecision(n));

/** Propellant (kg) for a Δv from a final mass; `how` names the traps. */
export function propellant($, how = 'right') {
  const mf = Number($.m);
  const dv = Number($.dv);
  const ue = Number($.isp) * G0;
  if (how === 'linear') return (mf * dv) / ue;
  if (how === 'noG0') return mf * (Math.exp(dv / Number($.isp)) - 1);
  return mf * (Math.exp(dv / ue) - 1);
}

/** The most Δv a tankage k allows (m/s); `how` names the traps. */
export function ceiling($, how = 'right') {
  const k = Number($.k);
  const ue = Number($.isp) * G0;
  if (how === 'noK') return ue * Math.log(1 + k);
  if (how === 'noG0') return Number($.isp) * Math.log((1 + k) / k);
  return ue * Math.log((1 + k) / k);
}

/** Thrust (mN) from power; `how` names the traps. */
export function thrust($, how = 'right') {
  const P = Number($.P);
  const eta = Number($.eta);
  const isp = Number($.isp);
  if (how === 'noTwo') return ((eta * P) / (isp * G0)) * 1000;
  if (how === 'noG0') return ((2 * eta * P) / isp) * 1000;
  return ((2 * eta * P) / (isp * G0)) * 1000;
}

/** Spiral time (days) from 400 km; `how` names the traps. */
export function spiralDays($, how = 'right') {
  const p = { h1: 400, h2: Number($.h2), mass: 12, power: Number($.P), isp: Number($.isp), eta: 0.5 };
  const c = spiralClosed(p);
  if (how === 'noTwo') return c.days * 2;
  if (how === 'noG0') return c.days / G0;
  return c.days;
}

const CHOOSE = {
  agile: { text: 'A craft must make several quick collision-avoidance burns of a few metres per second, each within an hour of a warning.', answer: 'mono' },
  keep: { text: 'A craft at 380 km must hold its orbit against drag for five years, with 60 W to spare most of the time.', answer: 'electric' },
  tiny: { text: 'A 3U craft needs about 5 m/s in all, for small corrections, and its team wants the simplest, safest system.', answer: 'cold' },
};

const BUDGET = {
  lower: { text: 'A craft moves from 500 km to 400 km. Which part of its Δv budget grows the most?', answer: 'drag' },
  dispose: { text: 'What sets how far a craft must lower its perigee at the end of its mission?', answer: 'rule' },
  sun: { text: 'Why size a low craft’s drag makeup at an active Sun?', answer: 'sun' },
};

const TANK = {
  pressure: { text: 'A cold-gas system cannot reach a mission’s Δv. The team proposes doubling the tank pressure to carry twice the gas. Does it help?', answer: 'no' },
  stronger: { text: 'What would raise a cold-gas system’s Δv limit?', answer: 'strong' },
  why: { text: 'Why does a cold-gas system have a Δv it can never exceed, however much gas it carries?', answer: 'grows' },
};

export default [
  problem({
    id: 'u14.1.prop',
    title: 'Propellant for a Δv',
    exam: 'u14',
    ch: '14',
    lab: 'propellant',
    src: 'Flux, written for the Propellant budget lab',
    topics: ['rocket'],
    principles: ['rocket'],
    vars: {
      m: choice(['8', '8 kg'], ['12', '12 kg'], ['20', '20 kg']),
      dv: choice(['200', '200 m/s'], ['500', '500 m/s'], ['1000', '1000 m/s']),
      isp: choice(['70', '70 s'], ['220', '220 s'], ['300', '300 s']),
    },
    variety: ['mass', 'Δv', 'thruster'],
    text: (T) => `A craft weighs ${T.m} after its burn. Its thruster has a specific impulse of ${T.isp}. How much propellant does it need for ${T.dv}, in kg? Ignore the tank.`,
    parts: [num('p', ($) => propellant($), 'kg', { label: 'm_p' })],
    level: 1,
    hints: ['Exhaust speed u_e = I_sp g₀, with g₀ = 9.81 m/s².', 'Δv = u_e ln(m₀/m_f), so m₀ = m_f e^{Δv/u_e}.', 'The propellant is m₀ − m_f.'],
    steps: ($) => [String.raw`$u_e = ${$.isp}\times 9.81 = ${fmt(Number($.isp) * G0)}\ \text{m/s}$`, String.raw`$m_p = ${$.m}\,(e^{${$.dv}/${fmt(Number($.isp) * G0)}} - 1) = ${fmt(propellant($))}\ \text{kg}$`],
    second: ($) => {
      // Bisection on the propellant, summing the rocket equation's increments dv = u_e dm/m.
      const ue = Number($.isp) * G0;
      const mf = Number($.m);
      const dvOf = (mp) => {
        const n = 4000;
        let v = 0;
        for (let i = 0; i < n; i++) {
          const m = mf + mp * (1 - (i + 0.5) / n);
          v += (ue * (mp / n)) / m;
        }
        return v;
      };
      let lo = 0;
      let hi = 1e4;
      for (let i = 0; i < 80; i++) {
        const mid = (lo + hi) / 2;
        if (dvOf(mid) < Number($.dv)) lo = mid;
        else hi = mid;
      }
      return { p: (lo + hi) / 2 };
    },
    cases: [kase('12 kg, 500 m/s at 220 s', { m: '12', dv: '500', isp: '220' }, { p: 3.104 })],
  }),

  problem({
    id: 'u14.2.ceiling',
    title: 'The most a tank can give',
    exam: 'u14',
    ch: '14',
    lab: 'propellant',
    src: 'Flux, written for the Propellant budget lab',
    topics: ['tankage'],
    principles: ['tankage'],
    vars: { k: choice(['1', '1.0'], ['1.6', '1.6'], ['2.5', '2.5']), isp: choice(['60', '60 s'], ['70', '70 s'], ['80', '80 s']) },
    variety: ['tankage', 'gas'],
    text: (T) => `A cold-gas system's tanks weigh ${T.k} times the gas they hold, at any pressure. The gas leaves at a specific impulse of ${T.isp}. However much gas it carries, what is the most Δv it can give, in m/s?`,
    parts: [num('v', ($) => ceiling($), 'm/s', { label: 'Δv_max' })],
    level: 2,
    hints: ['Let the craft’s own dry mass go to zero and the gas grow without limit.', 'Then m₀/m_f = (m_p + k m_p)/(k m_p) = (1 + k)/k.'],
    steps: ($) => [String.raw`$\Delta v_\text{max} = ${fmt(Number($.isp) * G0)} \ln\frac{1 + ${$.k}}{${$.k}} = ${fmt(ceiling($))}\ \text{m/s}$`],
    second: ($) => {
      // A huge load of gas on a 1 kg craft, by the rocket equation with the tank carried.
      const ue = Number($.isp) * G0;
      const k = Number($.k);
      const mp = 1e9;
      return { v: ue * Math.log((1 + mp * (1 + k)) / (1 + k * mp)) };
    },
    cases: [kase('k = 1.6 at 80 s', { k: '1.6', isp: '80' }, { v: 381.6 })],
  }),

  problem({
    id: 'u14.3.thrust',
    title: 'Thrust from power',
    exam: 'u14',
    ch: '14',
    lab: 'spiral',
    src: 'Flux, written for the Electric spiral lab',
    topics: ['electric'],
    principles: ['electric'],
    vars: {
      P: choice(['20', '20 W'], ['40', '40 W'], ['100', '100 W']),
      isp: choice(['1000', '1000 s'], ['1500', '1500 s'], ['3000', '3000 s']),
      eta: choice(['0.4', '40%'], ['0.5', '50%'], ['0.6', '60%']),
    },
    variety: ['power', 'specific impulse', 'efficiency'],
    text: (T) => `An electric thruster turns ${T.eta} of the ${T.P} it is fed into jet power, at a specific impulse of ${T.isp}. What thrust does it give, in mN?`,
    parts: [num('F', ($) => thrust($), 'mN', { label: 'F' })],
    level: 2,
    hints: ['The jet carries ½ ṁ u_e² = ½ F u_e of power.', 'Set ½ F u_e = ηP and solve for F, with u_e = I_sp g₀.'],
    steps: ($) => [String.raw`$F = \frac{2 \times ${$.eta} \times ${$.P}}{${$.isp}\times 9.81} = ${fmt(thrust($))}\ \text{mN}$`],
    second: ($) => {
      // Bisection on F until the jet power ½ F u_e equals ηP.
      const ue = Number($.isp) * G0;
      const want = Number($.eta) * Number($.P);
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 80; i++) {
        const mid = (lo + hi) / 2;
        if (0.5 * mid * ue < want) lo = mid;
        else hi = mid;
      }
      return { F: ((lo + hi) / 2) * 1000 };
    },
    cases: [kase('40 W, 1500 s, 50%', { P: '40', isp: '1500', eta: '0.5' }, { F: 2.719 })],
  }),

  problem({
    id: 'u14.4.spiral',
    title: 'How long the climb takes',
    exam: 'u14',
    ch: '14',
    lab: 'spiral',
    src: 'Flux, written for the Electric spiral lab',
    topics: ['electric'],
    principles: ['electric'],
    vars: {
      h2: choice(['550', '550 km'], ['700', '700 km'], ['1000', '1000 km']),
      P: choice(['40', '40 W'], ['100', '100 W']),
      isp: choice(['1500', '1500 s'], ['3000', '3000 s']),
    },
    variety: ['target', 'power', 'specific impulse'],
    text: (T) => `A 12 kg craft spirals from a circular 400 km orbit to ${T.h2}, thrusting along its velocity. Its thruster gets ${T.P} at 50% efficiency and ${T.isp}. How many days does the climb take? μ = 398,600 km³/s², Earth's radius 6378 km.`,
    parts: [num('d', ($) => spiralDays($), 'days', { label: 't' })],
    level: 3,
    hints: ['The spiral needs the difference of the two circular speeds, √(μ/r).', 'Thrust F = 2ηP/u_e.', 't = (m₀ u_e/F)(1 − e^{−Δv/u_e}).'],
    steps: ($) => {
      const c = spiralClosed({ h1: 400, h2: Number($.h2), mass: 12, power: Number($.P), isp: Number($.isp), eta: 0.5 });
      return [String.raw`$\Delta v = ${fmt(c.dv)}\ \text{m/s}, \quad F = ${fmt(c.F * 1000)}\ \text{mN}$`, String.raw`$t = ${fmt(c.days)}\ \text{days}$`];
    },
    sim: { scenario: 'raise', setup(s, $) { Object.assign(s, { h1: 400, h2: Number($.h2), power: Number($.P), isp: Number($.isp), mass: 12 }); }, read: (c) => ({ d: c.flownDays }) },
    cases: [kase('550 km on 40 W at 1500 s', { h2: '550', P: '40', isp: '1500' }, { d: 4.251 })],
  }),

  problem({
    id: 'u14.5.choose',
    title: 'Which thruster?',
    exam: 'u14',
    ch: '14',
    kind: 'conceptual',
    src: 'Flux, after NASA’s small spacecraft report, 4.5 and 4.6',
    topics: ['thrusters'],
    principles: ['thrusters'],
    vars: { q: choice(['agile', 'agile'], ['keep', 'keep'], ['tiny', 'tiny']) },
    variety: ['which mission'],
    text: (T, $) => `${CHOOSE[$.q].text} Which kind of thruster fits best?`,
    parts: [
      pick('a', 'thruster', [
        ['mono', 'A monopropellant thruster', 'Newtons of thrust: a few metres per second in seconds, whenever needed.'],
        ['electric', 'An electric thruster', 'A large total impulse on little propellant, where time is cheap and power is available.'],
        ['cold', 'Cold gas', 'Simple, safe and precise for a small Δv.'],
        ['solid', 'A solid motor', 'One large impulse, fired once: no good for repeated burns.'],
      ], ($) => CHOOSE[$.q].answer),
    ],
    level: 1,
    hints: ['How much Δv in total, and how quickly must it come?', 'Is there power to spare, or is thrust what matters?'],
    steps: ($) => [{ mono: 'Monopropellant.', electric: 'Electric.', cold: 'Cold gas.' }[CHOOSE[$.q].answer]],
    second: ($) => ({ a: { agile: 'mono', keep: 'electric', tiny: 'cold' }[$.q] }),
    cases: [kase('station keeping', { q: 'keep' }, { a: 'electric' })],
  }),

  problem({
    id: 'u14.6.budget',
    title: 'The Δv budget',
    exam: 'u14',
    ch: '14',
    kind: 'conceptual',
    lab: 'propellant',
    src: 'Flux, written for the Propellant budget lab',
    topics: ['dvbudget'],
    principles: ['dvbudget'],
    vars: { q: choice(['lower', 'lower'], ['dispose', 'dispose'], ['sun', 'sun']) },
    variety: ['which question'],
    text: (T, $) => BUDGET[$.q].text,
    parts: [
      pick('a', 'answer', [
        ['drag', 'Drag makeup, which grows several times over as the air thickens', 'The air at 400 km is several times denser than at 500 km: 42 m/s a year against 7.4.'],
        ['rule', 'The disposal rule: the craft must come down within five years', 'The perigee is lowered until drag ends the mission in time.'],
        ['sun', 'An active Sun heats and swells the thermosphere, and can triple the drag', 'A budget sized at a quiet Sun runs out early.'],
        ['disposal', 'The disposal burn, which grows as the orbit drops', 'Lowering from a lower orbit takes less Δv, not more.'],
      ], ($) => BUDGET[$.q].answer),
    ],
    level: 1,
    hints: ['Which manoeuvres does the budget hold?', 'Unit 9 says how the air changes with height and with the Sun.'],
    steps: ($) => [{ drag: 'Drag makeup.', rule: 'The disposal rule.', sun: 'The active Sun.' }[BUDGET[$.q].answer]],
    second: ($) => ({ a: { lower: 'drag', dispose: 'rule', sun: 'sun' }[$.q] }),
    cases: [kase('lower orbit', { q: 'lower' }, { a: 'drag' })],
  }),

  problem({
    id: 'u14.7.tank',
    title: 'Cold-gas tanks',
    exam: 'u14',
    ch: '14',
    kind: 'conceptual',
    lab: 'propellant',
    src: 'Flux, after MIT 16.851 Lecture 4',
    topics: ['tankage'],
    principles: ['tankage'],
    vars: { q: choice(['pressure', 'pressure'], ['stronger', 'stronger'], ['why', 'why']) },
    variety: ['which question'],
    text: (T, $) => TANK[$.q].text,
    parts: [
      pick('a', 'answer', [
        ['no', 'No: the tank’s wall, and its mass, double with the gas', 'Tank mass over gas mass is (3/2)ρ_t R_u T/(σM), with no pressure in it.'],
        ['strong', 'A tank material with more strength for its density, or a faster exhaust', 'k falls as σ/ρ_t rises; the limit u_e ln((1 + k)/k) grows with u_e.'],
        ['grows', 'The tank grows with the gas it holds, so each extra kilogram of gas brings its own tank', 'With tankage k the mass ratio can never pass (1 + k)/k.'],
        ['yes', 'Yes: twice the gas gives twice the Δv', 'The rocket equation is logarithmic, and the tank grows too.'],
      ], ($) => TANK[$.q].answer),
    ],
    level: 2,
    hints: ['How does a tank’s wall thickness depend on its pressure?', 'What is the mass ratio when the gas is far heavier than the craft?'],
    steps: ($) => [{ no: 'No.', strong: 'Stronger, lighter tank or faster exhaust.', grows: 'The tank grows with the gas.' }[TANK[$.q].answer]],
    second: ($) => ({ a: { pressure: 'no', stronger: 'strong', why: 'grows' }[$.q] }),
    cases: [kase('double the pressure', { q: 'pressure' }, { a: 'no' })],
  }),
];
