import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, begin, dot, label, line, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { R_EARTH, integrate, kepler, orbitFromAltitudes } from '@flux/subjects/mechanics/kepler.js';

/**
 * Kepler: an elliptical orbit with a clock. Slide the time since perigee and watch the craft race
 * through perigee and crawl round apogee.
 *
 * Shows that a quarter of the period does not move the craft a quarter of the way round: from
 * perigee, a geostationary transfer orbit carries it to 156° in a quarter period. The dots mark equal
 * slices of time, crowded near apogee. The position comes from Kepler's equation solved by Newton's
 * method, and is checked against the equations of motion integrated by RK4
 * (packages/subjects/src/mechanics/kepler.js).
 */
export const ORBITS = {
  gto: { name: 'Geostationary transfer orbit', hp: 250, ha: 35786 },
  molniya: { name: 'Molniya orbit', hp: 600, ha: 39700 },
  iss: { name: 'The ISS, nearly circular', hp: 415, ha: 422 },
  meo: { name: 'A mildly eccentric orbit', hp: 2000, ha: 12000 },
};

const SCENARIOS = [
  { id: 'gto', name: 'A transfer orbit, a quarter period from perigee', orbit: 'gto', frac: 0.25 },
  { id: 'gto-apogee', name: 'The same at apogee, half a period on', orbit: 'gto', frac: 0.5 },
  { id: 'molniya', name: 'A Molniya orbit: 12 hours, mostly over the north', orbit: 'molniya', frac: 0.25 },
  { id: 'iss', name: 'The ISS: a quarter period is a quarter turn', orbit: 'iss', frac: 0.25 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((x) => x.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, orbit: sc.orbit, frac: sc.frac });
}

const hm = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.round((s - 3600 * h) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
};
const deg = (rad) => (rad * 180) / Math.PI;

