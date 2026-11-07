import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { rtdResistance, temperatureReadings } from '@flux/subjects/design/instruments.js';

/**
 * Temperature: a type K thermocouple and a Pt100 RTD in the same bath, read by a logger in a room.
 *
 * Shows what each sensor really measures. A thermocouple measures the difference between its tip and
 * the junction where its wires meet the logger's copper, so a logger that does not measure that
 * junction's temperature is off by the room's. An RTD measures a resistance, so two-wire leads add
 * to it; three- and four-wire hookups take the leads out. The RTD's temperature is found by the
 * quadratic's root and again by Newton's method (packages/subjects/src/design/instruments.js).
 */
const SCENARIOS = [
  { id: 'no-cjc', name: 'Thermocouple, no cold-junction compensation', tip: 200, room: 25, cjc: false, lead: 0.5, wires: 4 },
  { id: 'cjc', name: 'Thermocouple with compensation', tip: 200, room: 25, cjc: true, lead: 0.5, wires: 4 },
  { id: 'two-wire', name: 'RTD on long two-wire leads', tip: 200, room: 25, cjc: true, lead: 2, wires: 2 },
  { id: 'warm-room', name: 'The room warms to 35 °C', tip: 200, room: 35, cjc: false, lead: 0.5, wires: 4 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, tip: sc.tip, room: sc.room, cjc: sc.cjc, lead: sc.lead, wires: sc.wires });
}

export default defineLab({
  id: 'temperature',
  exam: 'u5',
  title: 'Temperature sensors',
  hint: 'Warm the room with compensation off: the thermocouple reads the bath low by the room’s temperature. Then lengthen the RTD’s leads on two wires.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('no-cjc', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'tip', lo: 0, hi: 400 }),
  controls() {
    return `
      ${slider('te-tip', 'bath temperature (°C)', 200, 0, 400, 1)}
      ${slider('te-room', 'room, where the wires meet the logger (°C)', 25, 0, 45, 0.5)}
      <label class="field"><span>Thermocouple logger</span><select id="te-cjc"><option value="off">Assumes its terminals are at 0 °C</option><option value="on">Measures its terminals (compensated)</option></select></label>
      ${slider('te-lead', 'RTD lead resistance per wire (Ω)', 0.5, 0, 3, 0.05)}
      <label class="field"><span>RTD wiring</span><select id="te-wires"><option value="2">Two wires</option><option value="3">Three wires</option><option value="4">Four wires</option></select></label>
      <p class="tiny">Type K: about 41 μV/°C. Pt100: 100 Ω at 0 °C, 0.385 Ω/°C (Wikipedia, read 6 November 2026).</p>`;
  },
  bind(api) {
    bindSlider('te-tip', (s, v) => { s.tip = v; }, api);
    bindSlider('te-room', (s, v) => { s.room = v; }, api);
    bindSlider('te-lead', (s, v) => { s.lead = v; }, api);
    document.getElementById('te-cjc')?.addEventListener('change', (e) => {
      api.slice().cjc = e.target.value === 'on';
      api.bump();
    });
    document.getElementById('te-wires')?.addEventListener('change', (e) => {
      api.slice().wires = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const cjc = document.getElementById('te-cjc');
    if (cjc) cjc.value = state.cjc ? 'on' : 'off';
    const w = document.getElementById('te-wires');
    if (w) w.value = String(state.wires);
    for (const [id, val] of [['te-tip', state.tip], ['te-room', state.room], ['te-lead', state.lead]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const r = temperatureReadings(state);
    const gap = Math.abs(r.rtd - r.rtdNewton);
    return { ...r, tcError: r.tc - state.tip, rtdError: r.rtd - state.tip, Rtrue: rtdResistance(state.tip), gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const bars = [['bath', state.tip, C.text], ['thermocouple', c.tc, C.gold], ['RTD', c.rtd, C.teal]];
    const hi = Math.max(50, ...bars.map(([, v]) => v)) * 1.18;
    const P = plotIn(B, B.free, { lo: 0, hi: 3 }, { lo: 0, hi }, { left: 56, right: 14, top: 22, bottom: 34 });
    axes(P, { yLabel: 'reading (°C)', xFmt: () => '' });
    bars.forEach(([name, v, col], i) => {
      poly(P, [[i + 0.22, 0], [i + 0.78, 0], [i + 0.78, v], [i + 0.22, v]], { fill: alpha(col, 0.5), stroke: col });
      label(P, `${fig(v)} °C`, [i + 0.5, v], { color: col, dy: -10, bold: true });
      label(P, name, [i + 0.5, 0], { color: C.muted, dy: 14 });
    });
    seg(P, [0, state.tip], [3, state.tip], { color: alpha(C.text, 0.5), width: 1, dash: [5, 4] });
  },
  law: () => [String.raw`V = S\,(T_\text{tip} - T_\text{ref}),\quad S \approx 41\ \mu\text{V}/^\circ\text{C}`, String.raw`R = R_0\,(1 + AT + BT^2)`],
  liveRows(state, c) {
    return [
      kv('thermocouple voltage', `${fig(c.emf * 1000)} mV`),
      kv('thermocouple error', `${fig(c.tcError)} °C`),
      kv('RTD resistance, true', `${fig(c.Rtrue)} Ω`),
      kv('RTD resistance, as read', `${fig(c.R)} Ω`),
      kv('RTD error', `${fig(c.rtdError)} °C`),
      kv('root against Newton', `${fig(c.gap)} °C`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['bath', `${fig(state.tip)} °C`],
      ['thermocouple', `${fig(c.tc)} °C`],
      ['RTD', `${fig(c.rtd)} °C`],
      ['TC voltage', `${fig(c.emf * 1000)} mV`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A type K's sensitivity is taken as a constant 41 μV/°C; real loggers use the standard's polynomial tables. Both sensors are taken to sit at the bath's temperature, with no lag or heat leaking along the probe.`;
    let title = 'Both read true';
    let body = String.raw`The logger measures its own terminals and adds them back, and the RTD is read on ${state.wires} wires, so both report the bath, ${fig(state.tip)} °C.`;
    if (!state.cjc) {
      title = 'A thermocouple measures a difference';
      body = String.raw`The thermocouple gives ${fig(c.emf * 1000)} mV for ${fig(state.tip - state.room)} °C between its tip and the logger's terminals. A logger that takes those terminals as 0 °C reads ${fig(c.tc)} °C: low by the room's ${fig(state.room)} °C, and it drifts as the room does.`;
    } else if (state.wires === 2 && state.lead > 0) {
      title = 'Two wires: the leads read as heat';
      body = String.raw`The RTD changes about 0.385 Ω per °C, and its two leads add ${fig(2 * state.lead)} Ω. The logger cannot tell them apart and reads ${fig(c.rtdError)} °C high. Three or four wires take the leads out.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
