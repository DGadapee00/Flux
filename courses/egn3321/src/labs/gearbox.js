import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { bindSlider, showField, slider, leavesOut } from './widgets.js';

const RPM = (2 * Math.PI) / 60;

/**
 * A compound gear train (Hibbeler §16.3). A fast motor drives pinion 1. Pinion 1 meshes with gear 2
 * on shaft 2. Gear 3 rides on that shaft and meshes with gear 4 on the output shaft. Shows that
 * meshing gears share a pitch-line speed while gears on one shaft share ω, and that an idler's
 * teeth cancel. With `idler` on, gear 2 meshes with gear 4 directly and gear 3
 * is not used. Every gear has the same module m, so its pitch radius is m N / 2. Speeds are in rpm.
 */
const SCENARIOS = [
  { id: 'reduction', name: 'Two-stage reduction', N1: 20, N2: 60, N3: 25, N4: 50, rpm: 30000, m: 2, idler: false },
  { id: 'step-up', name: 'A second stage that steps up', N1: 20, N2: 60, N3: 40, N4: 20, rpm: 30000, m: 2, idler: false },
  { id: 'idler', name: 'Gear 2 as an idler', N1: 20, N2: 40, N3: 25, N4: 50, rpm: 30000, m: 2, idler: true },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, ...rest } = sc;
  Object.assign(state, { scenarioId: sc.id, ...rest, t: 0, anim: { playing: false }, show: { play: false } });
}

/** The train from tooth counts alone: the ratios a designer writes down. Counterclockwise is positive. */
export function train({ N1, N2, N3, N4, rpm, m, idler }) {
  const w1 = rpm;
  const w2 = -(N1 / N2) * w1;
  const w3 = w2;
  const w4 = idler ? -(N2 / N4) * w2 : -(N3 / N4) * w3;
  const r = (N) => (m * N) / 2000;
  return {
    w1,
    w2,
    w3,
    w4,
    r1: r(N1),
    r2: r(N2),
    r3: r(N3),
    r4: r(N4),
    // Pitch-line speeds, m/s: the speed of the teeth where two gears touch.
    v12: r(N1) * Math.abs(w1) * RPM,
    v34: (idler ? r(N2) : r(N3)) * Math.abs(w3) * RPM,
    ratio: w1 / w4,
  };
}

/** Gear centres on the drawing, in metres. Shaft 4 sits below and to the right of shaft 2. */
function centres(t, idler) {
  const O1 = [0, 0];
  const O2 = [t.r1 + t.r2, 0];
  const d = (idler ? t.r2 : t.r3) + t.r4;
  const ang = -55 * (Math.PI / 180);
  const O4 = [O2[0] + d * Math.cos(ang), O2[1] + d * Math.sin(ang)];
  return { O1, O2, O4 };
}

/**
 * Second method: radii and vectors, no tooth ratio. At each contact point, the driver's ω × r gives
 * the tooth velocity; the driven gear's ω is the one whose ω × r gives the same velocity there.
 */
function byContact(state, t) {
  const { O1, O2, O4 } = centres(t, state.idler);
  const unit = (a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dx, dy);
    return [dx / L, dy / L];
  };
  const vel = (w, O, P) => [-w * (P[1] - O[1]), w * (P[0] - O[0])];
  const omegaFrom = (O, P, v) => {
    const dx = P[0] - O[0];
    const dy = P[1] - O[1];
    return (dx * v[1] - dy * v[0]) / (dx * dx + dy * dy);
  };
  const w1 = state.rpm * RPM;
  const u12 = unit(O1, O2);
  const P12 = [O1[0] + t.r1 * u12[0], O1[1] + t.r1 * u12[1]];
  const v12 = vel(w1, O1, P12);
  const w2 = omegaFrom(O2, P12, v12);
  const rDrive = state.idler ? t.r2 : t.r3;
  const u24 = unit(O2, O4);
  const P34 = [O2[0] + rDrive * u24[0], O2[1] + rDrive * u24[1]];
  const v34 = vel(w2, O2, P34);
  const w4 = omegaFrom(O4, P34, v34);
  return { w2: w2 / RPM, w4: w4 / RPM, v12: Math.hypot(...v12), v34: Math.hypot(...v34) };
}

