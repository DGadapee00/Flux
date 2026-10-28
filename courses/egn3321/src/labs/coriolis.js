import { slottedRocker, slottedRockerNumeric } from '@flux/subjects/mechanics/rotating.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, note, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { bindSlider, slider } from './widgets.js';

const DEG = Math.PI / 180;

/**
 * Shows that a pin sliding in a turning slot needs the Coriolis term. A crank drives a pin that slides
 * in the slot of a rocker, the quick-return mechanism of a shaper. Seen from axes on the rocker, the
 * pin's acceleration is Ω̇ × r + Ω × (Ω × r) + 2Ω × v_rel + a_rel (Hibbeler §16.8). Leave out 2Ω × v_rel
 * and the rocker's angular acceleration comes out wrong, even with the crank at a steady speed.
 * The rocker swings slowly one way while the pin is above the pivot and fast back while it is below.
 *
 * Recompute: the rotating-axes equations matched to the crank pin's motion. Check: the rocker angle
 * from the geometry alone, differentiated twice numerically.
 */
const SCENARIOS = [
  { id: 'shaper', name: 'Shaper rocker, crank at 30°', r: 0.1, d: 0.25, omega: 4, alpha: 0, phi: 30 },
  { id: 'top', name: 'Pin at the top: the working stroke', r: 0.1, d: 0.25, omega: 4, alpha: 0, phi: 90 },
  { id: 'speeding', name: 'Crank speeding up', r: 0.1, d: 0.25, omega: 3, alpha: 5, phi: 150 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, id: scId, ...rest } = sc;
  void name;
  Object.assign(state, { scenarioId: scId, anim: { playing: false }, show: { play: false }, ...rest });
}

const specOf = (s, phiDeg = s.phi) => ({ r: Math.min(s.r, s.d - 0.02), d: s.d, phi: phiDeg * DEG, omega: s.omega, alpha: s.alpha });

