import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, begin, dot, label, line, poly, sceneIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { positionYield, positionYieldNumeric } from '@flux/subjects/design/tolerancing.js';
import { createRng } from '@flux/subjects/stats/rng.js';

/**
 * Position: where a drilled hole lands, against a square plus-and-minus box and a round position zone.
 *
 * Shows why GD&T places holes with a circle. A hole at the box's corner is √2 times further from
 * true position than one at the middle of an edge, yet the box accepts it and rejects the other. The
 * circle through the box's corners accepts every hole the box does, and 57% more area, all of it
 * holes no further off than the box already allows. The closed forms are a product of normal areas
 * (box) and a Rayleigh distance (circle); the second method integrates the scatter over each zone in
 * 2D (packages/subjects/src/design/tolerancing.js).
 */
const ZONES = {
  box: { name: 'Square box, ±t' },
  circle: { name: 'Position zone ⌀2√2 t, through the corners' },
  small: { name: 'Position zone ⌀2t, inside the box' },
};

const SCENARIOS = [
  { id: 'capable', name: 'A capable drill, box', t: 0.1, sigma: 0.03, zone: 'box' },
  { id: 'loose', name: 'A looser drill, box', t: 0.1, sigma: 0.05, zone: 'box' },
  { id: 'circle', name: 'The looser drill, position zone', t: 0.1, sigma: 0.05, zone: 'circle' },
  { id: 'small', name: 'A circle no wider than the box', t: 0.1, sigma: 0.05, zone: 'small' },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, t: sc.t, sigma: sc.sigma, zone: sc.zone });
}

const diaFor = (state) => (state.zone === 'small' ? 2 * state.t : 2 * Math.SQRT2 * state.t);

