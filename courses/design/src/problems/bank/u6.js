/**
 * Unit 6 bank: valves and boards. Original problems, written for the Valve and Ground return labs,
 * with staged hints and named traps (../coaching/u6.js), each checked against its lab (`sim`).
 */
import { COPPER, groundClosed, motorSteady, traceResistance, valveFlow } from '@flux/subjects/design/instruments.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
export const flow = ($) => valveFlow({ H0: 4, a: 0.004, k: $.dp10 / 100, KvMax: 10, kind: 'linear', x: $.x }).Q;
export const motorRpm = ($) => (motorSteady({ V: Number($.V), R: 2, k: 0.02, load: $.load }).w * 60) / (2 * Math.PI);
export const boardError = ($) => {
  const Rsh = traceResistance($.L, $.w, COPPER.oz1 * Number($.oz));
  return groundClosed({ I: $.I, Rgs: 0.005, Rsh, layout: 'shared' }).error * 1000;
};

export default [
  problem({
    id: 'u6.1.valve-flow',
    title: 'Flow through a throttled valve',
    exam: 'u6',
    ch: '6',
    lab: 'valve',
    src: 'Flux, written for the Valve lab',
    topics: ['valve'],
    principles: ['installed-characteristic'],
    vars: { line: choice(['cooling', 'a cooling-water loop'], ['wash', 'a wash-water line'], ['feed', 'a boiler feed line']), x: range(0.5, 1, 0.1, ''), dp10: range(0.5, 3, 0.5, 'bar') },
    text: (T, $) => String.raw`In ${T.line} a pump gives $4 - 0.004\,Q^2$ bar (Q in m³/h). The pipe loses ${$.dp10} bar at 10 m³/h, rising as $Q^2$. A linear valve with $K_v = 10$ m³/h fully open is ${Math.round($.x * 100)}% open, so $K_v = ${Math.round(100 * $.x) / 10}$. What is the flow?`,
    parts: [num('Q', ($) => flow($), 'm³/h', { label: 'flow' })],
    level: 3,
    hints: ['The valve drops $(Q/K_v)^2$ bar; the pipe $k Q^2$ with $k = \\Delta p_{10}/100$.', 'Set the pump equal to the losses: $4 - 0.004Q^2 = kQ^2 + (Q/K_v)^2$, and solve for $Q$.'],
    steps: ($, sig) => [String.raw`$Q = \sqrt{4/(0.004 + ${sig($.dp10 / 100)} + 1/${Math.round(100 * $.x) / 10}^2)} = ${sig(flow($))}$ m³/h.`],
    sim: {
      scenario: 'long',
      setup(s, $) {
        Object.assign(s, { kind: 'linear', x: $.x, dp10: $.dp10 });
      },
      read: (c) => ({ Q: c.Q }),
    },
    cases: [kase('Long pipe, half open', { line: 'cooling', x: 0.5, dp10: 3 }, { Q: 7.352 })],
  }),

  problem({
    id: 'u6.2.half-open',
    title: 'Half open, half the flow?',
    exam: 'u6',
    ch: '6',
    kind: 'conceptual',
    lab: 'valve',
    src: 'Flux, written for the Valve lab',
    topics: ['valve'],
    principles: ['installed-characteristic'],
    vars: { pipe: choice(['short', 'a short pipe that takes little of the pressure'], ['long', 'a long pipe that takes most of the pressure']) },
    text: (T) => `A linear valve sits in ${T.pipe}. Closed from fully open to half open, how much of the full flow still passes?`,
    parts: [
      pick('share', 'at half open', [
        ['about-half', 'roughly half to two thirds', 'The valve has authority: it takes much of the drop, so closing it cuts the flow.'],
        ['most', 'most of it, over 70%', 'The pipe dominates: adding valve resistance barely changes the system’s total.'],
      ], ($) => ($.pipe === 'short' ? 'about-half' : 'most')),
    ],
    level: 2,
    hints: ['The flow is set by the whole system’s resistance, pipe plus valve.', 'If the pipe is most of it, how much does a half-closed valve add?'],
    steps: ($) => [$.pipe === 'short' ? 'The valve is most of the resistance, so half open passes about 61% here.' : 'The pipe is most of the resistance, so half open still passes about 77%.'],
    sim: {
      scenario: 'short',
      setup(s, $) {
        Object.assign(s, { kind: 'linear', x: 0.5, dp10: $.pipe === 'short' ? 0.4 : 3 });
      },
      read: (c) => ({ share: c.share > 0.7 ? 'most' : 'about-half' }),
    },
    cases: [kase('A long pipe', { pipe: 'long' }, { share: 'most' })],
  }),

  problem({
    id: 'u6.3.ground-error',
    title: 'A sensor that reads the motor',
    exam: 'u6',
    ch: '6',
    lab: 'board',
    src: 'Flux, written for the Ground return lab',
    topics: ['board'],
    principles: ['ground-return'],
    vars: { oz: choice(['1', '1 oz (35 μm)'], ['2', '2 oz (70 μm)']), I: range(0.5, 3, 0.5, 'A'), w: range(0.3, 2, 0.1, 'mm'), L: range(20, 100, 10, 'mm') },
    text: (T, $) => String.raw`A motor's ${T.I} return shares ${T.L} of ${T.w} wide, ${T.oz} copper with the ground of a sensor chip that reads out against its own ground ($\rho = 1.68\times10^{-8}$ Ω·m). By how much does the sensor's reading shift when the motor runs?`,
    parts: [num('dV', ($) => boardError($), 'mV', { label: 'reading shift' })],
    level: 2,
    hints: ['The trace’s resistance is $\\rho L/(w t)$, with every length in metres.', 'The motor’s current through it lifts the sensor’s ground by $IR$.'],
    steps: ($, sig) => {
      const R = traceResistance($.L, $.w, COPPER.oz1 * Number($.oz));
      return [String.raw`$R = 1.68\times10^{-8} \times ${$.L / 1000}/(${$.w / 1000} \times ${35 * Number($.oz)}\times10^{-6}) = ${sig(R * 1000)}$ mΩ, so the shift is $${$.I} \times ${sig(R * 1000)} = ${sig(boardError($))}$ mV.`];
    },
    sim: {
      scenario: 'shared',
      setup(s, $) {
        Object.assign(s, { layout: 'shared', I: $.I, w: $.w, L: $.L, oz: Number($.oz) });
      },
      read: (c) => ({ dV: c.error * 1000 }),
    },
    cases: [kase('The notes’ example: 2 A, 60 mm of 0.5 mm, 1 oz', { oz: '1', I: 2, w: 0.5, L: 60 }, { dV: 115.3 })],
  }),

  problem({
    id: 'u6.4.ground-fix',
    title: 'Which change helps?',
    exam: 'u6',
    ch: '6',
    kind: 'conceptual',
    lab: 'board',
    src: 'Flux, written for the Ground return lab',
    topics: ['board'],
    principles: ['ground-return'],
    vars: { change: choice(['wider', 'the shared trace is made twice as wide'], ['star', 'the motor gets its own return straight to the connector'], ['longer', 'the shared trace is routed twice as long round a connector']) },
    text: (T) => `A motor's return current shares a thin trace with a sensor's ground, and the sensor reads 115 mV off whenever the motor runs. Then ${T.change}. What happens to the error?`,
    parts: [
      pick('effect', 'the error', [
        ['gone', 'it nearly vanishes', 'With separate returns, the sensor’s ground carries only its own tiny current.'],
        ['smaller', 'it shrinks but stays', 'Less resistance means less drop, but the motor current still flows past the sensor’s ground.'],
        ['bigger', 'it grows', 'More shared copper is more resistance in the motor’s path.'],
      ], ($) => ({ wider: 'smaller', star: 'gone', longer: 'bigger' }[$.change])),
    ],
    level: 1,
    hints: ['The error is the motor current times the resistance it shares with the sensor.', 'Which change alters that resistance, and which removes the sharing?'],
    steps: ($) => [{ wider: 'Twice the width, half the resistance: the error halves.', star: 'Nothing is shared, so the error all but vanishes.', longer: 'Twice the length, twice the resistance: the error doubles.' }[$.change]],
    sim: {
      scenario: 'shared',
      setup(s, $) {
        Object.assign(s, { layout: $.change === 'star' ? 'star' : 'shared', w: $.change === 'wider' ? 1 : 0.5, L: $.change === 'longer' ? 120 : 60 });
      },
      read: (c) => {
        const r = c.error / 0.1153;
        return { effect: r < 0.01 ? 'gone' : r < 1 ? 'smaller' : 'bigger' };
      },
    },
    cases: [kase('A star ground', { change: 'star' }, { effect: 'gone' })],
  }),
  problem({
    id: 'u6.5.motor-speed',
    title: 'Speed under load',
    exam: 'u6',
    ch: '6',
    lab: 'motor',
    src: 'Flux, written for the DC motor lab',
    topics: ['motor'],
    principles: ['motor-line'],
    vars: { V: choice(['12', '12 V'], ['6', '6 V']), load: range(0.01, 0.05, 0.005, 'N·m') },
    text: (T) => String.raw`A DC motor with a 2 Ω winding and $k = 0.02$ N·m/A (also V·s/rad) runs from ${T.V} against a load of ${T.load}. How fast does it turn, in rpm?`,
    parts: [num('rpm', ($) => motorRpm($), 'rpm', { label: 'speed' })],
    level: 2,
    hints: ['The load sets the current: $i = \\tau/k$.', 'Then $V = iR + k\\omega$ gives $\\omega$ in rad/s; multiply by $60/2\\pi$ for rpm.'],
    steps: ($, sig) => [String.raw`$i = ${$.load}/0.02 = ${sig($.load / 0.02)}$ A, $\omega = (${$.V} - ${sig($.load / 0.02)} \times 2)/0.02 = ${sig(motorRpm($) * 2 * Math.PI / 60)}$ rad/s $= ${sig(motorRpm($))}$ rpm.`],
    sim: {
      scenario: 'light',
      setup(s, $) {
        Object.assign(s, { V: Number($.V), load: $.load });
      },
      read: (c) => ({ rpm: c.rpm }),
    },
    cases: [kase('12 V, 0.02 N·m', { V: '12', load: 0.02 }, { rpm: 4775 })],
  }),

  problem({
    id: 'u6.6.pwm-change',
    title: 'Duty or frequency?',
    exam: 'u6',
    ch: '6',
    kind: 'conceptual',
    lab: 'pwm',
    src: 'Flux, written for the PWM drive lab',
    topics: ['pwm'],
    principles: ['pwm-average'],
    vars: { change: choice(['faster', 'the PWM frequency is doubled'], ['slower', 'the PWM frequency is halved'], ['duty', 'the duty cycle goes from 50% to 75%']) },
    text: (T) => `A microcontroller drives a 2 Ω coil from 12 V with PWM at 20 kHz and 50% duty, so it carries 3 A on average. Then ${T.change}. What happens to the mean current?`,
    parts: [
      pick('mean', 'the mean current', [
        ['same', 'it stays at 3 A', 'The average voltage is D V whatever the frequency, so the mean current is unchanged; only the ripple moves.'],
        ['bigger', 'it rises', 'More on-time per period raises the average voltage and so the mean current.'],
        ['smaller', 'it falls', 'Less on-time per period would lower it.'],
      ], ($) => ($.change === 'duty' ? 'bigger' : 'same')),
    ],
    level: 1,
    hints: ['The coil averages the voltage it sees.', 'Which change alters the fraction of time the pin is on?'],
    steps: ($) => [$.change === 'duty' ? 'The average voltage rises to 9 V, so the mean current rises to 4.5 A.' : 'The fraction of time on is still 50%: 6 V average, 3 A mean. Only the ripple changes.'],
    sim: {
      scenario: 'fast',
      setup(s, $) {
        Object.assign(s, { D: $.change === 'duty' ? 0.75 : 0.5, logf: Math.log10($.change === 'faster' ? 40000 : $.change === 'slower' ? 10000 : 20000) });
      },
      read: (c) => ({ mean: Math.abs(c.meanI - 3) < 1e-6 ? 'same' : c.meanI > 3 ? 'bigger' : 'smaller' }),
    },
    cases: [kase('Doubling the frequency', { change: 'faster' }, { mean: 'same' })],
  }),

  problem({
    id: 'u6.7.dip-estimate',
    title: 'L di/dt',
    exam: 'u6',
    ch: '6',
    lab: 'decoupling',
    src: 'Flux, written for the Decoupling lab',
    topics: ['decoupling'],
    principles: ['decoupling'],
    vars: { chip: choice(['mcu', 'a microcontroller'], ['fpga', 'a logic chip'], ['radio', 'a radio chip']), dI: range(0.05, 0.3, 0.05, 'A'), tr: range(5, 50, 5, 'ns', 1e-9) },
    text: (T) => String.raw`${T.chip.replace(/^a/, 'A')} steps its supply current by ${T.dI} in ${T.tr}. With no capacitor nearby, the current must come through 50 nH of trace. Roughly how far does its supply dip?`,
    parts: [num('dV', ($) => ((50e-9 * $.dI) / $.tr) * 1000, 'mV', { label: 'supply dip' })],
    level: 1,
    hints: ['The voltage across an inductance is $L\\,di/dt$.', 'Here $di/dt = \\Delta I/t_r$; keep nH as $10^{-9}$ H and ns as $10^{-9}$ s.'],
    steps: ($, sig) => [String.raw`$\Delta V = 50\times10^{-9} \times ${$.dI}/${sig($.tr)} = ${sig(((50e-9 * $.dI) / $.tr) * 1000)}$ mV.`],
    sim: {
      scenario: 'none',
      setup(s, $) {
        Object.assign(s, { cap: 'none', dI: $.dI, trNs: $.tr * 1e9 });
      },
      read: (c) => ({ dV: c.estimate * 1000 }),
    },
    cases: [kase('The notes’ example: 0.1 A in 10 ns', { chip: 'mcu', dI: 0.1, tr: 10 }, { dV: 500 })],
  }),

  problem({
    id: 'u6.8.cap-placement',
    title: 'Will the chip stay up?',
    exam: 'u6',
    ch: '6',
    kind: 'conceptual',
    lab: 'decoupling',
    src: 'Flux, written for the Decoupling lab',
    topics: ['decoupling'],
    principles: ['decoupling'],
    vars: { setup: choice(['none', 'no capacitor near the chip'], ['close', 'a 100 nF ceramic 2 mm from the chip']) },
    text: (T) => `A 3.3 V chip that resets below 3.0 V steps its current by 0.1 A in 10 ns. Its regulator is 50 mm away, and there is ${T.setup}. Does its supply stay above 3.0 V?`,
    parts: [
      pick('ok', 'the supply', [
        ['yes', 'stays above 3.0 V', 'A nearby capacitor supplies the step through only a few nH.'],
        ['no', 'dips below 3.0 V', 'Through 50 nH of trace the step needs about 0.5 V, more than the 0.3 V of room.'],
      ], ($) => ($.setup === 'close' ? 'yes' : 'no')),
    ],
    level: 1,
    hints: ['Estimate L di/dt for the path the current must take.', 'Compare with the 0.3 V of room between 3.3 and 3.0 V.'],
    steps: ($) => [$.setup === 'close' ? 'Behind 3 nH, the step dips the supply only about 65 mV.' : '50 nH × 0.1 A / 10 ns = 0.5 V: the chip resets.'],
    sim: {
      scenario: 'none',
      setup(s, $) {
        Object.assign(s, { cap: $.setup === 'close' ? 'local' : 'none', d: 2, dI: 0.1, trNs: 10 });
      },
      read: (c) => ({ ok: c.low ? 'no' : 'yes' }),
    },
    cases: [kase('No capacitor', { setup: 'none' }, { ok: 'no' })],
  }),
];
