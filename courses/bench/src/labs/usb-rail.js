import { C, alpha, begin, label, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { BOUNDS, drawBoard, drawPart, drawSupply } from './board.js';
import { bindSelect, bindSlider, put, select, slider } from './widgets.js';
import { fig, si } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { netOf, solveBoard } from '@flux/subjects/em/breadboard.js';

/**
 * Application lab: powering a breadboard from USB.
 *
 * Shows that the 5 V a USB port promises is not the 5 V on your rails. The source has a little
 * internal resistance and the cable's two thin wires have more, so the rail voltage falls in
 * proportion to the current drawn; a short, thick cable keeps it up. It also shows that a port has a
 * current limit, and how long a power bank lasts for a given load.
 *
 * Numbers. USB 2.0 (USB-IF, 2000, §7.2): a port supplies 4.75 to 5.25 V and up to 500 mA after
 * enumeration. USB Battery Charging 1.2 (USB-IF, 2010): a dedicated charging port up to 1.5 A. Copper
 * wire resistance from the American Wire Gauge table at 20 °C: 28 AWG 0.2129 Ω/m, 26 AWG 0.1339,
 * 24 AWG 0.0842, 22 AWG 0.0530; a USB cable's power pair is often 28 AWG in cheap cables and 24 or
 * 22 AWG in charging cables. Power bank: 10,000 mAh at the cell's 3.7 V, 37 Wh, as banks are labelled,
 * and a 2.1 A port; the 85% conversion efficiency and the sources' 0.1 Ω and 0.15 Ω output
 * resistances are illustrative values, not one maker's.
 *
 * Recompute: the rail voltage in closed form, V = E·R_L/(R_L + r + R_cable). Check: the circuit on
 * the board solved by modified nodal analysis; the battery life stepped minute by minute.
 */
const AWG = { 28: 0.2129, 26: 0.1339, 24: 0.0842, 22: 0.053 };
const SOURCES = {
  bank: { name: 'power bank, 2.1 A port', E: 5.1, r: 0.1, limit: 2.1, wh: 37, eff: 0.85 },
  laptop: { name: 'laptop USB 2.0 port', E: 5.05, r: 0.15, limit: 0.5, wh: null, eff: null },
};
const USB_MIN = 4.75;

const SCENARIOS = [
  { id: 'leds', name: 'Five LEDs at 20 mA each, from a power bank', src: 'bank', len: 1, awg: 28, mA: 100 },
  { id: 'motor', name: 'A small motor drawing 1 A, thin 1 m cable', src: 'bank', len: 1, awg: 28, mA: 1000 },
  { id: 'laptop', name: 'A servo from a laptop port', src: 'laptop', len: 1, awg: 28, mA: 600 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, src: sc.src, len: sc.len, awg: sc.awg, mA: sc.mA });
}

/** The load is a resistance that would draw `mA` at exactly 5 V. */
const loadOhms = (s) => 5 / (s.mA / 1000);
const cableOhms = (s) => 2 * s.len * AWG[s.awg];

function closedForm(s) {
  const src = SOURCES[s.src];
  const RL = loadOhms(s);
  const Rc = cableOhms(s);
  const I = src.E / (RL + src.r + Rc);
  return { I, Vport: src.E - I * src.r, Vrail: I * RL, Rc, RL };
}

/** Hours of running on the bank: stored energy, after conversion, over the power drawn at the port. */
function hours(s, c) {
  const src = SOURCES[s.src];
  if (!src.wh) return null;
  return (src.wh * src.eff) / (c.Vport * c.I);
}

