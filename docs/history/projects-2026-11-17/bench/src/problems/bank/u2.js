/**
 * Unit 2 · Light an LED. Templates vary by structure (a `choice` among configurations, givens or
 * unknowns), carry 2–3 staged hints, at least two named traps on every numeric part (in
 * ../coaching/u2.js), a worked case, and a second method: their lab (`sim`) or `second`.
 *
 * Where a problem gives the LED's voltage as a meter reading, the reading is the course LED model's
 * at that operating point, rounded to 0.01 V, so the lab and the problem agree. Design problems use
 * the typical forward voltage at 20 mA, as a builder would from a datasheet.
 */
import { E12, nextE12Up, seriesCurrent, seriesCurrentBisect, voltageAt } from '@flux/subjects/em/diode.js';
import { LEDS, ledModel } from '../../labs/leds.js';
import { choice, kase, num, problem } from '../kit.js';
import { bandsText } from './u1.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

const ohm = (r) => (r >= 1000 ? `${Number((r / 1000).toPrecision(3))} kΩ` : `${Number(r.toPrecision(3))} Ω`);
const COLOR = (...ks) => choice(...ks.map((k) => [k, `${LEDS[k].name} (V_f ≈ ${LEDS[k].vf.toFixed(1)} V at 20 mA)`]));
const SUPPLY = (...vs) => choice(...vs.map((v) => [v, `${v} V`]));

/** The largest E12 value strictly below `r`: the part one step down from the right one. */
export function prevE12Down(r) {
  const up = nextE12Up(r);
  const d = 10 ** Math.floor(Math.log10(up) + 1e-9);
  const m = Number((up / d).toPrecision(2));
  const i = E12.indexOf(m);
  const v = i > 0 ? E12[i - 1] * d : E12[E12.length - 1] * (d / 10);
  const down = Number(v.toPrecision(3));
  return down < r * (1 - 1e-9) ? down : prevE12Down(down);
}

/** The model's operating point for one LED and one resistor, the LED's voltage rounded as a meter shows it. */
function measured(color, vs, R) {
  const d = ledModel(color);
  const I = seriesCurrent(vs, R, [d]);
  return { Imodel: I, vm: Math.round(voltageAt(d, I) * 100) / 100 };
}

