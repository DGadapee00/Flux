/**
 * Shows that mechanical energy is shared between kinetic and potential, that the zero of potential
 * energy is a free choice that changes no speed, that friction moves energy into thermal energy, and
 * that a cart needs a release height of 2.5 R to get round a loop of radius R.
 *
 * A cart rides a track from a start height. The track is made of smooth pieces: cosine hills, straight
 * runs and a circular loop. A steady resistive force f acts against the motion, so the thermal energy
 * is f times the distance along the track. Energy at any point: K = K₀ + mg(y₀ − y) − f s. The check
 * drives the cart along the track with Newton's second law, m dv/dt = −mg sin θ − f, stepped in time by
 * RK4, and reads the speed where it arrives.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { gravitationalEnergy, kineticEnergy } from '@flux/subjects/mechanics/energy.js';
import { M, dot, fatLine, label, updateFatLine, QUANTITY_COLORS } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

/** The energy bars' zero line, above the track. */
const BASE = 2.6;

const SCENARIOS = [
  { id: 'hills', name: 'Over the hills from 1 m/s, no friction', mode: 'hills', m: 400, v0: 1, f: 0, h: 5, R: 2, zero: 0, at: 2.0 },
  { id: 'rough', name: 'Over the hills at 1 m/s, with 200 N of rolling resistance', mode: 'hills', m: 400, v0: 1, f: 200, h: 5, R: 2, zero: 0, at: 2.0 },
  { id: 'loop', name: 'A loop of radius 2 m, released from 6 m', mode: 'loop', m: 400, v0: 0, f: 0, h: 6, R: 2, zero: 0, at: 2.5 },
];

/** A piece of track: a point and its derivative for u from 0 to 1. */
const cosine = (x0, y0, x1, y1) => ({
  p: (u) => ({ x: x0 + (x1 - x0) * u, y: y0 + ((y1 - y0) * (1 - Math.cos(Math.PI * u))) / 2 }),
  d: (u) => ({ x: x1 - x0, y: ((y1 - y0) * Math.PI * Math.sin(Math.PI * u)) / 2 }),
});
const straight = (x0, y0, x1, y1) => ({
  p: (u) => ({ x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u }),
  d: () => ({ x: x1 - x0, y: y1 - y0 }),
});
const loop = (cx, R) => ({
  p: (u) => ({ x: cx + R * Math.sin(2 * Math.PI * u), y: R - R * Math.cos(2 * Math.PI * u) }),
  d: (u) => ({ x: 2 * Math.PI * R * Math.cos(2 * Math.PI * u), y: 2 * Math.PI * R * Math.sin(2 * Math.PI * u) }),
  loop: true,
});

/** The hills scale with the start height h; the loop sits after a ramp from h. */
function pieces(s) {
  if (s.mode === 'loop') return [cosine(0, s.h, 5, 0), straight(5, 0, 7.5, 0), loop(7.5, s.R), straight(7.5, 0, 10.5, 0)];
  return [cosine(0, s.h, 4, 0), cosine(4, 0, 7, 0.6 * s.h), cosine(7, 0.6 * s.h, 10.5, 0.2 * s.h)];
}

/** Where the cart is: `at` counts pieces, so 2.5 is halfway along the third. */
function locate(s) {
  const ps = pieces(s);
  const at = Math.min(ps.length, Math.max(0, s.at));
  const i = Math.min(ps.length - 1, Math.floor(at));
  return { ps, i, u: at - i };
}

// Five-point Gauss–Legendre, composite: the length of a piece from 0 to u.
const GL = [[-0.9061798459386640, 0.2369268850561891], [-0.5384693101056831, 0.4786286704993665], [0, 0.5688888888888889], [0.5384693101056831, 0.4786286704993665], [0.9061798459386640, 0.2369268850561891]];
function lengthOf(piece, u1, n = 40) {
  let sum = 0;
  const h = u1 / n;
  for (let k = 0; k < n; k += 1) {
    const mid = (k + 0.5) * h;
    for (const [x, w] of GL) {
      const d = piece.d(mid + (x * h) / 2);
      sum += (w * h * Math.hypot(d.x, d.y)) / 2;
    }
  }
  return sum;
}

