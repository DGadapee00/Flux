/** Shows that surface and volume use different generating centroids, even for the same sphere. */
import { defineLab } from './define2d.js';
import { pappusArea, pappusVolume } from '@flux/subjects/mechanics/sections.js';
import { begin, sceneIn, seg, poly, note, C } from './diagram.js';
import { slider, bindSlider } from './widgets.js';
import { cells, kv } from '../ui/shared.js';
import { prediction } from './device-kit.js';
const scenarios = [
  { id: 'torus', name: 'Circular area, off-axis: torus', shape: 'torus', R: 5, a: 1 },
  { id: 'sphere', name: 'Semicircular area, edge axis: sphere', shape: 'sphere', R: 5, a: 2 },
];
const integrate = (f, lo, hi) => {
  const n = 200,
    h = (hi - lo) / n;
  let total = f(lo) + f(hi);
  for (let i = 1; i < n; i++) total += (i % 2 ? 4 : 2) * f(lo + i * h);
  return (total * h) / 3;
};
export default defineLab({
  id: 'pappus',
  exam: 'u4',
  title: 'Pappus',
  app: false,
  hint: 'An area centroid is not a curve centroid',
  scenarios,
  defaultState: () => ({ ...scenarios[0], scenarioId: 'torus' }),
  applyScenario(id, s) {
    Object.assign(s, scenarios.find((x) => x.id === id) || scenarios[0]);
    s.scenarioId = s.id;
  },
  controls: () =>
    slider('pp-R', 'Circle centre from axis R (in)', 5, 1, 12, 0.1) +
    slider('pp-a', 'Generating radius a (in)', 1, 0.5, 5, 0.1),
  bind(api) {
    for (const k of ['R', 'a'])
      bindSlider(
        `pp-${k}`,
        (s, v) => {
          s[k] = v;
        },
        api,
      );
  },
  syncControls(s) {
    for (const k of ['R', 'a']) {
      const el = document.getElementById(`pp-${k}`);
      if (el && document.activeElement !== el) el.value = s[k];
    }
  },
  compute(s) {
    const { a, R } = s,
      sphere = s.shape === 'sphere',
      valid = sphere || R > a;
    const area = sphere ? (Math.PI * a * a) / 2 : Math.PI * a * a;
    const length = sphere ? Math.PI * a : 2 * Math.PI * a;
    const rArea = sphere ? (4 * a) / (3 * Math.PI) : R,
      rCurve = sphere ? (2 * a) / Math.PI : R;
    const V = pappusVolume(rArea, area),
      S = pappusArea(rCurve, length);
    // A second method: washers for volume, direct curve-of-revolution integration for surface.
    const Vnum = integrate(
      (t) => (sphere ? Math.PI * a ** 3 * Math.cos(t) ** 3 : 4 * Math.PI * R * a * a * Math.cos(t) ** 2),
      -Math.PI / 2,
      Math.PI / 2,
    );
    const Snum = integrate(
      (t) => 2 * Math.PI * a * (sphere ? a * Math.cos(t) : R + a * Math.cos(t)),
      sphere ? -Math.PI / 2 : 0,
      sphere ? Math.PI / 2 : 2 * Math.PI,
    );
    return {
      valid,
      V,
      S,
      rArea,
      rCurve,
      Vnum,
      Snum,
      gap: Math.max(Math.abs(V - Vnum) / V, Math.abs(S - Snum) / S),
    };
  },
  law: () => [String.raw`V=2\pi\bar r_A A,\qquad S=2\pi\bar r_L L`],
  liveRows(s, c) {
    if (!c.valid) return 'The axis crosses the generating area. These Pappus formulas do not apply.';
    return [
      kv('area centroid from axis', `${c.rArea.toFixed(4)} in`),
      kv('curve centroid from axis', `${c.rCurve.toFixed(4)} in`),
      kv('washer volume check', `${c.Vnum.toFixed(3)} in³`),
    ].join('');
  },
  readout(s, c) {
    return c.valid
      ? cells([
          ['surface area', `${c.S.toFixed(3)} in²`],
          ['volume', `${c.V.toFixed(3)} in³`],
        ])
      : cells([['axis intersection', 'outside this model']]);
  },
  coach: () => ({
    title: 'Follow the generating centroid',
    body: 'The filled shape generates volume; its curved boundary generates surface area. For a semicircle their centroids differ. The dashed reflection shows the opposite side of the revolved solid in cross section. Inputs are assumed teaching geometry. <b>What the course model leaves out.</b> The axis must not cross the generating interior. Thin shells, thickness, density and overlapping sweeps require separate treatment.',
  }),
  draw(canvas, s) {
    const B = begin(canvas),
      max = s.shape === 'sphere' ? s.a : s.R + s.a;
    const P = sceneIn(B, B.free, { x0: -max * 1.3, x1: max * 1.3, y0: -s.a * 1.6, y1: s.a * 1.6 });
    seg(P, [0, -s.a * 1.3], [0, s.a * 1.3], { color: C.muted, dash: [4, 4] });
    const curve = (side) =>
      Array.from({ length: 65 }, (_, i) => {
        const t = s.shape === 'sphere' ? -Math.PI / 2 + (i * Math.PI) / 64 : (i * 2 * Math.PI) / 64;
        return [side * ((s.shape === 'sphere' ? 0 : s.R) + s.a * Math.cos(t)), s.a * Math.sin(t)];
      });
    poly(P, curve(-1), { stroke: C.dim, dash: [3, 3] });
    poly(P, curve(1), { stroke: C.teal, fill: 'rgba(92,208,179,0.15)' });
    note(P, 'rotation axis', 0, s.a * 1.3);
    note(P, 'cross section (in)', -max, -s.a * 1.3);
  },
  predictions: [
    {
      ...prediction(
        'centroid',
        'sphere',
        'Double the generating semicircle radius a. By what factor does the sphere volume change?',
        (s) => (s.a *= 2),
        (c) => c.V,
        'bigger',
        'Volume grows by eight because both area and centroid travel radius grow.',
      ),
      mode: 'factor',
      factors: [8, 4, 2, 1],
      expect: { q: 8 },
    },
    prediction(
      'offset',
      'torus',
      'Double R while holding the generating circle fixed. What happens to the generating area centroid’s distance from the rotation axis?',
      (s) => (s.R *= 2),
      (c) => c.rArea,
      'bigger',
      'The centroid follows the circle centre. Confusing this distance with the generating radius gives the wrong sweep.',
    ),
  ],
});
