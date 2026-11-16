import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { DIRECTIONS, cwPosition, separationChecked } from '@flux/subjects/mechanics/separation.js';

/**
 * Deployment separation: two craft released together, and how long before a tracking radar sees them
 * as two objects.
 *
 * Shows why direction matters more than speed. Only a push along the track changes the orbit's
 * period, so only it makes the craft drift apart without limit, at three times the push each second.
 * The same push outward or across the orbit only swings the craft a few kilometres around the
 * deployer and back, every orbit, and in this model they never separate. Until they do, nobody can
 * say which track is which, and with N craft there are N! ways to match names to tracks. The
 * Clohessy–Wiltshire solution is checked by flying both orbits (packages/subjects/src/mechanics/
 * separation.js). They agree within 2% up to 2 m/s over two days; the difference is the push's small
 * change to the orbit's energy, which the linear equations leave out and which slowly adds a drift.
 *
 * The identification problem and its N! are NASA's small spacecraft report's (12.1). The push and
 * the distance at which a radar's tracks split are our own round figures.
 */
const SCENARIOS = [
  { id: 'along', name: 'Pushed 1 m/s along the track', hkm: 500, dv: 1, dir: 'along', Dkm: 10, days: 2, objects: 10 },
  { id: 'radial', name: 'The same push, radially out', hkm: 500, dv: 1, dir: 'radial', Dkm: 10, days: 2, objects: 10 },
  { id: 'slow', name: 'A gentle 0.2 m/s along the track', hkm: 500, dv: 0.2, dir: 'along', Dkm: 10, days: 2, objects: 10 },
  { id: 'cross', name: 'Pushed across the orbit', hkm: 500, dv: 1, dir: 'cross', Dkm: 10, days: 2, objects: 10 },
];
const FIELDS = ['hkm', 'dv', 'dir', 'Dkm', 'days', 'objects'];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  for (const f of FIELDS) state[f] = sc[f];
}

const SLIDERS = [['sx-h', 'hkm'], ['sx-v', 'dv'], ['sx-d', 'Dkm'], ['sx-t', 'days'], ['sx-n', 'objects']];
const COLORS = { along: C.gold, back: C.pink, radial: C.blue, cross: C.green };
const hours = (s) => (s === null ? 'never' : s < 3600 ? `${fig(s / 60)} min` : s < 2 * 86400 ? `${fig(s / 3600)} h` : `${fig(s / 86400)} days`);