export default defineLab({
  id: 'usb-rail',
  exam: 'u1',
  title: 'USB power',
  app: true,
  hint: 'Change the load, the cable and the source. Watch the rail voltage against USB’s 4.75 V floor.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('leds', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'mA', lo: 10, hi: 2500 }),
  controls() {
    return `
      ${select('ur-src', 'Source', Object.entries(SOURCES).map(([k, v]) => [k, v.name]), 'bank')}
      ${slider('ur-ma', 'Load current at 5 V (mA)', 100, 10, 2500, 10)}
      ${slider('ur-len', 'Cable length (m)', 1, 0.1, 3, 0.1)}
      ${select('ur-awg', 'Cable wire gauge', [[28, '28 AWG (thin)'], [26, '26 AWG'], [24, '24 AWG'], [22, '22 AWG (thick)']], 28)}`;
  },
  bind(api) {
    bindSelect('ur-src', (s, v) => { s.src = v; }, api);
    bindSlider('ur-ma', (s, v) => { s.mA = v; }, api);
    bindSlider('ur-len', (s, v) => { s.len = v; }, api);
    bindSelect('ur-awg', (s, v) => { s.awg = Number(v); }, api);
  },
  syncControls(s) {
    put('ur-src', s.src);
    put('ur-ma', s.mA);
    put('ur-len', s.len);
    put('ur-awg', s.awg);
  },
  compute(s) {
    const src = SOURCES[s.src];
    const c = closedForm(s);
    // Second method: the same circuit on the board, the cable as a resistor in each lead.
    const parts = [
      { id: 'S', type: 'V', a: 'T-1', b: 'T+1', value: src.E, r: src.r },
      { id: 'c+', type: 'R', a: 'T+1', b: 'B+1', value: c.Rc / 2 },
      { id: 'c-', type: 'R', a: 'B-1', b: 'T-1', value: c.Rc / 2 },
      { id: 'L', type: 'R', a: 'B+20', b: 'B-20', value: c.RL },
    ];
    const m = solveBoard(parts, { ground: netOf('T-1') });
    const VrailM = m.V[netOf('B+1')] - m.V[netOf('B-1')];
    let gap = Math.abs(VrailM - c.Vrail) / c.Vrail;
    const h = hours(s, c);
    if (h) {
      // Step the bank's energy down a minute at a time until it is spent.
      let E = src.wh * src.eff * 3600;
      const P = c.Vport * c.I;
      let t = 0;
      while (E > P * 60) {
        E -= P * 60;
        t += 60;
      }
      t += E / P;
      gap = Math.max(gap, Math.abs(t / 3600 - h) / h);
    }
    return {
      ...c, sag: src.E - c.Vrail, cableDrop: c.I * c.Rc, hours: h, over: c.I > src.limit, low: c.Vrail < USB_MIN,
      limit: src.limit, E: src.E, P: c.Vrail * c.I, gap,
    };
  },
  draw(canvas, s, c) {
    const B = begin(canvas);
    const P = sceneIn(B, B.free, BOUNDS, 10);
    drawBoard(P, {});
    drawSupply(P, { a: 'T-2', b: 'T+2' }, { name: s.src === 'bank' ? 'bank' : 'laptop', text: `${fig(c.Vport)} V` });
    // The load: a resistor across the rails, standing in for whatever the board powers.
    drawPart(P, { id: 'w+', type: 'W', a: 'T+16', b: 'a16', color: 'red' });
    drawPart(P, { id: 'L', type: 'R', a: 'c16', b: 'c24', value: Math.max(1, Math.round(c.RL)) });
    drawPart(P, { id: 'w-', type: 'W', a: 'a24', b: 'T-25', color: 'black' });
    label(P, `load: ${si(c.I, 'A')}`, [20, 6], { color: C.muted });
    // A gauge of the rail voltage from 4.0 to 5.3 V, with USB's floor marked.
    const x0 = 3;
    const x1 = 29;
    const toX = (v) => x0 + ((Math.min(5.3, Math.max(4, v)) - 4) / 1.3) * (x1 - x0);
    poly(P, [[x0, -5.4], [x1, -5.4], [x1, -4.2], [x0, -4.2]], { fill: alpha(C.bg, 0.9), stroke: alpha(C.text, 0.4), width: 1 });
    poly(P, [[x0, -5.4], [toX(c.Vrail), -5.4], [toX(c.Vrail), -4.2], [x0, -4.2]], { fill: c.low ? alpha(C.red, 0.75) : alpha(C.teal, 0.75), stroke: null });
    seg(P, [toX(USB_MIN), -6.2], [toX(USB_MIN), -3.4], { color: C.yellow, width: 2, dash: [4, 3] });
    seg(P, [toX(c.Vport), -6.2], [toX(c.Vport), -3.4], { color: C.text, width: 1.5 });
    label(P, '4.75 V: USB floor', [toX(USB_MIN), -6.9], { color: C.yellow });
    label(P, `port ${fig(c.Vport)} V`, [toX(c.Vport), -2.8], { color: C.text });
    label(P, `rails ${fig(c.Vrail)} V`, [x0 + 0.4, -4.8], { color: C.bg, bold: true, align: 'left' });
    label(P, '4.0 V', [x0, -6.9], { color: C.dim });
    label(P, '5.3 V', [x1, -6.9], { color: C.dim });
    if (c.over) label(P, `${si(c.I, 'A')} is over this port’s ${fig(c.limit)} A limit`, [16, 1.9], { color: C.red });
  },
  law: () => [String.raw`V_{\text{rail}} = E - I\,(r + R_{\text{cable}})`, String.raw`t = \frac{E_{\text{bank}}\,\eta}{V I}`],
  liveRows(s, c) {
    return [
      kv('cable resistance, both wires', si(c.Rc, 'Ω')),
      kv('lost in the cable', `${fig(c.cableDrop)} V`),
      kv('power to the board', si(c.P, 'W')),
      kv('power bank runs for', c.hours ? `${fig(c.hours)} h` : '—'),
    ].join('');
  },
  readout(s, c) {
    return cells([
      ['rail voltage', `${fig(c.Vrail)} V${c.low ? ', below 4.75 V' : ''}`],
      ['current', `${si(c.I, 'A')}${c.over ? ', over the limit' : ''}`],
    ]);
  },
  coach(s, c) {
    const out = String.raw`<b>What the course model leaves out.</b> The load here is a fixed resistance; real loads such as motors and microcontrollers draw current that changes with the voltage, and a motor draws several times its running current as it starts. A power bank's output also droops as its cell empties, and many banks switch off below about 50 mA. The output resistances and the 85% efficiency are illustrative values.`;
    return {
      title: c.low ? 'The rails have sagged below USB’s floor' : 'Every ohm in the path costs voltage',
      body: [
        `The source makes ${fig(c.E)} V. The current, ${si(c.I, 'A')}, drops ${fig(c.cableDrop)} V across the cable’s ${si(c.Rc, 'Ω')} and more inside the source, so the rails sit at ${fig(c.Vrail)} V. The drop is $IR$: twice the current, twice the sag.`,
        c.over ? `This port is good for ${fig(c.limit)} A. Drawing ${si(c.I, 'A')}, a real one would limit the current or shut off.` : (c.hours ? `The bank stores 37 Wh. At ${si(c.Vport * c.I, 'W')} it lasts about ${fig(c.hours)} hours.` : 'A laptop port does not run down, but it is limited to 500 mA.'),
        out,
      ],
    };
  },
});
