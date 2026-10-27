import { C, alpha, axes, begin, dot, label, line, note, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { battery, resistor, wire } from './schematic.js';
import { bindSelect, bindSlider, put, select, slider } from './widgets.js';
import { fig, si } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { LDR, MCU, adcCount } from './sensors.js';
import { bestFixed, divider, ldrLux, ldrResistance, par } from '@flux/subjects/em/sensors.js';
import { solveCircuit } from '@flux/subjects/em/mna.js';
import { nextE12Up } from '@flux/subjects/em/diode.js';

/**
 * Application lab: the light sensor of a night light. A GL5528 LDR and a fixed resistor make a
 * divider; a microcontroller's 10-bit analog input reads it, and the program turns the lamp on when
 * the reading crosses the value it has at dusk.
 *
 * It shows how to choose the fixed resistor: the geometric mean of the LDR's resistance in the two
 * lights you must tell apart gives the biggest swing in the reading, and a resistor far from it
 * squeezes the swing into a few counts. It also shows the loading limit: the ATmega328P's ADC is
 * designed for sources of about 10 kΩ or less, and the divider's own resistance, fixed ∥ LDR, must
 * stay near that.
 *
 * Numbers. GL5528 (Senba GL55 datasheet): 10–20 kΩ at 10 lux, taken as 15 kΩ; gamma 0.6; 1 MΩ dark.
 * ATmega328P (Microchip datasheet): ADC = V_in·1024/V_ref, 10 bits; sources of 10 kΩ or less. Light
 * levels are typical round figures, not measurements: a dark bedroom 1 lux, dusk 10 lux, a lit room
 * 300 lux, daylight indoors near a window 10,000 lux.
 *
 * Recompute: the divider formula. Check: nodal analysis on the circuit, and the light recovered from
 * the output voltage by inverting the LDR's law.
 */
const VS = 5;
const NIGHT = 1;
const ROOM = 300;
const FIXED = [1e3, 2.2e3, 4.7e3, 10e3, 12e3, 22e3, 47e3, 100e3, 1e6];

const SCENARIOS = [
  { id: 'ten', name: 'The LDR below a 10 kΩ resistor, room light', fixed: 10e3, pos: 'bottom', lg: Math.log10(300), onLux: 10 },
  { id: 'dusk', name: 'The same after dusk, 5 lux', fixed: 10e3, pos: 'bottom', lg: Math.log10(5), onLux: 10 },
  { id: 'meg', name: 'A 1 MΩ fixed resistor (too large)', fixed: 1e6, pos: 'bottom', lg: Math.log10(300), onLux: 10 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, fixed: sc.fixed, pos: sc.pos, lg: sc.lg, onLux: sc.onLux });
}

/** The output voltage and reading at a light level. */
export function readAt(s, lux) {
  const r = ldrResistance(LDR, lux);
  const [top, bottom] = s.pos === 'bottom' ? [s.fixed, r] : [r, s.fixed];
  const v = divider(VS, top, bottom).v;
  return { r, v, count: adcCount(v), rth: par(s.fixed, r) };
}