export default defineLab({
  id: 'separation',
  exam: 'u17',
  title: 'Deployment separation',
  hint: 'Push the craft 1 m/s along the track and watch it pass 10 km within the hour. Then push it the same 1 m/s radially: it swings out and back every orbit and never gets past 4 km.',
  gapLimit: 0.02,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('along', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'dv', lo: 0.1, hi: 2 }),
  controls() {
    const opt = Object.entries(DIRECTIONS).map(([k, t]) => `<option value="${k}">${t}</option>`).join('');
    return `
      <label class="field"><span>Direction of the push</span><select id="sx-r">${opt}</select></label>
      ${slider('sx-v', 'Push from the deployer (m/s)', 1, 0.1, 2, 0.1)}
      ${slider('sx-h', 'Altitude (km)', 500, 300, 800, 10)}
      ${slider('sx-d', 'Separation the radar can split (km)', 10, 1, 50, 1)}
      ${slider('sx-t', 'Days shown', 2, 0.5, 2, 0.5)}
      ${slider('sx-n', 'Craft released in the batch', 10, 2, 60, 1)}
      <p class="tiny">Two-body orbits, no drag or J2. The faint curves show the same push in the other directions. A drifting pair is drawn until a few times its split.</p>`;
  },
  bind(api) {
    document.getElementById('sx-r')?.addEventListener('change', (e) => {
      api.slice().dir = e.target.value;
      api.bump();
    });
    for (const [id, key] of SLIDERS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of [['sx-r', 'dir'], ...SLIDERS]) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    const c = separationChecked({ ...state, objects: Math.round(state.objects) });
    return { ...c, reachH: c.tReach === null ? null : c.tReach / 3600, separates: c.tReach !== null, boundKm: c.bound === null ? null : c.bound / 1e3 };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    // A drifting pair is shown until a few times its split; a bounded one over the whole window.
    const tH = c.separates ? Math.min(state.days * 24, Math.max(8 * c.reachH, 3)) : state.days * 24;
    const curve = (dir) => {
      const pts = [];
      for (let i = 0; i <= 400; i++) {
        const t = (tH * 3600 * i) / 400;
        pts.push([t / 3600, Math.hypot(...cwPosition({ hkm: state.hkm, dv: state.dv, dir }, t)) / 1e3]);
      }
      return pts;
    };
    const mine = curve(state.dir);
    const yTop = Math.max(state.Dkm * 1.6, ...mine.map((p) => p[1])) * 1.05;
    const P = plotIn(B, B.free, { lo: 0, hi: tH }, { lo: 0, hi: yTop });
    axes(P, { xLabel: 'hours since release', yLabel: 'separation (km)' });
    // The other directions, faint.
    for (const dir of Object.keys(DIRECTIONS)) {
      if (dir === state.dir) continue;
      line(P, curve(dir).map(([t, d]) => [t, Math.min(yTop, d)]), { color: alpha(COLORS[dir], 0.3), width: 1.5 });
    }
    line(P, mine, { color: COLORS[state.dir], width: 2.5 });
    seg(P, [0, state.Dkm], [tH, state.Dkm], { color: alpha(C.text, 0.7), width: 1.5, dash: [5, 4] });
    label(P, `radar splits them at ${fig(state.Dkm)} km`, [tH, state.Dkm], { color: C.text, align: 'right', dy: -10 });
    if (c.separates) {
      dot(P, c.reachH, state.Dkm, { color: COLORS[state.dir], r: 5 });
      label(P, hours(c.tReach), [c.reachH, state.Dkm], { color: COLORS[state.dir], align: 'left', dx: 8, dy: 14 });
    }
  },
  law: () => [
    String.raw`y = \frac{2\dot x_0}{n}(\cos nt - 1) + \frac{\dot y_0}{n}(4\sin nt - 3nt)`,
    String.raw`x = \frac{\dot x_0}{n}\sin nt + \frac{2\dot y_0}{n}(1 - \cos nt), \quad z = \frac{\dot z_0}{n}\sin nt`,
  ],
  liveRows(state, c) {
    return [
      kv('Orbit period', `${fig(c.T / 60)} min`),
      kv('Drift along the track', c.drift ? `${fig(c.drift * 3.6)} km/h` : 'none'),
      kv('Furthest it ever gets', c.bound === null ? 'no limit' : `${fig(c.boundKm)} km`),
      kv(`To ${fig(state.Dkm)} km, closed and flown`, c.separates ? `${hours(c.tReach)}, ${hours(c.flownReach)}` : 'never'),
      kv(`Ways to match ${Math.round(state.objects)} names to tracks`, `10^${fig(c.log10Matches)}`),
      kv('Two methods differ by', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['split after', hours(c.tReach)],
      ['drift', c.drift ? `${fig(c.drift * 3.6)} km/h` : 'none'],
      ['matchings', `10^${fig(c.log10Matches)}`],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Drag, which pulls craft of different mass and area apart over days; Earth's oblateness; the deployer's own small errors in direction; and how often a radar actually sees the cluster.`;
    if (!c.separates) {
      return { title: 'They never split', body: `A push ${state.dir === 'radial' ? 'outward' : 'across the orbit'} leaves the period unchanged, so the craft swings at most ${fig(c.boundKm)} km from the deployer and returns every orbit. A radar that needs ${fig(state.Dkm)} km sees one object. With ${Math.round(state.objects)} craft in the batch there are 10^${fig(c.log10Matches)} ways to match names to tracks. Push along the track, or carry a tracking aid. ${leavesOut}` };
    }
    return { title: `Split after ${hours(c.tReach)}`, body: `A push along the track changes the period, so the craft drifts ${fig(c.drift * 3.6)} km an hour along the orbit and passes ${fig(state.Dkm)} km after ${hours(c.tReach)}. Each pair of craft in a batch needs a different push to drift apart. ${leavesOut}` };
  },
  app: false,
});
