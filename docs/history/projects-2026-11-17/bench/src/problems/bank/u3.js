/**
 * Unit 3 · Reading the world. Templates vary by structure (a `choice` among configurations, givens or
 * unknowns), carry 2–3 staged hints, at least two named traps on every numeric part (in
 * ../coaching/u3.js), a worked case, and a second method: their lab (`sim`) or `second`.
 *
 * Sensor resistances given in a problem's text are the course models' (GL5528, 10 kΩ NTC with
 * B = 3950 K), rounded to three figures, so the problem and the lab agree.
 */
import { bestFixed, divider, ldrResistance, millman, ntcResistance, par } from '@flux/subjects/em/sensors.js';
import { E12 } from '@flux/subjects/em/diode.js';
import { LDR, MCU, NTC } from '../../labs/sensors.js';
import { choice, kase, num, problem } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const ohm = (r) => (r >= 1e6 ? `${Number((r / 1e6).toPrecision(3))} MΩ` : r >= 1000 ? `${Number((r / 1000).toPrecision(3))} kΩ` : `${Number(r.toPrecision(3))} Ω`);
const r3 = (r) => Number(r.toPrecision(3));
const RES = (...rs) => choice(...rs.map((r) => [r, ohm(r)]));

/** The largest E12 value at or below `r`. */
export function e12Down(r) {
  const d = 10 ** Math.floor(Math.log10(r) + 1e-12);
  let best = null;
  for (const m of [...E12, 10]) {
    const v = Number((m * d).toPrecision(3));
    if (v <= r * (1 + 1e-9)) best = v;
  }
  return best;
}

/** The swing of a divider's output, sensor below, fixed R above, as the sensor goes from ra to rb. */
export const swingAt = (ra, rb, R) => divider(5, R, rb).v - divider(5, R, ra).v;