export default [
  problem({
    id: 'u2.pick-r',
    title: 'Pick the resistor',
    exam: 'u2',
    ch: '2',
    lab: 'led',
    src: 'Kuphaldt §III.3',
    topics: ['led', 'e12'],
    principles: ['vf', 'e12-up'],
    variety: ['configuration'],
    vars: {
      color: COLOR('red', 'yellow', 'green', 'blue', 'white'),
      vs: SUPPLY(3.3, 5, 9, 12),
      mA: choice([5, '5 mA'], [10, '10 mA'], [15, '15 mA'], [20, '20 mA']),
    },
    derive: ($) => {
      const vf = LEDS[$.color].vf;
      const R = ($.vs - vf) / ($.mA / 1000);
      return { vf, R, Rbuy: nextE12Up(R) };
    },
    valid: ($) => $.vs - LEDS[$.color].vf >= 1,
    text: (T, $) => `A ${LEDS[$.color].name} LED drops about ${$.vf.toFixed(1)} V when lit. You want ${T.mA} through it from a ${T.vs} supply. Find the series resistance that gives exactly that, and the E12 value you buy.`,
    parts: [
      num('R', ($) => $.R, 'Ω', { label: 'exact resistance', tol: 0.01 }),
      num('Rbuy', ($) => $.Rbuy, 'Ω', { label: 'E12 value to buy', tol: 0.002 }),
    ],
    level: 1,
    hints: [
      'Kirchhoff’s loop: the supply’s voltage divides between the LED and the resistor. The LED keeps about V_f.',
      'The resistor gets V_s − V_f and carries the LED’s current, so R = (V_s − V_f)/I.',
      'Buy the next standard value up, so the current lands at or under what you wanted.',
    ],
    steps: ($, sig) => [
      String.raw`$R = (${$.vs} - ${$.vf.toFixed(1)})/${$.mA / 1000} = ${sig($.R)}\ \Omega$`,
      String.raw`Next E12 value up: $${sig($.Rbuy)}\ \Omega$ (${bandsText($.Rbuy)})`,
    ],
    sim: {
      scenario: 'red5',
      setup(s, $) {
        s.color = $.color;
        s.vs = $.vs;
        s.R = $.Rbuy;
      },
    },
    second: ($) => {
      // Bisect the loop residual V_s − V_f − I R for R, and walk the E12 table for the part.
      let lo = 0;
      let hi = 1e5;
      for (let k = 0; k < 200; k += 1) {
        const mid = (lo + hi) / 2;
        if ($.vs - $.vf - ($.mA / 1000) * mid > 0) lo = mid;
        else hi = mid;
      }
      const R = (lo + hi) / 2;
      const all = [1, 10, 100, 1000, 10000, 100000].flatMap((d) => E12.map((m) => Number((m * d).toPrecision(3))));
      return { R, Rbuy: all.find((v) => v >= R * (1 - 1e-9)) };
    },
    cases: [
      kase('Kuphaldt §III.3, LEDs: the series resistor takes the supply less the forward voltage; checked in the LED and resistor lab', { color: 'red', vs: 5, mA: 20 }, { R: 150, Rbuy: 150 }),
      kase('hand: white LED on a 9 V battery', { color: 'white', vs: 9, mA: 15 }, { R: 386.67, Rbuy: 390 }),
    ],
  }),

  problem({
    id: 'u2.current',
    title: 'The current with this resistor',
    exam: 'u2',
    ch: '2',
    lab: 'led',
    src: 'Kuphaldt §III.3',
    topics: ['led', 'ohm', 'colour'],
    principles: ['vf'],
    variety: ['representation'],
    vars: {
      given: choice(['value', 'by value'], ['bands', 'by its colour bands']),
      color: COLOR('red', 'yellow', 'green', 'blue'),
      vs: SUPPLY(5, 9, 12),
      R: choice([150, '150 Ω'], [220, '220 Ω'], [330, '330 Ω'], [470, '470 Ω'], [680, '680 Ω'], [1000, '1.0 kΩ']),
    },
    derive: ($) => {
      const { vm } = measured($.color, $.vs, $.R);
      return { vm, I: (($.vs - vm) / $.R) * 1000 };
    },
    valid: ($) => $.I >= 2 && $.I <= 30,
    text: (T, $) => `A ${LEDS[$.color].name} LED and a resistor ${$.given === 'bands' ? `with bands ${bandsText($.R)}` : `of ${ohm($.R)}`} run in series from a ${T.vs} supply. The LED is lit, and a meter across it reads ${$.vm.toFixed(2)} V. Find the current, in mA.`,
    parts: [num('I', ($) => $.I, 'mA', { label: 'current' })],
    level: 1,
    hints: [
      'The resistor and the LED carry one current. The resistor’s voltage gives it by Ohm’s law.',
      'The resistor takes what the LED leaves: V_R = V_s − V_LED. Then I = V_R/R.',
    ],
    steps: ($, sig) => [
      ...($.given === 'bands' ? [`${bandsText($.R)}: ${ohm($.R)}`] : []),
      String.raw`$V_R = ${$.vs} - ${$.vm.toFixed(2)} = ${sig($.vs - $.vm)}$ V`,
      String.raw`$I = ${sig($.vs - $.vm)}/${$.R} = ${sig($.I)}$ mA`,
    ],
    sim: {
      scenario: 'red5',
      setup(s, $) {
        s.color = $.color;
        s.vs = $.vs;
        s.R = $.R;
      },
      read: (c) => ({ I: c.I * 1000 }),
    },
    cases: [
      kase('Kuphaldt §I.2, Ohm’s law, applied to the resistor alone; checked in the LED and resistor lab', { given: 'value', color: 'red', vs: 9, R: 680 }, { I: 10.485 }),
      kase('hand: bands orange–orange–brown', { given: 'bands', color: 'blue', vs: 9, R: 330 }, { I: 17.667 }),
    ],
  }),

  problem({
    id: 'u2.power',
    title: 'Is a ¼ W resistor enough?',
    exam: 'u2',
    ch: '2',
    lab: 'led',
    src: 'Kuphaldt §I.2',
    topics: ['power', 'led'],
    principles: ['power'],
    variety: ['unknown'],
    vars: {
      vs: SUPPLY(5, 9, 12),
      R: choice([100, '100 Ω'], [150, '150 Ω'], [220, '220 Ω'], [330, '330 Ω'], [470, '470 Ω'], [680, '680 Ω']),
    },
    derive: ($) => {
      const { vm } = measured('red', $.vs, $.R);
      const VR = $.vs - vm;
      const I = VR / $.R;
      const P = VR * I * 1000;
      return { vm, VR, Ia: I, P, verdict: P <= 125 ? 'cool' : P <= 250 ? 'warm' : 'over' };
    },
    valid: ($) => $.Ia <= 0.032,
    text: (T, $) => `A red LED runs from a ${T.vs} supply through a ${T.R} resistor. A meter across the LED reads ${$.vm.toFixed(2)} V. Find the power in the resistor, in mW, and say how a ¼ W resistor fares. A common rule is to run a resistor at no more than half its rating.`,
    parts: [
      num('P', ($) => $.P, 'mW', { label: 'resistor’s power' }),
      pick('verdict', 'a ¼ W resistor', [
        ['cool', 'Fine: at most half its rating', 'Right when I²R is 125 mW or less: it runs cool with room to spare.'],
        ['warm', 'Within its rating, but over half: it runs warm', 'Right when I²R is between 125 mW and 250 mW. It works, but a ½ W part or a larger resistance is kinder.'],
        ['over', 'Over its rating: it will overheat', 'Right when I²R is over 250 mW. The resistor will scorch; use a ½ W part, a larger resistance, or a higher-voltage LED string.'],
      ], ($) => $.verdict),
    ],
    level: 2,
    hints: [
      'A resistor turns the power I·V_R into heat, where V_R is its own voltage, not the supply’s.',
      'V_R = V_s − V_LED and I = V_R/R, so P = V_R²/R = I²R.',
    ],
    steps: ($, sig) => [
      String.raw`$V_R = ${$.vs} - ${$.vm.toFixed(2)} = ${sig($.VR)}$ V, $I = ${sig($.VR)}/${$.R} = ${sig($.Ia * 1000)}$ mA`,
      String.raw`$P = I^2 R = ${sig($.P)}$ mW, against 250 mW: ${$.verdict === 'cool' ? 'under half' : $.verdict === 'warm' ? 'over half' : 'over the rating'}`,
    ],
    sim: {
      scenario: 'red9',
      setup(s, $) {
        s.color = 'red';
        s.vs = $.vs;
        s.R = $.R;
      },
      read: (c) => ({ P: c.PR * 1000 }),
    },
    second: ($) => {
      const P = ($.Ia ** 2) * $.R * 1000;
      return { P, verdict: P <= 125 ? 'cool' : P <= 250 ? 'warm' : 'over' };
    },
    cases: [
      kase('Kuphaldt §I.2, power in electric circuits: P = I²R = V²/R; checked in the LED and resistor lab', { vs: 9, R: 330 }, { P: 147.9, verdict: 'warm' }),
      kase('hand', { vs: 12, R: 330 }, { P: 295.8, verdict: 'over' }),
    ],
  }),

  problem({
    id: 'u2.series',
    title: 'A string in series',
    exam: 'u2',
    ch: '2',
    lab: 'led-strings',
    src: 'Kuphaldt §I.5',
    topics: ['led', 'nets'],
    principles: ['series', 'vf'],
    variety: ['configuration'],
    vars: {
      color: COLOR('red', 'yellow', 'blue'),
      n: choice([2, 'two'], [3, 'three']),
      vs: SUPPLY(9, 12),
    },
    derive: ($) => {
      const vf = LEDS[$.color].vf;
      return { vf, R: ($.vs - $.n * vf) / 0.02 };
    },
    valid: ($) => $.vs - $.n * LEDS[$.color].vf >= 1,
    text: (T, $) => `${T.n[0].toUpperCase()}${T.n.slice(1)} ${LEDS[$.color].name} LEDs, each about ${$.vf.toFixed(1)} V at 20 mA, go in series with one resistor across a ${T.vs} supply. What resistance gives them 20 mA?`,
    parts: [num('R', ($) => $.R, 'Ω', { label: 'resistance', tol: 0.01 })],
    level: 2,
    hints: [
      'In series every part carries the same current, and the voltages add around the loop.',
      'The LEDs take n·V_f between them. The resistor takes the rest, at 20 mA.',
    ],
    steps: ($, sig) => [
      String.raw`The LEDs take $${$.n} \times ${$.vf.toFixed(1)} = ${sig($.n * $.vf)}$ V`,
      String.raw`$R = (${$.vs} - ${sig($.n * $.vf)})/0.020 = ${sig($.R)}\ \Omega$`,
    ],
    sim: {
      scenario: 'series',
      setup(s, $) {
        s.color = $.color;
        s.n = $.n;
        s.vs = $.vs;
        s.spread = 0;
        s.open = -1;
        s.R = $.R;
      },
    },
    second: ($) => {
      // The course model passes through 20 mA at V_f, so bisect R until the modelled string carries 20 mA.
      const ds = Array.from({ length: $.n }, () => ledModel($.color));
      let lo = 1;
      let hi = 1e4;
      for (let k = 0; k < 200; k += 1) {
        const mid = (lo + hi) / 2;
        if (seriesCurrentBisect($.vs, mid, ds) > 0.02) lo = mid;
        else hi = mid;
      }
      return { R: (lo + hi) / 2 };
    },
    cases: [
      kase('Kuphaldt §I.5, series circuits: one current, voltages add; checked in the LED strings lab', { color: 'red', n: 3, vs: 9 }, { R: 150 }),
      kase('hand', { color: 'blue', n: 3, vs: 12 }, { R: 120 }),
    ],
  }),

  problem({
    id: 'u2.parallel',
    title: 'LEDs in parallel, a resistor each',
    exam: 'u2',
    ch: '2',
    lab: 'led-strings',
    src: 'Kuphaldt §I.5',
    topics: ['led', 'nets', 'power'],
    principles: ['parallel-share', 'vf'],
    variety: ['unknown'],
    vars: {
      q: choice(['R', 'the resistance each LED needs'], ['I', 'the current from the supply, in mA'], ['P', 'the power wasted in all the resistors, in mW']),
      n: choice([2, 'two'], [3, 'three']),
      vs: SUPPLY(5, 9, 12),
      mA: choice([10, '10 mA'], [15, '15 mA'], [20, '20 mA']),
    },
    derive: ($) => {
      const R = ($.vs - 2) / ($.mA / 1000);
      const I = $.n * $.mA;
      const P = $.n * ($.mA / 1000) * ($.vs - 2) * 1000;
      return { R, Itot: I, Pres: P, ans: { R, I, P }[$.q] };
    },
    text: (T, $) => `${T.n[0].toUpperCase()}${T.n.slice(1)} red LEDs (about 2.0 V each) sit in parallel on a ${T.vs} supply, each with its own resistor, each set for ${T.mA}. Find ${T.q}.`,
    parts: [num('ans', ($) => $.ans, ($) => ({ R: 'Ω', I: 'mA', P: 'mW' }[$.q]), { label: 'the answer' })],
    level: 2,
    hints: [
      'Each LED and its resistor form their own loop across the supply. They do not affect one another.',
      'Each resistor takes V_s − V_f at its own LED’s current. The supply gives the sum of the branch currents.',
    ],
    steps: ($, sig) => [
      String.raw`Each branch: $R = (${$.vs} - 2.0)/${$.mA / 1000} = ${sig($.R)}\ \Omega$`,
      $.q === 'R' ? 'Every branch is the same.' : $.q === 'I'
        ? String.raw`The supply gives every branch: $${$.n} \times ${$.mA} = ${sig($.Itot)}$ mA`
        : String.raw`Each resistor: $${$.mA / 1000} \times ${sig($.vs - 2)} = ${sig($.Pres / $.n)}$ mW; all ${$.n}: $${sig($.Pres)}$ mW`,
    ],
    sim: {
      scenario: 'own',
      setup(s, $) {
        s.n = $.n;
        s.vs = $.vs;
        s.spread = 0;
        s.open = -1;
        s.R = nextE12Up($.R);
      },
    },
    second: ($) => {
      // Branch by branch, then add up.
      let I = 0;
      let P = 0;
      let R = 0;
      for (let k = 0; k < $.n; k += 1) {
        const i = $.mA / 1000;
        R = ($.vs - 2) / i;
        I += i * 1000;
        P += i * i * R * 1000;
      }
      return { ans: { R, I, P }[$.q] };
    },
    cases: [
      kase('Kuphaldt §I.5, parallel circuits: branch currents add; checked in the LED strings lab', { q: 'I', n: 2, vs: 9, mA: 20 }, { ans: 40 }),
      kase('hand', { q: 'P', n: 3, vs: 12, mA: 15 }, { ans: 450 }),
    ],
  }),

  problem({
    id: 'u2.bands',
    title: 'Which resistor from the drawer?',
    exam: 'u2',
    ch: '2',
    lab: 'indicator',
    src: 'IEC 60063',
    topics: ['colour', 'e12'],
    principles: ['e12-up', 'vf'],
    variety: ['representation'],
    vars: {
      vs: SUPPLY(5, 9, 12),
      mA: choice([10, '10 mA'], [20, '20 mA']),
    },
    derive: ($) => {
      const R = ($.vs - 2) / ($.mA / 1000);
      return { Rx: R, up: nextE12Up(R), down: prevE12Down(R), naive: nextE12Up($.vs / ($.mA / 1000)) };
    },
    valid: ($) => new Set([$.up, $.down, $.naive, $.up * 10]).size === 4,
    text: (T) => `You want a red LED (2.0 V at 20 mA) to carry at most ${T.mA} from a ${T.vs} supply. Which resistor do you take from the drawer?`,
    parts: [
      {
        id: 'ans',
        kind: 'choice',
        label: 'the resistor',
        multi: false,
        options: ($) => [
          { value: $.up, label: `${bandsText($.up)} (${ohm($.up)})`, why: `Right: (V_s − V_f)/I = ${ohm($.Rx)}, and ${ohm($.up)} is the next E12 value up, so the current stays at or under the target.` },
          { value: $.down, label: `${bandsText($.down)} (${ohm($.down)})`, why: `${ohm($.down)} is below the ${ohm($.Rx)} you need, so the current would run over the target. Round up, not down.` },
          { value: $.naive, label: `${bandsText($.naive)} (${ohm($.naive)})`, why: `That is V_s/I rounded up: it leaves out the LED’s 2.0 V. The LED would run dimmer than you planned.` },
          { value: $.up * 10, label: `${bandsText($.up * 10)} (${ohm($.up * 10)})`, why: 'Right digits, wrong third band. The third band is the number of zeros, so this is ten times too large.' },
        ],
        correct: ($) => $.up,
      },
    ],
    level: 1,
    hints: [
      'Find the exact resistance first: R = (V_s − V_f)/I.',
      'Round up to the next E12 value. Then read its bands: two digits, then the number of zeros.',
    ],
    steps: ($, sig) => [
      String.raw`$R = (${$.vs} - 2.0)/${$.mA / 1000} = ${sig($.Rx)}\ \Omega$; next E12 up: $${sig($.up)}\ \Omega$`,
      `${bandsText($.up)}`,
    ],
    sim: {
      scenario: 'usb',
      setup(s, $) {
        s.vs = $.vs;
        s.target = $.mA;
        s.vf = 'typ';
      },
      read: (c) => ({ ans: c.Rpick }),
    },
    cases: [
      kase('IEC 60063, the E12 series; checked in the Indicator LED lab', { vs: 9, mA: 20 }, { ans: 390 }),
      kase('hand', { vs: 12, mA: 10 }, { ans: 1000 }),
    ],
  }),

  problem({
    id: 'u2.design',
    title: 'Design an indicator',
    exam: 'u2',
    ch: '2',
    lab: 'indicator',
    src: 'Kuphaldt §III.3',
    topics: ['led', 'e12', 'power'],
    principles: ['vf', 'e12-up', 'power'],
    variety: ['configuration'],
    vars: {
      vs: SUPPLY(5, 9, 12),
      mA: choice([5, '5 mA'], [10, '10 mA'], [15, '15 mA'], [20, '20 mA'], [25, '25 mA']),
    },
    derive: ($) => {
      const Rx = ($.vs - 2) / ($.mA / 1000);
      const Rbuy = nextE12Up(Rx);
      const I = (($.vs - 2) / Rbuy) * 1000;
      return { Rx, Rbuy, I, P: (I / 1000) ** 2 * Rbuy * 1000 };
    },
    valid: ($) => Math.abs($.Rbuy - $.Rx) / $.Rx > 0.01,
    text: (T) => `Design a power light: a red LED (take its voltage as 2.0 V) on a ${T.vs} supply, at no more than ${T.mA}. Find the E12 resistor you buy, the current it really gives, in mA, and the resistor’s power, in mW.`,
    parts: [
      num('Rbuy', ($) => $.Rbuy, 'Ω', { label: 'resistor', tol: 0.002 }),
      num('I', ($) => $.I, 'mA', { label: 'current' }),
      num('P', ($) => $.P, 'mW', { label: 'resistor’s power' }),
    ],
    level: 3,
    hints: [
      'Work in the order a builder does: the exact resistance, then the part you can buy, then what that part gives.',
      'The bought resistor is larger than the exact one, so the current comes out a little under your target.',
      'Its power is I²R with the real current and the bought resistance.',
    ],
    steps: ($, sig) => [
      String.raw`$R = (${$.vs} - 2.0)/${$.mA / 1000} = ${sig($.Rx)}\ \Omega$; buy $${sig($.Rbuy)}\ \Omega$`,
      String.raw`$I = (${$.vs} - 2.0)/${$.Rbuy} = ${sig($.I)}$ mA`,
      String.raw`$P = I^2 R = ${sig($.P)}$ mW`,
    ],
    sim: {
      scenario: 'usb',
      setup(s, $) {
        s.vs = $.vs;
        s.target = $.mA;
        s.vf = 'typ';
      },
      read: (c) => ({ Rbuy: c.Rpick }),
    },
    second: ($) => {
      const I = ($.vs - 2) / $.Rbuy;
      const VR = I * $.Rbuy;
      return { Rbuy: nextE12Up(($.vs - 2) / ($.mA / 1000)), I: I * 1000, P: (VR * VR) / $.Rbuy * 1000 };
    },
    cases: [
      kase('Kuphaldt §III.3, LEDs, with the E12 series of IEC 60063; checked in the Indicator LED lab', { vs: 9, mA: 20 }, { Rbuy: 390, I: 17.949, P: 125.64 }),
      kase('hand', { vs: 12, mA: 20 }, { Rbuy: 560, I: 17.857, P: 178.57 }),
    ],
  }),

  problem({
    id: 'u2.concept-fault',
    title: 'Why is it dark?',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'led',
    src: 'Kuphaldt §III.3',
    topics: ['diode', 'led'],
    principles: ['one-way'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'An LED and 150 Ω on 5 V stay dark. The meter reads 5.0 V across the LED and 0 V across the resistor. What is wrong?'],
        [2, 'An LED and 150 Ω on 5 V stay dark. The supply reads 5.0 V at its terminals, but 0 V across the LED and 0 V across the resistor. What is wrong?'],
        [3, 'An LED on 5 V glows so faintly you can barely see it. The meter reads 1.7 V across the LED and 3.3 V across its resistor, whose bands are brown–black–orange. What is wrong?'],
      ),
    },
    text: (T) => T.q,
    parts: [
      pick('ans', 'the fault', [
        ['flip', 'The LED is in backwards', 'Right when the LED has the whole supply and the resistor none: no current flows, and the blocking LED takes all the voltage. Turn it so the long leg faces +.'],
        ['path', 'The loop is open somewhere else: a jumper, a rail, a lead', 'Right when nothing in the loop has any voltage across it: the break is between the supply and the parts. Check the jumpers and the rails.'],
        ['big', 'The resistor is far too large', 'Right for the faint glow: brown–black–orange is 10 kΩ, so 3.3 V drives only 0.33 mA. Use about 150 Ω for 20 mA.'],
        ['dead', 'The supply is dead', 'The supply reads 5.0 V, so it is working. Look at where the voltage goes.'],
      ], ($) => ({ 1: 'flip', 2: 'path', 3: 'big' }[$.q])),
    ],
    level: 2,
    hints: [
      'With no current, a resistor has no voltage across it. Where the voltage does appear is where the loop is broken.',
      'An LED conducts only from anode (long leg) to cathode (flat side, short leg).',
    ],
    steps: ($) => [{ 1: 'All the voltage across the LED, none across the resistor: the LED blocks. It is backwards (or dead).', 2: 'No voltage across either part: the break is elsewhere in the loop.', 3: '10 kΩ at 3.3 V: 0.33 mA. Too large.' }[$.q]],
    sim: { scenario: 'flip', setup() {} },
    second: ($) => ({ ans: ['flip', 'path', 'big'][$.q - 1] }),
    cases: [
      kase('Kuphaldt §III.3, diodes: a reverse-biased diode blocks and drops the whole applied voltage', { q: 1 }, { ans: 'flip' }),
      kase('hand', { q: 3 }, { ans: 'big' }),
    ],
  }),

  problem({
    id: 'u2.concept-strings',
    title: 'Series or parallel?',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'led-strings',
    src: 'Kuphaldt §I.5',
    topics: ['led', 'nets'],
    principles: ['series', 'parallel-share'],
    variety: ['unknown'],
    vars: {
      q: choice(
        [1, 'Two red LEDs share one resistor in parallel. One glows much brighter than the other. Why?'],
        [2, 'Three LEDs run in series on 9 V. One fails open. What do the other two do?'],
        [3, 'Three red LEDs on a 12 V supply at 20 mA each. Which wiring wastes the least power in resistors?'],
      ),
    },
    text: (T) => T.q,
    parts: [
      pick('ans', 'the answer', [
        ['hog', 'Parallel LEDs share a voltage, and the one with the lower V_f takes most of the current', 'Right for the uneven pair: the curve is so steep that 0.1 V of spread is a large current difference. Give each LED its own resistor.'],
        ['dark', 'They go dark: a series string has one path', 'Right for the failed string: one open part breaks the only path.'],
        ['series', 'All three in series with one resistor', 'Right for least waste: the LEDs take 6 V of the 12 V, so the resistor burns 6 V × 20 mA = 120 mW. Three parallel branches burn 10 V × 60 mA = 600 mW.'],
        ['same', 'Nothing changes; each LED is independent', 'That is true only when each LED has its own resistor in its own loop.'],
      ], ($) => ({ 1: 'hog', 2: 'dark', 3: 'series' }[$.q])),
    ],
    level: 2,
    hints: [
      'Series: one current, voltages add. Parallel: one voltage, currents add.',
      'A resistor wastes its voltage times its current.',
    ],
    steps: ($) => [{ 1: 'One voltage, steep curves: the lower V_f hogs the current.', 2: 'One path, now broken: all dark.', 3: 'Series puts the LEDs’ voltage to use and leaves the resistor the least.' }[$.q]],
    sim: { scenario: 'shared', setup() {} },
    second: ($) => ({ ans: ['hog', 'dark', 'series'][$.q - 1] }),
    cases: [
      kase('Kuphaldt §I.5, series and parallel circuits', { q: 2 }, { ans: 'dark' }),
      kase('hand', { q: 3 }, { ans: 'series' }),
    ],
  }),

  problem({
    id: 'u2.concept-curve',
    title: 'An LED is not a resistor',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'led',
    src: 'Kuphaldt §III.3',
    topics: ['diode', 'led'],
    principles: ['vf'],
    variety: ['unknown'],
    vars: {
      q: choice(
        [1, 'A red LED runs from 9 V through 680 Ω. You swap in 330 Ω. What does the LED’s voltage do?'],
        [2, 'You wire a red LED straight across a 5 V supply, with no resistor. What happens?'],
        [3, 'A friend picks the resistor as R = V_s/I. What have they left out?'],
      ),
    },
    text: (T) => T.q,
    parts: [
      pick('ans', 'the answer', [
        ['barely', 'It barely moves: from about 1.9 V to 2.0 V', 'Right for the swap: past its knee an LED’s voltage rises only slowly with current, so the resistor sets the current.'],
        ['burn', 'Almost nothing limits the current, and the LED burns out', 'Right for no resistor: 5 V is far past the knee, where a little more voltage is a lot more current.'],
        ['vf', 'The LED’s own forward voltage', 'Right for V_s/I: the resistor gets only V_s − V_f, so their resistor is too large and the LED runs dim.'],
        ['doubles', 'It doubles, like a resistor’s would', 'An LED is not a resistor. Its voltage is set by its junction and changes only a little with current.'],
      ], ($) => ({ 1: 'barely', 2: 'burn', 3: 'vf' }[$.q])),
    ],
    level: 1,
    hints: [
      'Look at the LED’s I–V curve: flat below the knee, then nearly vertical.',
      'On the steep part, a small change in voltage is a large change in current.',
    ],
    steps: ($) => [{ 1: 'Steep curve: the voltage barely moves; the current doubles.', 2: 'Nothing limits the current.', 3: 'R = (V_s − V_f)/I.' }[$.q]],
    sim: { scenario: 'red9', setup() {} },
    second: ($) => ({ ans: ['barely', 'burn', 'vf'][$.q - 1] }),
    cases: [
      kase('Kuphaldt §III.3, diodes: the forward voltage drop', { q: 1 }, { ans: 'barely' }),
      kase('hand', { q: 3 }, { ans: 'vf' }),
    ],
  }),
];
