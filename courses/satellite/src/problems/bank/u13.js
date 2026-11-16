/**
 * Unit 13 bank: environmental test and verification. Original problems, with staged hints and named
 * traps (../coaching/u13.js). Numeric templates are checked by a second route: Simpson's rule on the
 * spectrum, Unit 4's fatigue model, and the thermal vacuum model's transition times.
 */
import { choice, kase, num, problem } from '../kit.js';
import { grmsNumeric } from '@flux/subjects/mechanics/testlevels.js';
import { vibClosed } from '@flux/subjects/mechanics/randomvib.js';
import { transitionClosed } from '@flux/subjects/heat/tvac.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const fmt = (x, n = 3) => Number(x.toPrecision(n));

/** The spectrum's breakpoints: +6 dB/oct from 20 Hz, flat W from fa to fb, −6 dB/oct to 2000 Hz. */
export function points($) {
  const W = Number($.W);
  const fa = Number($.fa);
  const fb = Number($.fb);
  return [[20, W * (20 / fa) ** 2], [fa, W], [fb, W], [2000, W * (fb / 2000) ** 2]];
}

/** The overall level, g rms; `how` names the traps. */
export function grms($, how = 'right') {
  const W = Number($.W);
  const fa = Number($.fa);
  const fb = Number($.fb);
  // Rising slope: ∫ W (f/fa)² df from 20 to fa = W (fa³ − 20³)/(3 fa²); falling: W fb² (1/fb − 1/2000).
  const rise = (W * (fa ** 3 - 20 ** 3)) / (3 * fa * fa);
  const flat = W * (fb - fa);
  const fall = W * fb * fb * (1 / fb - 1 / 2000);
  if (how === 'flatOnly') return Math.sqrt(flat);
  if (how === 'noSqrt') return rise + flat + fall;
  return Math.sqrt(rise + flat + fall);
}

/** Damage a minute at +dB over the limit, as a multiple; `how` names the traps. */
export function damageFactor($, how = 'right') {
  const r = 10 ** (Number($.dB) / 10);
  const b = Number($.b);
  if (how === 'wRatio') return r;
  if (how === 'noHalf') return r ** b;
  return r ** (b / 2);
}

/** The new transition time, hours; `how` names the traps. */
export function transitionTime($, how = 'right') {
  const t = Number($.t);
  const k = Number($.k);
  const e = Number($.e);
  if (how === 'massOnly') return t * k;
  if (how === 'epsOnly') return (t * 0.9) / e;
  return (t * k * 0.9) / e;
}

const PROGRAM = {
  one: { text: 'A team has money for one flight unit of a new design and no spare. How should it be tested for launch?', answer: 'protoflight' },
  follow: { text: 'A second craft is built to a design already qualified on a prototype. How is it tested?', answer: 'acceptance' },
  fresh: { text: 'A new mechanism has little fatigue margin, and the flight unit must keep as much life as it can. How should the design be qualified?', answer: 'prototype' },
};

const TVAC = {
  where: { text: 'Where do a unit’s thermal vacuum test temperatures come from?', answer: 'aft' },
  cycles: { text: 'How many thermal vacuum cycles should flight hardware see before flight, at all levels of assembly together?', answer: 'twelve' },
  rate: { text: 'How fast may the hardware’s temperature change between plateaus?', answer: 'rate' },
};

const CAMPAIGN = {
  magnetics: { text: 'A craft carries a magnetometer and needs both a vibration test and a dc magnetics test. In which order?', answer: 'magafter' },
  between: { text: 'Why run a functional test between each environmental test?', answer: 'trace' },
  small: { text: 'A small craft skips its subsystem-level tests and goes from unit tests straight to system tests. What does it risk?', answer: 'late' },
};

