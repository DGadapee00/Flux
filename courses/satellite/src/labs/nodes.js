import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { CRAFT, nodesChecked, nodesClosed } from '@flux/subjects/heat/twonode.js';

/**
* Two faces: a spacecraft modelled as a sunlit face and a radiator joined by a conductive link,
 * with sliders for the link and a heater and a choice of sunlight, the two temperatures drawn.
 *
 * Shows that one temperature for the whole craft hides the design problem: with no link the sunlit
 * face reaches 88 °C while the electronics on the radiator freeze at −85 °C. A 1 W/K link brings
 * them to 60 °C and 4 °C. In an orbit with eclipses, a heater and a stronger link keep the
 * electronics above −10 °C. The Newton solution is checked by marching both faces in time
 * (packages/subjects/src/heat/twonode.js).
 */
const SCENARIOS = [
  { id: 'nolink', name: 'Full sun, no link', G: 0, H: 0, sun: 'sun' },
  { id: 'link', name: 'Full sun, a 1 W/K link', G: 1, H: 0, sun: 'sun' },
  { id: 'cold', name: 'With eclipses, 1 W/K, no heater', G: 1, H: 0, sun: 'average' },
  { id: 'fixed', name: 'With eclipses, 3 W/K and a 5 W heater', G: 3, H: 5, sun: 'average' },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, G: sc.G, H: sc.H, sun: sc.sun });
}

const KEYS = [['tn-g', 'G'], ['tn-h', 'H']];

function march(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 40 }, { lo: -120, hi: 120 });
  axes(P, { xLabel: 'time (hours)', yLabel: 'temperature (°C)' });
  poly(P, [[0, CRAFT.lo], [40, CRAFT.lo], [40, CRAFT.hi], [0, CRAFT.hi]], { fill: alpha(C.green, 0.12), stroke: null });
  label(P, 'electronics’ range', [40, CRAFT.hi], { color: C.green, align: 'right', dy: -8 });
  line(P, c.path.map((p) => [p[0], p[1]]), { color: C.red, width: 2.5 });
  line(P, c.path.map((p) => [p[0], p[2]]), { color: C.blue, width: 2.5 });
  label(P, `sunlit face ${fig(c.T1c)} °C`, [40, c.T1c], { color: C.red, align: 'right', dy: c.T1c > c.T2c ? -10 : 14 });
  label(P, `radiator ${fig(c.T2c)} °C`, [40, c.T2c], { color: C.blue, align: 'right', dy: c.T1c > c.T2c ? 14 : -10 });
}

function vsLink(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 15 }, { lo: -120, hi: 120 });
  axes(P, { xLabel: 'link conductance G (W/K)', yLabel: 'steady temperature (°C)' });
  poly(P, [[0, CRAFT.lo], [15, CRAFT.lo], [15, CRAFT.hi], [0, CRAFT.hi]], { fill: alpha(C.green, 0.12), stroke: null });
  const gs = Array.from({ length: 61 }, (_, i) => i / 4);
  const rows = gs.map((G) => nodesClosed({ ...state, G }));
  line(P, gs.map((G, i) => [G, rows[i].T1c]), { color: C.red, width: 2.5 });
  line(P, gs.map((G, i) => [G, rows[i].T2c]), { color: C.blue, width: 2.5 });
  dot(P, state.G, c.T1c, { color: C.pink, r: 5 });
  dot(P, state.G, c.T2c, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'nodes',
  exam: 'u6',
  title: 'Two faces',
  hint: 'With no link, read both temperatures. Then strengthen the link, and switch to an orbit with eclipses.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('nolink', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'G', lo: 0, hi: 15 }),
  controls() {
    return `
      <label class="field"><span>Sunlight</span><select id="tn-s">${[['sun', 'Full sun: a dawn–dusk orbit'], ['average', 'Orbit average with eclipses: 61%']].map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('tn-g', "Conductive link G (W/K)", 1, 0, 15, 0.1)}
      ${slider('tn-h', "Heater on the radiator (W)", 0, 0, 30, 0.5)}
      <p class="tiny">Each face 0.25 m², α = 0.6 and ε = 0.85 on the sunlit face, ε = 0.85 on the radiator, 15 W of electronics on the radiator, 4 kJ/K per face. The electronics must stay between −10 °C and 40 °C. Left: both faces warming from 20 °C. Right: steady temperatures against the link’s conductance.</p>`;
  },
  bind(api) {
    document.getElementById('tn-s')?.addEventListener('change', (e) => {
      api.slice().sun = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('tn-s');
      if (el) el.value = String(state.sun);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return nodesChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      vsLink(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    march(B, a, state, c);
    vsLink(B, b, state, c);
  },
  law: () => [String.raw`\alpha S A_1 - \varepsilon\sigma A_1T_1^4 - G(T_1 - T_2) = 0`, String.raw`Q + H + G(T_1 - T_2) - \varepsilon\sigma A_2T_2^4 = 0`],
  liveRows(state, c) {
    return [
      kv('Sunlit face', `${fig(c.T1c)} °C`),
      kv('Radiator with the electronics', `${fig(c.T2c)} °C`),
      kv('Heat through the link', `${fig(c.flow)} W`),
      kv('Electronics in range?', c.ok ? 'yes' : 'no'),
      kv('Newton against the time march', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['radiator', `${fig(c.T2c)} °C`], ['sunlit face', `${fig(c.T1c)} °C`], ['link', `${fig(c.flow)} W`], ['in range', c.ok ? 'yes' : 'no']]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real craft have many faces and boxes, radiation between them inside the craft, Earth’s infrared and reflected sunlight, and an eclipse that swings the temperatures each orbit around these means.`;
    if (c.T2c < CRAFT.lo) return { title: 'The electronics are too cold', body: `The radiator settles at ${fig(c.T2c)} °C, below −10 °C. ${state.G < 0.5 ? 'With almost no link, the Sun’s heat stays on the far face.' : 'More link brings the Sun’s heat across; a heater adds its own.'} ${leavesOut}` };
    if (c.T2c > CRAFT.hi) return { title: 'The electronics are too hot', body: `The radiator settles at ${fig(c.T2c)} °C: it cannot shed the electronics’ heat and the Sun’s. A larger radiator or a weaker link would cool it. ${leavesOut}` };
    return { title: 'In range', body: `The link carries ${fig(c.flow)} W from the sunlit face to the radiator, which settles at ${fig(c.T2c)} °C with the electronics, inside their −10 °C to 40 °C range. ${leavesOut}` };
  },
  app: false,
});
