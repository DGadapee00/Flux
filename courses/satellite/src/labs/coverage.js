import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { capAngle, coverageChecked } from '@flux/subjects/mechanics/coverage.js';

/**
 * Station coverage: how much of each day a network of ground stations sees a craft, and how long the
 * craft waits between contacts.
 *
 * Shows that where a station stands matters as much as how many there are. A station near a pole
 * sees a polar orbiter on most orbits, three times what one in the tropics sees; the same station
 * never sees a craft whose orbit stays below its latitude. Spreading stations around the world
 * shortens the longest wait more than it adds minutes. The long-run share of time in view, from the
 * ground track's latitude density, is checked against flying the orbit for twenty days with the
 * Earth turning under it (packages/subjects/src/mechanics/coverage.js).
 *
 * Station positions are the ATLAS network's, from NASA's small spacecraft report (Table 11-7).
 */
export const STATIONS = Object.freeze({
  none: null,
  utq: { name: 'Utqiagvik, Alaska', lat: 71.27, lon: -156.81 },
  sod: { name: 'Sodankylä, Finland', lat: 67.36, lon: 26.63 },
  moj: { name: 'Mojave, California', lat: 35.05, lon: -118.15 },
  dub: { name: 'Dubai, UAE', lat: 24.94, lon: 55.35 },
  mwu: { name: 'Mwulire, Rwanda', lat: -1.96, lon: 30.39 },
  awa: { name: 'Awarua, New Zealand', lat: -46.52, lon: 168.38 },
});

const SCENARIOS = [
  { id: 'polar', name: 'A sun-synchronous craft, one Arctic station', incl: 97.4, hkm: 500, eps: 10, s1: 'utq', s2: 'none', s3: 'none' },
  { id: 'mid', name: 'The same craft, one station at 35°N', incl: 97.4, hkm: 500, eps: 10, s1: 'moj', s2: 'none', s3: 'none' },
  { id: 'iss', name: 'A 51.6° orbit and the Arctic station', incl: 51.6, hkm: 500, eps: 10, s1: 'utq', s2: 'none', s3: 'none' },
  { id: 'network', name: 'Three stations spread around the world', incl: 97.4, hkm: 500, eps: 10, s1: 'utq', s2: 'sod', s3: 'awa' },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, incl: sc.incl, hkm: sc.hkm, eps: sc.eps, s1: sc.s1, s2: sc.s2, s3: sc.s3 });
}

const KEYS = [['cv-i', 'incl'], ['cv-h', 'hkm'], ['cv-e', 'eps']];
const SELECTS = [['cv-1', 's1'], ['cv-2', 's2'], ['cv-3', 's3']];
const chosen = (state) => [state.s1, state.s2, state.s3].filter((k, i, a) => k !== 'none' && a.indexOf(k) === i);
const COLORS = [C.gold, C.pink, C.green];
const DEG = Math.PI / 180;

/** The edge of a station's visibility cap as [lon°, lat°] points, broken where it wraps. */
function capRing(st, lam) {
  const phi = st.lat * DEG;
  const pts = [];
  let prev = null;
  for (let k = 0; k <= 96; k++) {
    const b = (2 * Math.PI * k) / 96;
    const lat2 = Math.asin(Math.sin(phi) * Math.cos(lam) + Math.cos(phi) * Math.sin(lam) * Math.cos(b));
    const lon2 = st.lon * DEG + Math.atan2(Math.sin(b) * Math.sin(lam) * Math.cos(phi), Math.cos(lam) - Math.sin(phi) * Math.sin(lat2));
    const lon = ((((lon2 / DEG + 180) % 360) + 360) % 360) - 180;
    if (prev !== null && Math.abs(lon - prev) > 180) pts.push(null);
    pts.push([lon, lat2 / DEG]);
    prev = lon;
  }
  return pts;
}