export default defineLab({
  id: 'coriolis',
  exam: 'u5',
  title: 'Coriolis',
  app: false,
  gapLimit: 5e-4,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'A pin sliding in a turning slot needs 2Ω × v_rel. Leave it out and the rocker’s α is wrong.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('shaper', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'phi', lo: 0, hi: 359 }),
  controls() {
    return `
      ${slider('co-r', 'crank r (m)', 0.1, 0.04, 0.2, 0.005)}
      ${slider('co-d', 'pivot to pivot d (m)', 0.25, 0.15, 0.4, 0.005)}
      ${slider('co-w', 'crank speed ω (rad/s)', 4, 0.5, 10, 0.1)}
      ${slider('co-al', 'crank α (rad/s²)', 0, -10, 10, 0.5)}
      ${slider('co-phi', 'crank angle φ (°)', 30, 0, 360, 1)}
      <p class="tiny">Teal is the crank, white the rocker and the pin's velocity. Purple is the pin's acceleration; the dashed purple arrow is the Coriolis part, 2Ω × v_rel. Yellow marks the two fixed pivots.</p>`;
  },
  bind(api) {
    bindSlider('co-r', (s, v) => { s.r = v; }, api);
    bindSlider('co-d', (s, v) => { s.d = v; }, api);
    bindSlider('co-w', (s, v) => { s.omega = v; }, api);
    bindSlider('co-al', (s, v) => { s.alpha = v; }, api);
    bindSlider('co-phi', (s, v) => { s.phi = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('co-r', state.r);
    set('co-d', state.d);
    set('co-w', state.omega);
    set('co-al', state.alpha);
    set('co-phi', Math.round(state.phi));
  },
  tick(dt, state) {
    // The crank turns in slow motion, a quarter of its real rate, so the swing can be followed.
    return advance(state, dt, { key: 'phi', lo: 0, hi: 360, rate: (0.25 * Math.abs(state.omega)) / DEG });
  },
  compute(state) {
    const c = slottedRocker(specOf(state));
    const n = slottedRockerNumeric(specOf(state));
    const scaleW = Math.max(1e-6, Math.abs(c.W), Math.abs(state.omega) * 0.1);
    const scaleA = Math.max(1e-6, Math.abs(c.Wd), Math.abs(c.WdWithout), state.omega ** 2 * 0.1);
    const gap = Math.max(Math.abs(n.W - c.W) / scaleW, Math.abs(n.Wd - c.Wd) / scaleA);
    const series = Array.from({ length: 181 }, (_, i) => {
      const p = slottedRocker(specOf(state, i * 2));
      return { phi: i * 2, Wd: p.Wd, without: p.WdWithout, W: p.W };
    });
    const tidy = (x) => (Math.abs(x) < 1e-9 ? 0 : x);
    return {
      ...c,
      W: tidy(c.W),
      Wd: tidy(c.Wd),
      vRel: tidy(c.vRel),
      coriolis: tidy(c.coriolis),
      WdWithout: tidy(c.WdWithout),
      numW: n.W,
      numWd: n.Wd,
      rEff: specOf(state).r,
      series,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.55);
    const L = state.d + c.rEff + 0.06;
    const S = sceneIn(B, left, { x0: -0.75 * L, x1: 0.75 * L, y0: -0.08, y1: L + 0.04 });
    const O = [0, 0];
    const Cp = [0, state.d];
    // The crank's circle, the rocker, the crank, the pin.
    circle(S, Cp, c.rEff, { stroke: alpha(C.text, 0.2), width: 1, dash: [3, 4] });
    seg(S, O, [L * c.e[0], L * c.e[1]], { color: C.text, width: 6 });
    seg(S, O, [L * c.e[0], L * c.e[1]], { color: C.bg, width: 2 });
    seg(S, Cp, c.P, { color: C.teal, width: 4 });
    circle(S, c.P, 0.008, { stroke: C.text, fill: C.text });
    dot(S, O[0], O[1], { color: C.yellow, r: 5 });
    dot(S, Cp[0], Cp[1], { color: C.yellow, r: 4 });
    label(S, 'O', O, { dx: -12, dy: 6, color: C.yellow });
    label(S, 'C', Cp, { dx: -12, color: C.yellow });

    // The pin's velocity, and its acceleration with the Coriolis part dashed.
    const vMax = Math.max(1e-6, c.rEff * Math.abs(state.omega));
    const reach = Math.min(70, 0.22 * Math.min(S.box.x1 - S.box.x0, S.box.y1 - S.box.y0));
    vec(S, c.P, c.vP, reach / vMax, { color: C.text, label: 'v_P' });
    const aMax = Math.max(1e-6, Math.hypot(c.aP[0], c.aP[1]), Math.abs(c.coriolis));
    const ka = reach / aMax;
    vec(S, c.P, c.aP, ka, { color: C.purple, label: 'a_P' });
    if (Math.abs(c.coriolis) > 1e-9) vec(S, c.P, [c.coriolis * c.n[0], c.coriolis * c.n[1]], ka, { color: C.purple, dash: [5, 4], width: 2, label: '2Ω×v_rel' });
    if (veiled) return;

    // The rocker's angular acceleration round a full turn of the crank, with and without Coriolis.
    const vals = c.series.flatMap((p) => [p.Wd, p.without]);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const span = hi - lo || 1;
    const P = chartIn(B, right, { lo: 0, hi: 360 }, { lo: lo - 0.08 * span, hi: hi + 0.12 * span });
    axes(P, { xLabel: 'crank angle φ (°)', yLabel: 'Ω̇ (rad/s²)' });
    line(P, c.series.map((p) => [p.phi, p.without]), { color: alpha(C.text, 0.45), width: 1.5, dash: [5, 4] });
    line(P, c.series.map((p) => [p.phi, p.Wd]), { color: C.purple, width: 2.5 });
    const k = c.series.reduce((b, p, i) => (Math.abs(p.without - p.Wd) > Math.abs(c.series[b].without - c.series[b].Wd) ? i : b), 0);
    note(P, 'without 2Ω×v_rel', c.series[k].phi, c.series[k].without, { color: C.dim });
    dot(P, ((state.phi % 360) + 360) % 360, c.Wd, { color: C.purple, r: 5 });
  },
  law: () => [String.raw`\vec a_P=\dot{\vec\Omega}\times\vec r+\vec\Omega\times(\vec\Omega\times\vec r)+2\vec\Omega\times\vec v_{rel}+\vec a_{rel}`],
  liveRows(state, c) {
    return [
      kv('pin on the slot $\\rho$', `${fig(c.rho)} m`),
      kv('rocker $\\Omega$, sliding $v_{rel}$', `${fig(c.W)} rad/s, ${fig(c.vRel)} m/s`),
      kv('Coriolis $2\\Omega v_{rel}$', `${fig(c.coriolis)} m/s²`),
      kv('rocker $\\dot\\Omega$', `${fig(c.Wd)} rad/s²`),
      kv('$\\dot\\Omega$ without Coriolis', `${fig(c.WdWithout)} rad/s²`),
      kv('$\\Omega$, $\\dot\\Omega$ from the rocker angle, numerically', `${fig(c.numW)}, ${fig(Math.abs(c.numWd) < 1e-6 ? 0 : c.numWd)}`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['Ω', `${fig(c.W)} rad/s`],
      ['Ω̇', `${fig(c.Wd)} rad/s²`],
      ['v_rel', `${fig(c.vRel)} m/s`],
      ['Coriolis', `${fig(c.coriolis)} m/s²`],
    ]);
  },
  coach(state, c) {
    if (Math.abs(c.vRel) < 1e-6) {
      return {
        title: 'The pin is not sliding: no Coriolis term',
        body: [
          String.raw`Here the pin's velocity is square to the slot, so $v_{rel} = 0$ and $2\Omega v_{rel} = 0$. The rocker turns at $\Omega = ${fig(c.W)}$ rad/s, which is $v_P/\rho$.`,
          String.raw`With the pin ${c.P[1] > state.d ? 'far from' : 'close to'} the pivot, $\rho = ${fig(c.rho)}$ m, so the same pin speed swings the rocker ${c.P[1] > state.d ? 'slowly: the working stroke' : 'fast: the quick return'}.`,
        ],
      };
    }
    return {
      title: 'The Coriolis term changes the rocker’s α',
      body: [
        String.raw`The pin slides along the slot at $${fig(c.vRel)}$ m/s while the slot turns at $${fig(c.W)}$ rad/s, so the Coriolis part is $2\Omega v_{rel} = ${fig(c.coriolis)}$ m/s², across the slot.`,
        String.raw`Across the slot the pin's acceleration is $\rho\dot\Omega + 2\Omega v_{rel}$. So $\dot\Omega = ${fig(c.Wd)}$ rad/s². Leaving out the Coriolis part would give $${fig(c.WdWithout)}$ rad/s².`,
      ],
    };
  },
  predictions: [
    {
      id: 'co-double',
      scenario: 'shaper',
      ask: 'Run the crank twice as fast, from 4 to 8 rad/s, at the same angle.',
      apply(s) { s.omega *= 2; },
      watch: [
        { id: 'W', label: 'the rocker’s angular velocity Ω', get: (c) => c.W },
        { id: 'Wd', label: 'the rocker’s angular acceleration Ω̇', get: (c) => c.Wd },
      ],
      mode: 'factor',
      expect: { W: 2, Wd: 4 },
      why: 'Every speed in the mechanism doubles, so $\\Omega$ doubles, from 0.923 to 1.85 rad/s. Every acceleration term, the Coriolis one included, is a product of two speeds, so $\\dot\\Omega$ grows four times, from 1.91 to 7.65 rad/s².',
    },
    {
      id: 'co-top',
      scenario: 'shaper',
      ask: 'Turn the crank from 30° to 90°, so the pin is straight above the crank’s pivot.',
      apply(s) { s.phi = 90; },
      watch: [
        { id: 'vRel', label: 'the pin’s sliding speed along the slot', get: (c) => c.vRel },
        { id: 'W', label: 'the rocker’s angular velocity', get: (c) => c.W },
      ],
      mode: 'dir',
      expect: { vRel: 'smaller', W: 'bigger' },
      why: 'At the top the pin moves straight across the slot, so it does not slide at all: $v_{rel}$ falls from 0.277 m/s to zero, and so does the Coriolis term. All of its 0.4 m/s now swings the rocker: $\\Omega = 0.4/0.35 = 1.14$ rad/s, up from 0.923.',
    },
    {
      id: 'co-quick',
      scenario: 'top',
      ask: 'Turn the crank half a turn, from 90° to 270°, so the pin is below the crank’s pivot.',
      apply(s) { s.phi = 270; },
      watch: [{ id: 'W', label: 'how fast the rocker swings', get: (c) => c.W }],
      mode: 'dir',
      expect: { W: 'bigger' },
      why: 'The pin moves at the same 0.4 m/s, but now only 0.15 m from the rocker pivot instead of 0.35 m. The rocker swings back at 2.67 rad/s instead of 1.14: the quick return of a shaper.',
    },
  ],
});
