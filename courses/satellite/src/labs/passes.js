import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { EARTH, passesChecked, passesClosed } from '@flux/subjects/mechanics/passes.js';

/**
* Passes: a circular orbit with sliders for altitude and the ground station's elevation mask, the
 * Earth's shadow and the station's view drawn, with eclipse and pass times read out.
 *
 * Shows what the mission timeline looks like: at 400 km each 92-minute orbit spends 36 minutes in
 * shadow, and a station that needs 10° of elevation sees an overhead pass for only 6.2 minutes. At
 * 2000 km the pass lasts 22 minutes while the eclipse barely changes. The closed forms are checked by
 * integrating the orbit and adding up the time in shadow and in view
 * (packages/subjects/src/mechanics/passes.js).
 */
const SCENARIOS = [
  { id: 'iss', name: '400 km, 10° mask', hkm: 400, eps: 10 },
  { id: 'horizon', name: '400 km, down to the horizon', hkm: 400, eps: 0 },
  { id: 'leo800', name: '800 km, 10° mask', hkm: 800, eps: 10 },
  { id: 'high', name: '2000 km, 10° mask', hkm: 2000, eps: 10 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, hkm: sc.hkm, eps: sc.eps });
}

const KEYS = [['ps-h', 'hkm'], ['ps-e', 'eps']];

function square(r) {
  const s = Math.min(r.x1 - r.x0, r.y1 - r.y0);
  const cx = (r.x0 + r.x1) / 2;
  const cy = (r.y0 + r.y1) / 2;
  return { ...r, x0: cx - s / 2, x1: cx + s / 2, y0: cy - s / 2, y1: cy + s / 2 };
}

function orbit(B, rect, state, c) {
  const R = EARTH.R;
  const L = c.r * 1.25;
  const P = plotIn(B, square(rect), { lo: -L, hi: L }, { lo: -L, hi: L });
  axes(P, { xLabel: 'km', yLabel: 'km', xFmt: () => '', yFmt: () => '' });
  poly(P, [[0, -R], [L, -R], [L, R], [0, R]], { fill: alpha(C.muted, 0.25), stroke: null });
  const circ = (rad, a0 = 0, a1 = 2 * Math.PI) => Array.from({ length: 181 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / 180;
    return [rad * Math.cos(a), rad * Math.sin(a)];
  });
  poly(P, circ(R), { fill: alpha(C.blue, 0.35), stroke: null });
  line(P, circ(c.r), { color: alpha(C.text, 0.6), width: 1.5 });
  line(P, circ(c.r, -c.lam, c.lam), { color: C.gold, width: 4 });
  const shadowHalf = Math.asin(R / c.r);
  line(P, circ(c.r, -shadowHalf, shadowHalf).map(([x, y]) => [x, y]), { color: C.gold, width: 0 });
  line(P, circ(c.r, Math.PI - shadowHalf, Math.PI + shadowHalf).map(([x, y]) => [-x, y]), { color: C.muted, width: 4 });
  dot(P, R, 0, { color: C.green, r: 5 });
  label(P, 'station', [R, 0], { color: C.green, align: 'right', dx: -8 });
  label(P, `in view ${fig(c.tpmin)} min`, [c.r * Math.cos(c.lam), c.r * Math.sin(c.lam)], { color: C.gold, align: 'left', dx: 6, dy: -6 });
  label(P, `shadow ${fig(c.temin)} min`, [c.r, -c.r * 0.95], { color: C.muted, align: 'left', dx: 4 });
  label(P, 'Sun this way ←', [-L * 0.95, L * 0.9], { color: C.gold, align: 'left' });
}

function times(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 200, hi: 2000 }, { lo: 0, hi: 40 });
  axes(P, { xLabel: 'altitude (km)', yLabel: 'minutes per orbit' });
  const hs = Array.from({ length: 91 }, (_, i) => 200 + 20 * i);
  line(P, hs.map((h) => [h, passesClosed({ hkm: h, eps: state.eps }).temin]), { color: C.muted, width: 2.5 });
  line(P, hs.map((h) => [h, passesClosed({ hkm: h, eps: state.eps }).tpmin]), { color: C.gold, width: 2.5 });
  label(P, 'eclipse', [2000, passesClosed({ hkm: 2000, eps: state.eps }).temin], { color: C.muted, align: 'right', dy: -10 });
  label(P, 'overhead pass', [2000, passesClosed({ hkm: 2000, eps: state.eps }).tpmin], { color: C.gold, align: 'right', dy: 14 });
  dot(P, state.hkm, c.temin, { color: C.pink, r: 5 });
  dot(P, state.hkm, c.tpmin, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'passes',
  exam: 'u1',
  title: 'Passes',
  hint: 'Raise the orbit from 400 km to 2000 km: the pass grows more than threefold, the eclipse hardly at all.',
  gapLimit: 2e-3,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('iss', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'hkm', lo: 200, hi: 2000 }),
  controls() {
    return `
      ${slider('ps-h', "Altitude (km)", 400, 200, 2000, 10)}
      ${slider('ps-e', "Station elevation mask (°)", 10, 0, 30, 1)}
      <p class="tiny">A circular orbit with the Sun in its plane, Earth’s shadow a cylinder, and the station passed overhead; Earth’s rotation is left out. Left: the orbit, the shadow (grey) and the arc the station can see (gold). Right: eclipse and pass length against altitude.</p>`;
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
    return passesChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      orbit(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    orbit(B, a, state, c);
    times(B, b, state, c);
  },
  law: () => [String.raw`T = 2\pi\sqrt{r^3/\mu}, \qquad t_\text{eclipse} = \frac{T}{\pi}\arcsin\frac{R}{r}`, String.raw`\lambda = \arccos\!\left(\frac{R}{r}\cos\varepsilon\right) - \varepsilon, \qquad t_\text{pass} = \frac{T\lambda}{\pi}`],
  liveRows(state, c) {
    return [
      kv('Period', `${fig(c.Tmin)} min`),
      kv('Eclipse', `${fig(c.temin)} min, ${fig(100 * c.fe)}% of the orbit`),
      kv('Overhead pass above the mask', `${fig(c.tpmin)} min`),
      kv('Ground track seen', `${fig(c.rangeKm)} km`),
      kv('Closed forms against the integrated orbit', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['eclipse', `${fig(c.temin)} min`], ['pass', `${fig(c.tpmin)} min`], ['period', `${fig(c.Tmin)} min`], ['altitude', `${fig(state.hkm)} km`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Earth turns under the orbit, so most passes are not overhead and are shorter; the Sun is rarely in the orbit plane, so some orbits have no eclipse at all; and the shadow has a penumbra.`;
    return { title: 'The mission’s clock', body: `Each ${fig(c.Tmin)}-minute orbit spends ${fig(c.temin)} minutes in shadow, which the battery must cover, and the station sees at most ${fig(c.tpmin)} minutes of it, which the link must use. Higher orbits see the station longer, but take longer to go round. ${leavesOut}` };
  },
  app: false,
});