export default defineLab({
  id: 'position',
  exam: 'u2',
  title: 'Position',
  hint: 'Switch the box for the circle through its corners: the same good holes pass, and so do the ones the box threw away at the middle of each edge.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('loose', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'sigma', lo: 0.01, hi: 0.15 }),
  controls() {
    return `
      <label class="field"><span>Inspect by</span><select id="po-zone">${Object.entries(ZONES).map(([id, z]) => `<option value="${id}">${z.name}</option>`).join('')}</select></label>
      ${slider('po-t', 'box half-width t (mm)', 0.1, 0.05, 0.2, 0.005)}
      ${slider('po-s', 'drill scatter σ (mm)', 0.05, 0.01, 0.15, 0.001)}
      <p class="tiny">Holes scatter round the true position, equally in every direction. The dots are 600 holes from one seeded run: green pass both checks, yellow pass only the circle, pink only the box.</p>`;
  },
  bind(api) {
    document.getElementById('po-zone')?.addEventListener('change', (e) => {
      api.slice().zone = e.target.value;
      api.bump();
    });
    bindSlider('po-t', (s, v) => { s.t = v; }, api);
    bindSlider('po-s', (s, v) => { s.sigma = v; }, api);
  },
  syncControls(state) {
    const sel = document.getElementById('po-zone');
    if (sel) sel.value = state.zone;
    for (const [id, val] of [['po-t', state.t], ['po-s', state.sigma]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const dia = diaFor(state);
    const spec = { t: state.t, sigma: state.sigma, dia };
    const a = positionYield(spec);
    const n = positionYieldNumeric(spec, Math.min(400, Math.max(120, Math.ceil((20 * state.t) / state.sigma))));
    const gap = Math.max(Math.abs(n.box - a.box), Math.abs(n.circle - a.circle));
    const accepted = state.zone === 'box' ? a.box : a.circle;
    const areaRatio = (Math.PI * dia * dia) / 4 / (4 * state.t * state.t);
    const rng = createRng(7);
    const holes = Array.from({ length: 600 }, () => [rng.normal(0, state.sigma), rng.normal(0, state.sigma)]);
    return { dia, box: a.box, circle: a.circle, accepted, areaRatio, holes, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const R = Math.max(c.dia / 2, state.t * Math.SQRT2, 3.2 * state.sigma) * 1.15;
    const P = sceneIn(B, B.free, { x0: -R, x1: R, y0: -R, y1: R }, 24);
    const t = state.t;
    const r = c.dia / 2;
    const ring = Array.from({ length: 97 }, (_, i) => [r * Math.cos((i / 96) * 2 * Math.PI), r * Math.sin((i / 96) * 2 * Math.PI)]);
    const boxOn = state.zone === 'box';
    poly(P, [[-t, -t], [t, -t], [t, t], [-t, t]], { fill: boxOn ? alpha(C.pink, 0.1) : null, stroke: C.pink, width: boxOn ? 2.5 : 1.2, dash: boxOn ? null : [5, 4] });
    poly(P, ring, { fill: boxOn ? null : alpha(C.teal, 0.1), stroke: C.teal, width: boxOn ? 1.2 : 2.5, dash: boxOn ? [5, 4] : null });
    for (const [x, y] of c.holes) {
      const inBox = Math.abs(x) <= t && Math.abs(y) <= t;
      const inCircle = x * x + y * y <= r * r;
      // Green: both accept. Yellow: the circle accepts a hole the box rejects. Pink: the reverse.
      const color = inBox && inCircle ? alpha(C.green, 0.8) : inCircle ? C.yellow : inBox ? C.pink : alpha(C.red, 0.7);
      dot(P, x, y, { color, r: inBox !== inCircle ? 3.4 : 2.2 });
    }
    line(P, [[-R * 0.08, 0], [R * 0.08, 0]], { color: C.text, width: 1 });
    line(P, [[0, -R * 0.08], [0, R * 0.08]], { color: C.text, width: 1 });
    label(P, 'true position', [0, 0], { color: C.text, dy: 14 });
    label(P, `box ±${fig(t)}`, [t, t], { color: C.pink, align: 'left', dx: 6, dy: -6 });
    label(P, `⌀${fig(c.dia)}`, [r * Math.cos(-0.6), r * Math.sin(-0.6)], { color: C.teal, align: 'left', dx: 8 });
  },
  law: () => [String.raw`P_\text{box} = \left(2\Phi(t/\sigma) - 1\right)^2`, String.raw`P_\text{circle} = 1 - e^{-r^2/2\sigma^2},\quad r = \tfrac{\varnothing}{2}`],
  liveRows(state, c) {
    return [
      kv('box accepts', `${fig(c.box * 100)}%`),
      kv(`circle ⌀${fig(c.dia)} accepts`, `${fig(c.circle * 100)}%`),
      kv('zone area against the box', `${fig(c.areaRatio)}×`),
      kv('closed form against 2D Simpson', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['accepted', `${fig(c.accepted * 100)}%`],
      ['box', `${fig(c.box * 100)}%`],
      ['circle', `${fig(c.circle * 100)}%`],
      ['zone ⌀', `${fig(c.dia)} mm`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The drill is centred on the true position and scatters the same in every direction. A worn fixture shifts the whole cloud, and a position tolerance at maximum material condition grants extra room as the hole grows.`;
    let title = 'The box rejects good holes';
    let body = String.raw`A hole ${fig(state.t)} mm out at the box's corner is ${fig(state.t * Math.SQRT2)} mm from true position, and the box accepts it. A hole the same distance off along an edge is rejected. Yellow dots would pass a position zone through the corners.`;
    if (state.zone === 'circle') {
      title = 'The circle through the corners';
      body = String.raw`Every hole the box accepted still passes, and so do the ones it rejected that sit no further off than its corners. The yield rises from ${fig(c.box * 100)}% to ${fig(c.circle * 100)}%, with no hole worse than before.`;
    } else if (state.zone === 'small') {
      title = 'A circle as wide as the box is stricter';
      body = String.raw`A ⌀${fig(c.dia)} zone sits inside the box, so it accepts only ${fig(c.circle * 100)}% against the box's ${fig(c.box * 100)}%. Converting a plus-and-minus box to position means the circle through its corners, ⌀2√2 t.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});
