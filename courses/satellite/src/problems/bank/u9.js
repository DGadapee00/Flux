/**
 * Unit 9 bank: the space environment and radiation. Original problems, with staged hints and named
 * traps (../coaching/u9.js). Drag and upset problems are checked against the Orbital decay and
 * Memory upsets labs (`sim`); dose and the conceptual problems against a second rule (`second`).
 */
import { choice, kase, num, problem } from '../kit.js';
import { CD, K_B, M_O, decayRate, density, exoTemp, lifetimeClosed, scaleHeight } from '@flux/subjects/mechanics/orbitdecay.js';
import { upsetsClosed } from '@flux/subjects/em/upsets.js';
import { CASSINI } from '../../labs/upsets.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const fmt = (x, n = 3) => Number(x.toPrecision(n));
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
/** 6.14 × 10⁻¹³ for prose, and the same in TeX. */
const sci = (x, n = 3) => {
  const [m, e] = x.toExponential(n - 1).split('e');
  return `${m} × 10${String(Number(e)).split('').map((ch) => SUP[ch]).join('')}`;
};
const texSci = (x, n = 4) => {
  const [m, e] = x.toExponential(n - 1).split('e');
  return String.raw`${m}	imes10^{${Number(e)}}`;
};
const G300 = 8.94; // m/s², g at 300 km, as the problems state it
const U = 1.66053907e-27;

/** Scale height (km) for a solar flux; `how` names the traps. */
export function scaleFor($, how = 'right') {
  const T = exoTemp(Number($.f));
  if (how === 'seaLevelG') return (K_B * T) / (M_O * 9.81) / 1e3;
  if (how === 'nitrogen') return (K_B * T) / (28.013 * U * G300) / 1e3;
  return scaleHeight(T);
}

/** The 6U craft: 0.06 m² facing the flow. */
const AREA = 0.06;
/** Decay rate (km a year) at the start; `how` names the traps. */
export function rateFor($, how = 'right') {
  const B = (CD * AREA) / $.m;
  const z = Number($.z);
  if (how === 'noCd') return decayRate(z, AREA / $.m, 147);
  if (how === 'speed') {
    const a = (6378.137 + z) * 1e3;
    return decayRate(z, B, 147) / a;
  }
  return decayRate(z, B, 147);
}

/** Yearly dose (rad) behind each shield, from NASA's small spacecraft report (6.5, Table 6-15). */
export const SHIELD = { thin: { trapped: 1383, solar: 750 }, thick: { trapped: 73.6, solar: 183 } };
/** Years a part covers with a margin of 2; `how` names the traps. */
export function partYears($, how = 'right') {
  const s = SHIELD[$.shield];
  const rated = Number($.rated) * 1000;
  if (how === 'noMargin') return rated / (s.trapped + s.solar);
  if (how === 'trappedOnly') return rated / (2 * s.trapped);
  return rated / (2 * (s.trapped + s.solar));
}

/** Years between lost words for a 1 Gbit-class memory with a code on 72-bit words; `how` names the traps. */
export function yearsBetween($, how = 'right') {
  const bits = Number($.gbit) * 1e9;
  const scrub = Number($.hours) / 24;
  const c = upsetsClosed({ bits, word: 72, rate: CASSINI, scrub, ecc: true });
  if (how === 'noHalf') return c.years / 2;
  if (how === 'noCode') return 1 / (bits * CASSINI) / 365.25;
  return c.years;
}

const EFFECTS = {
  drift: { text: 'A voltage regulator’s output drifts a little further from its set point every month.', cause: 'cumulative' },
  flip: { text: 'A stored counter jumps by a large power of two once; rewriting it fixes it for good.', cause: 'one particle, no damage' },
  latch: { text: 'A processor’s supply current jumps and stays high until the power is cycled.', cause: 'one particle, a current path' },
};
/** Second rule: the effect named by what causes it (NASA small spacecraft report, 8.2.1). */
const EFFECT_FOR = { cumulative: 'tid', 'one particle, no damage': 'seu', 'one particle, a current path': 'sel' };