function energies(s) {
  const { ps, i, u } = locate(s);
  const start = ps[0].p(0);
  const here = ps[i].p(u);
  let dist = lengthOf(ps[i], u);
  for (let k = 0; k < i; k += 1) dist += lengthOf(ps[k], 1);
  const K0 = kineticEnergy(s.m, s.v0);
  const E0 = K0 + gravitationalEnergy(s.m, G, start.y - s.zero);
  const U = gravitationalEnergy(s.m, G, here.y - s.zero);
  const Eth = s.f * dist;
  const K = E0 - U - Eth;
  return { ps, i, u, here, dist, K0, E0, U, Eth, K };
}

/** Ride one piece from u0 to u1 by RK4 in time. Null if the cart stops first. */
function ride(piece, s, v0, u1, dt = 2e-3) {
  const rate = (u, v) => {
    const d = piece.d(u);
    const len = Math.hypot(d.x, d.y);
    return [v / len, (-G * d.y) / len - s.f / s.m];
  };
  const step = ([u, v], h) => {
    const k1 = rate(u, v);
    const k2 = rate(u + (h / 2) * k1[0], v + (h / 2) * k1[1]);
    const k3 = rate(u + (h / 2) * k2[0], v + (h / 2) * k2[1]);
    const k4 = rate(u + h * k3[0], v + h * k3[1]);
    return [u + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), v + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
  };
  let y = [0, v0];
  for (let n = 0; n < 3e5; n += 1) {
    if (u1 <= 0) return v0;
    const next = step(y, dt);
    if (next[1] <= 0) return null;
    if (next[0] >= u1) {
      // The last step is cut so the cart lands on u1 exactly.
      let lo = 0;
      let hi = dt;
      for (let k = 0; k < 80; k += 1) {
        const mid = 0.5 * (lo + hi);
        if (step(y, mid)[0] < u1) lo = mid;
        else hi = mid;
      }
      return step(y, 0.5 * (lo + hi))[1];
    }
    y = next;
  }
  return null;
}

/** The normal force at the top of the loop, from energy: N = mv²/R − mg. */
function loopTop(s) {
  if (s.mode !== 'loop') return null;
  const top = { ...s, at: 2.5 };
  const e = energies(top);
  return { K: e.K, N: (2 * e.K) / s.R - s.m * G };
}

/**
 * Whether the cart has fallen off the loop by the time it is at u on piece i. On the way up the track
 * pushes with N = mv²/R + mg cos φ, φ measured from the bottom; N only falls until the top, so past the
 * top the cart is still on only if it was on at the top.
 */
function fallen(s, i, u, v, round) {
  if (s.mode !== 'loop' || i !== 2 || v === null) return false;
  const phi = 2 * Math.PI * u;
  if (phi > Math.PI) return !round;
  return (s.m * v * v) / s.R + s.m * G * Math.cos(phi) < 0;
}

/** A cart left at rest on a flat crest, with friction holding it, never starts. */
const stuck = (s) => s.v0 <= 0 && s.f > 0;

