import { eigen2, principal2, transform } from '@flux/subjects/mechanics/materials.js';
import { PLAY, playing } from '@flux/shells/engineering/motion.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, begin, circle, dot, hidden, label, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that turning an element by θ moves its point around Mohr's circle by 2θ, the same way:
 * principal planes 90° apart on the element are 180° apart on the circle, and the largest
 * in-plane shear is 45° from them. With both principals of one sign, the largest shear in the
 * material is not the circle's radius: the third principal, zero, makes a bigger circle.
 *
 * Recompute: the transformation equations, and the circle from its centre and radius.
 * Second method: the eigenvalues of the 2×2 stress matrix, and every turned point's distance from
 * the centre against the radius.
 */

const MPA = 1e6;
const DEG = Math.PI / 180;
const SCENARIOS = [
  { id: 'general', name: 'With shear', sx: 80e6, sy: 20e6, txy: 30e6, theta: 0 },
  { id: 'principal', name: 'On the principal plane', sx: 80e6, sy: 20e6, txy: 30e6, theta: 22.5 },
  { id: 'uni', name: 'Uniaxial, turned 30°', sx: 100e6, sy: 0, txy: 0, theta: 30 },
  { id: 'shear', name: 'Pure shear', sx: 0, sy: 0, txy: 50e6, theta: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, {
    scenarioId: sc.id, sx: sc.sx, sy: sc.sy, txy: sc.txy, theta: sc.theta,
    anim: { playing: false }, show: { play: false },
  });
}

/** The circle's point for a face: σ along, τ plotted positive downward (Hibbeler's convention). */
const pt = (s, t) => [s / MPA, -t / MPA];

