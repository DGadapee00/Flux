import { M_PER_FT } from '@flux/subjects/convert.js';
import { G } from '@flux/subjects/mechanics/constants.js';
import { bankedCurve } from '@flux/subjects/mechanics/dynamics.js';
import { MPH, aashtoFmax, frictionNeed, limitSpeed, minRadiusFt } from '@flux/subjects/mechanics/highway.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, dot, hidden, label, line, note, poly, sceneIn, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Application: the curve of a highway (Hibbeler §13.5). A designer picks the superelevation e and
 * the side friction f that drivers find comfortable, and the curve's radius follows. AASHTO's
 * policy (A Policy on Geometric Design of Highways and Streets, 2011) uses R = V²/(15(e + f)), with
 * f = 0.14 at 50 mph down to 0.10 at 70 mph and e up to 8% on rural highways. The exact force balance
 * on the bank, v² = Rg(e + f)/(1 − ef), shows what the shortcut leaves out: a small margin.
 * Shows that a faster road needs a far wider curve, and that the bank does a large share of the work.
 *
 * Recompute: AASHTO's radius and the exact limit speed. Check: bankedCurve's vector force balance.
 */
const SCENARIOS = [
  { id: 'r60', name: 'Rural highway, 60 mph, e = 8%', V: 60, e: 0.08, f: 0.12, drive: 60, Rfix: null },
  { id: 'r70', name: 'Interstate, 70 mph, e = 8%', V: 70, e: 0.08, f: 0.1, drive: 70, Rfix: null },
  { id: 'r50', name: 'A 50 mph road with a 4% bank', V: 50, e: 0.04, f: 0.14, drive: 50, Rfix: null },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, id: scId, ...rest } = sc;
  void name;
  Object.assign(state, { scenarioId: scId, ...rest });
}

const OUT = String.raw`The car is a point, so how its load shifts onto the outer tyres is left out, and so is the spiral that eases a real curve in from the straight. The side friction factor is a comfort limit, not what the tyres can give: dry tyres can supply several times more. That is why a car taken faster than the design speed usually holds the road, and why rain, which cuts what the tyres can give, matters more than the formula shows. Real design also caps e for snow and ice, so a car crawling round the curve does not slide inward.`;

