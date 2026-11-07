import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, poly, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { ETA_C, ETA_D, powerChecked } from '@flux/subjects/mechanics/power.js';

/**
 * Power: a satellite's solar array and battery run through five orbits of sunlight and shadow.
 *
 * Shows that an array matching the orbit-average load is not enough: it must also refill, in daylight,
 * what the eclipse drew, with the battery's losses on the way in and out. A tracking array sized to
 * the average drains the battery a little every orbit; a battery too small runs flat in shadow. The
 * array energy per orbit comes in closed form; the second method steps the battery through five orbits
 * (packages/subjects/src/mechanics/power.js).
 */
const SCENARIOS = [
  { id: 'sized', name: 'A 40 W array for a 20 W load at 500 km', h: 500, Pload: 20, panel: 'tracking', Ppeak: 40, Ebatt: 40 },
  { id: 'average', name: 'An array that only matches the average load', h: 500, Pload: 20, panel: 'tracking', Ppeak: 32.1, Ebatt: 40 },
  { id: 'body', name: 'A 100 W panel fixed on the body', h: 500, Pload: 20, panel: 'body', Ppeak: 100, Ebatt: 40 },
  { id: 'small', name: 'The 40 W array with a 12 Wh battery', h: 500, Pload: 20, panel: 'tracking', Ppeak: 40, Ebatt: 12 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, h: sc.h, Pload: sc.Pload, panel: sc.panel, Ppeak: sc.Ppeak, Ebatt: sc.Ebatt });
}

const KEYS = [['pw-h', 'h'], ['pw-l', 'Pload'], ['pw-p', 'Ppeak'], ['pw-b', 'Ebatt']];
const mins = (s) => `${fig(s / 60)} min`;