export default [
  problem({
    id: 'u13.1.grms',
    title: 'The overall level of a test spectrum',
    exam: 'u13',
    ch: '13',
    lab: 'levels',
    src: 'Flux, written for the Test levels lab',
    topics: ['levels'],
    principles: ['levels'],
    vars: {
      W: choice(['0.04', '0.04 g²/Hz'], ['0.08', '0.08 g²/Hz'], ['0.16', '0.16 g²/Hz']),
      fa: choice(['50', '50 Hz'], ['80', '80 Hz']),
      fb: choice(['500', '500 Hz'], ['800', '800 Hz']),
    },
    variety: ['plateau level', 'breakpoints'],
    text: (T) => `A random vibration test spectrum rises at +6 dB an octave from 20 Hz to ${T.fa}, stays flat at ${T.W} to ${T.fb}, and falls at −6 dB an octave to 2000 Hz. What is its overall level, in g rms?`,
    parts: [num('g', ($) => grms($), 'g rms', { label: 'g_rms' })],
    level: 2,
    hints: ['+6 dB an octave means W grows as f²; −6 dB as 1/f².', 'Integrate W over each segment and add.', 'g_rms is the square root of the sum.'],
    steps: ($) => [String.raw`$g_\text{rms}^2 = ${fmt(grms($, 'noSqrt'))}\ \text{g}^2$`, String.raw`$g_\text{rms} = ${fmt(grms($))}\ \text{g}$`],
    second: ($) => ({ g: grmsNumeric(points($)) }),
    cases: [kase('GEVS’s acceptance shape', { W: '0.08', fa: '50', fb: '800' }, { g: 9.995 })],
  }),

  problem({
    id: 'u13.2.db',
    title: 'What a few decibels cost',
    exam: 'u13',
    ch: '13',
    lab: 'levels',
    src: 'Flux, written for the Test levels lab',
    topics: ['levels'],
    principles: ['levels'],
    vars: { dB: choice(['3', '3 dB'], ['6', '6 dB']), b: choice(['4', '4'], ['6.4', '6.4'], ['8', '8']) },
    variety: ['margin', 'fatigue exponent'],
    text: (T) => `A bracket's fatigue curve has exponent b = ${T.b}. A random test runs ${T.dB} above the flight limit spectrum. By what factor is each minute's fatigue damage larger than a minute at the limit?`,
    parts: [num('k', ($) => damageFactor($), '', { label: 'factor' })],
    level: 2,
    hints: ['Decibels on a spectrum are 10 log of the ratio of W.', 'The response g_rms goes as √W; damage a minute goes as g_rms to the power b.'],
    steps: ($) => [String.raw`$W \times 10^{${$.dB}/10} = ${fmt(10 ** (Number($.dB) / 10))}$`, String.raw`$\left(${fmt(10 ** (Number($.dB) / 10))}\right)^{${$.b}/2} = ${fmt(damageFactor($))}$`],
    second: ($) => {
      // Unit 4's bracket model, with its own exponent replaced, at the two levels.
      const r = 10 ** (Number($.dB) / 10);
      const a = vibClosed({ fn: 200, Q: 10, W: 0.04 });
      const c = vibClosed({ fn: 200, Q: 10, W: 0.04 * r });
      return { k: (c.srms / a.srms) ** Number($.b) };
    },
    cases: [kase('3 dB, b = 6.4', { dB: '3', b: '6.4' }, { k: 9.12 })],
  }),

  problem({
    id: 'u13.3.trans',
    title: 'A slower transition',
    exam: 'u13',
    ch: '13',
    lab: 'tvac',
    src: 'Flux, written for the Thermal vacuum lab',
    topics: ['tvac'],
    principles: ['tvac'],
    vars: {
      t: choice(['2', '2 hours'], ['3', '3 hours'], ['4', '4 hours']),
      k: choice(['1.5', '1.5 times'], ['2', '2 times'], ['3', '3 times']),
      e: choice(['0.45', '0.45'], ['0.3', '0.3'], ['0.09', '0.09']),
    },
    variety: ['mass', 'finish'],
    text: (T) => `An unpowered craft painted black, ε = 0.9, heats between its thermal vacuum plateaus in ${T.t}, with the shroud set the same way each time. A second craft has the same surface area, ${T.k} the thermal mass, and a finish with ε = ${T.e}. How long does it take, in hours?`,
    parts: [num('h', ($) => transitionTime($), 'h', { label: 'time' })],
    level: 2,
    hints: ['In vacuum only radiation moves heat: m c dT/dt = εσA(a⁴ − T⁴).', 'With no power inside, the time goes as m c/(εA).'],
    steps: ($) => [String.raw`$t = ${$.t} \times ${$.k} \times \tfrac{0.9}{${$.e}} = ${fmt(transitionTime($))}\ \text{h}$`],
    second: ($) => {
      // The thermal vacuum model's own transition, scaled from a black 12 kg craft.
      const base = transitionClosed({ m: 12, A: 0.27, eps: 0.9, Q: 0 }, 263.15, 333.15, 20);
      const next = transitionClosed({ m: 12 * Number($.k), A: 0.27, eps: Number($.e), Q: 0 }, 263.15, 333.15, 20);
      return { h: (Number($.t) * next.hours) / base.hours };
    },
    cases: [kase('twice the mass, ε = 0.3', { t: '2', k: '2', e: '0.3' }, { h: 12 })],
  }),

  problem({
    id: 'u13.4.program',
    title: 'Which test program?',
    exam: 'u13',
    ch: '13',
    kind: 'conceptual',
    src: 'Flux, after NASA GSFC-STD-7000B, 1.8 and Table 2.2-2',
    topics: ['testing'],
    principles: ['testing'],
    vars: { q: choice(['one', 'one'], ['follow', 'follow'], ['fresh', 'fresh']) },
    variety: ['which situation'],
    text: (T, $) => PROGRAM[$.q].text,
    parts: [
      pick('a', 'program', [
        ['protoflight', 'Protoflight: the flight unit at qualification levels for acceptance durations', 'One unit both qualifies the design and is screened for workmanship, at a cost in its life.'],
        ['acceptance', 'Acceptance: flight levels, to screen workmanship', 'The design is already qualified; this unit only has to be shown built right.'],
        ['prototype', 'Qualify a separate prototype, then acceptance-test the flight unit', 'The prototype spends its life on the qualification; the flight unit keeps most of its own.'],
        ['analysis', 'Analysis alone, with no test', 'Launch providers and GEVS expect tests; analysis alone needs much larger factors of safety.'],
      ], ($) => PROGRAM[$.q].answer),
    ],
    level: 1,
    hints: ['Is the design already qualified?', 'Who pays for the qualification’s damage: the flight unit, or a second unit?'],
    steps: ($) => [{ protoflight: 'Protoflight.', acceptance: 'Acceptance.', prototype: 'A prototype, then acceptance.' }[PROGRAM[$.q].answer]],
    second: ($) => ({ a: { one: 'protoflight', follow: 'acceptance', fresh: 'prototype' }[$.q] }),
    cases: [kase('one unit', { q: 'one' }, { a: 'protoflight' })],
  }),

  problem({
    id: 'u13.5.tvac',
    title: 'Thermal vacuum rules',
    exam: 'u13',
    ch: '13',
    kind: 'conceptual',
    lab: 'tvac',
    src: 'Flux, after NASA GSFC-STD-7000B, 2.6 and Table 2.6-1',
    topics: ['tvac'],
    principles: ['tvac'],
    vars: { q: choice(['where', 'where'], ['cycles', 'cycles'], ['rate', 'rate']) },
    variety: ['which rule'],
    text: (T, $) => TVAC[$.q].text,
    parts: [
      pick('a', 'answer', [
        ['aft', 'The unit’s allowable flight range, widened by 10 °C at each end', 'Test temperatures rest on what the hardware can stand, not on the orbit predictions.'],
        ['twelve', 'At least 12', 'The cycles screen workmanship; their number is set by the stress they apply, not by the mission.'],
        ['rate', 'No faster than 1 °C a minute', 'Faster changes stress joints and boards more than the flight will.'],
        ['predict', 'The predicted orbit temperatures, exactly', 'A test at the predictions shows no margin.'],
      ], ($) => TVAC[$.q].answer),
    ],
    level: 1,
    hints: ['GEVS sets margins, counts and rates for thermal vacuum.', 'Margins are on the hardware’s allowable range.'],
    steps: ($) => [{ aft: 'Allowable range ± 10 °C.', twelve: '12 cycles before flight.', rate: '1 °C a minute.' }[TVAC[$.q].answer]],
    second: ($) => ({ a: { where: 'aft', cycles: 'twelve', rate: 'rate' }[$.q] }),
    cases: [kase('the plateaus', { q: 'where' }, { a: 'aft' })],
  }),

  problem({
    id: 'u13.6.campaign',
    title: 'Ordering the campaign',
    exam: 'u13',
    ch: '13',
    kind: 'conceptual',
    src: 'Flux, after NASA GSFC-STD-7000B, 2.2.1 and 2.2.2',
    topics: ['campaign'],
    principles: ['campaign'],
    vars: { q: choice(['magnetics', 'magnetics'], ['between', 'between'], ['small', 'small']) },
    variety: ['which question'],
    text: (T, $) => CAMPAIGN[$.q].text,
    parts: [
      pick('a', 'answer', [
        ['magafter', 'Vibration first, then magnetics', 'The shaker’s fields can magnetise the hardware; measuring after lets that be found and corrected.'],
        ['trace', 'So a fault can be traced to the test that caused it', 'A fault found after several environments cannot be pinned on one.'],
        ['late', 'Finding problems late, at system level, when they cost most to fix', 'Lower-level tests catch faults while the hardware is still easy to reach.'],
        ['magfirst', 'Magnetics first, then vibration', 'Vibration can change the magnetic signature after it was measured.'],
      ], ($) => CAMPAIGN[$.q].answer),
    ],
    level: 1,
    hints: ['What can one test do to the result of another?', 'Where is a problem cheapest to find?'],
    steps: ($) => [{ magafter: 'Vibration, then magnetics.', trace: 'To trace faults.', late: 'Late discovery.' }[CAMPAIGN[$.q].answer]],
    second: ($) => ({ a: { magnetics: 'magafter', between: 'trace', small: 'late' }[$.q] }),
    cases: [kase('magnetics', { q: 'magnetics' }, { a: 'magafter' })],
  }),
];