export default [
  problem({
    id: 'u3.divider',
    title: 'Two resistors, one output',
    exam: 'u3',
    ch: '3',
    lab: 'divider',
    src: 'Kuphaldt §I.6',
    topics: ['divider'],
    principles: ['ratio'],
    variety: ['unknown'],
    vars: {
      q: choice(['V', 'the output voltage'], ['R', 'the lower resistor that gives this output']),
      top: RES(1e3, 2.2e3, 4.7e3, 10e3, 22e3, 47e3),
      bottom: RES(1e3, 2.2e3, 3.3e3, 4.7e3, 10e3, 22e3),
    },
    derive: ($) => ({ V: divider(5, $.top, $.bottom).v }),
    valid: ($) => $.top !== $.bottom,
    text: (T, $, sig) => ($.q === 'V'
      ? `A divider runs from 5 V: ${T.top} from the supply to the output, ${T.bottom} from the output to 0 V. Nothing is attached to the output. Find the output voltage.`
      : `A divider runs from 5 V with ${T.top} from the supply to the output. You want ${sig($.V)} V at the output, with nothing attached. What resistance goes from the output to 0 V?`),
    parts: [num('ans', ($) => ($.q === 'V' ? $.V : $.bottom), ($) => ($.q === 'V' ? 'V' : 'Ω'), { label: 'the answer', tol: 0.01 })],
    level: 1,
    hints: [
      'One current flows through both resistors, so each takes a share of 5 V in proportion to its resistance.',
      'The output is the lower resistor’s share: V_out = V_s·R_lower/(R_upper + R_lower).',
    ],
    steps: ($, sig) => ($.q === 'V'
      ? [String.raw`$V_{\text{out}} = 5 \times ${$.bottom}/(${$.top} + ${$.bottom}) = ${sig($.V)}$ V`]
      : [String.raw`$R_{\text{lower}} = R_{\text{upper}}\,V_{\text{out}}/(V_s - V_{\text{out}}) = ${$.top} \times ${sig($.V)}/${sig(5 - $.V)} = ${sig($.bottom)}\ \Omega$`]),
    sim: {
      scenario: 'pot10',
      setup(s, $) {
        s.sensor = 'pot';
        s.potR = $.top + $.bottom;
        s.x = $.bottom / ($.top + $.bottom);
        s.load = 0;
        s.asked = $.q;
      },
      read: (c, s) => (s.asked === 'V' ? { ans: c.v } : {}),
    },
    second: ($) => ({ ans: $.q === 'V' ? millman([[5, $.top], [0, $.bottom]]) : ($.top * $.V) / (5 - $.V) }),
    cases: [
      kase('Kuphaldt §I.6, voltage divider circuits; checked in the Voltage divider lab', { q: 'V', top: 10e3, bottom: 4.7e3 }, { ans: 1.5986 }),
      kase('hand', { q: 'R', top: 2.2e3, bottom: 3.3e3 }, { ans: 3300 }),
    ],
  }),

  problem({
    id: 'u3.ldr',
    title: 'Light and dark',
    exam: 'u3',
    ch: '3',
    lab: 'divider',
    src: 'GL55 datasheet',
    topics: ['ldr', 'divider'],
    principles: ['ratio', 'sensor-side'],
    variety: ['configuration'],
    vars: {
      pos: choice(['bottom', 'between the output and 0 V'], ['top', 'between 5 V and the output']),
      fixed: RES(4.7e3, 10e3, 22e3),
      room: choice([100, '100 lux'], [300, '300 lux'], [1000, '1,000 lux']),
      night: choice([0.3, '0.3 lux'], [1, '1 lux'], [3, '3 lux']),
    },
    derive: ($) => {
      const rr = r3(ldrResistance(LDR, $.room));
      const rn = r3(ldrResistance(LDR, $.night));
      const v = (r) => ($.pos === 'bottom' ? divider(5, $.fixed, r).v : divider(5, r, $.fixed).v);
      return { rr, rn, Vroom: v(rr), Vnight: v(rn) };
    },
    text: (T, $) => `A GL5528 LDR sits ${T.pos} in a divider from 5 V; a ${T.fixed} resistor is the other half. The LDR measures ${ohm($.rr)} in a room at ${T.room} and ${ohm($.rn)} at night, ${T.night}. Find the output in the room and at night.`,
    parts: [
      num('Vroom', ($) => $.Vroom, 'V', { label: 'in the room', tol: 0.01 }),
      num('Vnight', ($) => $.Vnight, 'V', { label: 'at night', tol: 0.01 }),
    ],
    level: 2,
    hints: [
      'The LDR is a resistor whose value depends on the light. Work the divider twice, once for each value.',
      'Ask which part is below the output: its share of 5 V is the output.',
    ],
    steps: ($, sig) => [
      String.raw`Room: $5 \times ${$.pos === 'bottom' ? $.rr : $.fixed}/(${$.fixed} + ${$.rr}) = ${sig($.Vroom)}$ V`,
      String.raw`Night: $5 \times ${$.pos === 'bottom' ? $.rn : $.fixed}/(${$.fixed} + ${$.rn}) = ${sig($.Vnight)}$ V`,
    ],
    sim: {
      scenario: 'ldr',
      setup(s, $) {
        s.sensor = 'ldr';
        s.pos = $.pos;
        s.fixed = $.fixed;
        s.lux = $.room;
        s.load = 0;
      },
      read: (c) => ({ Vroom: c.v }),
    },
    second: ($) => {
      const v = (r) => millman($.pos === 'bottom' ? [[5, $.fixed], [0, r]] : [[5, r], [0, $.fixed]]);
      return { Vroom: v($.rr), Vnight: v($.rn) };
    },
    cases: [
      kase('GL55 series datasheet, GL5528: 10–20 kΩ at 10 lux, gamma 0.6; checked in the Voltage divider lab', { pos: 'bottom', fixed: 10e3, room: 300, night: 1 }, { Vroom: 0.814, Vnight: 4.25 }),
      kase('hand', { pos: 'top', fixed: 10e3, room: 300, night: 1 }, { Vroom: 4.186, Vnight: 0.7497 }),
    ],
  }),

  problem({
    id: 'u3.best',
    title: 'The fixed resistor for the biggest swing',
    exam: 'u3',
    ch: '3',
    lab: 'nightlight',
    src: 'GL55 datasheet',
    topics: ['ldr', 'divider'],
    principles: ['geo-mean'],
    variety: ['representation'],
    vars: {
      given: choice(['ohms', 'as resistances'], ['lux', 'as light levels, from the datasheet’s figures']),
      a: choice([1000, '1,000 lux'], [300, '300 lux'], [100, '100 lux']),
      b: choice([0.3, '0.3 lux'], [1, '1 lux'], [3, '3 lux']),
    },
    derive: ($) => {
      const ra = r3(ldrResistance(LDR, $.a));
      const rb = r3(ldrResistance(LDR, $.b));
      const R = bestFixed(ra, rb);
      return { ra, rb, R, swing: swingAt(ra, rb, R) };
    },
    text: (T, $) => ($.given === 'ohms'
      ? `An LDR measures ${ohm($.ra)} in the light and ${ohm($.rb)} in the dark. It sits below the output of a divider from 5 V. Which fixed resistor above it gives the biggest swing in the output, and how big is that swing?`
      : `A GL5528 LDR (15 kΩ at 10 lux, gamma 0.6) sits below the output of a divider from 5 V. You must tell ${T.a} from ${T.b}. Which fixed resistor above it gives the biggest swing in the output, and how big is that swing?`),
    parts: [
      num('R', ($) => $.R, 'Ω', { label: 'fixed resistor', tol: 0.01 }),
      num('swing', ($) => $.swing, 'V', { label: 'swing', tol: 0.01 }),
    ],
    level: 3,
    hints: [
      'Write the swing as V(dark) − V(light) with the fixed resistor R as the unknown, and find the R that makes it largest.',
      'Setting the derivative to zero gives R² = R_light·R_dark: the geometric mean.',
      'Then work the divider at both resistances with that R and subtract.',
    ],
    steps: ($, sig) => [
      ...($.given === 'lux' ? [String.raw`$R = 15\ \text{k}\Omega\,(E/10)^{-0.6}$: $${sig($.ra)}\ \Omega$ and $${sig($.rb)}\ \Omega$`] : []),
      String.raw`$R = \sqrt{${$.ra} \times ${$.rb}} = ${sig($.R)}\ \Omega$`,
      String.raw`Swing $= 5\left(\frac{${$.rb}}{${sig($.R)} + ${$.rb}} - \frac{${$.ra}}{${sig($.R)} + ${$.ra}}\right) = ${sig($.swing)}$ V`,
    ],
    second: ($) => {
      // Golden-section search on the swing, over a log scale of R.
      let lo = Math.log($.ra);
      let hi = Math.log($.rb);
      const g = (Math.sqrt(5) - 1) / 2;
      for (let k = 0; k < 200; k += 1) {
        const m1 = hi - g * (hi - lo);
        const m2 = lo + g * (hi - lo);
        if (swingAt($.ra, $.rb, Math.exp(m1)) > swingAt($.ra, $.rb, Math.exp(m2))) hi = m2;
        else lo = m1;
      }
      const R = Math.exp((lo + hi) / 2);
      return { R, swing: swingAt($.ra, $.rb, R) };
    },
    cases: [
      kase('GL55 series datasheet, GL5528 at 300 and 1 lux; checked in the Night light lab', { given: 'lux', a: 300, b: 1 }, { R: 10462, swing: 3.4367 }),
      kase('hand', { given: 'ohms', a: 1000, b: 0.3 }, { R: 10201, swing: 4.1513 }),
    ],
  }),

  problem({
    id: 'u3.load',
    title: 'What the load does',
    exam: 'u3',
    ch: '3',
    lab: 'divider',
    src: 'Kuphaldt §I.10',
    topics: ['loading', 'divider'],
    principles: ['loading-div'],
    variety: ['unknown'],
    vars: {
      q: choice(['V', 'the output with the load attached'], ['pct', 'how far the load pulls the output down, in percent']),
      R: RES(1e3, 10e3, 100e3),
      L: RES(1e3, 10e3, 100e3, 1e6),
    },
    derive: ($) => {
      const d = divider(5, $.R, $.R, $.L);
      return { V: d.v, pct: ((2.5 - d.v) / 2.5) * 100 };
    },
    text: (T) => `Two equal ${T.R} resistors divide 5 V, so the output is 2.50 V with nothing attached. A ${T.L} load is connected from the output to 0 V. Find ${T.q}.`,
    parts: [num('ans', ($) => ($.q === 'V' ? $.V : $.pct), ($) => ($.q === 'V' ? 'V' : '%'), { label: 'the answer', tol: 0.01 })],
    level: 2,
    hints: [
      'The load joins the output to 0 V, so it is in parallel with the lower resistor.',
      'Replace the lower resistor by R ∥ R_load, then divide again.',
    ],
    steps: ($, sig) => [
      String.raw`$R \parallel R_L = ${sig(par($.R, $.L))}\ \Omega$`,
      String.raw`$V = 5 \times ${sig(par($.R, $.L))}/(${$.R} + ${sig(par($.R, $.L))}) = ${sig($.V)}$ V${$.q === 'pct' ? String.raw`, down $${sig($.pct)}\%$` : ''}`,
    ],
    sim: {
      scenario: 'pot10',
      setup(s, $) {
        s.sensor = 'pot';
        s.potR = 2 * $.R;
        s.x = 0.5;
        s.load = $.L;
        s.asked = $.q;
      },
      read: (c, s) => ({ ans: s.asked === 'V' ? c.v : c.sagPct }),
    },
    cases: [
      kase('Kuphaldt §I.10, Thévenin’s theorem: a divider is a source of V/2 behind R/2; checked in the Voltage divider lab', { q: 'V', R: 100e3, L: 1e3 }, { ans: 0.04902 }),
      kase('hand', { q: 'pct', R: 10e3, L: 1e6 }, { ans: 0.4975 }),
    ],
  }),

  problem({
    id: 'u3.ntc',
    title: 'A thermistor divider',
    exam: 'u3',
    ch: '3',
    lab: 'divider',
    src: 'NTC 3950',
    topics: ['ntc', 'divider'],
    principles: ['ratio', 'sensor-side'],
    variety: ['configuration'],
    vars: {
      pos: choice(['bottom', 'between the output and 0 V'], ['top', 'between 5 V and the output']),
      t: choice([0, '0 °C'], [10, '10 °C'], [40, '40 °C'], [60, '60 °C'], [80, '80 °C']),
    },
    derive: ($) => {
      const r = ntcResistance(NTC, $.t);
      const V = $.pos === 'bottom' ? divider(5, 10e3, r).v : divider(5, r, 10e3).v;
      return { r, V };
    },
    text: (T) => `A 10 kΩ NTC thermistor (B = 3950 K, 10 kΩ at 25 °C) sits ${T.pos} in a divider from 5 V, with a 10 kΩ fixed resistor as the other half. Find the output at ${T.t}.`,
    parts: [num('V', ($) => $.V, 'V', { label: 'output', tol: 0.01 })],
    level: 2,
    hints: [
      'First the thermistor’s resistance: R = R₂₅·exp(B(1/T − 1/T₂₅)), with both temperatures in kelvin.',
      'Then the divider: the output is the lower part’s share of 5 V.',
    ],
    steps: ($, sig) => [
      String.raw`$R = 10\,000\,e^{3950\,(1/${sig($.t + 273.15)} - 1/298.15)} = ${sig($.r)}\ \Omega$`,
      String.raw`$V = 5 \times ${$.pos === 'bottom' ? sig($.r) : '10\\,000'}/(10\,000 + ${sig($.r)}) = ${sig($.V)}$ V`,
    ],
    sim: {
      scenario: 'ntc',
      setup(s, $) {
        s.sensor = 'ntc';
        s.pos = $.pos;
        s.fixed = 10e3;
        s.tC = $.t;
        s.load = 0;
      },
      read: (c) => ({ V: c.v }),
    },
    cases: [
      kase('the beta equation of a 10 kΩ, B = 3950 K NTC; checked in the Voltage divider lab', { pos: 'bottom', t: 0 }, { V: 3.8738 }),
      kase('hand', { pos: 'top', t: 60 }, { V: 4.0044 }),
    ],
  }),

  problem({
    id: 'u3.pull-power',
    title: 'The cost of a small pull-up',
    exam: 'u3',
    ch: '3',
    lab: 'button',
    src: 'ATmega328P datasheet',
    topics: ['pullup', 'power'],
    principles: ['pull-size'],
    variety: ['configuration'],
    vars: {
      vcc: choice([3.3, '3.3 V'], [5, '5 V']),
      rp: RES(220, 1e3, 4.7e3, 10e3),
    },
    derive: ($) => ({ P: (($.vcc * $.vcc) / $.rp) * 1000 }),
    text: (T) => `A button pulls an input to 0 V against a ${T.rp} pull-up to ${T.vcc}. While the button is held, how much power does the pull-up waste, in mW?`,
    parts: [num('P', ($) => $.P, 'mW', { label: 'power', tol: 0.01 })],
    level: 1,
    hints: [
      'Held, the button joins the pin to 0 V, so the pull-up has the whole supply across it.',
      'A resistor with V across it wastes V²/R.',
    ],
    steps: ($, sig) => [String.raw`$P = ${$.vcc}^2/${$.rp} = ${sig($.P)}$ mW`],
    sim: {
      scenario: 'pressed',
      setup(s, $) {
        s.pull = 'up';
        s.rp = $.rp;
        s.pressed = true;
      },
    },
    second: ($) => {
      const I = $.vcc / $.rp;
      return { P: I * I * $.rp * 1000 };
    },
    cases: [
      kase('Kuphaldt §I.2, power: P = V²/R; checked in the Button and pull-up lab', { vcc: 5, rp: 10e3 }, { P: 2.5 }),
      kase('hand', { vcc: 3.3, rp: 220 }, { P: 49.5 }),
    ],
  }),

  problem({
    id: 'u3.pull-max',
    title: 'The largest pull-up that still works',
    exam: 'u3',
    ch: '3',
    lab: 'button',
    src: 'ATmega328P datasheet',
    topics: ['pullup', 'inputs'],
    principles: ['pull-size'],
    variety: ['configuration'],
    vars: {
      vcc: choice([3.3, '3.3 V'], [5, '5 V']),
      leak: choice([1e-6, '1 µA, the chip’s own pin'], [10e-6, '10 µA, a pin plus a long cable'], [50e-6, '50 µA, a sensor module’s input']),
    },
    derive: ($) => {
      const R = ((1 - MCU.vih) * $.vcc) / $.leak;
      return { R, buy: e12Down(R) };
    },
    text: (T) => `A pull-up to ${T.vcc} holds an ATmega328P input high. The chip reads high only above 0.6 of its supply. At worst, ${T.leak} leaks out of the input to 0 V. What is the largest pull-up that still reads high, and the largest E12 value you can use?`,
    parts: [
      num('R', ($) => $.R, 'Ω', { label: 'largest pull-up', tol: 0.01 }),
      num('buy', ($) => $.buy, 'Ω', { label: 'E12 value', tol: 0.002 }),
    ],
    level: 3,
    hints: [
      'The leakage flows through the pull-up, so the pin sits I·R below the supply.',
      'The pin must stay above 0.6·V_cc, so the pull-up may drop at most 0.4·V_cc.',
      'R_max = 0.4·V_cc/I. Round down, not up: a larger resistor would drop too much.',
    ],
    steps: ($, sig) => [
      String.raw`$R_{\max} = (${$.vcc} - 0.6 \times ${$.vcc})/I = ${sig(0.4 * $.vcc)}/${$.leak} = ${sig($.R)}\ \Omega$`,
      String.raw`Largest E12 value at or below: $${sig($.buy)}\ \Omega$`,
    ],
    sim: {
      scenario: 'pullup',
      setup(s) {
        s.pull = 'up';
      },
    },
    second: ($) => {
      // Bisect on R for the pin voltage V_cc − I·R to meet 0.6·V_cc.
      let lo = 0;
      let hi = 1e9;
      for (let k = 0; k < 200; k += 1) {
        const mid = (lo + hi) / 2;
        if ($.vcc - $.leak * mid > MCU.vih * $.vcc) lo = mid;
        else hi = mid;
      }
      const R = (lo + hi) / 2;
      const all = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7].flatMap((d) => E12.map((m) => Number((m * d).toPrecision(3))));
      return { R, buy: Math.max(...all.filter((v) => v <= R * (1 + 1e-9))) };
    },
    cases: [
      kase('ATmega328P datasheet, DC characteristics: V_IH 0.6·V_CC, input leakage 1 µA', { vcc: 5, leak: 1e-6 }, { R: 2e6, buy: 1.8e6 }),
      kase('hand', { vcc: 3.3, leak: 10e-6 }, { R: 132e3, buy: 120e3 }),
    ],
  }),

  problem({
    id: 'u3.concept-float',
    title: 'The button that presses itself',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'button',
    src: 'ATmega328P datasheet',
    topics: ['pullup', 'inputs'],
    principles: ['floating'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'A button runs from an input pin to 0 V, with nothing else on the pin. The program sees presses when nobody touches it, and a meter on the pin reads about 2.5 V. What is wrong?'],
        [2, 'An input has a 1 MΩ pull-up to 5 V and a button to 0 V. It usually reads high, but misreads when a motor cable runs nearby. What fixes it?'],
        [3, 'A button input has a 100 Ω pull-up. It reads correctly, but the battery runs down fast while the button is held. Why?'],
      ),
    },
    text: (T) => T.q,
    parts: [
      pick('ans', 'the answer', [
        ['float', 'The pin floats: add a pull-up to 5 V (or turn on the chip’s own)', 'Right for the phantom presses: joined to nothing, the pin drifts with stray pickup near half the supply, where the chip may read either way.'],
        ['stronger', 'Use a smaller pull-up, such as 10 kΩ', 'Right for the misreads: 1 MΩ is no match for the stray coupling. 10 kΩ holds the pin a hundred times more firmly.'],
        ['waste', 'Held, the pull-up has the whole supply across it', 'Right for the drained battery: 5 V across 100 Ω is 50 mA and 250 mW, for as long as the button is held.'],
        ['button', 'The button is broken', 'A broken button would read one way all the time. A reading that wanders with nothing touched is a floating input.'],
      ], ($) => ({ 1: 'float', 2: 'stronger', 3: 'waste' }[$.q])),
    ],
    level: 1,
    hints: [
      'An input pin draws almost no current, so something must give it a voltage when the button is open.',
      'A pull resistor must be much smaller than any stray path, but not so small that it wastes power when the button is held.',
    ],
    steps: ($) => [{ 1: 'Floating input: add a pull-up.', 2: 'The pull-up is too weak: use 10 kΩ.', 3: 'V²/R across the pull-up while held.' }[$.q]],
    sim: { scenario: 'float', setup() {} },
    second: ($) => ({ ans: ['float', 'stronger', 'waste'][$.q - 1] }),
    cases: [
      kase('ATmega328P datasheet, I/O ports: an input with no pull-up has no defined level', { q: 1 }, { ans: 'float' }),
      kase('hand', { q: 3 }, { ans: 'waste' }),
    ],
  }),

  problem({
    id: 'u3.concept-divider',
    title: 'Ratio, side and load',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'divider',
    src: 'Kuphaldt §I.6',
    topics: ['divider', 'loading'],
    principles: ['ratio', 'loading-div', 'sensor-side'],
    variety: ['unknown'],
    vars: {
      q: choice(
        [1, 'Two 1 MΩ resistors divide 5 V, and a meter shows 2.50 V. A 1 kΩ LED driver input is connected to the output. What happens?'],
        [2, 'An LDR sits between 5 V and the output, a fixed resistor below. As the room gets darker, what does the output do?'],
        [3, 'A divider of 10 kΩ and 10 kΩ gives 2.50 V. You rebuild it with 100 kΩ and 100 kΩ. With nothing attached, what is the output?'],
      ),
    },
    text: (T) => T.q,
    parts: [
      pick('ans', 'the answer', [
        ['collapses', 'The output collapses toward 0 V', 'Right for the 1 kΩ load: in parallel with 1 MΩ it leaves under 1 kΩ, a tiny share of 5 V. A divider can only drive loads much larger than itself.'],
        ['falls', 'It falls', 'Right for the LDR on top: darker means more resistance above the output, so the output’s share of 5 V shrinks.'],
        ['same', 'The same 2.50 V', 'Right for the bigger pair: the output depends on the ratio, and 1 : 1 is still 1 : 1.'],
        ['rises', 'It rises', 'That is the LDR below the output. Above it, more resistance pulls the output down.'],
      ], ($) => ({ 1: 'collapses', 2: 'falls', 3: 'same' }[$.q])),
    ],
    level: 2,
    hints: [
      'A divider’s output is the lower part’s share of the supply.',
      'A load joins the lower part in parallel.',
    ],
    steps: ($) => [{ 1: '1 MΩ ∥ 1 kΩ ≈ 1 kΩ against 1 MΩ: about 5 mV.', 2: 'More resistance above: lower output.', 3: 'Same ratio, same output.' }[$.q]],
    sim: { scenario: 'pot100', setup() {} },
    second: ($) => ({ ans: ['collapses', 'falls', 'same'][$.q - 1] }),
    cases: [
      kase('Kuphaldt §I.6, voltage dividers: the output depends on the ratio', { q: 3 }, { ans: 'same' }),
      kase('hand', { q: 2 }, { ans: 'falls' }),
    ],
  }),

  problem({
    id: 'u3.concept-pull',
    title: 'Up or down?',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'button',
    src: 'ATmega328P datasheet',
    topics: ['pullup'],
    principles: ['floating', 'pull-size'],
    variety: ['unknown'],
    vars: {
      q: choice(
        [1, 'A button connects the pin to 0 V, with a pull-up to 5 V. What does the program read while the button is pressed?'],
        [2, 'A button connects the pin to 5 V. Which pull resistor does the pin need?'],
        [3, 'You want a button with no extra resistor on the board. What can the ATmega328P do?'],
      ),
    },
    text: (T) => T.q,
    parts: [
      pick('ans', 'the answer', [
        ['low', 'Low: pressed reads 0', 'Right with a pull-up: the button pulls the pin to 0 V, so pressed is low. Programs often invert it.'],
        ['down', 'A pull-down to 0 V', 'Right for a button to 5 V: the pin must sit low until the button pulls it high.'],
        ['internal', 'Turn on its own 20–50 kΩ pull-up in software', 'Right: each pin has an internal pull-up you switch on. Wire the button to 0 V.'],
        ['high', 'High: pressed reads 1', 'With a pull-up, the pin is already high when the button is open. The button pulls it low.'],
      ], ($) => ({ 1: 'low', 2: 'down', 3: 'internal' }[$.q])),
    ],
    level: 1,
    hints: [
      'The pull resistor sets the reading when the button is open; the button sets it when closed.',
      'The pull resistor goes to the rail the button does not.',
    ],
    steps: ($) => [{ 1: 'Pull-up, button to 0 V: pressed is low.', 2: 'Button to 5 V: pull-down.', 3: 'The internal pull-up.' }[$.q]],
    sim: { scenario: 'pressed', setup() {} },
    second: ($) => ({ ans: ['low', 'down', 'internal'][$.q - 1] }),
    cases: [
      kase('ATmega328P datasheet, I/O ports: each pin has a switchable internal pull-up', { q: 3 }, { ans: 'internal' }),
      kase('hand', { q: 1 }, { ans: 'low' }),
    ],
  }),
];
