import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, dot, label, line, poly, sceneIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { R_EARTH, kepler } from '@flux/subjects/mechanics/kepler.js';
import { transferChecked } from '@flux/subjects/mechanics/transfer.js';

/**
 * Transfer: a craft on a circular orbit fires forward, stretching its orbit into an ellipse; at the
 * Hohmann burn the ellipse just touches the target orbit, and a second burn there rounds it out.
 *
 * Shows that a forward burn raises the orbit and lengthens its period, so a craft that burns to catch
 * one ahead falls further behind: a twin left on the old circle pulls ahead each orbit. The burns
 * come from vis-viva; the second method integrates the trajectory to apogee by RK4 and reads the
 * radius and speed there (packages/subjects/src/mechanics/transfer.js).
 */
const SCENARIOS = [
  { id: 'geo', name: 'Low orbit to geostationary: Hohmann', h1: 300, h2: 35786, frac: 1, tf: 1 },
  { id: 'raise', name: 'Raise 400 km to 800 km', h1: 400, h2: 800, frac: 1, tf: 1 },
  { id: 'chase', name: 'On a 400 km orbit, no burn yet', h1: 400, h2: 800, frac: 0, tf: 1 },
  { id: 'small', name: 'A small forward burn: 30% of the raise', h1: 400, h2: 800, frac: 0.3, tf: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, h1: sc.h1, h2: sc.h2, frac: sc.frac, tf: sc.tf });
}

const KEYS = [['tr-h1', 'h1'], ['tr-h2', 'h2'], ['tr-f', 'frac'], ['tr-t', 'tf']];
const ms = (kms) => `${fig(kms * 1000)} m/s`;
const dur = (s) => (s >= 3600 ? `${fig(s / 3600)} h` : `${fig(s / 60)} min`);