export default defineLab({
  id: 'coverage',
  exam: 'u12',
  title: 'Station coverage',
  hint: 'Move the one station from 35°N to the Arctic and watch a polar orbiter’s contact time triple. Then tilt the orbit to 51.6° and watch the Arctic station lose it.',
  gapLimit: 0.03,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('polar', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'incl', lo: 10, hi: 100 }),
  controls() {
    const opts = Object.entries(STATIONS).map(([k, s]) => `<option value="${k}">${s ? `${s.name}, ${fig(Math.abs(s.lat))}°${s.lat >= 0 ? 'N' : 'S'}` : 'No station'}</option>`).join('');
    return `
      ${SELECTS.map(([id], i) => `<label class="field"><span>Station ${i + 1}</span><select id="${id}">${opts}</select></label>`).join('')}
      ${slider('cv-i', 'Orbit inclination (°)', 97.4, 0, 100, 0.1)}
      ${slider('cv-h', 'Altitude (km)', 500, 300, 1000, 10)}
      ${slider('cv-e', 'Lowest elevation the stations use (°)', 10, 0, 30, 1)}
      <p class="tiny">A circular orbit flown for 20 days. The map shows one day's ground track and each station's circle of view.</p>`;
  },
  bind(api) {
    for (const [id, key] of SELECTS) {
      document.getElementById(id)?.addEventListener('change', (e) => {
        api.slice()[key] = e.target.value;
        api.bump();
      });
    }
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of [...SELECTS, ...KEYS]) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const keys = chosen(state);
    const orbit = { hkm: state.hkm, eps: state.eps, incl: state.incl };
    if (!keys.length) return { keys, closed: [], shares: [], anyShare: 0, passesPerDay: 0, longestGapH: 0, track: [], gap: 0, minutesPerDay: [], anyMinutes: 0, lam: capAngle(state.hkm, state.eps) };
    const c = coverageChecked(orbit, keys.map((k) => STATIONS[k]));
    return { ...c, keys, anyMinutes: c.anyShare * 1440, lam: capAngle(state.hkm, state.eps), first: c.minutesPerDay[0] };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const both = H > 380 || (W > 1.5 * H && W > 560);
    const [top, bottom] = both ? split(B.free, 0.62) : [B.free, null];
    const P = plotIn(B, top, { lo: -180, hi: 180 }, { lo: -90, hi: 90 }, { left: 40, right: 12, top: 14, bottom: 34 });
    axes(P, { xLabel: 'longitude (°)', yLabel: 'latitude (°)' });
    const pts = [];
    let prev = null;
    for (const p of c.track) {
      if (prev && Math.abs(p[0] - prev[0]) > 180) pts.push(null);
      pts.push(p);
      prev = p;
    }
    line(P, pts, { color: alpha(C.teal, 0.85), width: 1.5 });
    c.keys.forEach((k, i) => {
      const st = STATIONS[k];
      const ring = capRing(st, c.lam);
      line(P, ring, { color: COLORS[i], width: 2 });
      dot(P, st.lon, st.lat, { color: COLORS[i], r: 4 });
    });
    if (!bottom) return;
    // Minutes a day each station sees the craft, and any of them together.
    const rows = [...c.keys.map((k, i) => [STATIONS[k].name.split(',')[0], c.minutesPerDay[i], COLORS[i]]), ['any station', c.anyMinutes, C.teal]];
    const hi = Math.max(10, ...rows.map((r) => r[1])) * 1.15;
    const Q = plotIn(B, bottom, { lo: 0, hi }, { lo: 0, hi: rows.length }, { left: 92, right: 14, top: 10, bottom: 40 });
    axes(Q, { xLabel: 'minutes in view a day', yFmt: () => '' });
    rows.forEach(([name, v, color], i) => {
      const y = rows.length - i - 0.5;
      poly(Q, [[0, y - 0.3], [v, y - 0.3], [v, y + 0.3], [0, y + 0.3]], { fill: alpha(color, 0.8), stroke: null });
      label(Q, name, [0, y], { color: C.text, align: 'right', dx: -6 });
    });
  },
  law: () => [
    String.raw`\lambda = \arccos\!\left(\tfrac{R}{r}\cos\varepsilon\right) - \varepsilon`,
    String.raw`p(\beta) = \frac{1}{2\pi^2\sqrt{\sin^2 i - \sin^2\beta}}\ \text{per steradian}`,
  ],
  liveRows(state, c) {
    const rows = c.keys.map((k, i) => kv(`${STATIONS[k].name}, latitude density and flown`, `${fig(c.minutesPerDay[i])}, ${fig(c.shares[i] * 1440)} min/day`));
    return [
      kv('Circle of view, half-angle', `${fig(c.lam / DEG)}°`),
      ...rows,
      kv('In view of any station', `${fig(c.anyMinutes)} min/day`),
      kv('Contacts a day', fig(c.passesPerDay)),
      kv('Longest wait between contacts', c.passesPerDay > 0 ? `${fig(c.longestGapH)} h` : 'never in view'),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['in view', `${fig(c.anyMinutes)} min/day`],
      ['contacts', `${fig(c.passesPerDay)} a day`],
      ['longest wait', c.passesPerDay > 0 ? `${fig(c.longestGapH)} h` : 'never'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Stations shared with other missions, which cannot give every pass; time to point the antenna and lock the link at the start of each pass; terrain that hides the low sky; and an orbit whose plane drifts.`;
    if (!c.keys.length) return { title: 'No station', body: `Choose a station to see the craft. ${leavesOut}` };
    if (c.passesPerDay === 0) {
      return { title: 'Out of reach', body: `A ${fig(state.incl)}° orbit never passes north of ${fig(state.incl)}° latitude, and the station's circle of view reaches only ${fig(c.lam / DEG)}° from it. The craft never comes into view. Choose a station nearer the equator or a more inclined orbit. ${leavesOut}` };
    }
    if (c.keys.length > 1) {
      return { title: 'A network shortens the wait', body: `Together the stations see the craft ${fig(c.anyMinutes)} minutes a day in ${fig(c.passesPerDay)} contacts, and it never waits more than ${fig(c.longestGapH)} h. Stations far apart in longitude fill each other's gaps. ${leavesOut}` };
    }
    return { title: `${fig(c.anyMinutes)} minutes a day`, body: `The craft passes within ${fig(c.lam / DEG)}° of ${STATIONS[c.keys[0]].name} ${fig(c.passesPerDay)} times a day, for ${fig(c.anyMinutes)} minutes in all, but can wait ${fig(c.longestGapH)} h between contacts. A polar orbiter crosses high latitudes every orbit, so stations near a pole see it most. ${leavesOut}` };
  },
  app: false,
});
