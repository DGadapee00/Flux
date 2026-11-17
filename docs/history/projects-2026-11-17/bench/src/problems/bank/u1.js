/**
 * Unit 1 · The bench. Templates vary by structure (a `choice` among configurations, givens or
 * unknowns), carry 2–3 staged hints, at least two named traps on every numeric part (in
 * ../coaching/u1.js), a worked case, and a second method: their lab (`sim`) or `second`.
 *
 * Worked cases are the course's own, checked against its labs; the sections they rest on are cited
 * through src/data/textbook.js. The meter, battery and USB figures are the ones the labs state.
 */
import { netOf, relaxBoard, solveBoard } from '@flux/subjects/em/breadboard.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

const E12 = [[100, '100 Ω'], [220, '220 Ω'], [330, '330 Ω'], [470, '470 Ω'], [680, '680 Ω'], [1000, '1.0 kΩ'], [1500, '1.5 kΩ'], [2200, '2.2 kΩ'], [3300, '3.3 kΩ'], [4700, '4.7 kΩ']];
const COLORS = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];
/** The three colour bands of an E12 value: first digit, second digit, multiplier. */
export function bandsText(ohms) {
  const e = Math.floor(Math.log10(ohms)) - 1;
  const two = Math.round(ohms / 10 ** e);
  return `${COLORS[Math.floor(two / 10)]}–${COLORS[two % 10]}–${COLORS[e]}`;
}
const ohm = (r) => (r >= 1000 ? `${r / 1000} kΩ` : `${r} Ω`);

const BAT = { E: 9, r: 1.5 };
const R_VOLT = 10e6;
const R_AMP = 0.5;
const AWG = { 28: 0.2129, 26: 0.1339, 24: 0.0842, 22: 0.053 };

