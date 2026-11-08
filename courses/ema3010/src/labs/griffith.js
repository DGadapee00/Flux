import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { ALLOYS, crackChecked, westergaard } from '@flux/subjects/matsci/fracture.js';

/**
* Crack: a wide plate with a through crack under tension, with a choice of alloy and sliders for
 * the crack's half-length and the stress, the stress ahead of the tip and the failure map drawn.
 *
 * Shows that a safety factor on strength alone does not protect a cracked part: a 7075 aluminium
 * plate with a 10 mm half-crack breaks at 135 MPa, 27% of its yield strength. K = σ√(πa) is checked
 * against the exact elastic stress ahead of the tip, extrapolated to the tip by Richardson's method
 * (packages/subjects/src/matsci/fracture.js).
 */
const SCENARIOS = [
  { id: 'holds', name: '4340 steel, 5 mm crack, 300 MPa', alloy: 'steel', amm: 5, sigma: 300 },
  { id: 'alu', name: '7075 aluminium, 10 mm crack, 150 MPa', alloy: 'aluminium', amm: 10, sigma: 150 },
  { id: 'safety', name: '4340 at half its yield, 3 mm crack', alloy: 'steel', amm: 3, sigma: 735 },
  { id: 'titanium', name: 'Titanium, 2 mm crack, 600 MPa', alloy: 'titanium', amm: 2, sigma: 600 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, alloy: sc.alloy, amm: sc.amm, sigma: sc.sigma });
}

const KEYS = [['gf-a', 'amm'], ['gf-s', 'sigma']];

const mpa = (x) => `${fig(x)} MPa`;
const kk = (x) => `${fig(x)} MPa·m^½`;

function tip(B, rect, state, c) {
  const rmax = Math.max(1, 3 * c.rp * 1000);
  const P = plotIn(B, rect, { lo: 0, hi: rmax }, { lo: 0, hi: 3 * c.sy });
  axes(P, { xLabel: 'distance ahead of the crack tip (mm)', yLabel: 'opening stress σ_yy (MPa)' });
  if (c.rp * 1000 < rmax) poly(P, [[0, 0], [c.rp * 1000, 0], [c.rp * 1000, 3 * c.sy], [0, 3 * c.sy]], { fill: alpha(C.red, 0.15), stroke: null });
  seg(P, [0, c.sy], [rmax, c.sy], { color: alpha(C.red, 0.8), width: 1.5, dash: [6, 4] });
  label(P, `yield ${mpa(c.sy)}`, [rmax, c.sy], { color: C.red, align: 'right', dy: -10 });
  seg(P, [0, state.sigma], [rmax, state.sigma], { color: alpha(C.muted, 0.7), width: 1, dash: [3, 3] });
  label(P, `far away ${mpa(state.sigma)}`, [rmax, state.sigma], { color: C.muted, align: 'right', dy: 12 });
  const pts = Array.from({ length: 200 }, (_, i) => {
    const r = (rmax * (i + 1)) / 200;
    return [r, Math.min(3 * c.sy, westergaard(state.sigma, c.a, r / 1000))];
  });
  line(P, pts, { color: C.gold, width: 2.5 });
  label(P, `plastic zone ${fig(c.rp * 1000)} mm`, [c.rp * 1000, 2.7 * c.sy], { color: C.red, align: 'left', dx: 6 });
}

