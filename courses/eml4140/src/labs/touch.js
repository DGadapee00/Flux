import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { BODIES, SKIN, contactChecked } from '@flux/subjects/heat/contact.js';

/**
* Touch: a hand at 34 °C on a block of steel, aluminium, glass, wood or foam, the temperature across
 * the joint drawn after a second.
 *
 * Shows that metal feels cold because it draws heat fast, not because it is colder: at the same 20 °C,
 * steel pulls the skin's surface to 21 °C and wood only to 31 °C, because steel's effusivity √(kρc) is
 * 42 times wood's. The contact temperature comes in closed form; the second method marches both bodies
 * by finite differences (packages/subjects/src/heat/contact.js).
 */
const SCENARIOS = [
  {
    id: 'steel',
    name: 'Steel at 20 °C',
    body: 'steel',
    Tb: 20
  },
  {
    id: 'wood',
    name: 'Wood at 20 °C',
    body: 'wood',
    Tb: 20
  },
  {
    id: 'glass',
    name: 'Glass at 20 °C',
    body: 'glass',
    Tb: 20
  },
  {
    id: 'hot',
    name: 'Steel at 60 °C',
    body: 'steel',
    Tb: 60
  }
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, body: sc.body, Tb: sc.Tb });
}

const KEYS = [['tc-t', 'Tb']];

const degC = (T) => `${fig(T)} °C`;

function joint(B, rect, state, c) {
  const lo = Math.min(state.Tb, SKIN.T) - 5;
  const hi = Math.max(state.Tb, SKIN.T) + 5;
  const P = plotIn(B, rect, { lo: -2, hi: 2 }, { lo, hi });
  axes(P, { xLabel: 'distance from the joint (mm): skin left, block right', yLabel: 'temperature (°C)' });
  const pts = Array.from({ length: 201 }, (_, i) => {
    const x = -2 + (4 * i) / 200;
    return [x, c.profile(x / 1000, 1)];
  });
  line(P, pts.filter((p) => p[0] <= 0), { color: C.pink, width: 3 });
  line(P, pts.filter((p) => p[0] >= 0), { color: C.teal, width: 3 });
  seg(P, [0, lo], [0, hi], { color: alpha(C.muted, 0.5), width: 1, dash: [3, 3] });
  dot(P, 0, c.Tc, { color: C.gold, r: 6, ring: C.text });
  label(P, `joint ${degC(c.Tc)}`, [0, c.Tc], { color: C.gold, align: 'left', dx: 10, dy: -12 });
}

function compare(B, rect, state, c) {
  const ids = Object.keys(BODIES);
  const e1 = Math.sqrt(SKIN.k * SKIN.rho * SKIN.c);
  const vals = ids.map((id) => {
    const b = BODIES[id];
    const e2 = Math.sqrt(b.k * b.rho * b.c);
    return (e1 * SKIN.T + e2 * state.Tb) / (e1 + e2);
  });
  const lo = Math.min(state.Tb, SKIN.T) - 3;
  const hi = Math.max(state.Tb, SKIN.T) + 3;
  const P = plotIn(B, rect, { lo: -0.6, hi: ids.length - 0.4 }, { lo, hi });
  axes(P, { yLabel: 'contact temperature (°C)', xFmt: () => '' });
  seg(P, [-0.6, SKIN.T], [ids.length - 0.4, SKIN.T], { color: alpha(C.pink, 0.6), width: 1, dash: [5, 4] });
  vals.forEach((v, k) => {
    poly(P, [[k - 0.3, lo], [k + 0.3, lo], [k + 0.3, v], [k - 0.3, v]], { fill: alpha(ids[k] === state.body ? C.gold : C.teal, 0.75), stroke: null });
    label(P, BODIES[ids[k]].name.split(' ').pop(), [k, lo], { color: C.muted, dy: 12 });
  });
}

export default defineLab({
  id: 'touch',
  exam: 'u1',
  title: 'Touch',
  hint: 'Touch steel, then wood, at the same temperature. The joint sits near the steel’s temperature but near the skin’s for wood.',
  gapLimit: 5e-3,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('steel', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'Tb', lo: -20, hi: 80 }),
  controls() {
    return `
      <label class="field"><span>Block</span><select id="tc-b">${Object.entries(BODIES).map(([id, b]) => [id, b.name]).map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('tc-t', "Block temperature (°C)", 20, -20, 80, 1)}
      <p class="tiny">Skin at 34 °C with k = 0.37 W/(m·K), ρ = 1000 kg/m³, c = 3500 J/(kg·K). Left: temperature across the joint 1 s after touching, skin on the left. Right: the contact temperature each block gives at this block temperature.</p>`;
  },
  bind(api) {
    document.getElementById('tc-b')?.addEventListener('change', (e) => {
      api.slice().body = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('tc-b');
      if (el) el.value = String(state.body);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return contactChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      joint(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    joint(B, a, state, c);
    compare(B, b, state, c);
  },
  law: () => [String.raw`T_c = \frac{e_1T_1 + e_2T_2}{e_1 + e_2}, \qquad e = \sqrt{k\rho c}`, String.raw`T = T_c + (T_\infty - T_c)\,\mathrm{erf}\frac{|x|}{2\sqrt{\alpha t}}`],
  liveRows(state, c) {
    return [
      kv('Effusivity: skin, block', `${fig(c.e1)}, ${fig(c.e2)} W·s^½/(m²·K)`),
      kv('Contact temperature', degC(c.Tc)),
      kv('Heat flux out of the skin at 1 s', `${fig(c.q1 / 1000)} kW/m²`),
      kv('Finite differences at 1 s', degC(c.Tnum)),
      kv('Two methods, as a share of the temperature gap', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['contact', degC(c.Tc)], ['block', degC(state.Tb)], ['skin', degC(SKIN.T)], ['flux at 1 s', `${fig(c.q1 / 1000)} kW/m²`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real contact is imperfect: rough surfaces touch at points, and that contact resistance keeps the skin warmer at first; blood flow also warms the skin from inside.`;
    const pull = (SKIN.T - c.Tc) / Math.max(SKIN.T - state.Tb, 1e-9);
    return { title: pull > 0.5 ? 'It draws heat fast: it feels cold' : 'It draws heat slowly: it feels warm', body: `The joint settles at once to ${degC(c.Tc)}, weighted by effusivity: the skin's is ${fig(c.e1)}, the ${BODIES[state.body].name.toLowerCase()}'s ${fig(c.e2)}. Your nerves read the joint, not the block, so at the same ${degC(state.Tb)} steel feels far colder than wood. ${leavesOut}` };
  },
  app: false,
});
