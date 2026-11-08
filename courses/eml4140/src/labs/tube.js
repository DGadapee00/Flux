import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { TUBE, tubeChecked, tubeClosed } from '@flux/subjects/heat/tube.js';

/**
* Tube: water heated as it flows through a 10 mm tube, 5 m long, with its wall at 80 °C, and a
 * slider for the flow rate, the bulk temperature drawn along the tube.
 *
 * Shows that the water does not warm at a steady rate: it closes on the wall's temperature
 * exponentially, over a length ṁc_p/hP. At 4 g/s that length is 2.3 m, the water leaves at 73 °C and
 * the last two metres add only 6 °C. Past Re ≈ 2300 the flow turns turbulent and h jumps fivefold.
 * The exponential is checked by a Runge–Kutta march (packages/subjects/src/heat/tube.js).
 */
const SCENARIOS = [
  {
    id: 'slow',
    name: 'A trickle, 2 g/s',
    mdot: 2
  },
  {
    id: 'laminar',
    name: 'Laminar, 4 g/s',
    mdot: 4
  },
  {
    id: 'edge',
    name: 'Just laminar, 11 g/s',
    mdot: 11
  },
  {
    id: 'turbulent',
    name: 'Turbulent, 30 g/s',
    mdot: 30
  }
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, mdot: sc.mdot });
}

const KEYS = [['tb-m', 'mdot']];

function along(B, rect, state, c) {
  const { L, Ts, Ti } = TUBE;
  const P = plotIn(B, rect, { lo: 0, hi: L }, { lo: Ti - 4, hi: Ts + 8 });
  axes(P, { xLabel: 'distance along the tube (m)', yLabel: 'bulk temperature (°C)' });
  seg(P, [0, Ts], [L, Ts], { color: alpha(C.red, 0.8), width: 1.5, dash: [6, 4] });
  label(P, `wall ${Ts} °C`, [0, Ts], { color: C.red, align: 'left', dx: 4, dy: -10 });
  const steady = Math.min(L, (Ts - Ti) / (c.a * (Ts - Ti)));
  seg(P, [0, Ti], [steady, Ti + c.a * (Ts - Ti) * steady], { color: alpha(C.muted, 0.8), width: 1.5, dash: [3, 3] });
  const pts = Array.from({ length: 121 }, (_, i) => [(L * i) / 120, c.Tm((L * i) / 120)]);
  line(P, pts, { color: C.gold, width: 3 });
  label(P, `out at ${fig(c.To)} °C`, [L, c.To], { color: C.gold, align: 'right', dy: 14 });
  if (c.lenScale < L) {
    dot(P, c.lenScale, c.Tm(c.lenScale), { color: C.blue, r: 5 });
    label(P, `ṁc_p/hP = ${fig(c.lenScale)} m`, [c.lenScale, c.Tm(c.lenScale)], { color: C.blue, align: 'left', dx: 8, dy: 14 });
  }
}

function outlet(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 60 }, { lo: 40, hi: 84 });
  axes(P, { xLabel: 'flow rate (g/s)', yLabel: 'outlet temperature (°C)' });
  const pts = Array.from({ length: 237 }, (_, i) => {
    const m = 1 + i * 0.25;
    return [m, tubeClosed({ mdot: m }).To];
  });
  const lam = pts.filter((p) => tubeClosed({ mdot: p[0] }).laminar);
  const tur = pts.filter((p) => !tubeClosed({ mdot: p[0] }).laminar);
  line(P, lam, { color: C.blue, width: 2.5 });
  line(P, tur, { color: C.gold, width: 2.5 });
  label(P, 'laminar', [6, 48], { color: C.blue });
  label(P, 'turbulent', [45, 74], { color: C.gold });
  dot(P, state.mdot, c.To, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'tube',
  exam: 'u3',
  title: 'Tube',
  hint: 'Read the outlet temperature at 4 g/s, then see how little of the rise happens in the last metres. Then cross 12 g/s and watch the outlet jump.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('slow', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'mdot', lo: 1, hi: 60 }),
  controls() {
    return `
      ${slider('tb-m', "Flow rate (g/s)", 4, 1, 60, 0.5)}
      <p class="tiny">Water near 40 °C (c_p = 4180 J/(kg·K), k = 0.63 W/(m·K), Pr = 4.3) enters at 20 °C. Laminar flow uses Nu = 3.66; turbulent uses Dittus–Boelter. Left: the bulk temperature along the tube, with the dashed line it would follow if it kept warming at its first rate. Right: the outlet temperature against the flow rate.</p>`;
  },
  bind(api) {

    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {

    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return tubeChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      along(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    along(B, a, state, c);
    outlet(B, b, state, c);
  },
  law: () => [String.raw`\frac{T_s - T_m(x)}{T_s - T_{m,i}} = \exp\!\left(-\frac{hPx}{\dot m c_p}\right)`, String.raw`\text{Nu}_D = 3.66 \ \text{(laminar)}, \qquad 0.023\,\text{Re}_D^{0.8}\text{Pr}^{0.4} \ \text{(turbulent)}`],
  liveRows(state, c) {
    return [
      kv('Reynolds number', `${fig(c.Re)}, ${c.laminar ? 'laminar' : 'turbulent'}`),
      kv('Nu and h', `${fig(c.Nu)}, ${fig(c.h)} W/(m²·K)`),
      kv('Length scale ṁc_p/hP', `${fig(c.lenScale)} m`),
      kv('Outlet temperature', `${fig(c.To)} °C`),
      kv('Heat picked up', `${fig(c.q)} W`),
      kv('Exponential against Runge–Kutta and LMTD', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['outlet', `${fig(c.To)} °C`], ['heat', `${fig(c.q)} W`], ['Re', fig(c.Re)], ['h', `${fig(c.h)} W/(m²·K)`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The entry length, where the layers are still thin and h is higher, and the change of water’s viscosity with temperature. Between Re ≈ 2300 and 10 000 the flow is in transition and neither correlation is reliable.`;
    if (!c.laminar) return { title: 'Turbulent: h jumps', body: `At Re = ${fig(c.Re)} the flow is turbulent: eddies carry heat across the tube and h is ${fig(c.h)} W/(m²·K), against 231 laminar. The water leaves at ${fig(c.To)} °C and picks up ${fig(c.q)} W. ${leavesOut}` };
    if (c.lenScale < 0.5 * TUBE.L) return { title: 'The last metres do almost nothing', body: `The water closes on the wall over ${fig(c.lenScale)} m, well inside the tube. By the outlet it is at ${fig(c.To)} °C, and the far half of the tube added only ${fig(c.To - c.Tm(TUBE.L / 2))} °C: the difference that drives the heat has nearly gone. ${leavesOut}` };
    return { title: 'Closing on the wall exponentially', body: `The temperature difference to the wall falls by a factor e every ${fig(c.lenScale)} m, so the water warms fast at first and slower later. It leaves at ${fig(c.To)} °C, not the ${fig(Math.min(TUBE.Ts, TUBE.Ti + c.a * (TUBE.Ts - TUBE.Ti) * TUBE.L))} °C a steady rate would give. ${leavesOut}` };
  },
  app: false,
});