export default [
  problem({
    id: 'u9.1.scale',
    title: 'The thermosphere’s scale height',
    exam: 'u9',
    ch: '9',
    lab: 'decay',
    src: 'Flux, written for the Orbital decay lab',
    topics: ['decay'],
    principles: ['decay'],
    vars: { f: choice(['70', 'a quiet Sun, F10.7 = 70'], ['150', 'a middling Sun, F10.7 = 150'], ['250', 'an active Sun, F10.7 = 250']) },
    variety: ['solar activity'],
    text: (T) => `Under ${T.f}, the thermosphere's temperature is T∞ ≈ 500 + 3.4 F10.7 kelvin. Above 300 km the air is mostly atomic oxygen, 16.0 u. With g = ${G300} m/s² at 300 km, what is the scale height, in km? k = 1.381 × 10⁻²³ J/K, 1 u = 1.661 × 10⁻²⁷ kg.`,
    parts: [num('H', ($) => scaleFor($), 'km', { label: 'H' })],
    level: 2,
    hints: ['Find T∞ from the flux first.', 'H = kT/(mg), with m the mass of one oxygen atom.'],
    steps: ($) => [String.raw`$T_\infty = 500 + 3.4(${$.f}) = ${fmt(exoTemp(Number($.f)), 4)}$ K`, String.raw`$H = kT/(mg) = ${fmt(scaleFor($))}$ km`],
    sim: { scenario: 'moderate', setup(s, $) { s.f107 = Number($.f); }, read: (c) => ({ H: c.H }) },
    cases: [kase('a middling Sun', { f: '150' }, { H: 58.6 })],
  }),

  problem({
    id: 'u9.2.rate',
    title: 'How fast is it falling?',
    exam: 'u9',
    ch: '9',
    lab: 'decay',
    src: 'Flux, written for the Orbital decay lab',
    topics: ['decay'],
    principles: ['decay'],
    vars: { z: choice(['450', '450 km'], ['500', '500 km'], ['550', '550 km']), m: choice([6, '6 kg'], [12, '12 kg'], [24, '24 kg']) },
    variety: ['altitude and mass'],
    text: (T, $) => `A ${T.m} craft on a circular orbit at ${T.z} presents 0.06 m² to the flow, with C_D = 2.2. The air there has a density of ${sci(density(Number($.z), 147), 4)} kg/m³. How fast is its altitude falling, in km a year? μ = 3.986 × 10¹⁴ m³/s², Earth's radius 6378 km, a year 3.156 × 10⁷ s.`,
    parts: [num('r', ($) => rateFor($), 'km/yr', { label: 'falling' })],
    level: 2,
    hints: ['Find C_D A/m first, in m²/kg.', 'da/dt = (C_D A/m) ρ √(μa), with a measured from Earth’s centre in metres.'],
    steps: ($) => [String.raw`$C_DA/m = ${fmt((CD * AREA) / $.m)}$ m²/kg, $a = ${(6378.137 + Number($.z)).toFixed(0)}$ km`, String.raw`$da/dt = ${fmt(rateFor($))}$ km a year`],
    sim: { scenario: 'moderate', setup(s, $) { Object.assign(s, { z0: Number($.z), m: $.m, A: AREA, f107: 147 }); }, read: (c) => ({ r: c.rate0 }) },
    cases: [kase('12 kg at 500 km', { z: '500', m: 12 }, { r: 11.16 })],
  }),

  problem({
    id: 'u9.3.sun',
    title: 'Which way does the Sun push?',
    exam: 'u9',
    ch: '9',
    kind: 'conceptual',
    lab: 'decay',
    src: 'Flux, written for the Orbital decay lab',
    topics: ['decay'],
    principles: ['decay'],
    vars: { to: choice(['active', 'from a quiet Sun to an active one'], ['quiet', 'from an active Sun to a quiet one']) },
    text: (T) => `A small craft orbits at 500 km. Solar activity moves ${T.to}. Does the craft's orbital life get longer or shorter?`,
    parts: [
      pick('l', 'the life', [
        ['shorter', 'shorter', 'A hotter thermosphere is taller, so more air reaches the craft and drags it down faster.'],
        ['longer', 'longer', 'A cooler thermosphere shrinks below the craft, so it meets less air and falls more slowly.'],
        ['same', 'the same', 'The Sun sets the thermosphere’s temperature, and the temperature sets how much air reaches 500 km.'],
      ], ($) => ($.to === 'active' ? 'shorter' : 'longer')),
    ],
    level: 1,
    hints: ['What does the Sun’s ultraviolet do to the thermosphere’s temperature?', 'A hotter gas has a larger scale height, H = kT/(mg).'],
    steps: ($) => [$.to === 'active' ? 'Hotter, taller air: more drag, a shorter life.' : 'Cooler, shorter air: less drag, a longer life.'],
    second: ($) => {
      const quiet = lifetimeClosed({ z0: 500, B: 0.011, f107: 70 });
      const active = lifetimeClosed({ z0: 500, B: 0.011, f107: 250 });
      const [from, to] = $.to === 'active' ? [quiet, active] : [active, quiet];
      return { l: to < from ? 'shorter' : to > from ? 'longer' : 'same' };
    },
    cases: [kase('to active', { to: 'active' }, { l: 'shorter' })],
  }),

  problem({
    id: 'u9.4.dose',
    title: 'How long does the part last?',
    exam: 'u9',
    ch: '9',
    src: 'Flux, after NASA’s small spacecraft report, 6.5',
    topics: ['dose'],
    principles: ['dose'],
    vars: { rated: choice(['2', '2 krad'], ['5', '5 krad'], ['10', '10 krad']), shield: choice(['thin', '0.2 cm of aluminium'], ['thick', '1.11 cm of aluminium']) },
    variety: ['part rating and shield'],
    text: (T, $) => `A commercial part tolerates ${T.rated} of total dose. Behind ${T.shield}, a 500 km orbit at 85° gives ${SHIELD[$.shield].trapped} rad a year from the trapped belts and ${SHIELD[$.shield].solar} rad a year from solar particle events. With a radiation design margin of 2, how many years does the part cover?`,
    parts: [num('t', ($) => partYears($), 'yr', { label: 'years' })],
    level: 2,
    hints: ['Add the trapped and solar doses for the yearly total.', 'Divide the rating by twice the yearly dose.'],
    steps: ($) => {
      const s = SHIELD[$.shield];
      return [String.raw`Yearly dose $= ${s.trapped} + ${s.solar} = ${fmt(s.trapped + s.solar, 4)}$ rad`, String.raw`$t = ${Number($.rated) * 1000}/(2 \times ${fmt(s.trapped + s.solar, 4)}) = ${fmt(partYears($))}$ years`];
    },
    second: ($) => {
      // Step month by month until twice the dose reaches the rating, then interpolate within the month.
      const s = SHIELD[$.shield];
      const perMonth = (2 * (s.trapped + s.solar)) / 12;
      const rated = Number($.rated) * 1000;
      let months = 0;
      let dose = 0;
      while (dose + perMonth < rated) {
        dose += perMonth;
        months++;
      }
      return { t: (months + (rated - dose) / perMonth) / 12 };
    },
    cases: [kase('5 krad behind 0.2 cm', { rated: '5', shield: 'thin' }, { t: 1.172 })],
  }),

  problem({
    id: 'u9.5.lost',
    title: 'Years between lost words',
    exam: 'u9',
    ch: '9',
    lab: 'upsets',
    src: 'Flux, written for the Memory upsets lab',
    topics: ['upsets'],
    principles: ['upsets'],
    vars: { gbit: choice(['1', '1 Gbit'], ['2', '2 Gbit'], ['4', '4 Gbit']), hours: choice(['6', 'every 6 hours'], ['24', 'once a day']) },
    variety: ['memory size and scrub interval'],
    text: (T) => `A ${T.gbit} memory sees 1.12 × 10⁻⁷ upsets per bit per day. A code corrects one bit in each 72-bit word, and a scrubber clears every word ${T.hours}. On average, how many years pass between words the code cannot correct?`,
    parts: [num('y', ($) => yearsBetween($), 'yr', { label: 'years' })],
    level: 3,
    hints: ['A word is lost when two upsets land in it within one scrub interval: P₂ ≈ x²/2 with x = kλT.', 'Losses a day = (N/k) P₂/T; take the reciprocal and convert to years.'],
    steps: ($) => {
      const T = Number($.hours) / 24;
      const x = 72 * CASSINI * T;
      return [String.raw`$x = 72(1.12\times10^{-7})(${fmt(T)}) = ${texSci(x)}$`, String.raw`Losses a day $= (N/72)(x^2/2)/T$; one every $${fmt(yearsBetween($))}$ years`];
    },
    sim: { scenario: 'daily', setup(s, $) { Object.assign(s, { gbit: Number($.gbit), r7: 1.12, lgH: Math.log10(Number($.hours)), ecc: true }); }, read: (c) => ({ y: c.years }) },
    cases: [kase('1 Gbit, daily', { gbit: '1', hours: '24' }, { y: 6.06 })],
  }),

  problem({
    id: 'u9.6.scrub',
    title: 'Scrub more often',
    exam: 'u9',
    ch: '9',
    kind: 'conceptual',
    lab: 'upsets',
    src: 'Flux, written for the Memory upsets lab',
    topics: ['upsets'],
    principles: ['upsets'],
    vars: { change: choice(['twice', 'scrubs twice as often'], ['storm', 'meets a storm with twice the upset rate']) },
    variety: ['which change'],
    text: (T) => `A memory with a code that corrects one bit per word ${T.change}. By what factor do the words it cannot correct, per day, change?`,
    parts: [
      pick('f', 'factor', [
        ['half', 'halved', 'Half the interval gives each word a quarter of the chance of two upsets, over twice as many scrubs.'],
        ['quarter', 'a quarter', 'Only if the number of scrubs a day stayed the same.'],
        ['double', 'doubled', 'Only if one upset were enough to lose a word, as with no code.'],
        ['four', 'four times', 'A loss needs two upsets, so its chance goes as the square of the rate.'],
      ], ($) => ($.change === 'twice' ? 'half' : 'four')),
    ],
    level: 2,
    hints: ['Losses go as N k λ² T / 2.', 'Which of λ and T changes, and with what power does it enter?'],
    steps: ($) => [$.change === 'twice' ? 'T halves, and losses go as T: halved.' : 'λ doubles, and losses go as λ²: four times.'],
    second: ($) => {
      const base = { bits: 1e9, word: 72, rate: CASSINI, scrub: 1, ecc: true };
      const a = upsetsClosed(base).uncorrectable;
      const b = upsetsClosed($.change === 'twice' ? { ...base, scrub: 0.5 } : { ...base, rate: 2 * CASSINI }).uncorrectable;
      const r = b / a;
      return { f: r < 0.35 ? 'quarter' : r < 0.75 ? 'half' : r < 3 ? 'double' : 'four' };
    },
    cases: [kase('scrub twice as often', { change: 'twice' }, { f: 'half' })],
  }),

  problem({
    id: 'u9.7.effect',
    title: 'Name the effect',
    exam: 'u9',
    ch: '9',
    kind: 'conceptual',
    src: 'Flux, after NASA’s small spacecraft report, 8.2.1',
    topics: ['effects'],
    principles: ['effects'],
    vars: { what: choice(['drift', 'drift'], ['flip', 'flip'], ['latch', 'latch']) },
    variety: ['which symptom'],
    text: (T, $) => `${EFFECTS[$.what].text} Which radiation effect is this?`,
    parts: [
      pick('e', 'effect', [
        ['tid', 'total ionizing dose', 'Dose builds over the mission and degrades a part slowly.'],
        ['seu', 'a single-event upset', 'One particle flips a stored bit; the part is not harmed and a rewrite fixes it.'],
        ['sel', 'a single-event latch-up', 'One particle opens a path that draws a large current until the power is cycled.'],
      ], ($) => ({ drift: 'tid', flip: 'seu', latch: 'sel' })[$.what]),
    ],
    level: 1,
    hints: ['Is it slow and cumulative, or sudden?', 'If sudden: does a rewrite fix it, or does it need the power cycled?'],
    steps: ($) => [`It is ${EFFECTS[$.what].cause}.`],
    second: ($) => ({ e: EFFECT_FOR[EFFECTS[$.what].cause] }),
    cases: [kase('the latch', { what: 'latch' }, { e: 'sel' })],
  }),
];