function map(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0.3, hi: 50, log: true }, { lo: 30, hi: 3000, log: true });
  axes(P, { xLabel: 'crack half-length a (mm)', yLabel: 'stress (MPa)' });
  const pts = Array.from({ length: 101 }, (_, i) => {
    const a = 0.3 * (50 / 0.3) ** (i / 100);
    return [a, c.KIc / Math.sqrt(Math.PI * a / 1000)];
  });
  line(P, pts, { color: C.red, width: 2.5 });
  label(P, 'fracture: K = K_Ic', [50, c.KIc / Math.sqrt(Math.PI * 0.05)], { color: C.red, align: 'right', dy: 14 });
  seg(P, [0.3, c.sy], [50, c.sy], { color: alpha(C.muted, 0.8), width: 1.5, dash: [5, 4] });
  label(P, 'yields above this', [0.35, c.sy], { color: C.muted, align: 'left', dy: -10 });
  dot(P, state.amm, state.sigma, { color: c.breaks ? C.red : C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'griffith',
  exam: 'u4',
  title: 'Crack',
  hint: 'Set 4340 steel at half its yield strength and grow the crack. Watch where the dot crosses the fracture curve while the stress stays far below yield.',
  gapLimit: 1e-9,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('holds', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'amm', lo: 0.5, hi: 30 }),
  controls() {
    return `
      <label class="field"><span>Alloy</span><select id="gf-al">${Object.entries(ALLOYS).map(([id, m]) => [id, `${m.name}: K_Ic = ${m.KIc} MPa·m^½, σ_y = ${m.sy} MPa`]).map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('gf-a', "Crack half-length a (mm)", 5, 0.5, 30, 0.1)}
      ${slider('gf-s', "Stress σ (MPa)", 300, 50, 1500, 10)}
      <p class="tiny">A through crack of length 2a in a plate much wider than the crack, loaded across the crack. Typical toughness and yield values. Left: the opening stress ahead of a tip, with the yield stress and Irwin’s plastic zone. Right: stress against crack length; above the curve the plate breaks, above the dashed line it yields.</p>`;
  },
  bind(api) {
    document.getElementById('gf-al')?.addEventListener('change', (e) => {
      api.slice().alloy = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('gf-al');
      if (el) el.value = String(state.alloy);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return crackChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      map(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    tip(B, a, state, c);
    map(B, b, state, c);
  },
  law: () => [String.raw`K_I = \sigma\sqrt{\pi a}, \qquad \text{fracture when } K_I \ge K_{Ic}`, String.raw`a_c = \frac{1}{\pi}\left(\frac{K_{Ic}}{\sigma}\right)^2, \qquad r_p = \frac{1}{2\pi}\left(\frac{K_I}{\sigma_y}\right)^2`],
  liveRows(state, c) {
    return [
      kv('Stress intensity K', `${kk(c.K)} of ${kk(c.KIc)}`),
      kv('Critical half-length at this stress', `${fig(c.ac * 1000)} mm`),
      kv('Breaking stress at this crack', mpa(c.sc)),
      kv('Safety factor on yield', fig(c.safety)),
      kv('Plastic zone', `${fig(c.rp * 1000)} mm`),
      kv('σ√(πa) against the tip field', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['K', kk(c.K)], ['K_Ic', kk(c.KIc)], ['breaks at', mpa(c.sc)], ['verdict', c.breaks ? 'breaks' : 'holds']]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A plate of finite width raises K by a factor Y > 1; thin sheets resist fracture better than K_Ic, which is measured thick, in plane strain; and when the plastic zone is not small next to the crack, K no longer describes the tip.`;
    if (c.breaks && !c.yields) return { title: 'It breaks below yield', body: `K = ${kk(c.K)} has reached the toughness ${kk(c.KIc)}, though the stress is only ${fig(100 / c.safety)}% of yield. A safety factor of ${fig(c.safety)} on strength did not help: at this stress a crack longer than ${fig(c.ac * 1000)} mm runs. ${leavesOut}` };
    if (c.breaks) return { title: 'It breaks', body: `K = ${kk(c.K)} exceeds the toughness and the stress is past yield as well. ${leavesOut}` };
    return { title: 'It holds, for now', body: `K = ${kk(c.K)} is below the toughness ${kk(c.KIc)}. At ${mpa(state.sigma)} the crack may grow to ${fig(c.ac * 1000)} mm before it runs; fatigue or corrosion can take it there. ${leavesOut}` };
  },
  app: false,
});
