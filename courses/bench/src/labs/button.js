import { C, alpha, axes, begin, label, line, note, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { junction, resistor, wire } from './schematic.js';
import { bindSelect, bindSlider, put, select, showField, slider } from './widgets.js';
import { fig, si } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { MCU } from './sensors.js';
import { millman } from '@flux/subjects/em/sensors.js';
import { solveCircuit } from '@flux/subjects/em/mna.js';

/**
 * Shows that an input pin joined to nothing has no voltage of its own. It drifts with whatever stray
 * field reaches it, so it reads high, low, or both by turns. A pull-up or pull-down resistor gives it
 * one, and a button pulls it the other way when pressed. A pull resistor too large loses to the
 * stray pickup and the input misreads; one too small wastes power every time the button is held.
 *
 * The pin is a node. A stray source, half the supply plus a 60 Hz hum, reaches it through 1 MΩ: the
 * pin's leakage and the wiring's pickup lumped together. The pull resistor joins it to 5 V or 0 V, and
 * the pressed button joins it to the other rail through 0.1 Ω. The ATmega328P reads below 1.5 V as
 * low and above 3.0 V as high (0.3 and 0.6 of 5 V); between, it may read either.
 *
 * Recompute: modified nodal analysis at each instant over two cycles of hum. Check: Millman's theorem,
 * the conductance-weighted average of the voltages the pin is joined to.
 */
const VCC = 5;
const R_STRAY = 1e6;
const R_BUTTON = 0.1;
const HZ = 60;
const PULLS = [[100, '100 Ω'], [1e3, '1 kΩ'], [10e3, '10 kΩ'], [35e3, '35 kΩ (the chip’s own, 20–50 kΩ)'], [1e6, '1 MΩ']];

const SCENARIOS = [
  { id: 'float', name: 'A button with no pull resistor', pull: 'none', rp: 10e3, pressed: false, hum: 2 },
  { id: 'pullup', name: 'A 10 kΩ pull-up, button not pressed', pull: 'up', rp: 10e3, pressed: false, hum: 2 },
  { id: 'pressed', name: 'A 10 kΩ pull-up, button pressed', pull: 'up', rp: 10e3, pressed: true, hum: 2 },
  { id: 'weak', name: 'A 1 MΩ pull-up (too large)', pull: 'up', rp: 1e6, pressed: false, hum: 2 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, pull: sc.pull, rp: sc.rp, pressed: sc.pressed, hum: sc.hum });
}

/** What the pin is joined to at time t: [volts, ohms] pairs. */
function links(s, t) {
  const out = [[VCC / 2 + s.hum * Math.sin(2 * Math.PI * HZ * t), R_STRAY]];
  if (s.pull === 'up') out.push([VCC, s.rp]);
  if (s.pull === 'down') out.push([0, s.rp]);
  if (s.pressed) out.push([s.pull === 'down' ? VCC : 0, R_BUTTON]);
  return out;
}

/** The pin's voltage at time t by nodal analysis: every link is a source behind a resistor. */
function pinMNA(s, t) {
  const nodes = ['g', 'pin'];
  const edges = [];
  links(s, t).forEach(([v, r], k) => {
    nodes.push(`n${k}`);
    edges.push({ id: `V${k}`, type: 'V', a: 'g', b: `n${k}`, value: v });
    edges.push({ id: `R${k}`, type: 'R', a: `n${k}`, b: 'pin', value: r });
  });
  return solveCircuit(nodes, edges, 'g').V.pin;
}

export function readPin(s) {
  const ts = Array.from({ length: 121 }, (_, k) => (2 / HZ) * (k / 120));
  const vs = ts.map((t) => pinMNA(s, t));
  const vm = ts.map((t) => millman(links(s, t)));
  const gap = Math.max(...vs.map((v, k) => Math.abs(v - vm[k]))) / VCC;
  const vMin = Math.min(...vs);
  const vMax = Math.max(...vs);
  const reading = vMin >= MCU.vih * VCC ? 'high' : vMax <= MCU.vil * VCC ? 'low' : 'unsure';
  return { ts, vs, vMin, vMax, gap, reading };
}