export default [
  problem({
    id: 'u1.series',
    title: 'Two resistors in a row',
    exam: 'u1',
    ch: '1',
    lab: 'breadboard',
    src: 'Kuphaldt §I.5',
    topics: ['nets', 'ohm'],
    principles: ['strips', 'series'],
    variety: ['representation'],
    vars: {
      given: choice(['value', 'by value'], ['bands', 'by colour bands']),
      R1: choice(...E12),
      R2: choice(...E12),
    },
    derive: ($) => ({ I: (5 / ($.R1 + $.R2)) * 1000, Vmid: (5 * $.R2) / ($.R1 + $.R2) }),
    valid: ($) => $.R1 !== $.R2,
    text: (T, $) => `A 5 V supply feeds the top rails of a breadboard. A red jumper joins the + rail to row 10. R₁ ${$.given === 'bands' ? `(bands ${bandsText($.R1)})` : `= ${ohm($.R1)}`} goes from row 10 to row 14, R₂ ${$.given === 'bands' ? `(bands ${bandsText($.R2)})` : `= ${ohm($.R2)}`} from row 14 to row 18, and a black jumper joins row 18 to the − rail. Find the current from the supply in mA, and the voltage of row 14.`,
    parts: [
      num('I', ($) => $.I, 'mA', { label: 'current' }),
      num('Vmid', ($) => $.Vmid, 'V', { label: 'row 14' }),
    ],
    level: 1,
    hints: [
      'Each row is one strip: one node. Follow the path from the + rail to the − rail and list what it passes through.',
      'The two resistors carry the same current, so they add: I = V/(R₁ + R₂). Row 14 is what is left after R₁ takes its drop.',
    ],
    steps: ($, sig) => [
      String.raw`$I = 5/(${$.R1} + ${$.R2}) = ${sig($.I)}$ mA`,
      String.raw`$V_{14} = 5 - I R_1 = 5 \cdot R_2/(R_1 + R_2) = ${sig($.Vmid)}$ V`,
    ],
    sim: {
      scenario: 'series',
      setup(s, $) {
        s.R1 = $.R1;
        s.R2 = $.R2;
      },
      read: (c) => ({ I: c.I1 * 1000, Vmid: c.Vmid }),
    },
    cases: [
      kase('Kuphaldt §I.5, series circuits: the current is the supply over the total resistance; checked in the Breadboard lab', { given: 'value', R1: 1000, R2: 2200 }, { I: 1.5625, Vmid: 3.4375 }),
      kase('hand: bands brown–black–red and red–red–brown', { given: 'bands', R1: 1000, R2: 220 }, { I: 4.0984, Vmid: 0.90164 }),
    ],
  }),

  problem({
    id: 'u1.jumper',
    title: 'A stray jumper',
    exam: 'u1',
    ch: '1',
    lab: 'breadboard',
    src: 'Kuphaldt §I.5',
    topics: ['nets'],
    principles: ['strips', 'short'],
    variety: ['unknown'],
    vars: {
      q: choice(['I', 'the current from the supply'], ['V', 'the voltage of row 14']),
      R1: choice(...E12),
      R2: choice(...E12),
    },
    derive: ($) => ({ ans: $.q === 'I' ? (5 / $.R1) * 1000 : 0, before: (5 / ($.R1 + $.R2)) * 1000 }),
    text: (T, $) => `On a 5 V breadboard, R₁ = ${ohm($.R1)} runs from row 10 (joined to the + rail) to row 14, and R₂ = ${ohm($.R2)} from row 14 to row 18 (joined to the − rail). A stray jumper wire lands with one end in row 14 and the other in row 18. Find ${T.q}${$.q === 'I' ? ', in mA' : ''}.`,
    parts: [num('ans', ($) => $.ans, ($) => ($.q === 'I' ? 'mA' : 'V'), { label: 'the answer', abs: 1e-4 })],
    level: 2,
    hints: [
      'A jumper has almost no resistance. Which two rows does it join, and what else joins them?',
      'Rows 14 and 18 are now one node at 0 V, so R₂ has no voltage across it. Only R₁ is left in the path.',
    ],
    steps: ($, sig) => [
      $.q === 'I'
        ? String.raw`$R_2$ is shorted: $I = 5/${$.R1} = ${sig($.ans)}$ mA, up from $${sig($.before)}$ mA`
        : String.raw`Row 14 is joined to row 18, which is joined to the − rail: $V_{14} = 0$ V`,
    ],
    sim: {
      scenario: 'jumper',
      setup(s, $) {
        s.R1 = $.R1;
        s.R2 = $.R2;
        s.asked = $.q;
      },
      read: (c, s) => ({ ans: s.asked === 'V' ? (Math.abs(c.Vmid) < 1e-6 ? 0 : c.Vmid) : c.I1 * 1000 }),
    },
    cases: [
      kase('Kuphaldt §I.5: a short in a series circuit removes that resistance from the path; checked in the Breadboard lab', { q: 'I', R1: 1000, R2: 2200 }, { ans: 5 }),
      kase('hand', { q: 'V', R1: 470, R2: 1000 }, { ans: 0 }),
    ],
  }),

  problem({
    id: 'u1.loading',
    title: 'What the voltmeter reads',
    exam: 'u1',
    ch: '1',
    lab: 'meter',
    src: 'Kuphaldt §I.8',
    topics: ['voltmeter', 'meter'],
    principles: ['loading'],
    variety: ['unknown'],
    vars: {
      q: choice(['read', 'the meter reading'], ['err', 'the meter’s error, in percent']),
      R: choice([1000, '1 kΩ'], [10000, '10 kΩ'], [100000, '100 kΩ'], [1000000, '1 MΩ']),
    },
    derive: ($) => {
      // The meter's 10 MΩ in parallel with R₂; the battery's 1.5 Ω in the chain.
      const Rp = ($.R * R_VOLT) / ($.R + R_VOLT);
      const read = (BAT.E * Rp) / ($.R + Rp + BAT.r);
      const ideal = (BAT.E * $.R) / (2 * $.R + BAT.r);
      return { Rp, read, ideal, err: ((read - ideal) / ideal) * 100 };
    },
    text: (T) => `A 9 V battery (internal resistance 1.5 Ω) drives two equal ${T.R} resistors in series. A meter on DC volts, with 10 MΩ between its leads, goes across the lower resistor. Find ${T.q}.`,
    parts: [num('ans', ($) => ($.q === 'read' ? $.read : $.err), ($) => ($.q === 'read' ? 'V' : '%'), { label: 'the answer', tol: 0.002, abs: 1e-4 })],
    level: 2,
    hints: [
      'A voltmeter is a resistor too: its 10 MΩ sits in parallel with the resistor it is across.',
      'Combine R with 10 MΩ in parallel, then share the 9 V between the upper resistor, that pair and the battery’s 1.5 Ω.',
    ],
    steps: ($, sig) => [
      String.raw`$R \parallel 10\ \text{M}\Omega = ${sig($.Rp)}\ \Omega$`,
      String.raw`Reading $= 9 \cdot ${sig($.Rp)}/(${$.R} + ${sig($.Rp)} + 1.5) = ${sig($.read)}$ V against $${sig($.ideal)}$ V with no meter: ${sig($.err)}%`,
    ],
    sim: {
      scenario: 'volts',
      setup(s, $) {
        s.R1 = $.R;
        s.R2 = $.R;
        s.asked = $.q;
      },
      read: (c, s) => ({ ans: s.asked === 'read' ? c.value : c.error * 100 }),
    },
    cases: [
      kase('Kuphaldt §I.8, voltmeter impact on measured circuit; checked in the Multimeter lab', { q: 'read', R: 1000000 }, { ans: 4.2857 }),
      kase('hand', { q: 'err', R: 10000 }, { ans: -0.04998 }),
    ],
  }),

  problem({
    id: 'u1.ammeter-across',
    title: 'Amps across a resistor',
    exam: 'u1',
    ch: '1',
    lab: 'meter',
    src: 'Kuphaldt §I.8',
    topics: ['ammeter', 'meter'],
    principles: ['in-series', 'short'],
    variety: ['unknown'],
    vars: {
      q: choice(['meter', 'what the meter reads'], ['R1', 'the current through R₁']),
      R1: choice([1000, '1 kΩ'], [4700, '4.7 kΩ'], [10000, '10 kΩ']),
      R2: choice([1000, '1 kΩ'], [4700, '4.7 kΩ'], [10000, '10 kΩ']),
    },
    derive: ($) => {
      const Rp = (R_AMP * $.R2) / (R_AMP + $.R2);
      const I = BAT.E / ($.R1 + Rp + BAT.r);
      const meter = (I * Rp) / R_AMP;
      return { I1: I * 1000, meter: meter * 1000, true: (BAT.E / ($.R1 + $.R2 + BAT.r)) * 1000 };
    },
    text: (T) => `A 9 V battery (1.5 Ω inside) drives R₁ = ${T.R1} and R₂ = ${T.R2} in series. Someone sets their meter to milliamps (0.5 Ω between the leads) and clips the leads across R₂, as if measuring volts. Find ${T.q}, in mA.`,
    parts: [num('ans', ($) => ($.q === 'meter' ? $.meter : $.I1), 'mA', { label: 'the answer', tol: 0.005 })],
    level: 2,
    hints: [
      'On amps the meter is a 0.5 Ω resistor. Where is it, and what is it in parallel with?',
      'R₂ in parallel with 0.5 Ω is about 0.5 Ω, so R₁ alone sets the current, and almost all of it goes through the meter.',
    ],
    steps: ($, sig) => [
      String.raw`$I = 9/(R_1 + R_2 \parallel 0.5 + 1.5) = ${sig($.I1)}$ mA, against $${sig($.true)}$ mA before the meter went on`,
      String.raw`The meter takes $${sig($.meter)}$ mA of it`,
    ],
    sim: {
      scenario: 'volts',
      setup(s, $) {
        s.mode = 'A';
        s.R1 = $.R1;
        s.R2 = $.R2;
        s.asked = $.q;
      },
      read: (c, s) => ({ ans: s.asked === 'meter' ? c.value * 1000 : c.iR1 * 1000 }),
    },
    cases: [
      kase('Kuphaldt §I.8, ammeter use: an ammeter goes in series; checked in the Multimeter lab', { q: 'meter', R1: 10000, R2: 10000 }, { ans: 0.89982 }),
      kase('hand', { q: 'R1', R1: 1000, R2: 4700 }, { ans: 8.9819 }),
    ],
  }),

  problem({
    id: 'u1.fuse',
    title: 'Amps across the battery',
    exam: 'u1',
    ch: '1',
    lab: 'meter',
    src: 'Kuphaldt §I.8',
    topics: ['ammeter', 'safety'],
    principles: ['in-series'],
    variety: ['configuration'],
    vars: {
      src: choice(['nine', 'a 9 V battery with 1.5 Ω inside'], ['aa', 'two AA cells in series, 3.0 V with 0.3 Ω inside']),
    },
    derive: ($) => {
      const E = $.src === 'nine' ? 9 : 3;
      const r = $.src === 'nine' ? 1.5 : 0.3;
      const I = E / (r + R_AMP);
      return { E, r, I, blows: I > 0.2 ? 'yes' : 'no' };
    },
    text: (T) => `A meter set to milliamps has 0.5 Ω between its leads and a 0.2 A fuse. Its leads go straight across ${T.src}. What current tries to flow, and does the fuse blow?`,
    parts: [
      num('I', ($) => $.I, 'A', { label: 'current' }),
      pick('blows', 'does the fuse blow?', [
        ['yes', 'Yes', 'Right: amps or more against a 0.2 A fuse. An ammeter across a source is a short circuit.'],
        ['no', 'No', 'The current is many times the fuse’s rating. Only the source’s own small resistance and the meter’s 0.5 Ω limit it.'],
      ], ($) => $.blows),
    ],
    level: 1,
    hints: [
      'On amps the meter is just 0.5 Ω. Across the source, the only other resistance is inside the source.',
      'I = E/(r + 0.5 Ω). Compare it with 0.2 A.',
    ],
    steps: ($, sig) => [String.raw`$I = ${$.E}/(${$.r} + 0.5) = ${sig($.I)}$ A, against a 0.2 A fuse: it blows`],
    second: ($) => {
      // The same short solved on the board: source, internal resistance and meter.
      const parts = [
        { id: 'S', type: 'V', a: 'T-1', b: 'T+1', value: $.E, r: $.r },
        { id: 'M', type: 'R', a: 'T+5', b: 'T-5', value: R_AMP },
      ];
      const I = relaxBoard(parts, { ground: netOf('T-1') }).I.M;
      return { I, blows: I > 0.2 ? 'yes' : 'no' };
    },
    cases: [
      kase('Kuphaldt §I.8 and §I.3: an ammeter across a voltage source is a short circuit; checked in the Multimeter lab', { src: 'nine' }, { I: 4.5, blows: 'yes' }),
      kase('hand', { src: 'aa' }, { I: 3.75, blows: 'yes' }),
    ],
  }),

  problem({
    id: 'u1.ohms-in-circuit',
    title: 'Ohms in a circuit',
    exam: 'u1',
    ch: '1',
    src: 'Kuphaldt §VI.2',
    topics: ['ohmmeter', 'meter'],
    principles: ['parallel-path'],
    variety: ['unknown'],
    vars: {
      q: choice(['read', 'what the meter reads'], ['R3', 'the hidden resistor R₃, from the reading']),
      R2: choice([1000, '1 kΩ'], [2200, '2.2 kΩ'], [4700, '4.7 kΩ'], [10000, '10 kΩ']),
      R3: choice([1000, '1 kΩ'], [2200, '2.2 kΩ'], [4700, '4.7 kΩ'], [10000, '10 kΩ']),
    },
    derive: ($) => {
      const read = ($.R2 * $.R3) / ($.R2 + $.R3);
      return { read, ans: $.q === 'read' ? read : $.R3 };
    },
    valid: ($) => $.R2 !== $.R3,
    text: (T, $, sig) => ($.q === 'read'
      ? `With the power off, a meter on ohms is clipped across R₂ = ${T.R2}, between rows 14 and 18. Another resistor, R₃ = ${T.R3}, also joins rows 14 and 18 elsewhere on the board. What does the meter read, in ohms?`
      : `With the power off, a meter on ohms is clipped across R₂ = ${T.R2}, between rows 14 and 18. It reads ${sig(($.R2 * $.R3) / ($.R2 + $.R3))} Ω. Some other resistor R₃ must also join those two rows. What is it, in ohms?`),
    parts: [num('ans', ($) => $.ans, 'Ω', { label: 'the answer' })],
    level: 3,
    hints: [
      'An ohmmeter pushes its own small current between its leads and measures the voltage it makes. It cannot tell which path the current took.',
      'Two paths between the same two rows are in parallel: 1/R = 1/R₂ + 1/R₃.',
    ],
    steps: ($, sig) => [$.q === 'read'
      ? String.raw`$R_2 \parallel R_3 = ${sig($.read)}\ \Omega$. Lift one leg of R₂ to measure it alone.`
      : String.raw`$1/R_3 = 1/R_{\text{read}} - 1/R_2$, so $R_3 = ${sig($.R3)}\ \Omega$`],
    second: ($) => {
      // The ohmmeter on the board: a 1 V source behind 10 kΩ, solved by nodal analysis. For R₃, try
      // each candidate on the board and keep the one that gives the reading.
      const reading = (R3) => {
        const parts = [
          { id: 'M', type: 'V', a: 'a18', b: 'a14', value: 1, r: 10000 },
          { id: 'R2', type: 'R', a: 'd14', b: 'd18', value: $.R2 },
          { id: 'R3', type: 'R', a: 'f14', b: 'f18', value: R3 },
          { id: 'w1', type: 'W', a: 'e14', b: 'f14' },
          { id: 'w2', type: 'W', a: 'e18', b: 'f18' },
        ];
        const v = solveBoard(parts, { ground: netOf('a18') }).V[netOf('a14')];
        return (10000 * v) / (1 - v);
      };
      if ($.q === 'read') return { ans: reading($.R3) };
      // Bisect for R₃ on a log scale between 1 Ω and 1 MΩ: the reading grows with R₃.
      const target = ($.R2 * $.R3) / ($.R2 + $.R3);
      let lo = 0;
      let hi = 6;
      for (let k = 0; k < 80; k += 1) {
        const mid = (lo + hi) / 2;
        if (reading(10 ** mid) < target) lo = mid;
        else hi = mid;
      }
      return { ans: 10 ** ((lo + hi) / 2) };
    },
    cases: [
      kase('Kuphaldt §VI.2, ohmmeter usage: measure a part out of circuit, or it reads every path in parallel', { q: 'read', R2: 10000, R3: 4700 }, { ans: 3197.3 }),
      kase('hand', { q: 'R3', R2: 2200, R3: 1000 }, { ans: 1000 }),
    ],
  }),

  problem({
    id: 'u1.cable',
    title: 'Voltage at the rails',
    exam: 'u1',
    ch: '1',
    lab: 'usb-rail',
    src: 'USB 2.0 §7.2',
    topics: ['usb', 'supply'],
    principles: ['ir-drop'],
    variety: ['configuration'],
    vars: {
      awg: choice([28, '28 AWG'], [26, '26 AWG'], [24, '24 AWG'], [22, '22 AWG']),
      len: range(0.3, 2, 0.1, 'm'),
      RL: choice([5, '5 Ω'], [10, '10 Ω'], [25, '25 Ω'], [50, '50 Ω']),
    },
    derive: ($) => {
      const Rc = 2 * $.len * AWG[$.awg];
      const I = 5.1 / ($.RL + 0.1 + Rc);
      return { Rc, I, V: I * $.RL };
    },
    text: (T, $) => `A power bank makes 5.10 V behind 0.1 Ω. A USB cable ${T.len} long, with ${T.awg} copper wires (${AWG[$.awg]} Ω per metre each, and two of them), feeds a breadboard whose load is ${T.RL}. Find the voltage on the rails.`,
    parts: [num('V', ($) => $.V, 'V', { label: 'rail voltage', tol: 0.002 })],
    level: 1,
    hints: [
      'The current leaves on one wire and returns on the other, so the cable adds both wires’ resistance.',
      'I = E/(R_L + r + R_cable); the rails get I·R_L.',
    ],
    steps: ($, sig) => [
      String.raw`$R_{\text{cable}} = 2 \times ${$.len} \times ${AWG[$.awg]} = ${sig($.Rc)}\ \Omega$`,
      String.raw`$I = 5.10/(${$.RL} + 0.1 + ${sig($.Rc)}) = ${sig($.I)}$ A, so $V = I R_L = ${sig($.V)}$ V`,
    ],
    sim: {
      scenario: 'leds',
      setup(s, $) {
        s.src = 'bank';
        s.len = $.len;
        s.awg = $.awg;
        s.mA = (5 / $.RL) * 1000;
      },
      read: (c) => ({ V: c.Vrail }),
    },
    cases: [
      kase('USB 2.0 §7.2 sets 4.75–5.25 V at the port; AWG table for 28 AWG copper; checked in the USB power lab', { awg: 28, len: 1, RL: 5 }, { V: 4.6147 }),
      kase('hand', { awg: 22, len: 1, RL: 5 }, { V: 4.8983 }),
    ],
  }),

  problem({
    id: 'u1.bank-life',
    title: 'How long a power bank lasts',
    exam: 'u1',
    ch: '1',
    lab: 'usb-rail',
    src: 'Kuphaldt §I.11',
    topics: ['supply'],
    principles: ['energy'],
    variety: ['representation'],
    vars: {
      given: choice(['mah', 'in mAh at the cell’s 3.7 V'], ['wh', 'in watt-hours']),
      cap: choice([5000, '5,000'], [10000, '10,000'], [20000, '20,000']),
      P: range(0.25, 5, 0.25, 'W'),
    },
    derive: ($) => {
      const Wh = ($.cap / 1000) * 3.7;
      return { Wh, h: (Wh * 0.85) / $.P };
    },
    text: (T, $, sig) => `A power bank is labelled ${$.given === 'mah' ? `${T.cap} mAh (its cell runs at 3.7 V)` : `${sig(($.cap / 1000) * 3.7)} Wh`}. It turns 85% of its stored energy into 5 V output. A project draws ${T.P} from it. How many hours does it run?`,
    parts: [num('h', ($) => $.h, 'h', { label: 'run time' })],
    level: 2,
    hints: [
      'Work in energy. A bank’s mAh are counted at its cell’s 3.7 V, not at 5 V: watt-hours = Ah × 3.7 V.',
      'Only 85% of that reaches the output. Hours = usable watt-hours ÷ watts drawn.',
    ],
    steps: ($, sig) => [
      String.raw`Stored: $${sig($.Wh)}$ Wh; usable: $0.85 \times ${sig($.Wh)} = ${sig($.Wh * 0.85)}$ Wh`,
      String.raw`$t = ${sig($.Wh * 0.85)}/${$.P} = ${sig($.h)}$ h`,
    ],
    second: ($) => {
      // Step the stored energy down a minute at a time.
      let E = ($.cap / 1000) * 3.7 * 0.85 * 3600;
      const step = $.P * 60;
      let t = 0;
      while (E > step) {
        E -= step;
        t += 60;
      }
      return { h: (t + E / $.P) / 3600 };
    },
    cases: [
      kase('Kuphaldt §I.11, battery capacity in amp-hours; a 10,000 mAh bank at 3.7 V holds 37 Wh', { given: 'mah', cap: 10000, P: 0.5 }, { h: 62.9 }),
      kase('hand', { given: 'wh', cap: 20000, P: 4 }, { h: 15.725 }),
    ],
  }),

  problem({
    id: 'u1.concept-strips',
    title: 'Which holes are joined?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'breadboard',
    src: 'Kuphaldt §VI.1',
    topics: ['breadboard'],
    principles: ['strips'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'On a breadboard, are holes c12 and e12 connected?'],
        [2, 'Are holes e12 and f12, on either side of the centre channel, connected?'],
        [3, 'A resistor goes in with one leg in b20 and the other in d20. What current flows through it?'],
      ),
    },
    text: (T) => T.q,
    parts: [
      {
        id: 'ans',
        kind: 'choice',
        label: 'the answer',
        multi: false,
        options: ($) => ($.q === 3
          ? [
            { value: 'zero', label: 'None: it is bypassed', why: 'Right: b20 and d20 are in one strip, so both legs sit at the same voltage and no current flows through the resistor.' },
            { value: 'full', label: 'The usual V/R, as if it were wired in', why: 'Both legs are in the same a–e strip, so there is no voltage across it. A part only works when its legs are in different strips.' },
          ]
          : [
            { value: 'joined', label: 'Joined', why: $.q === 1 ? 'Right: holes a–e in one row are one metal strip.' : 'The centre channel splits every row in two: a–e on one side, f–j on the other.' },
            { value: 'separate', label: 'Separate', why: $.q === 2 ? 'Right: the channel splits the row, so e12 and f12 are on different strips. That is why a chip straddles the channel.' : 'Holes a–e in one row are one strip: c12 and e12 are joined.' },
          ]),
        correct: ($) => ({ 1: 'joined', 2: 'separate', 3: 'zero' }[$.q]),
      },
    ],
    level: 1,
    hints: [
      'Each row is two strips of five: a–e on one side of the channel, f–j on the other.',
      'A part only does something if its legs are in different strips.',
    ],
    steps: ($) => [{ 1: 'c12 and e12 are in the same a–e strip: joined.', 2: 'The channel separates e12 from f12: not joined.', 3: 'b20 and d20 share a strip: the resistor is bypassed.' }[$.q]],
    sim: { scenario: 'along', setup() {} },
    second: ($) => {
      const same = { 1: ['c12', 'e12'], 2: ['e12', 'f12'], 3: ['b20', 'd20'] }[$.q];
      const one = netOf(same[0]) === netOf(same[1]);
      return { ans: $.q === 3 ? (one ? 'zero' : 'full') : one ? 'joined' : 'separate' };
    },
    cases: [
      kase('Kuphaldt §VI.1: breadboard strips', { q: 2 }, { ans: 'separate' }),
      kase('hand', { q: 3 }, { ans: 'zero' }),
    ],
  }),

  problem({
    id: 'u1.concept-meter',
    title: 'How does the meter go in?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'meter',
    src: 'Kuphaldt §VI.2',
    topics: ['meter'],
    principles: ['in-series', 'loading'],
    variety: ['unknown'],
    vars: {
      q: choice(
        [1, 'You want the voltage across a resistor. How does the meter connect?'],
        [2, 'You want the current through a resistor. How does the meter connect?'],
        [3, 'You want a resistor’s resistance while it sits in a working circuit. What do you do first?'],
      ),
    },
    text: (T) => T.q,
    parts: [
      pick('ans', 'the answer', [
        ['across', 'Leads on either side of the part, circuit untouched', 'That is the voltmeter: across the part. On amps this would short the part, and across a source it would blow the fuse.'],
        ['series', 'Break the circuit and let the meter close the gap', 'That is the ammeter: in series, so the current passes through it. Move the red lead to the mA jack too.'],
        ['off', 'Turn the power off and lift one leg of the part', 'That is the ohmmeter: it uses its own test current, so the circuit must be dead, and other paths must be out of the way.'],
      ], ($) => ({ 1: 'across', 2: 'series', 3: 'off' }[$.q])),
    ],
    level: 1,
    hints: [
      'A voltmeter compares two points; it takes almost no current, so it goes across.',
      'An ammeter must carry the current it measures, so the current has to pass through it.',
    ],
    steps: ($) => [{ 1: 'Volts: across.', 2: 'Amps: in series.', 3: 'Ohms: power off, part out of circuit.' }[$.q]],
    sim: { scenario: 'volts', setup() {} },
    second: ($) => ({ ans: ['across', 'series', 'off'][$.q - 1] }),
    cases: [
      kase('Kuphaldt §VI.2, voltmeter, ammeter and ohmmeter usage', { q: 2 }, { ans: 'series' }),
      kase('hand', { q: 3 }, { ans: 'off' }),
    ],
  }),

  problem({
    id: 'u1.concept-usb',
    title: 'Keeping the rails up',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'usb-rail',
    src: 'USB 2.0 §7.2',
    topics: ['usb'],
    principles: ['ir-drop'],
    variety: ['unknown'],
    vars: {
      q: choice(
        [1, 'Your rails read 4.6 V under load from a power bank. Which change raises them most?'],
        [2, 'A servo works from a wall charger but stutters from a laptop’s USB 2.0 port. Why?'],
        [3, 'The meter reads 5.08 V at the power bank and 4.62 V on the rails with the motor running. Where did 0.46 V go?'],
      ),
    },
    text: (T) => T.q,
    parts: [
      pick('ans', 'the answer', [
        ['cable', 'A shorter, thicker cable', 'Right for the sagging rails: the cable’s resistance is most of the drop, and 22 AWG has a quarter of 28 AWG’s.'],
        ['limit', 'The port is only good for 500 mA', 'Right for the servo: USB 2.0 promises 500 mA. A servo’s peaks go past that, and the port limits or droops.'],
        ['wires', 'Across the cable’s two wires, as I·R', 'Right for the missing volts: the current through the cable’s resistance drops voltage on the way out and on the way back.'],
        ['bank', 'A bigger power bank', 'A bigger bank lasts longer but makes the same 5 V behind the same resistance. Capacity is not voltage.'],
      ], ($) => ({ 1: 'cable', 2: 'limit', 3: 'wires' }[$.q])),
    ],
    level: 2,
    hints: [
      'Every resistance between the source and the rails takes a drop of I·R.',
      'A source has two limits: its voltage and the current it is rated for.',
    ],
    steps: ($) => [{ 1: 'Cut the cable’s resistance.', 2: 'USB 2.0 ports supply up to 500 mA.', 3: 'I × R_cable, both wires.' }[$.q]],
    sim: { scenario: 'motor', setup() {} },
    second: ($) => ({ ans: ['cable', 'limit', 'wires'][$.q - 1] }),
    cases: [
      kase('USB 2.0 §7.2: a port supplies up to 500 mA', { q: 2 }, { ans: 'limit' }),
      kase('hand', { q: 1 }, { ans: 'cable' }),
    ],
  }),
];