const rel = (a, b) => Math.abs(a - b) / Math.max(1e-12, Math.abs(b));

const sense = (w) => (w > 0 ? 'ccw' : 'cw');

/** What the real device has that the model ignores (D30). */
const OUT = String.raw`The model treats each mesh as two pitch circles rolling without slip. That gives speeds and senses and nothing else. A real train has backlash, the play between teeth, and its shafts twist under load. It says nothing about torque, or about which gear carries the load: that is Unit 6. Real teeth have involute profiles, cut so the speed ratio holds steady while each pair of teeth is in contact; the pitch circles stand in for that.`;

export default defineLab({
  id: 'gearbox',
  exam: 'u5',
  title: 'Gear train',
  app: false,
  hint: 'Change the teeth. Meshing gears share a pitch-line speed, so ω scales as 1/N, and each mesh reverses the sense.',
  gapLimit: 1e-9,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  tick(dt, state) {
    return advance(state, dt, { lo: 0, hi: 120, rate: 1 });
  },
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('reduction', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'N2', lo: 24, hi: 120 }),
  controls() {
    return `
      ${slider('gb-rpm', 'motor speed (rpm)', 30000, 5000, 60000, 1000)}
      ${slider('gb-n1', 'pinion 1 teeth N₁', 20, 12, 40, 1)}
      ${slider('gb-n2', 'gear 2 teeth N₂ (shaft 2)', 60, 24, 120, 1)}
      ${slider('gb-n3', 'gear 3 teeth N₃ (on shaft 2)', 25, 12, 60, 1)}
      ${slider('gb-n4', 'gear 4 teeth N₄ (output)', 50, 12, 120, 1)}
      ${slider('gb-m', 'module m (mm)', 2, 1, 5, 0.5)}
      <p class="tiny">Pitch radius r = mN/2. Counterclockwise is positive. No slip at a mesh. Gear 4 meshes with gear 3, in a plane behind gear 2. Play turns the train, slowed so the motor turns at 1.5 rad/s; the teeth at a mesh move together.</p>`;
  },
  bind(api) {
    bindSlider('gb-rpm', (s, v) => { s.rpm = v; }, api);
    bindSlider('gb-n1', (s, v) => { s.N1 = v; }, api);
    bindSlider('gb-n2', (s, v) => { s.N2 = v; }, api);
    bindSlider('gb-n3', (s, v) => { s.N3 = v; }, api);
    bindSlider('gb-n4', (s, v) => { s.N4 = v; }, api);
    bindSlider('gb-m', (s, v) => { s.m = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('gb-rpm', state.rpm);
    set('gb-n1', state.N1);
    set('gb-n2', state.N2);
    set('gb-n3', state.N3);
    set('gb-n4', state.N4);
    set('gb-m', state.m);
    showField('gb-n3', !state.idler);
  },
  compute(state) {
    const t = train(state);
    const v = byContact(state, t);
    return {
      ...t,
      idler: !!state.idler,
      w2Contact: v.w2,
      w4Contact: v.w4,
      gap: Math.max(rel(v.w2, t.w2), rel(v.w4, t.w4), rel(v.v12, t.v12), rel(v.v34, t.v34)),
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    // Side by side whenever the space is wider than tall (a phone's band is), stacked otherwise.
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const xm = B.free.x0 + 0.55 * W;
    const [left, right] = W > 1.1 * H ? [{ ...B.free, x1: xm }, { ...B.free, x0: xm }] : split(B.free, 0.58);
    const small = Math.min(W, H) < 320;
    const { O1, O2, O4 } = centres(c, c.idler);
    const rs = [c.r1, c.r2, c.r4];
    const xs = [O1[0] - c.r1, O2[0] + c.r2, O4[0] + c.r4];
    const ys = [O1[1] + c.r1, O2[1] + c.r2, O4[1] - c.r4];
    const S = sceneIn(B, left, { x0: Math.min(...xs) * 1.05, x1: Math.max(...xs) * 1.05, y0: Math.min(...ys) * 1.1, y1: Math.max(...ys) * 1.1 + Math.max(...rs) * 0.1 });
    const { ctx } = S;
    // Play turns the motor at 1.5 rad/s on screen; every other gear keeps its true ratio to it.
    const spinOf = (w) => (1.5 * (Number(state.t) || 0) * w) / Math.max(Math.abs(c.w1), 1e-9);
    const circle = (O, r, col, N, w) => {
      const phase = spinOf(w);
      ctx.save();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(S.X(O[0]), S.Y(O[1]), r * S.k, 0, 2 * Math.PI);
      ctx.stroke();
      // One tick per tooth, so the tooth count is visible.
      const n = Math.round(N);
      for (let i = 0; i < n; i++) {
        const a = (2 * Math.PI * i) / n + phase;
        seg(S, [O[0] + 0.92 * r * Math.cos(a), O[1] + 0.92 * r * Math.sin(a)], [O[0] + 1.06 * r * Math.cos(a), O[1] + 1.06 * r * Math.sin(a)], { color: alpha(col, 0.7), width: 1 });
      }
      // The sense of rotation: an arc with a head.
      const R = r * S.k * 0.55;
      const a0 = Math.PI * 0.15;
      const a1 = Math.PI * 0.85;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(S.X(O[0]), S.Y(O[1]), R, -a1, -a0);
      ctx.stroke();
      const end = w > 0 ? -a1 : -a0;
      const hx = S.X(O[0]) + R * Math.cos(end);
      const hy = S.Y(O[1]) + R * Math.sin(end);
      const dir = w > 0 ? -1 : 1;
      const tx = -Math.sin(end) * dir;
      const ty = Math.cos(end) * dir;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(hx + tx * 7, hy + ty * 7);
      ctx.lineTo(hx - ty * 4, hy + tx * 4);
      ctx.lineTo(hx + ty * 4, hy - tx * 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    circle(O1, c.r1, C.gold, state.N1, c.w1);
    circle(O2, c.r2, C.teal, state.N2, c.w2);
    if (!c.idler) circle(O2, c.r3, C.blue, state.N3, c.w3);
    circle(O4, c.r4, C.pink, state.N4, c.w4);
    label(S, small ? '1' : 'motor 1', O1, { dy: c.r1 * S.k + 12, color: C.gold });
    label(S, small ? (c.idler ? '2' : '2 + 3') : c.idler ? 'idler 2' : 'shaft 2: gears 2 + 3', O2, { dy: -c.r2 * S.k - 10, color: C.teal });
    label(S, small ? '4' : 'output 4', O4, { dy: c.r4 * S.k + 12, color: C.pink });

    // Shaft speeds, rpm, signed: up is counterclockwise.
    const ws = [['1', c.w1, C.gold], ['2', c.w2, C.teal], ['4', c.w4, C.pink]];
    const top = Math.max(...ws.map(([, w]) => Math.abs(w))) * 1.2;
    const P = plotIn(B, right, { lo: 0, hi: 3 }, { lo: -top, hi: top }, { left: 44, right: 8, top: 24, bottom: 30 });
    axes(P, { xLabel: 'shaft', yLabel: 'ω (k rpm)', xFmt: () => '', yFmt: (v) => String(Math.round(v / 100) / 10) });
    ws.forEach(([name, w, col], i) => {
      poly(P, [[i + 0.2, 0], [i + 0.8, 0], [i + 0.8, w], [i + 0.2, w]], { fill: alpha(col, 0.45), stroke: col, width: 1.5 });
      label(P, small ? name : `${name}: ${fig(Math.abs(w))} ${sense(w)}`, [i + 0.5, w], { dy: w > 0 ? -10 : 12, color: col });
    });
  },
  law: () => [String.raw`r_1\omega_1 = r_2\omega_2,\quad r = \tfrac12 mN`, String.raw`\frac{\omega_4}{\omega_1} = \frac{N_1 N_3}{N_2 N_4}`],
  liveRows(state, c) {
    return [
      kv('$\\omega_2 = -(N_1/N_2)\\,\\omega_1$', `${fig(c.w2)} rpm`),
      kv(c.idler ? '$\\omega_4 = (N_1/N_4)\\,\\omega_1$' : '$\\omega_4 = (N_1N_3/N_2N_4)\\,\\omega_1$', `${fig(c.w4)} rpm`),
      kv('$\\omega_4$ from $\\omega\\times r$ at each contact', `${fig(c.w4Contact)} rpm`),
      kv('pitch-line speed, mesh 1–2', `${fig(c.v12)} m/s`),
      kv(c.idler ? 'pitch-line speed, mesh 2–4' : 'pitch-line speed, mesh 3–4', `${fig(c.v34)} m/s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['shaft 2', `${fig(Math.abs(c.w2))} rpm`],
      ['output', `${fig(Math.abs(c.w4))} rpm`],
      ['ω₁/ω₄', fig(c.ratio)],
      ['pitch v', `${fig(c.v12)} m/s`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    if (c.idler) {
      return {
        title: 'The idler cancels out',
        body: String.raw`Gear 2 meshes on both sides. Its teeth cancel from the ratio: $\omega_4 = (N_1/N_4)\,\omega_1 = ${fig(c.w4)}$ rpm. It only sets the sense: shaft 4 turns the same way as the motor.`,
      };
    }
    return {
      title: 'Each mesh reverses the sense',
      body: String.raw`Two external meshes: shaft 4 turns the same way as the motor, at $${fig(Math.abs(c.w4))}$ rpm. The pitch line of mesh 1–2 moves at $${fig(c.v12)}$ m/s.`,
    };
  }),
  predictions: [
    {
      id: 'gb-faster',
      scenario: 'reduction',
      ask: 'Double the motor speed, from 30,000 rpm to 60,000 rpm. Leave the teeth alone.',
      apply(s) { s.rpm = 60000; },
      watch: [
        { id: 'w4', label: 'the output speed', get: (c) => c.w4 },
        { id: 'v12', label: 'the pitch-line speed at mesh 1–2', get: (c) => c.v12 },
      ],
      mode: 'factor',
      expect: { w4: 2, v12: 2 },
      why: 'Every ratio is fixed by the teeth, so every shaft speeds up by the same factor. The output goes from 5,000 rpm to 10,000 rpm. The pitch line of mesh 1–2 goes from 62.8 m/s to 126 m/s.',
    },
    {
      id: 'gb-idler',
      scenario: 'idler',
      ask: 'Double the idler, from 40 teeth to 80.',
      apply(s) { s.N2 = 80; },
      watch: [
        { id: 'w2', label: 'the idler speed', get: (c) => c.w2 },
        { id: 'w4', label: 'the output speed', get: (c) => c.w4 },
      ],
      mode: 'dir',
      expect: { w2: 'smaller', w4: 'same' },
      why: 'The idler slows from 15,000 rpm to 7,500 rpm. But its teeth enter the ratio twice and cancel: $\\omega_4 = (N_1/N_4)\\,\\omega_1 = (20/50)(30{,}000) = 12{,}000$ rpm either way.',
    },
    {
      id: 'gb-module',
      scenario: 'reduction',
      ask: 'Double the module, from 2 mm to 4 mm. Same tooth counts, bigger teeth.',
      apply(s) { s.m = 4; },
      watch: [
        { id: 'w4', label: 'the output speed', get: (c) => c.w4 },
        { id: 'v12', label: 'the pitch-line speed at mesh 1–2', get: (c) => c.v12 },
      ],
      mode: 'factor',
      expect: { w4: 1, v12: 2 },
      why: 'Every radius doubles, so every ratio $r_1/r_2 = N_1/N_2$ stays: the output stays at 5,000 rpm. The pinion radius goes from 20 mm to 40 mm, so its teeth move twice as fast, 126 m/s instead of 62.8 m/s.',
    },
  ],
});