export default defineLab({
  id: 'mohr',
  exam: 'u5',
  title: "Mohr's circle",
  hint: 'Turn the element by θ and its point turns 2θ the same way. Shear is zero on the principal planes, largest 45° from them.',
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('general', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'theta', lo: -90, hi: 90 }),
  controls() {
    return `
      ${slider('mh-x', 'σx (MPa)', 80, -100, 150, 5)}
      ${slider('mh-y', 'σy (MPa)', 20, -100, 150, 5)}
      ${slider('mh-t', 'τxy (MPa)', 30, -80, 80, 5)}
      ${slider('mh-a', 'θ (degrees)', 0, -90, 90, 1)}
      <p class="tiny">Plane stress; tension positive. Left, the element turned θ counterclockwise: gold arrows are normal stress, teal arrows shear. Right, Mohr's circle with τ plotted positive downward, so the gold point X′ turns 2θ the same way as the element. Y′ is the other face, across the diameter. The dashed circles use the third principal, zero; the biggest circle's radius is the largest shear in the material. Play turns the element.</p>`;
  },
  bind(api) {
    bindSlider('mh-x', (s, v) => { s.sx = v * MPA; }, api);
    bindSlider('mh-y', (s, v) => { s.sy = v * MPA; }, api);
    bindSlider('mh-t', (s, v) => { s.txy = v * MPA; }, api);
    bindSlider('mh-a', (s, v) => { s.theta = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('mh-x', state.sx / MPA);
    set('mh-y', state.sy / MPA);
    set('mh-t', state.txy / MPA);
    set('mh-a', Math.round(Number(state.theta) || 0));
  },
  tick(dt, state) {
    if (!playing(state)) return false;
    // 20° a second: the element makes a half turn in 9 s, and its point a full circle.
    let th = (Number(state.theta) || 0) + 20 * dt;
    if (th > 90) th -= 180;
    state.theta = th;
    return true;
  },
  compute(state) {
    const p = principal2(state.sx, state.sy, state.txy);
    const e = eigen2(state.sx, state.sy, state.txy);
    const tr = transform(state.sx, state.sy, state.txy, state.theta);
    const scale = Math.max(Math.abs(p.s1), Math.abs(p.s2), p.R, 1);
    // Second method: the eigenvalues, and the turned point's distance from the centre.
    const onCircle = Math.abs(Math.hypot(tr.sx - p.avg, tr.txy) - p.R) / scale;
    const gap = Math.max(Math.abs(p.s1 - e.s1) / scale, Math.abs(p.s2 - e.s2) / scale, onCircle);
    const hi = Math.max(p.s1, 0);
    const lo = Math.min(p.s2, 0);
    return {
      ...tr, s1: p.s1, s2: p.s2, R: p.R, avg: p.avg, thetaP: p.theta / DEG, tauAbs: (hi - lo) / 2, gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    // Side by side whenever the space is wider than tall, as on a phone held upright.
    const W = B.free.x1 - B.free.x0;
    const Hh = B.free.y1 - B.free.y0;
    const [left, right] = W > 1.1 * Hh
      ? [{ ...B.free, x1: B.free.x0 + 0.4 * W }, { ...B.free, x0: B.free.x0 + 0.4 * W }]
      : split(B.free, 0.42);
    const th = (Number(state.theta) || 0) * DEG;

    // The element: a unit square turned θ, over the faint unturned one.
    const E = sceneIn(B, left, { x0: -1.6, x1: 1.6, y0: -1.6, y1: 1.6 });
    const h = 0.55;
    const corner = (u, v, a) => [u * Math.cos(a) - v * Math.sin(a), u * Math.sin(a) + v * Math.cos(a)];
    const sq = (a) => [[-h, -h], [h, -h], [h, h], [-h, h]].map(([u, v]) => corner(u, v, a));
    poly(E, sq(0), { fill: null, stroke: alpha(C.text, 0.25), dash: [4, 4] });
    poly(E, sq(th), { fill: alpha(C.text, 0.1), stroke: C.text, width: 1.5 });
    seg(E, [0, 0], corner(1.35, 0, th), { color: alpha(C.gold, 0.5), width: 1, dash: [3, 3] });
    label(E, 'x′', corner(1.45, 0, th), { color: C.gold });
    const mag = Math.max(Math.abs(c.s1), Math.abs(c.s2), c.R, 1);
    const len = (v) => (Math.abs(v) / mag) * 0.45 * E.k * 1.6;
    // Each face: its outward normal n, and the shear's direction along it.
    const faces = [
      { n: th, s: c.sx, t: c.txy },
      { n: th + Math.PI, s: c.sx, t: c.txy },
      { n: th + Math.PI / 2, s: c.sy, t: c.txy },
      { n: th - Math.PI / 2, s: c.sy, t: c.txy },
    ];
    for (const f of faces) {
      const mid = [h * 1.02 * Math.cos(f.n), h * 1.02 * Math.sin(f.n)];
      const out = [(h + 0.06) * Math.cos(f.n), (h + 0.06) * Math.sin(f.n)];
      if (len(f.s) > 3) {
        if (f.s > 0) arrow(E, out, f.n, len(f.s), { color: C.gold, width: 2.5, head: 8 });
        else arrow(E, out, f.n + Math.PI, len(f.s), { color: C.gold, width: 2.5, head: 8, tail: true });
      }
      // Positive τx′y′ acts along +y′ on the +x′ face and along +x′ on the +y′ face; the opposite
      // faces carry it the other way. On a face with normal angle n, that is n + 90° for the x′
      // faces and n − 90° for the y′ faces.
      const isX = Math.abs(Math.cos(f.n - th)) > 0.5;
      const along = f.n + (isX ? Math.PI / 2 : -Math.PI / 2) * Math.sign(f.t || 1);
      if (len(f.t) > 3) {
        const half = len(f.t) / 2 / E.k;
        const start = [mid[0] - half * Math.cos(along), mid[1] - half * Math.sin(along)];
        arrow(E, start, along, len(f.t), { color: C.teal, width: 2, head: 7 });
      }
    }
    if (!veiled) label(E, `θ = ${fig(Number(state.theta) || 0)}°`, [0, -1.45], { color: C.muted });

    // The circle. σ runs right; τ is plotted downward, so a turn of the element by θ turns its
    // point by 2θ the same way.
    const s1 = c.s1 / MPA;
    const s2 = c.s2 / MPA;
    const lo = Math.min(s2, 0);
    const hi = Math.max(s1, 0);
    const big = (hi - lo) / 2;
    const pad = Math.max(big, 1) * 0.18;
    const M = sceneIn(B, right, { x0: lo - pad, x1: hi + pad, y0: -big - pad, y1: big + pad });
    seg(M, [lo - pad, 0], [hi + pad, 0], { color: alpha(C.text, 0.45), width: 1 });
    seg(M, [0, -big - pad * 0.8], [0, big + pad * 0.8], { color: alpha(C.text, 0.45), width: 1 });
    label(M, 'σ', [hi + pad, 0], { color: C.muted, dx: -6, dy: -9 });
    label(M, 'τ ↓', [0, -big - pad * 0.8], { color: C.muted, dx: 14, dy: -2 });
    // The two circles through the third principal, zero.
    circle(M, [s1 / 2, 0], Math.abs(s1) / 2, { stroke: alpha(C.text, 0.3), dash: [4, 4], width: 1 });
    circle(M, [s2 / 2, 0], Math.abs(s2) / 2, { stroke: alpha(C.text, 0.3), dash: [4, 4], width: 1 });
    const cen = [c.avg / MPA, 0];
    circle(M, cen, c.R / MPA, { stroke: C.gold, width: 2 });
    // The reference face X (θ = 0) and the turned faces X′ and Y′, joined through the centre.
    const X0 = pt(state.sx, state.txy);
    const Xp = pt(c.sx, c.txy);
    const Yp = pt(c.sy, -c.txy);
    seg(M, X0, [2 * cen[0] - X0[0], -X0[1]], { color: alpha(C.text, 0.25), width: 1, dash: [3, 3] });
    seg(M, Xp, Yp, { color: C.gold, width: 1.5 });
    // The 2θ arc, from X to X′.
    const a0 = Math.atan2(X0[1], X0[0] - cen[0]);
    const r = Math.max(c.R / MPA, 1e-9);
    const steps = 30;
    const arc = [];
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (2 * th * i) / steps;
      arc.push([cen[0] + 0.35 * r * Math.cos(a), 0.35 * r * Math.sin(a)]);
    }
    for (let i = 1; i < arc.length; i++) seg(M, arc[i - 1], arc[i], { color: C.yellow, width: 1.5 });
    dot(M, X0[0], X0[1], { color: alpha(C.text, 0.5), r: 3 });
    dot(M, s1, 0, { color: C.text, r: 3 });
    dot(M, s2, 0, { color: C.text, r: 3 });
    dot(M, Yp[0], Yp[1], { color: C.teal, r: 5 });
    dot(M, Xp[0], Xp[1], { color: C.gold, r: 6 });
    label(M, 'X′', Xp, { color: C.gold, dx: 10, dy: -10 });
    label(M, 'Y′', Yp, { color: C.teal, dx: 10, dy: -10 });
    if (!veiled) {
      label(M, `σ₁ ${fig(s1)}`, [s1, 0], { color: C.text, dy: 12 });
      label(M, `σ₂ ${fig(s2)}`, [s2, 0], { color: C.text, dy: 12 });
      if (Math.abs(th) > 3 * DEG) label(M, '2θ', arc[Math.floor(steps / 2)], { color: C.yellow, dx: 8, dy: -8 });
    }
  },
  law: () => [
    String.raw`\sigma_{x'}=\tfrac{\sigma_x+\sigma_y}{2}+\tfrac{\sigma_x-\sigma_y}{2}\cos 2\theta+\tau_{xy}\sin 2\theta`,
    String.raw`R=\sqrt{\left(\tfrac{\sigma_x-\sigma_y}{2}\right)^2+\tau_{xy}^2}`,
  ],
  liveRows(state, c) {
    return [
      kv('σx′', `${fig(c.sx / MPA)} MPa`),
      kv('τx′y′', `${fig(c.txy / MPA)} MPa`),
      kv('σ1, σ2', `${fig(c.s1 / MPA)}, ${fig(c.s2 / MPA)} MPa`),
      kv('largest in-plane shear, R', `${fig(c.R / MPA)} MPa`),
      kv('largest shear, any plane', `${fig(c.tauAbs / MPA)} MPa`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['σx′', `${fig(c.sx / MPA)} MPa`],
      ['τ', `${fig(c.txy / MPA)} MPa`],
      ['σ1', `${fig(c.s1 / MPA)} MPa`],
      ['θp', `${fig(c.thetaP)}°`],
    ]);
  },
  coach(state, c) {
    const onP = Math.abs(c.txy) < 0.02 * Math.max(Math.abs(c.R), 1);
    const sameSign = c.s1 > 0 && c.s2 > 0 ? 'tension' : c.s1 < 0 && c.s2 < 0 ? 'compression' : '';
    const abs = sameSign
      ? ` Both principals are ${sameSign}, so the biggest dashed circle wins: the largest shear in the material is ${fig(c.tauAbs / MPA)} MPa, on a plane out of this one, not R.`
      : '';
    return {
      title: onP ? 'Shear has dropped out' : 'This plane still carries shear',
      body: (onP
        ? `At ${fig(c.thetaP)}° the shear is zero and X′ sits on the σ axis. The principals are ${fig(c.s1 / MPA)} MPa and ${fig(c.s2 / MPA)} MPa.`
        : `σx′ is ${fig(c.sx / MPA)} MPa and the shear is ${fig(c.txy / MPA)} MPa. Turn the element to θp = ${fig(c.thetaP)}° and X′ reaches σ₁ = ${fig(c.s1 / MPA)} MPa on the σ axis.`) + abs,
    };
  },
});