export default defineLab({
  id: 'nightlight',
  exam: 'u3',
  title: 'Night light',
  app: true,
  hint: 'Pick the fixed resistor. Watch the gap between the room and night readings, and the lamp at dusk.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('ten', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'lg', lo: -1, hi: 4 }),
  controls() {
    return `
      ${select('nl-fixed', 'Fixed resistor', FIXED.map((r) => [r, si(r, 'Ω')]), 10e3)}
      ${select('nl-pos', 'Where the LDR sits', [['bottom', 'below the output (reading rises in the dark)'], ['top', 'above the output (reading falls in the dark)']], 'bottom')}
      ${slider('nl-lg', 'Light now (log₁₀ lux)', 2.5, -1, 4, 0.1)}
      ${select('nl-on', 'Turn the lamp on below', [[5, '5 lux'], [10, '10 lux, dusk'], [20, '20 lux'], [50, '50 lux']], 10)}
      <p class="tiny">GL5528 LDR into an ATmega328P’s 10-bit analog input on 5 V.</p>`;
  },
  bind(api) {
    bindSelect('nl-fixed', (s, v) => { s.fixed = Number(v); }, api);
    bindSelect('nl-pos', (s, v) => { s.pos = v; }, api);
    bindSlider('nl-lg', (s, v) => { s.lg = v; }, api);
    bindSelect('nl-on', (s, v) => { s.onLux = Number(v); }, api);
  },
  syncControls(s) {
    put('nl-fixed', s.fixed);
    put('nl-pos', s.pos);
    put('nl-lg', Number(s.lg).toFixed(1));
    put('nl-on', s.onLux);
  },
  compute(s) {
    const lux = 10 ** s.lg;
    const now = readAt(s, lux);
    const room = readAt(s, ROOM);
    const night = readAt(s, NIGHT);
    const thr = readAt(s, s.onLux);
    const rises = s.pos === 'bottom';
    // Second method: nodal analysis for the voltage, then the light recovered from it.
    const [top, bottom] = rises ? [s.fixed, now.r] : [now.r, s.fixed];
    const m = solveCircuit(['g', 'vs', 'o'], [
      { id: 'S', type: 'V', a: 'g', b: 'vs', value: VS },
      { id: 'T', type: 'R', a: 'vs', b: 'o', value: top },
      { id: 'B', type: 'R', a: 'o', b: 'g', value: bottom },
    ], 'g');
    const vM = m.V.o;
    const rBack = rises ? (s.fixed * vM) / (VS - vM) : (s.fixed * (VS - vM)) / vM;
    const luxBack = ldrLux(LDR, rBack);
    const gap = Math.max(Math.abs(vM - now.v) / VS, Math.abs(luxBack - lux) / lux);
    const best = bestFixed(room.r, night.r);
    return {
      lux, ...now, gap,
      countRoom: room.count, countNight: night.count, swing: Math.abs(night.count - room.count),
      thrCount: thr.count,
      on: rises ? now.count > thr.count : now.count < thr.count,
      rthNight: night.rth,
      adcOk: night.rth <= MCU.adcSource,
      best, bestBuy: nextE12Up(best),
      iDiv: VS / (s.fixed + now.r),
      rises,
    };
  },
  draw(canvas, s, c) {
    const B = begin(canvas);
    const [a, b] = split(B.free, 0.4);
    const P = sceneIn(B, a, { x0: -5, x1: 23, y0: -1.5, y1: 11.5 }, 10);
    // On a phone the drawing is small: the circuit and the lamp, the numbers in the readout.
    const tiny = P.k < 9;
    battery(P, [0, 0], [0, 10], { text: tiny ? '' : '5 V' });
    wire(P, [[0, 10], [6, 10]]);
    const ldrTop = s.pos === 'top';
    resistor(P, [6, 10], [6, 5], { text: tiny ? '' : ldrTop ? `LDR ${si(c.r, 'Ω')}` : si(s.fixed, 'Ω'), side: -1, vary: ldrTop, light: ldrTop });
    resistor(P, [6, 5], [6, 0], { text: tiny ? '' : ldrTop ? si(s.fixed, 'Ω') : `LDR ${si(c.r, 'Ω')}`, side: -1, vary: !ldrTop, light: !ldrTop });
    wire(P, [[6, 0], [0, 0]]);
    wire(P, [[6, 5], [11, 5]], { dots: [[6, 5]] });
    poly(P, [[11, 3.4], [16.5, 3.4], [16.5, 6.6], [11, 6.6]], { fill: alpha(C.bg, 0.9), stroke: alpha(C.text, 0.6), width: 1.2 });
    if (!tiny) {
      label(P, 'A0', [13.75, 5.9], { color: C.muted });
      label(P, String(c.count), [13.75, 4.4], { color: C.yellow, bold: true });
    }
    // The lamp the program drives.
    const { ctx, X, Y, k } = P;
    if (c.on) {
      const g = ctx.createRadialGradient(X(20), Y(5), k * 0.5, X(20), Y(5), k * 4);
      g.addColorStop(0, alpha('#ffd27a', 0.85));
      g.addColorStop(1, alpha('#ffd27a', 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(X(20), Y(5), k * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(X(20), Y(5), k * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = c.on ? '#ffd27a' : alpha(C.muted, 0.3);
    ctx.fill();
    seg(P, [16.5, 5], [18.8, 5], { color: alpha(C.text, 0.6), width: 1.5, dash: [3, 3] });
    if (!tiny) label(P, c.on ? 'lamp on' : 'lamp off', [20, 2.6], { color: c.on ? C.yellow : C.muted, bold: true });

    // The reading against the light, with the levels that matter.
    const Q = plotIn(B, b, { lo: 0.1, hi: 10000, log: true }, { lo: 0, hi: 1023 }, { left: 44, right: 14, top: 20, bottom: 40 });
    axes(Q, { xLabel: 'light (lux)', yLabel: 'reading (of 1023)' });
    const pts = [];
    for (let i = 0; i <= 150; i += 1) {
      const lux = 10 ** (-1 + (5 * i) / 150);
      pts.push([lux, readAt(s, lux).count]);
    }
    line(Q, [[0.1, c.thrCount], [10000, c.thrCount]], { color: C.purple, width: 1.5, dash: [5, 4] });
    line(Q, pts, { color: C.teal, width: 2.5 });
    for (const [lux, text] of [[NIGHT, 'night'], [s.onLux, 'on'], [ROOM, 'room']]) {
      line(Q, [[lux, 0], [lux, 1023]], { color: alpha(C.text, 0.25), width: 1, dash: [2, 4] });
      note(Q, text, lux, 1000, { color: C.muted, dx: 3 });
    }
    dot(Q, c.lux, c.count, { color: C.yellow });
    note(Q, `swing ${c.swing} counts`, 0.12, s.pos === 'bottom' ? 60 : 960, { color: C.teal, dx: 4 });
  },
  law: () => [String.raw`\text{reading} = \frac{1024\,V_{\text{out}}}{5\ \text{V}}`, String.raw`R_{\text{best}} = \sqrt{R_{\text{room}}\,R_{\text{night}}}`],
  liveRows(s, c) {
    return [
      kv('LDR now', si(c.r, 'Ω')),
      kv('reading in the room, at night', `${c.countRoom}, ${c.countNight}`),
      kv('reading that turns the lamp on', String(c.thrCount)),
      kv('best fixed resistor, √(R_room R_night)', `${si(c.best, 'Ω')}, buy ${si(c.bestBuy, 'Ω')}`),
      kv('divider’s resistance at night, for the ADC', `${si(c.rthNight, 'Ω')}${c.adcOk ? '' : ', over 10 kΩ'}`),
    ].join('');
  },
  readout(s, c) {
    return cells([
      ['reading', `${c.count} (${fig(c.v)} V)`],
      ['lamp', c.on ? 'on' : 'off'],
    ]);
  },
  coach(s, c) {
    const out = String.raw`<b>What the course model leaves out.</b> The GL5528 is 10 to 20 kΩ at 10 lux, so two parts can switch at quite different light; calibrate the threshold on the bench. An LDR also responds slowly, tens of milliseconds to light and seconds to dark. And the lamp’s own light can fall on the sensor, so a real night light needs two thresholds, one to turn on and a higher one to turn off, or it flickers at dusk.`;
    return {
      title: c.swing < 200 ? 'The fixed resistor squeezes the swing' : 'A good spread between room and night',
      body: [
        `In the room the LDR is ${si(readAt(s, ROOM).r, 'Ω')}; at night it is ${si(readAt(s, NIGHT).r, 'Ω')}. With ${si(s.fixed, 'Ω')} the reading goes from ${c.countRoom} to ${c.countNight}: ${c.swing} counts of 1023. The best fixed resistor is the geometric mean of the two, ${si(c.best, 'Ω')}; the next standard value is ${si(c.bestBuy, 'Ω')}.`,
        `The program turns the lamp on when the reading ${c.rises ? 'rises above' : 'falls below'} ${c.thrCount}, its value at ${fig(s.onLux)} lux. Now, at ${fig(c.lux)} lux, the lamp is ${c.on ? 'on' : 'off'}.`,
        c.adcOk ? `At night the ADC sees ${si(c.rthNight, 'Ω')}, within the 10 kΩ it is designed for.` : `At night the ADC sees ${si(c.rthNight, 'Ω')}, more than the 10 kΩ it is designed for, so its reading can come out low. A smaller fixed resistor, or a 100 nF capacitor from the input to 0 V, fixes it.`,
        out,
      ],
    };
  },
});