export default defineLab({
  id: 'track',
  exam: 'u4',
  title: 'Energy track',
  hint: 'Move the cart along the track. Watch the energy bars trade, and where friction sends the rest.',
  orbit: false,
  fit: { w: 11.6, h: 13.2 },
  camera: { pos: new THREE.Vector3(0, 0.05, 24), target: new THREE.Vector3(0, 0.05, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'track-zero',
      scenario: 'hills',
      ask: String.raw`Move the zero of potential energy up $3\ \mathrm{m}$, from the ground to the top of the second hill. What happens to the cart's potential energy and to its speed there?`,
      apply(s) { s.zero = 3; },
      watch: [
        { id: 'U', label: 'the potential energy', get: (c) => c.U, signed: true },
        { id: 'v', label: 'the speed', get: (c) => c.v },
      ],
      mode: 'dir',
      expect: { U: 'smaller', v: 'same' },
      why: String.raw`Every potential energy drops by $mg \times 3\ \mathrm{m}$, the start's included. Only differences in $U$ enter $K = K_0 + U_0 - U$, so the speed does not change.`,
    },
    {
      id: 'track-friction',
      scenario: 'hills',
      ask: String.raw`Add $200\ \mathrm{N}$ of rolling resistance. At the top of the second hill, what happens to the thermal energy and to the speed?`,
      apply(s) { s.f = 200; },
      watch: [
        { id: 'Eth', label: 'the thermal energy', get: (c) => c.Eth },
        { id: 'v', label: 'the speed', get: (c) => c.v },
      ],
      mode: 'dir',
      expect: { Eth: 'bigger', v: 'smaller' },
      why: String.raw`The resistance does work $-fs$ over the distance $s$ along the track. That energy leaves the kinetic and potential bars and becomes thermal energy, $fs$. The total stays the same; less of it is kinetic.`,
    },
    {
      id: 'track-loop',
      scenario: 'loop',
      ask: String.raw`Release the cart from $4\ \mathrm{m}$ instead of $6$: twice the loop's radius, exactly the loop's height. Does it get round the loop on the track?`,
      apply(s) { s.h = 4; },
      watch: [{ id: 'round', label: 'it stays on the track at the top', get: (c) => c.round, mode: 'bool' }],
      expect: { round: false },
      why: String.raw`At the top the track can only push down, so gravity alone must be enough to turn the cart: $v^2 \ge gR$. Energy then needs $mgh \ge mg(2R) + \tfrac12 mgR$, so $h \ge 2.5R = 5\ \mathrm{m}$. From the loop's own height the cart has no speed left at the top, and it leaves the track well before.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('hills', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('tr-at', 'Where the cart is, along the track (%)', 50, 0, 100, 0.5)}${sliderRow('tr-h', 'Start height (m)', 5, 1, 7.5, 0.1)}${sliderRow('tr-v0', 'Starting speed (m/s)', 0, 0, 10, 0.1)}${sliderRow('tr-f', 'Rolling resistance (N)', 0, 0, 1000, 10)}${sliderRow('tr-zero', 'Height where U = 0 (m)', 0, -2, 6, 0.1)}${sliderRow('tr-R', 'Radius of the loop (m)', 2, 1, 2.5, 0.05)}${sliderRow('tr-m', 'Mass of the cart and riders (kg)', 400, 100, 1000, 10)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'tr-at', (s, x) => { s.at = (x / 100) * pieces(s).length; });
    bindSlider(api, 'tr-h', (s, x) => { s.h = x; });
    bindSlider(api, 'tr-v0', (s, x) => { s.v0 = x; });
    bindSlider(api, 'tr-f', (s, x) => { s.f = x; });
    bindSlider(api, 'tr-zero', (s, x) => { s.zero = x; });
    bindSlider(api, 'tr-R', (s, x) => { s.R = x; });
    bindSlider(api, 'tr-m', (s, x) => { s.m = x; });
  },
  syncControls(state) {
    putSlider('tr-at', (100 * state.at) / pieces(state).length, 1);
    putSlider('tr-h', state.h, 1);
    putSlider('tr-v0', state.v0, 1);
    putSlider('tr-f', state.f, 0);
    putSlider('tr-zero', state.zero, 1);
    putSlider('tr-R', state.R, 2);
    putSlider('tr-m', state.m, 0);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const track = fatLine(new Array(400 * 3).fill(0), { color: M.grey, width: 3 });
    const ground = fatLine([0, 0, 0, 1, 0, 0], { color: M.greyDark, width: 1.5 });
    const zero = fatLine([0, 0, 0, 1, 0, 0], { color: M.teal, width: 1.5, opacity: 0.8 });
    const zeroName = label('<i>U</i> = 0', 0, 0, 0, 'graph-axis');
    const cart = dot(M.blue, 0.22);
    const base = fatLine([-2.8, BASE, 0, 2.8, BASE, 0], { color: M.greyDark, width: 1.5 });
    const keys = [['U', '<i>U</i>', QUANTITY_COLORS.x], ['K', '<i>K</i>', M.white], ['Eth', '<i>E</i><sub>th</sub>', QUANTITY_COLORS.a], ['E0', 'total', M.yellow]];
    const bars = keys.map(([, , color]) => fatLine([0, 0, 0, 0, 1, 0], { color, width: 16 }));
    const barNames = keys.map(([, html]) => label(html, 0, 0, 0, 'graph-axis'));
    const barValues = keys.map(() => label('', 0, 0, 0, 'graph-tick x'));
    const title = label('energy (kJ)', 4.1, 5.4, 0, 'graph-title');
    const warn = label('', 0, 0, 0, 'graph-axis');
    group.add(track, ground, zero, zeroName, cart, base, title, warn, ...bars, ...barNames, ...barValues);
    group.visible = false;
    return { group, track, ground, zero, zeroName, cart, bars, barNames, barValues, keys, warn };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const e = energies(state);
    computed.U = e.U;
    computed.K = Math.max(0, e.K);
    computed.Eth = e.Eth;
    computed.E0 = e.E0;
    computed.s = e.dist;
    computed.y = e.here.y;
    computed.stalls = e.K < -1e-9 || (stuck(state) && state.at > 0);
    const top = loopTop(state);
    computed.Ntop = top ? top.N : null;
    computed.round = top ? top.N >= 0 && !stuck(state) : null;
    const v = computed.stalls ? null : Math.sqrt((2 * computed.K) / state.m);
    computed.fallen = fallen(state, e.i, e.u, v, computed.round);
    computed.v = computed.fallen ? null : v;
  },
  second(state) {
    // Newton's second law along the track, stepped in time, piece by piece.
    const { ps, i, u } = locate(state);
    // With no friction, a cart at rest on a flat crest needs a nudge to start; a micrometre per second
    // changes no digit shown. With friction it stays put, and ride() reports that.
    const start = state.v0 > 0 || state.f > 0 ? state.v0 : 1e-6;
    let v = start;
    for (let k = 0; k <= i && v !== null; k += 1) v = ride(ps[k], state, v, k === i ? u : 1);
    const out = {};
    let round = null;
    if (state.mode === 'loop') {
      let vt = start;
      for (let k = 0; k < 3 && vt !== null; k += 1) vt = ride(ps[k], state, vt, k === 2 ? 0.5 : 1);
      // A cart too slow to reach the top has fallen off on the way up.
      round = vt !== null && (state.m * vt * vt) / state.R - state.m * G >= 0;
      out.round = round;
      if (vt !== null) out.Ntop = (state.m * vt * vt) / state.R - state.m * G;
    }
    out.v = fallen(state, i, u, v, round) ? null : v;
    return out;
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = false;
    const X0 = -5.25;
    const Y0 = -6.2;
    const ps = pieces(state);
    const per = Math.floor(400 / ps.length);
    const pts = [];
    for (let k = 0; k < 400; k += 1) {
      const j = Math.min(ps.length - 1, Math.floor(k / per));
      const p = ps[j].p(Math.min(1, (k - j * per) / (per - 1)));
      pts.push(X0 + p.x, Y0 + p.y, 0);
    }
    updateFatLine(h.track, pts);
    updateFatLine(h.ground, [X0 - 0.3, Y0, 0, X0 + 10.8, Y0, 0]);
    updateFatLine(h.zero, [X0 - 0.3, Y0 + state.zero, 0.01, X0 + 10.8, Y0 + state.zero, 0.01]);
    h.zero.visible = Math.abs(state.zero) > 1e-9;
    h.zeroName.visible = h.zero.visible;
    h.zeroName.position.set(X0 + 10.4, Y0 + state.zero + 0.3, 0);
    const { i, u } = locate(state);
    const here = ps[i].p(u);
    // The cart rides on top of the track: offset along the normal on the side away from the loop's centre.
    const d = ps[i].d(u);
    const dl = Math.hypot(d.x, d.y) || 1;
    const n = { x: -d.y / dl, y: d.x / dl };
    h.cart.position.set(X0 + here.x + n.x * 0.24, Y0 + here.y + n.y * 0.24, 0.05);
    h.warn.visible = !!computed.stalls || !!computed.fallen;
    h.warn.element.textContent = computed.stalls ? 'it never gets this far' : 'too slow: it has left the track';
    h.warn.position.set(X0 + here.x, Y0 + here.y + (ps[i].loop ? -0.75 : 0.75), 0);
    // The bars, in kilojoules, on a common scale.
    const vals = [computed.U, computed.K, computed.Eth, computed.E0];
    // Room for 3.4 units above the zero line and 1.4 below, where only a negative U can go.
    const up = Math.max(...vals, 1e-9);
    const down = Math.max(...vals.map((v) => -v), 1e-9);
    const scale = Math.min(3.4 / up, 1.4 / down);
    vals.forEach((val, k) => {
      const x = -2.1 + k * 1.4;
      const y1 = BASE + val * scale;
      h.bars[k].visible = Math.abs(val * scale) > 0.02;
      if (h.bars[k].visible) updateFatLine(h.bars[k], [x, BASE, 0.01, x, y1, 0.01]);
      h.barNames[k].position.set(x, val >= 0 ? BASE - 0.45 : BASE + 0.4, 0);
      h.barValues[k].element.textContent = String(fmt(val / 1000, 3)).replace('-', '−');
      h.barValues[k].position.set(x, y1 + (val >= 0 ? 0.3 : -0.3), 0);
    });
  },
  law: () => [
    String.raw`K_0 + U_0 = K + U + E_{\text{th}},\qquad U = mgy,\quad E_{\text{th}} = fs`,
    String.raw`\text{top of a loop: } v^2 \ge gR \iff h \ge 2.5R`,
  ],
  readoutCells(state, computed) {
    const cells = [
      ['Speed here', computed.v === null ? (computed.stalls ? 'it never gets here' : 'it has left the track') : `${fmt(computed.v)} m/s`, computed.v === null ? 'warn' : ''],
      ['Kinetic energy', `${fmt(computed.K)} J`],
      ['Potential energy', `${fmt(computed.U)} J`],
      ['Thermal energy', `${fmt(computed.Eth)} J, over ${fmt(computed.s, 3)} m of track`],
      ['Total at the start', `${fmt(computed.E0)} J`],
      ['Height here', `${fmt(computed.y, 3)} m`],
    ];
    if (state.mode === 'loop') cells.push(['Normal force at the top of the loop', `${fmt(computed.Ntop)} N${computed.round ? '' : ': it leaves the track'}`, computed.round ? '' : 'warn']);
    return cells;
  },
  coach(state, computed) {
    const body = [
      String.raw`The total at the start is $K_0 + U_0 = ${fmt(computed.E0, 4)}$ J. At every point it is shared out as $K + U + E_{\text{th}}$. Gravity is conservative, so going down a hill and back up to the same height returns all of the kinetic energy. Only friction keeps any.`,
      String.raw`Where $U = 0$ is a choice. Moving it shifts every $U$ by the same amount, the start's included, so no speed changes. The teal line marks it when it is not the ground.`,
    ];
    if (state.mode === 'loop') {
      body.push(String.raw`At the top of the loop the track pushes down with $N = mv^2/R - mg = ${fmt(computed.Ntop, 4)}$ N. A negative value means the track would have to pull: the cart has already left it. With no friction the cart needs $h \ge 2.5R = ${fmt(2.5 * state.R, 3)}$ m.`);
    }
    body.push(String.raw`<b>What the model leaves out.</b> The resistance is one steady force; real rolling resistance grows with the normal force, which is large at the bottom of a loop. The wheels' turning energy is ignored, and the cart is a point.`);
    return { title: 'The bars trade, and the total holds', body };
  },
});