export default defineLab({
  id: 'transfer',
  exam: 'u1',
  title: 'Transfer',
  hint: 'Fire a small forward burn and run the clock: the gold twin left on the old circle pulls ahead. Then fire the full Hohmann burn and the ellipse just touches the target.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('raise', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'frac', lo: 0, hi: 1.2 }),
  controls() {
    return `
      ${slider('tr-h1', 'Starting altitude (km)', 400, 200, 2000, 10)}
      ${slider('tr-h2', 'Target altitude (km)', 800, 500, 36000, 10)}
      ${slider('tr-f', 'First burn, as a share of the Hohmann burn', 1, 0, 1.2, 0.01)}
      ${slider('tr-t', 'Time since the burn, as a share of half the new orbit', 1, 0, 1, 0.01)}
      <p class="tiny">Circular orbits, in one plane, about a point-mass Earth. Teal: the starting circle. Gold dashed: the target. Pink: the orbit after the first burn. Gold dot: a twin that stayed on the starting circle.</p>`;
  },
  bind(api) {
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of KEYS) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  compute(state) {
    const h2 = Math.max(state.h2, state.h1 + 50);
    const r = transferChecked({ h1: state.h1, h2, frac: state.frac });
    const t = state.tf * (r.T / 2);
    const craft = kepler({ a: r.a, e: Math.max(r.e, 0), t });
    const twinAngle = (2 * Math.PI * t) / r.T1;
    return { ...r, h2used: h2, t, craft: [craft.x, craft.y], twin: [r.r1 * Math.cos(twinAngle), r.r1 * Math.sin(twinAngle)], hohmann: Math.abs(state.frac - 1) < 0.005 };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const reach = 1.12 * Math.max(c.r2, c.ra, c.r1);
    const cx = -(c.ra - c.r1) / 2; // centre the view on the new ellipse
    const S = sceneIn(B, B.free, { x0: Math.min(cx - reach / 1.05, -reach), x1: Math.max(cx + reach / 1.05, reach), y0: -reach, y1: reach }, 14);
    const circle = (r) => Array.from({ length: 121 }, (_, i) => [r * Math.cos((i / 120) * 2 * Math.PI), r * Math.sin((i / 120) * 2 * Math.PI)]);
    poly(S, circle(R_EARTH), { fill: alpha(C.blue, 0.45), stroke: C.blue, width: 1 });
    line(S, circle(c.r2), { color: alpha(C.gold, 0.7), width: 1.5, dash: [6, 5] });
    line(S, circle(c.r1), { color: C.teal, width: 2 });
    if (c.e > 1e-6) {
      const b = c.a * Math.sqrt(1 - c.e * c.e);
      const ell = Array.from({ length: 241 }, (_, i) => {
        const E = (i / 240) * 2 * Math.PI;
        return [c.a * (Math.cos(E) - c.e), b * Math.sin(E)];
      });
      line(S, ell, { color: C.pink, width: 2 });
    }
    // The burns: forward at perigee, and at apogee when the transfer is Hohmann.
    if (state.frac > 0) {
      arrow(S, [c.r1, 0], Math.PI / 2, 14 + 30 * Math.min(1, state.frac), { color: C.red, width: 3 });
      label(S, `Δv₁ ${ms(state.frac * c.dv1)}`, [c.r1, 0], { color: C.red, dx: 10, dy: 10, align: 'left' });
    }
    if (c.hohmann) {
      arrow(S, [-c.ra, 0], -Math.PI / 2, 30, { color: C.red, width: 3 });
      label(S, `Δv₂ ${ms(c.dv2)}`, [-c.ra, 0], { color: C.red, dx: -10, dy: -10, align: 'right' });
    }
    dot(S, ...c.twin, { color: C.gold, r: 5 });
    dot(S, ...c.craft, { color: C.yellow, r: 6, ring: C.text });
    label(S, `${dur(c.t)} after the burn`, [0, reach], { color: C.muted, base: 'top' });
  },
  law: () => [String.raw`v^2 = \mu\left(\frac2r - \frac1a\right)`, String.raw`\Delta v_1 = \sqrt{\frac{\mu}{r_1}}\left(\sqrt{\frac{2r_2}{r_1 + r_2}} - 1\right)`, String.raw`\Delta v_2 = \sqrt{\frac{\mu}{r_2}}\left(1 - \sqrt{\frac{2r_1}{r_1 + r_2}}\right)`],
  liveRows(state, c) {
    return [
      kv('Circular speeds at start and target', `${fig(c.v1)}, ${fig(c.v2)} km/s`),
      kv('Hohmann Δv₁, Δv₂, total', `${ms(c.dv1)}, ${ms(c.dv2)}, ${ms(c.total)}`),
      kv('Transfer time, half the ellipse', dur(c.tTransfer)),
      kv('This burn', ms(state.frac * c.dv1)),
      kv('Its apogee altitude', `${fig(c.ra - R_EARTH)} km`),
      kv('Its period, against the circle’s', `${dur(c.T)}, ${dur(c.T1)}`),
      kv('Behind the twin after one orbit', `${fig(c.lagKm)} km of track`),
      kv('Apogee by vis-viva, by RK4', `${fig(c.ra - R_EARTH)}, ${fig(c.raNum - R_EARTH)} km`),
      kv('Two methods differ by', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['Δv₁', ms(c.dv1)],
      ['Δv₂', ms(c.dv2)],
      ['apogee', `${fig(c.ra - R_EARTH)} km`],
      ['lag per orbit', `${fig(c.lagKm)} km`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Burns that change speed instantly, one plane, and a point-mass Earth with no drag. Real burns take minutes, and a change of plane costs far more Δv than a change of height.`;
    if (state.frac === 0) {
      return { title: 'No burn yet', body: `On the ${fig(state.h1)} km circle the craft moves at ${fig(c.v1)} km/s and goes round in ${dur(c.T1)}. Fire forward and watch what that does to the period. ${leavesOut}` };
    }
    if (c.hohmann) {
      return { title: 'A Hohmann transfer', body: `A forward burn of ${ms(c.dv1)} stretches the circle into an ellipse whose apogee just touches ${fig(c.h2used)} km. Half an orbit later, ${dur(c.tTransfer)}, the craft is there but too slow for a circle, so a second burn of ${ms(c.dv2)} rounds it out: ${ms(c.total)} in all. ${leavesOut}` };
    }
    return { title: 'Faster now, behind later', body: `The forward burn of ${ms(state.frac * c.dv1)} raises the far side of the orbit to ${fig(c.ra - R_EARTH)} km. A bigger orbit takes longer, ${dur(c.T)} against ${dur(c.T1)}, so after one orbit the twin that stayed on the circle is ${fig(c.lagKm)} km ahead. To catch a craft ahead, burn backward. ${leavesOut}` };
  },
  app: false,
});