export default defineLab({
  id: 'highway',
  exam: 'u2',
  title: 'Highway',
  gapLimit: 1e-9,
  hint: 'A designer picks the bank and a comfortable side friction; the radius follows. Faster roads need far wider curves.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('r60', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'drive', lo: 20, hi: 90 }),
  controls() {
    return `
      ${slider('hw-V', 'design speed V (mph)', 60, 50, 70, 5)}
      ${slider('hw-e', 'superelevation e (rise per run)', 0.08, 0, 0.12, 0.01)}
      ${slider('hw-f', 'side friction f, AASHTO by default', 0.12, 0.05, 0.2, 0.005)}
      ${slider('hw-d', 'a driver’s speed (mph)', 60, 20, 90, 1)}
      <p class="tiny">The cross-section looks along the road, the curve's centre to the left. Grey is the weight, teal the road's normal push, pink the side friction, purple m v²/R toward the centre. Setting V picks AASHTO's f for that speed.</p>`;
  },
  bind(api) {
    bindSlider('hw-V', (s, v) => { s.V = v; s.f = aashtoFmax(v); s.Rfix = null; }, api);
    bindSlider('hw-e', (s, v) => { s.e = v; }, api);
    bindSlider('hw-f', (s, v) => { s.f = v; }, api);
    bindSlider('hw-d', (s, v) => { s.drive = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('hw-V', state.V);
    set('hw-e', state.e);
    set('hw-f', state.f);
    set('hw-d', state.drive);
  },
  compute(state) {
    const Rdesign = minRadiusFt(state.V, state.e, state.f);
    const Rft = state.Rfix ?? Rdesign;
    const R = Rft * M_PER_FT;
    const vLim = limitSpeed(R, state.e, state.f);
    const v = state.drive * MPH;
    const need = frictionNeed(v, R, state.e);
    const th = (Math.atan(state.e) * 180) / Math.PI;
    const b = bankedCurve({ mass: 1, radius: R, thetaDeg: th, speed: v, mu: state.f });
    const gap = Math.max(Math.abs(b.vMax - vLim) / vLim, Math.abs(b.f / b.N - need) / Math.max(1e-6, Math.abs(need), state.e));
    const series = Array.from({ length: 41 }, (_, i) => {
      const V = 50 + (20 * i) / 40;
      return { V, R: minRadiusFt(V, state.e, aashtoFmax(V)) };
    });
    return {
      Rdesign,
      Rft,
      Rm: R,
      vLimMph: vLim / MPH,
      need,
      within: Math.abs(need) <= state.f + 1e-12,
      N: b.N / G,
      F: b.f / G,
      an: b.an / G,
      series,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.5);
    // The cross-section: the road tilted at θ, the centre of the curve to the left.
    const th = Math.atan(state.e);
    const S = sceneIn(B, left, { x0: -2.4, x1: 2.4, y0: -1.6, y1: 1.9 });
    // Along the road surface, rising toward the outside of the curve (to the right).
    const ux = Math.cos(th);
    const uy = Math.sin(th);
    const road = [[-2.2 * ux, -2.2 * uy], [2.2 * ux, 2.2 * uy], [2.2 * ux, 2.2 * uy - 0.35], [-2.2 * ux, -2.2 * uy - 0.35]];
    poly(S, road, { fill: alpha(C.text, 0.12), stroke: alpha(C.text, 0.6), width: 1.5 });
    const car = [[-0.5 * ux, -0.5 * uy], [0.5 * ux, 0.5 * uy], [0.5 * ux - 0.45 * uy, 0.5 * uy + 0.45 * ux], [-0.5 * ux - 0.45 * uy, -0.5 * uy + 0.45 * ux]];
    poly(S, car, { fill: alpha(C.blue, 0.35), stroke: C.blue, width: 1.5 });
    label(S, '← centre of the curve', [-1.6, 1.6], { color: C.dim, align: 'left' });
    // Forces per unit weight: weight 1 down, N along the road's normal, F along the road.
    const k = 110 / S.k;
    const at = [0, 0.22];
    vec(S, at, [0, -1], k * S.k, { color: C.dim, label: 'W' });
    const n = [-Math.sin(th), Math.cos(th)];
    vec(S, at, [c.N * n[0], c.N * n[1]], k * S.k, { color: C.teal, label: 'N' });
    // F is positive down the bank, toward the inside of the curve.
    const down = [-Math.cos(th), -Math.sin(th)];
    if (Math.abs(c.F) > 1e-4) vec(S, [0, 0.02], [c.F * down[0], c.F * down[1]], k * S.k, { color: C.pink, label: 'f' });
    vec(S, [1.4, 1.3], [-c.an, 0], k * S.k, { color: C.purple, dash: [5, 4], width: 2, label: 'mv²/R' });
    if (!veiled) label(S, c.within ? `needs f = ${fig(c.need)}, within ${fig(state.f)}` : `needs f = ${fig(c.need)}, more than ${fig(state.f)}`, [0, -1.25], { color: c.within ? C.teal : C.red });
    if (veiled) return;

    // AASHTO's minimum radius across design speeds, for this bank.
    const P = chartIn(B, right, { lo: 50, hi: 70 }, { lo: 0, hi: Math.max(...c.series.map((p) => p.R)) * 1.15 });
    axes(P, { xLabel: 'design speed (mph)', yLabel: 'minimum radius (ft)' });
    line(P, c.series.map((p) => [p.V, p.R]), { color: C.gold, width: 2.5 });
    note(P, `e = ${fig(state.e)}, AASHTO f`, 52, c.series[4].R, { color: C.gold, dy: -8 });
    dot(P, state.V, c.Rdesign, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`R=\dfrac{V^2}{15(e+f)}\ \ \text{(AASHTO, mph, ft)}`, String.raw`v^2=Rg\,\dfrac{e+f}{1-ef}\ \ \text{(exact)}`],
  liveRows(state, c) {
    return [
      kv('AASHTO minimum radius', `${fig(c.Rdesign)} ft = ${fig(c.Rdesign * M_PER_FT)} m`),
      kv('radius in use', `${fig(c.Rft)} ft`),
      kv('exact limit speed on it', `${fig(c.vLimMph)} mph`),
      kv(`side friction needed at ${fig(state.drive)} mph`, `${fig(c.need)}`),
      kv('$N/W$, $f/W$, $a_n/g$', `${fig(c.N)}, ${fig(c.F)}, ${fig(c.an)}`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['min radius', `${fig(c.Rdesign)} ft`],
      ['limit speed', `${fig(c.vLimMph)} mph`],
      ['friction needed', fig(c.need)],
      ['f allowed', fig(state.f)],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    const bankShare = state.e / (state.e + state.f);
    return {
      title: c.within ? 'Within the design friction' : 'More friction than the design allows',
      body: [
        String.raw`At ${fig(state.V)} mph with $e = ${fig(state.e)}$ and $f = ${fig(state.f)}$, AASHTO's $R = V^2/15(e + f) = ${fig(c.Rdesign)}$ ft. The bank carries ${Math.round(100 * bankShare)}% of the sideways push; friction the rest.`,
        String.raw`At ${fig(state.drive)} mph on ${fig(c.Rft)} ft the car needs $f = ${fig(c.need)}$. The exact limit, with the $ef$ term AASHTO drops, is ${fig(c.vLimMph)} mph.`,
        'AASHTO’s side friction factors (0.14 at 50 mph to 0.10 at 70) are set by driver comfort, not by what dry tyres can grip.',
      ],
    };
  }),
  predictions: [
    {
      id: 'hw-faster',
      scenario: 'r60',
      ask: 'Design the road for 70 mph instead of 60, with the same 8% bank and AASHTO’s f for 70 mph.',
      apply(s) { s.V = 70; s.f = 0.1; },
      watch: [{ id: 'R', label: 'the minimum radius', get: (c) => c.Rdesign }],
      mode: 'dir',
      expect: { R: 'bigger' },
      why: 'The radius grows as $V^2$, and at 70 mph drivers get less side friction, 0.10 instead of 0.12. Together: 1,815 ft instead of 1,200, half again as wide for a speed only a sixth higher.',
    },
    {
      id: 'hw-bank',
      scenario: 'r60',
      ask: 'Keep the 60 mph design speed but bank the road at 4% instead of 8%.',
      apply(s) { s.e = 0.04; },
      watch: [{ id: 'R', label: 'the minimum radius', get: (c) => c.Rdesign }],
      mode: 'dir',
      expect: { R: 'bigger' },
      why: 'With $e + f$ = 0.16 instead of 0.20, the curve must be 1,500 ft instead of 1,200. The bank was doing 40% of the work.',
    },
    {
      id: 'hw-flat',
      scenario: 'r60',
      ask: 'Keep the 1,200 ft curve built for 60 mph, but rebuild it with only a 4% bank. Drive it at 60 mph.',
      apply(s) { s.Rfix = 1200; s.e = 0.04; },
      watch: [{ id: 'ok', label: 'the car still needs no more than f = 0.12', get: (c) => c.within, mode: 'bool' }],
      mode: 'bool',
      expect: { ok: false },
      why: 'At 60 mph on 1,200 ft, $v^2/gR$ = 0.200. With $e$ = 0.04 the car needs $f = (0.200 - 0.04)/(1 + 0.04 \\times 0.200)$ = 0.159, more than the design’s 0.12. Dry tyres would still hold it; the design comfort is gone.',
    },
  ],
});