export default defineLab({
  id: 'button',
  exam: 'u3',
  title: 'Button and pull-up',
  app: false,
  hint: 'Take the pull resistor away and watch the pin wander. Then try one too large and one too small.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('float', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'hum', lo: 0, hi: 2.5 }),
  controls() {
    return `
      ${select('bt-pull', 'Pull resistor', [['none', 'none: the pin floats'], ['up', 'pull-up, to 5 V'], ['down', 'pull-down, to 0 V']], 'none')}
      ${select('bt-rp', 'Its value', PULLS, 10e3)}
      ${select('bt-press', 'The button', [['no', 'not pressed'], ['yes', 'pressed']], 'no')}
      ${slider('bt-hum', 'Stray hum picked up (V peak)', 2, 0, 2.5, 0.1)}
      <p class="tiny">An ATmega328P on 5 V: low below 1.5 V, high above 3.0 V. The hum and its 1 MΩ path are illustrative.</p>`;
  },
  bind(api) {
    bindSelect('bt-pull', (s, v) => { s.pull = v; }, api);
    bindSelect('bt-rp', (s, v) => { s.rp = Number(v); }, api);
    bindSelect('bt-press', (s, v) => { s.pressed = v === 'yes'; }, api);
    bindSlider('bt-hum', (s, v) => { s.hum = v; }, api);
  },
  syncControls(s) {
    put('bt-pull', s.pull);
    put('bt-rp', s.rp);
    put('bt-press', s.pressed ? 'yes' : 'no');
    put('bt-hum', s.hum);
    showField('bt-rp', s.pull !== 'none');
  },
  compute(s) {
    const r = readPin(s);
    // With the button held, the pull resistor sits across the supply.
    const pWaste = s.pressed && s.pull !== 'none' ? (VCC * VCC) / (s.rp + R_BUTTON) : 0;
    return {
      ...r,
      vMid: (r.vMin + r.vMax) / 2,
      steady: r.reading !== 'unsure',
      high: r.reading === 'high',
      pWaste,
      iPress: s.pressed && s.pull !== 'none' ? VCC / (s.rp + R_BUTTON) : 0,
    };
  },
  draw(canvas, s, c) {
    const B = begin(canvas);
    const [a, b] = split(B.free, 0.42);
    const P = sceneIn(B, a, { x0: -2, x1: 22, y0: -1.5, y1: 11.5 }, 10);
    // 5 V rail on top, 0 V along the bottom, the pin in the middle. On a phone, no words.
    const tiny = P.k < 9;
    wire(P, [[0, 10], [14, 10]], { color: C.red });
    wire(P, [[0, 0], [14, 0]], { color: C.blue });
    if (!tiny) {
      label(P, '5 V', [-0.4, 10], { color: C.red, align: 'right' });
      label(P, '0 V', [-0.4, 0], { color: C.blue, align: 'right' });
    }
    const pin = [6, 5];
    if (s.pull === 'up') resistor(P, [6, 10], [6, 5], { text: tiny ? '' : si(s.rp, 'Ω'), side: -1 });
    if (s.pull === 'down') resistor(P, [6, 5], [6, 0], { text: tiny ? '' : si(s.rp, 'Ω'), side: -1 });
    // The button: to the rail the pull resistor is not on.
    const bx = 10;
    wire(P, [pin, [bx, 5]]);
    const top = s.pull === 'down' ? [bx, 10] : [bx, 5];
    const bot = s.pull === 'down' ? [bx, 5] : [bx, 0];
    const m1 = [bx, (top[1] + bot[1]) / 2 + 1];
    const m2 = [bx, (top[1] + bot[1]) / 2 - 1];
    wire(P, [top, m1]);
    wire(P, [m2, bot]);
    seg(P, s.pressed ? [bx - 0.15, m1[1]] : [bx - 1.6, m1[1] + 0.6], s.pressed ? [bx - 0.15, m2[1]] : m2, { color: C.text, width: 2.5 });
    if (!tiny) label(P, s.pressed ? 'pressed' : 'button', [bx + 0.8, (top[1] + bot[1]) / 2], { color: C.muted, align: 'left' });
    // The stray pickup, dashed, and the pin's input.
    seg(P, [2, 5], pin, { color: alpha(C.purple, 0.9), width: 1.5, dash: [4, 3] });
    if (!tiny) label(P, 'stray hum', [2, 6.2], { color: C.purple });
    junction(P, pin);
    poly(P, [[13, 4], [17, 4], [17, 6], [13, 6]], { fill: alpha(C.bg, 0.9), stroke: alpha(C.text, 0.6), width: 1.2 });
    wire(P, [[bx, 5], [13, 5]]);
    if (!tiny) label(P, 'input pin', [15, 5], { color: C.text });
    if (!tiny) label(P, c.reading === 'unsure' ? 'reads at random' : `reads ${c.reading.toUpperCase()}`, [15, 7.2], { color: c.steady ? C.teal : C.red, bold: true });

    // The pin's voltage over two cycles of hum, against the chip's thresholds.
    const Q = plotIn(B, b, { lo: 0, hi: (2 / HZ) * 1000 }, { lo: 0, hi: VCC }, { left: 42, right: 14, top: 20, bottom: 40 });
    const shade = (y0, y1, col) => {
      const { ctx, box, Y } = Q;
      ctx.save();
      ctx.fillStyle = col;
      ctx.fillRect(box.x0, Y(y1), box.x1 - box.x0, Y(y0) - Y(y1));
      ctx.restore();
    };
    shade(MCU.vih * VCC, VCC, alpha(C.teal, 0.1));
    shade(MCU.vil * VCC, MCU.vih * VCC, alpha(C.red, 0.1));
    shade(0, MCU.vil * VCC, alpha(C.blue, 0.1));
    axes(Q, { xLabel: 'time (ms)', yLabel: 'pin (V)' });
    line(Q, c.ts.map((t, k) => [t * 1000, c.vs[k]]), { color: C.yellow, width: 2.5 });
    note(Q, 'reads high', 0.5, VCC * 0.97, { color: C.teal, dx: 2, dy: 10 });
    note(Q, 'may read either', 0.5, VCC * 0.47, { color: C.red, dx: 2, dy: 4 });
    note(Q, 'reads low', 0.5, 0.2, { color: C.blue, dx: 2, dy: -2 });
  },
  law: () => [String.raw`V_{\text{pin}} = \frac{\sum V_k / R_k}{\sum 1 / R_k}`, String.raw`P = \frac{V_{cc}^2}{R_{\text{pull}}}\ \text{(button held)}`],
  liveRows(s, c) {
    return [
      kv('pin, lowest', `${fig(c.vMin)} V`),
      kv('pin, highest', `${fig(c.vMax)} V`),
      kv('current while held', si(c.iPress, 'A')),
      kv('power wasted while held', si(c.pWaste, 'W')),
    ].join('');
  },
  readout(s, c) {
    return cells([
      ['pin', Math.abs(c.vMax - c.vMin) < 0.01 ? `${fig(c.vMid)} V` : `${fig(c.vMin)} to ${fig(c.vMax)} V`],
      ['reads', c.reading === 'unsure' ? 'at random' : c.reading.toUpperCase()],
    ]);
  },
  coach(s, c) {
    const out = String.raw`<b>What the model leaves out.</b> The stray pickup is one source behind 1 MΩ, an illustrative stand-in for leakage and capacitive coupling to nearby wires. A real floating pin also picks up your hand, and its input has clamp diodes that stop it going far past the rails. A real button bounces for a few milliseconds when pressed.`;
    if (s.pull === 'none' && !s.pressed) {
      return {
        title: 'A floating pin reads noise',
        body: [`Nothing ties the pin to 5 V or 0 V, so it follows the stray hum: it sits near half the supply and swings from ${fig(c.vMin)} V to ${fig(c.vMax)} V. Much of that is between 1.5 V and 3.0 V, where the chip may read either. The program sees presses that never happened.`, 'Add a pull-up: 10 kΩ to 5 V holds the pin high until the button pulls it low.', out],
      };
    }
    if (c.reading === 'unsure') {
      return {
        title: 'The pull resistor is too weak',
        body: [`A ${si(s.rp, 'Ω')} pull resistor is too close to the stray path’s 1 MΩ. They share the pin between them, so it swings from ${fig(c.vMin)} V to ${fig(c.vMax)} V and crosses into the region the chip cannot decide. Use 10 kΩ or the chip’s own 20–50 kΩ pull-up.`, out],
      };
    }
    return {
      title: s.pressed ? 'The button wins' : 'The pull resistor holds the pin',
      body: [
        s.pressed
          ? `The button joins the pin to ${s.pull === 'down' ? '5 V' : '0 V'} through 0.1 Ω, far less than the pull resistor, so the pin reads ${c.reading.toUpperCase()}. Meanwhile ${si(s.rp, 'Ω')} sits across the supply and wastes ${si(c.pWaste, 'W')}${c.pWaste > 0.1 ? ', which would warm a ¼ W resistor and drain a battery' : ''}.`
          : `The ${si(s.rp, 'Ω')} pull resistor is far smaller than the stray 1 MΩ, so it holds the pin at ${fig(c.vMid)} V and it reads ${c.reading.toUpperCase()}.`,
        out,
      ],
    };
  },
});