export default defineLab({
  id: 'kepler',
  exam: 'u1',
  title: 'Kepler',
  hint: 'Move the clock a quarter period past perigee and read the angle: well past 90° on an eccentric orbit. The dots are equal slices of time.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('gto', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'frac', lo: 0, hi: 0.999 }),
  controls() {
    return `
      <label class="field"><span>Orbit</span><select id="kp-orbit">${Object.entries(ORBITS).map(([id, o]) => `<option value="${id}">${o.name}</option>`).join('')}</select></label>
      ${slider('kp-frac', 'Time since perigee, as a share of the period', 0.25, 0, 0.999, 0.001)}
      <p class="tiny">Earth to scale. Altitudes above a 6378 km equator; μ = 398600 km³/s². Grey dots: positions at every twentieth of the period.</p>`;
  },
  bind(api) {
    document.getElementById('kp-orbit')?.addEventListener('change', (e) => {
      api.slice().orbit = e.target.value;
      api.bump();
    });
    bindSlider('kp-frac', (s, v) => { s.frac = v; }, api);
  },
  syncControls(state) {
    const o = document.getElementById('kp-orbit');
    if (o) o.value = state.orbit;
    const f = document.getElementById('kp-frac');
    if (f && document.activeElement !== f) f.value = String(state.frac);
  },
  compute(state) {
    const spec = ORBITS[state.orbit] || ORBITS.gto;
    const o = orbitFromAltitudes(spec.hp, spec.ha);
    const t = state.frac * o.T;
    const k = kepler({ a: o.a, e: o.e, t });
    const n = integrate({ a: o.a, e: o.e, t });
    const gap = Math.hypot(n.x - k.x, n.y - k.y) / o.a;
    const ticks = [];
    for (let i = 0; i < 20; i++) {
      const p = kepler({ a: o.a, e: o.e, t: (i / 20) * o.T });
      ticks.push([p.x, p.y]);
    }
    return { ...o, ...k, spec, t, altitude: k.r - R_EARTH, numeric: n, ticks, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const b = c.a * Math.sqrt(1 - c.e * c.e);
    const cx = -c.a * c.e; // ellipse centre, with Earth at the focus (0, 0)
    const pad = 0.12 * c.a;
    const S = sceneIn(B, B.free, { x0: cx - c.a - pad, x1: cx + c.a + pad, y0: -b - pad, y1: b + pad + 0.25 * c.a }, 14);
    const earth = [];
    for (let i = 0; i <= 64; i++) earth.push([R_EARTH * Math.cos((2 * Math.PI * i) / 64), R_EARTH * Math.sin((2 * Math.PI * i) / 64)]);
    poly(S, earth, { fill: alpha(C.blue, 0.5), stroke: C.blue, width: 1 });
    const path = [];
    for (let i = 0; i <= 240; i++) {
      const E = (2 * Math.PI * i) / 240;
      path.push([cx + c.a * Math.cos(E), b * Math.sin(E)]);
    }
    line(S, path, { color: alpha(C.text, 0.5), width: 1.5 });
    // The swept sector from perigee to now, shaded.
    const sector = [[0, 0]];
    for (let i = 0; i <= 80; i++) {
      const p = kepler({ a: c.a, e: c.e, t: (c.t * i) / 80 });
      sector.push([p.x, p.y]);
    }
    poly(S, sector, { fill: alpha(C.gold, 0.18), stroke: null });
    for (const [x, y] of c.ticks) dot(S, x, y, { color: alpha(C.text, 0.6), r: 3 });
    seg(S, [0, 0], [c.a * (1 - c.e), 0], { color: alpha(C.text, 0.3), width: 1, dash: [3, 3] });
    label(S, 'perigee', [c.a * (1 - c.e), 0], { color: C.muted, dx: 8, align: 'left' });
    seg(S, [0, 0], [c.x, c.y], { color: C.gold, width: 1.5 });
    dot(S, c.x, c.y, { color: C.yellow, r: 6, ring: C.text });
    label(S, `${fig(deg(c.nu))}° from perigee after ${fig(100 * state.frac)}% of the period`, [cx, b + pad + 0.25 * c.a], { color: C.yellow, dy: 10, base: 'top' });
  },
  law: () => [String.raw`M = \sqrt{\mu/a^3}\,t = E - e\sin E`, String.raw`r = a(1 - e\cos E), \qquad \tan\frac\nu2 = \sqrt{\frac{1 + e}{1 - e}}\tan\frac E2`, String.raw`v^2 = \mu\left(\frac2r - \frac1a\right), \qquad T = 2\pi\sqrt{a^3/\mu}`],
  liveRows(state, c) {
    return [
      kv('Semi-major axis, eccentricity', `${fig(c.a)} km, ${fig(c.e)}`),
      kv('Period', hm(c.T)),
      kv('Time since perigee', hm(c.t)),
      kv('Mean anomaly M', `${fig(deg(c.M))}°`),
      kv('Eccentric anomaly E (Newton steps)', `${fig(deg(c.E))}° (${c.iterations})`),
      kv('True anomaly ν', `${fig(deg(c.nu))}°`),
      kv('Altitude, speed', `${fig(c.altitude)} km, ${fig(c.v)} km/s`),
      kv('RK4 against Kepler, ÷ a', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['angle', `${fig(deg(c.nu))}°`],
      ['altitude', `${fig(c.altitude)} km`],
      ['speed', `${fig(c.v)} km/s`],
      ['period', hm(c.T)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Everything but one point-mass Earth. Earth's bulge turns an orbit's plane and perigee slowly, drag lowers a low orbit, and the Moon and Sun tug on high ones.`;
    if (c.e < 0.01) {
      return { title: 'A circle: equal times, equal angles', body: `With e = ${fig(c.e)} the craft moves at a steady ${fig(c.v)} km/s, so a quarter of the ${hm(c.T)} period is a quarter turn: ${fig(deg(c.nu))}°. ${leavesOut}` };
    }
    return {
      title: 'Fast at perigee, slow at apogee',
      body: `Equal areas in equal times: near Earth the radius is short, so the craft sweeps a wide angle quickly. After ${fig(100 * state.frac)}% of the ${hm(c.T)} period it is ${fig(deg(c.nu))}° round, not ${fig(360 * state.frac)}°. Kepler's equation has no closed-form solution; Newton's method took ${c.iterations} steps here. ${leavesOut}`,
    };
  },
  app: false,
});