export default defineLab({
  id: 'power',
  exam: 'u5',
  title: 'Power',
  hint: 'Shrink the array until its orbit average just matches the load, and watch the battery sink a little every orbit. Then shrink the battery until it runs flat in shadow.',
  gapLimit: 1e-5,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('sized', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'Ppeak', lo: 10, hi: 150 }),
  controls() {
    return `
      <label class="field"><span>Array</span><select id="pw-panel"><option value="tracking">Wings that track the Sun</option><option value="body">A panel fixed on the body, facing away from Earth</option></select></label>
      ${slider('pw-h', 'Orbit altitude (km)', 500, 400, 1500, 10)}
      ${slider('pw-l', 'Load, all the time (W)', 20, 5, 60, 1)}
      ${slider('pw-p', 'Array power in full sun (W)', 40, 10, 150, 0.1)}
      ${slider('pw-b', 'Battery capacity (Wh)', 40, 5, 100, 1)}
      <p class="tiny">A circular orbit with the Sun in its plane, the longest eclipse. The battery charges at ${ETA_C * 100}% and discharges at ${ETA_D * 100}% efficiency and starts full. Grey bands: shadow.</p>`;
  },
  bind(api) {
    document.getElementById('pw-panel')?.addEventListener('change', (e) => {
      api.slice().panel = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    const el = document.getElementById('pw-panel');
    if (el) el.value = state.panel;
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return powerChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const wide = W > 1.5 * (B.free.y1 - B.free.y0) && W > 560;
    const both = wide || B.free.y1 - B.free.y0 > 420;
    const [top, bottom] = both ? split(B.free, wide ? 0.55 : 0.58) : [B.free, null];
    // Shadow bands: the eclipse is centred half an orbit from noon.
    const bands = (P, lo, hi) => {
      const w = c.Te / c.T;
      for (let k = 0; k < 5; k++) {
        const mid = k + 0.5;
        poly(P, [[mid - w / 2, lo], [mid + w / 2, lo], [mid + w / 2, hi], [mid - w / 2, hi]], { fill: alpha(C.muted, 0.14), stroke: null });
      }
    };
    const P = plotIn(B, top, { lo: 0, hi: 5 }, { lo: 0, hi: 1.05 });
    axes(P, { xLabel: 'orbits', yLabel: 'battery charge' });
    bands(P, 0, 1.05);
    line(P, c.trace.map(([t, soc]) => [t, soc]), { color: c.sustains ? C.green : C.red, width: 2.5 });
    label(P, c.emptied ? 'runs flat in shadow' : c.sustains ? 'keeps up' : 'sinks a little every orbit', [5, 1.05], { color: c.sustains ? C.green : C.red, align: 'right', dy: -12 });
    if (!bottom) return;
    const top2 = 1.1 * Math.max(state.Ppeak, state.Pload);
    const Q = plotIn(B, bottom, { lo: 0, hi: 2 }, { lo: 0, hi: top2 });
    axes(Q, { xLabel: 'orbits', yLabel: 'power (W)' });
    bands(Q, 0, top2);
    line(Q, c.trace.filter(([t]) => t <= 2).map(([t, , pa]) => [t, pa]), { color: C.gold, width: 2 });
    seg(Q, [0, state.Pload], [2, state.Pload], { color: C.pink, width: 2, dash: [5, 4] });
    label(Q, 'array', [0.05, state.panel === 'tracking' ? state.Ppeak : state.Ppeak * 0.9], { color: C.gold, align: 'left', dy: -10 });
    label(Q, 'load', [1.95, state.Pload], { color: C.pink, align: 'right', dy: -10 });
  },
  law: () => [String.raw`T_e = T\,\frac{\arcsin(R/r)}{\pi}, \qquad T = 2\pi\sqrt{r^3/\mu}`, String.raw`P_\text{sun} = P_L\,\frac{T_s + T_e/(\eta_c\eta_d)}{T_s}`],
  liveRows(state, c) {
    return [
      kv('Period, of it in shadow', `${mins(c.T)}, ${mins(c.Te)}`),
      kv('Array energy per orbit, closed form', `${fig(c.Earray)} Wh`),
      kv('Array energy per orbit, stepped', `${fig(c.arrayWh)} Wh`),
      kv('Two methods differ by', c.gap.toExponential(0)),
      kv('Array average against the load', `${fig(c.avgArray)} W, ${fig(state.Pload)} W`),
      kv('Tracking array needed in sunlight', `${fig(c.needSun)} W`),
      kv('Battery drawn in each eclipse', `${fig(c.eclipseDraw)} Wh, ${fig(100 * c.dod)}% of it`),
      kv('Charge at each eclipse', c.atEclipse.map((x) => `${fig(100 * x)}%`).join(', ')),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['eclipse', mins(c.Te)],
      ['discharge', `${fig(100 * c.dod)}%`],
      ['lowest charge', `${fig(100 * c.lowest)}%`],
      ['state', c.emptied ? 'flat' : c.sustains ? 'keeps up' : 'sinking'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Arrays that lose power as they heat and age, batteries that wear faster the deeper they discharge, and orbits where the Sun lies out of the plane and the eclipse shortens or vanishes.`;
    if (c.emptied) {
      return { title: 'The battery runs flat', body: `Each ${mins(c.Te)} eclipse draws ${fig(c.eclipseDraw)} Wh, more than the ${fig(state.Ebatt)} Wh battery holds: ${fig(100 * c.dod)}% depth of discharge. Size the battery for the longest eclipse, with margin. ${leavesOut}` };
    }
    if (!c.sustains) {
      return { title: 'Matching the average is not enough', body: `The array averages ${fig(c.avgArray)} W over an orbit against a ${fig(state.Pload)} W load, but in daylight it must also put back the ${fig(c.eclipseDraw)} Wh the eclipse took, through ${ETA_C * 100}% and ${ETA_D * 100}% losses. A tracking array needs ${fig(c.needSun)} W, so the battery sinks a little every orbit. ${leavesOut}` };
    }
    return { title: 'Daylight refills the night', body: `The ${mins(c.Te)} eclipse draws ${fig(c.eclipseDraw)} Wh, ${fig(100 * c.dod)}% of the battery, and daylight puts it back every orbit. ${state.panel === 'tracking' ? `A tracking array needs at least ${fig(c.needSun)} W here; this one gives ${fig(state.Ppeak)} W.` : `The body panel peaks at ${fig(state.Ppeak)} W at noon but averages only ${fig(c.avgArray)} W over the orbit, P/π, against the ${fig(state.Pload)} W load.`} ${leavesOut}` };
  },
  app: false,
});
