import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { METALS, hpChecked, hpClosed, sizeDensity } from '@flux/subjects/matsci/hallpetch.js';

/**
* Grain size: a metal's yield strength against its grain size (Hall–Petch), with a choice of metal
 * and sliders for the median grain size and the spread of sizes.
 *
 * Shows that grain boundaries, though defects, make a metal stronger: they stop slip. Mild steel
 * with 100 µm grains yields at 144 MPa; with 10 µm grains, at 304 MPa. A spread of sizes raises it a
 * little more, because small grains count for more. The closed form for a log-normal spread is
 * checked by integrating over the distribution (packages/subjects/src/matsci/hallpetch.js).
 */
const SCENARIOS = [
  { id: 'coarse', name: 'Mild steel, 100 µm grains', metal: 'steel', ld: 2, s: 0 },
  { id: 'fine', name: 'Mild steel, 10 µm grains', metal: 'steel', ld: 1, s: 0 },
  { id: 'spread', name: '10 µm median, with a spread', metal: 'steel', ld: 1, s: 0.6 },
  { id: 'copper', name: 'Copper, 50 µm grains', metal: 'copper', ld: 1.699, s: 0.3 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, metal: sc.metal, ld: sc.ld, s: sc.s });
}

const KEYS = [['gs-d', 'ld'], ['gs-s', 's']];

const mpa = (x) => `${fig(x)} MPa`;

function hp(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 1050 }, { lo: 0, hi: 900 });
  axes(P, { xLabel: 'd^{−1/2} (m^{−1/2})', yLabel: 'yield strength (MPa)' });
  for (const [id, m] of Object.entries(METALS)) {
    const mine = id === state.metal;
    line(P, [[0, m.s0], [1050, m.s0 + m.ky * 1050]], { color: mine ? C.gold : alpha(C.muted, 0.7), width: mine ? 2.5 : 1.5, dash: mine ? null : [5, 4] });
    label(P, m.name, [1050, Math.min(880, m.s0 + m.ky * 1050)], { color: mine ? C.gold : C.muted, align: 'right', dy: -10 });
  }
  dot(P, c.invRoot, c.sy, { color: C.pink, r: 6, ring: C.text });
  label(P, `${mpa(c.sy)} at ${fig(c.dum)} µm`, [c.invRoot, c.sy], { color: C.text, align: c.invRoot > 600 ? 'right' : 'left', dx: c.invRoot > 600 ? -10 : 10, dy: 14 });
}

function sizes(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0.1, hi: 3000, log: true }, { lo: 0, hi: 1.2 });
  axes(P, { xLabel: 'grain size d (µm)', yLabel: 'share of grains', yFmt: () => '' });
  if (state.s < 0.02) {
    seg(P, [c.dum, 0], [c.dum, 1], { color: C.gold, width: 3 });
  } else {
    const pts = Array.from({ length: 201 }, (_, i) => {
      const d = 0.1 * 30000 ** (i / 200);
      return [d, sizeDensity(state, d) * state.s * Math.sqrt(2 * Math.PI)];
    });
    poly(P, [[0.1, 0], ...pts, [3000, 0]], { fill: alpha(C.gold, 0.25), stroke: null });
    line(P, pts, { color: C.gold, width: 2 });
  }
  label(P, `median ${fig(c.dum)} µm`, [c.dum, 1], { color: C.text, dy: -10 });
}

export default defineLab({
  id: 'grain',
  exam: 'u2',
  title: 'Grain size',
  hint: 'Shrink the grains from 100 µm to 10 µm and read the yield strength. Then widen the spread at the same median.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('coarse', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'ld', lo: 0, hi: 2.5 }),
  controls() {
    return `
      <label class="field"><span>Metal</span><select id="gs-m">${Object.entries(METALS).map(([id, m]) => [id, `${m.name}: σ₀ = ${m.s0} MPa, k_y = ${m.ky} MPa·m^½`]).map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('gs-d', "Median grain size, log₁₀(d / 1 µm)", 1, 0, 2.5, 0.01)}
      ${slider('gs-s', "Spread of sizes, s in ln d", 0, 0, 0.8, 0.01)}
      <p class="tiny">Typical σ₀ and k_y for each metal. Grain sizes follow a log-normal spread about the median. Left: yield strength against d^{−1/2}, the Hall–Petch plot, for all three metals. Right: the spread of grain sizes.</p>`;
  },
  bind(api) {
    document.getElementById('gs-m')?.addEventListener('change', (e) => {
      api.slice().metal = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('gs-m');
      if (el) el.value = String(state.metal);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return hpChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      hp(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    hp(B, a, state, c);
    sizes(B, b, state, c);
  },
  law: () => [String.raw`\sigma_y = \sigma_0 + k_y\,d^{-1/2}`, String.raw`\mathrm{E}\!\left[d^{-1/2}\right] = d_{50}^{-1/2}\,e^{s^2/8}`],
  liveRows(state, c) {
    return [
      kv('Median grain size', `${fig(c.dum)} µm`),
      kv('Yield strength', mpa(c.sy)),
      kv('All grains at the median', mpa(c.single)),
      kv('Boundaries add', mpa(c.sy - c.s0)),
      kv('Closed form against the integral', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['yield', mpa(c.sy)], ['grains', `${fig(c.dum)} µm`], ['boundaries add', mpa(c.sy - c.s0)], ['σ₀', mpa(c.s0)]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Below about 20 nm the relation fails: grains too small to hold a pile-up slide at their boundaries instead, and the metal can soften. Heat also grows grains, so fine-grained parts must avoid long hot service.`;
    if (state.s > 0.2) return { title: 'A spread of sizes', body: `With the same ${fig(c.dum)} µm median, a spread s = ${fig(state.s)} gives ${mpa(c.sy)}, against ${mpa(c.single)} for uniform grains. The small grains raise the average of d^{−1/2} more than the large ones lower it. ${leavesOut}` };
    return { title: 'Boundaries stop slip', body: `Slip in one grain piles dislocations against the boundary before it can start the next grain. At ${fig(c.dum)} µm the boundaries add ${mpa(c.sy - c.s0)} to the ${mpa(c.s0)} the lattice gives: yield at ${mpa(c.sy)}. Smaller grains, shorter pile-ups, more stress needed. ${leavesOut}` };
  },
  app: false,
});
