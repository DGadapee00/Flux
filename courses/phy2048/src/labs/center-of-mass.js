/**
 * Shows that the centre of mass is the mass-weighted average, and that a burst in flight does not
 * move it off the parabola the body was already on.
 *
 * Point masses use the weighted sum. A rod and a hoop are checked by summing x dm. The burst is
 * checked by averaging the fragment positions, which have to land on the parabola.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { centerOfMass } from '@flux/subjects/mechanics/momentum.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { M, QUANTITY_COLORS, dot, fatLine, label, updateFatLine } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const MARK = QUANTITY_COLORS.mark;
const KINDS = [['points', 'Two masses'], ['rod', 'Rod with an end mass'], ['hoop', 'Hoop'], ['burst', 'A shell in flight']];

const SCENARIOS = [
  { id: 'unequal', name: 'A light mass and a heavy one', kind: 'points', m1: 2, x1: 0, y1: 0, m2: 6, x2: 4, y2: 1, L: 2, mrod: 3, mend: 1, R: 1, m: 2, speed: 8, ang: 50, t: 1.2, u: 3 },
  { id: 'rod', name: 'A uniform rod with a mass at one end', kind: 'rod', m1: 2, x1: 0, y1: 0, m2: 6, x2: 4, y2: 1, L: 2, mrod: 3, mend: 1, R: 1, m: 2, speed: 8, ang: 50, t: 1.2, u: 3 },
  { id: 'burst', name: 'Three fragments of a shell', kind: 'burst', m1: 2, x1: 0, y1: 0, m2: 6, x2: 4, y2: 1, L: 2, mrod: 3, mend: 1, R: 1, m: 2, speed: 8, ang: 50, t: 1.2, u: 3 },
  { id: 'hoop', name: 'A uniform hoop', kind: 'hoop', m1: 2, x1: 0, y1: 0, m2: 6, x2: 4, y2: 1, L: 2, mrod: 3, mend: 1, R: 1, m: 2, speed: 8, ang: 50, t: 1.2, u: 3 },
];

function pointsOf(state) {
  return centerOfMass([
    { mass: state.m1, r: v(state.x1, state.y1, 0) },
    { mass: state.m2, r: v(state.x2, state.y2, 0) },
  ]).r;
}

function rodClosed(state) {
  const total = state.mrod + state.mend;
  return { x: (state.mrod * state.L / 2 + state.mend * state.L) / total, y: 0 };
}

/** Midpoint sum of x dm along the rod. Exact for a uniform rod, since x is linear. */
function rodQuad(state) {
  const n = 8000;
  const dx = state.L / n;
  let moment = state.mend * state.L;
  const lambda = state.mrod / state.L;
  for (let i = 0; i < n; i += 1) moment += lambda * ((i + 0.5) * dx) * dx;
  return { x: moment / (state.mrod + state.mend), y: 0 };
}

/** Sum of cos and sin over equal steps of a full circle. The pairs cancel. */
function hoopQuad(state) {
  const n = 7200;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i += 1) {
    const th = ((i + 0.5) / n) * Math.PI * 2;
    sx += Math.cos(th);
    sy += Math.sin(th);
  }
  return { x: state.R * sx / n, y: state.R * sy / n };
}

function burstClosed(state) {
  const th = state.ang * Math.PI / 180;
  return {
    x: state.speed * Math.cos(th) * state.t,
    y: state.speed * Math.sin(th) * state.t - 0.5 * G * state.t * state.t,
  };
}

/**
 * Three equal fragments. Their velocities relative to the centre of mass are (u, 0),
 * (−u/2, u/2) and (−u/2, −u/2), which add to nothing.
 */
function fragments(state) {
  const th = state.ang * Math.PI / 180;
  const vx = state.speed * Math.cos(th);
  const vy = state.speed * Math.sin(th);
  const u = state.u;
  const rel = [[u, 0], [-u / 2, u / 2], [-u / 2, -u / 2]];
  return rel.map(([rx, ry]) => ({
    x: (vx + rx) * state.t,
    y: (vy + ry) * state.t - 0.5 * G * state.t * state.t,
  }));
}

function burstAverage(state) {
  const parts = fragments(state);
  const x = parts.reduce((s, p) => s + p.x, 0) / parts.length;
  const y = parts.reduce((s, p) => s + p.y, 0) / parts.length;
  return { x, y };
}

function answer(state, which) {
  if (state.kind === 'rod') return which === 'quad' ? rodQuad(state) : rodClosed(state);
  if (state.kind === 'hoop') return which === 'quad' ? hoopQuad(state) : { x: 0, y: 0 };
  if (state.kind === 'burst') return which === 'quad' ? burstAverage(state) : burstClosed(state);
  if (which === 'quad') {
    const total = state.m1 + state.m2;
    return {
      x: (state.m1 * state.x1 + state.m2 * state.x2) / total,
      y: (state.m1 * state.y1 + state.m2 * state.y2) / total,
    };
  }
  const r = pointsOf(state);
  return { x: r.x, y: r.y };
}

export default defineLab({
  id: 'center-of-mass',
  exam: 'u5',
  title: 'Center of mass',
  hint: 'The centre of mass is the mass-weighted average. A burst does not push it off the path.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0, 24), target: new THREE.Vector3(0, 0, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'cm-mass',
      scenario: 'unequal',
      ask: 'Double the heavier mass. It sits to the right. What happens to the horizontal position of the centre of mass?',
      apply(s) { s.m2 *= 2; },
      watch: [{ id: 'x', label: 'the horizontal position', get: (c) => c.x }],
      mode: 'dir',
      expect: { x: 'bigger' },
      why: 'The centre of mass is pulled toward the heavier mass. Doubling that mass moves the average closer to it.',
    },
    {
      id: 'cm-end',
      scenario: 'rod',
      ask: 'Double the mass fixed at the end of the rod. What happens to the centre of mass?',
      apply(s) { s.mend *= 2; },
      watch: [{ id: 'x', label: 'the centre of mass along the rod', get: (c) => c.x }],
      mode: 'dir',
      expect: { x: 'bigger' },
      why: 'A uniform rod on its own balances at its midpoint. Mass at the end pulls the balance toward that end.',
    },
    {
      id: 'cm-burst',
      scenario: 'burst',
      ask: 'Double the speed of the fragments relative to the centre of mass. What happens to where the centre of mass is?',
      apply(s) { s.u *= 2; },
      watch: [
        { id: 'x', label: 'its horizontal position', get: (c) => c.x },
        { id: 'y', label: 'its height', get: (c) => c.y },
      ],
      mode: 'dir',
      expect: { x: 'same', y: 'same' },
      why: 'The fragments push each other, not the outside world. Their extra momenta cancel, so the centre of mass stays on the parabola.',
    },
    {
      id: 'cm-launch',
      scenario: 'burst',
      ask: 'Double the launch speed of the shell. What happens to the horizontal position of the centre of mass?',
      apply(s) { s.speed *= 2; },
      watch: [{ id: 'x', label: 'its horizontal position', get: (c) => c.x, mode: 'factor' }],
      expect: { x: 2 },
      why: String.raw`No horizontal force acts, so $x_{\mathrm{cm}} = (v\cos\theta)\,t$. Twice the launch speed means twice the horizontal position at the same time. The height is not a clean factor, because gravity has been subtracting $\tfrac12 gt^2$ the whole way.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('unequal', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${selectRow('cm-kind', 'Body', KINDS, 'points')}<div id="cm-points">${sliderRow('cm-m1', 'Mass 1 (kg)', 2, 0.2, 20, 0.1)}${sliderRow('cm-x1', 'x₁ (m)', 0, -8, 8, 0.1)}${sliderRow('cm-y1', 'y₁ (m)', 0, -4, 4, 0.1)}${sliderRow('cm-m2', 'Mass 2 (kg)', 6, 0.2, 20, 0.1)}${sliderRow('cm-x2', 'x₂ (m)', 4, -8, 8, 0.1)}${sliderRow('cm-y2', 'y₂ (m)', 1, -4, 4, 0.1)}</div><div id="cm-rod">${sliderRow('cm-L', 'Rod length (m)', 2, 0.4, 6, 0.1)}${sliderRow('cm-mrod', 'Rod mass (kg)', 3, 0.2, 20, 0.1)}${sliderRow('cm-mend', 'End mass (kg)', 1, 0, 20, 0.1)}</div><div id="cm-hoop">${sliderRow('cm-R', 'Hoop radius (m)', 1, 0.2, 3, 0.1)}</div><div id="cm-burst">${sliderRow('cm-v', 'Launch speed (m/s)', 8, 1, 20, 0.1)}${sliderRow('cm-ang', 'Launch angle (°)', 50, 15, 75, 1)}${sliderRow('cm-t', 'Time (s)', 1.2, 0.2, 2.5, 0.05)}${sliderRow('cm-u', 'Fragment speed in the CM frame (m/s)', 3, 0, 12, 0.1)}</div></div>`;
  },
  bind(api) {
    bindSelect(api, 'cm-kind', (s, v) => { s.kind = v; });
    bindSlider(api, 'cm-m1', (s, v) => { s.m1 = v; });
    bindSlider(api, 'cm-x1', (s, v) => { s.x1 = v; });
    bindSlider(api, 'cm-y1', (s, v) => { s.y1 = v; });
    bindSlider(api, 'cm-m2', (s, v) => { s.m2 = v; });
    bindSlider(api, 'cm-x2', (s, v) => { s.x2 = v; });
    bindSlider(api, 'cm-y2', (s, v) => { s.y2 = v; });
    bindSlider(api, 'cm-L', (s, v) => { s.L = v; });
    bindSlider(api, 'cm-mrod', (s, v) => { s.mrod = v; });
    bindSlider(api, 'cm-mend', (s, v) => { s.mend = v; });
    bindSlider(api, 'cm-R', (s, v) => { s.R = v; });
    bindSlider(api, 'cm-v', (s, v) => { s.speed = v; });
    bindSlider(api, 'cm-ang', (s, v) => { s.ang = v; });
    bindSlider(api, 'cm-t', (s, v) => { s.t = v; });
    bindSlider(api, 'cm-u', (s, v) => { s.u = v; });
  },
  syncControls(state) {
    const show = (id, on) => {
      const el = document.getElementById(id);
      if (el) el.hidden = !on;
    };
    show('cm-points', state.kind === 'points');
    show('cm-rod', state.kind === 'rod');
    show('cm-hoop', state.kind === 'hoop');
    show('cm-burst', state.kind === 'burst');
    putSelect('cm-kind', state.kind);
    putSlider('cm-m1', state.m1, 1);
    putSlider('cm-x1', state.x1, 1);
    putSlider('cm-y1', state.y1, 1);
    putSlider('cm-m2', state.m2, 1);
    putSlider('cm-x2', state.x2, 1);
    putSlider('cm-y2', state.y2, 1);
    putSlider('cm-L', state.L, 1);
    putSlider('cm-mrod', state.mrod, 1);
    putSlider('cm-mend', state.mend, 1);
    putSlider('cm-R', state.R, 1);
    putSlider('cm-v', state.speed, 1);
    putSlider('cm-ang', state.ang, 0);
    putSlider('cm-t', state.t, 2);
    putSlider('cm-u', state.u, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const ground = fatLine([-5.2, -2.4, 0, 5.2, -2.4, 0], { color: M.greyDark, width: 2 });
    const rod = fatLine([0, 0, 0, 1, 0, 0], { color: M.blue, width: 3 });
    const hoop = fatLine(new Array(49 * 3).fill(0), { color: M.blue, width: 2.5 });
    const path = fatLine(new Array(41 * 3).fill(0), { color: M.grey, width: 1.5 });
    const masses = [0, 1, 2].map(() => dot(M.blue, 0.14));
    const cm = dot(MARK, 0.16);
    const name = label('CM', 0, 0, 0, 'graph-axis');
    group.add(ground, rod, hoop, path, ...masses, cm, name);
    group.visible = false;
    return { group, rod, hoop, path, masses, cm, name };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    Object.assign(computed, answer(state, 'closed'));
  },
  second(state) {
    return answer(state, 'quad');
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.cm) return;
    ctx.grid.visible = false;
    h.masses.forEach((d) => { d.visible = false; });
    h.rod.visible = false;
    h.hoop.visible = false;
    h.path.visible = false;
    const place = (mesh, x, y) => { mesh.position.set(x, y, 0.05); mesh.visible = true; };
    if (state.kind === 'points') {
      const xs = [state.x1, state.x2, computed.x];
      const ys = [state.y1, state.y2, computed.y];
      const lo = Math.min(...xs, ...ys);
      const hi = Math.max(...xs, ...ys);
      const span = Math.max(hi - lo, 1);
      const s = 6 / span;
      const map = (q) => (q - (lo + hi) / 2) * s;
      place(h.masses[0], map(state.x1), map(state.y1));
      place(h.masses[1], map(state.x2), map(state.y2));
      h.masses[1].material.color.set(M.gold);
      place(h.cm, map(computed.x), map(computed.y));
      h.name.position.set(map(computed.x), map(computed.y) + 0.45, 0);
      return;
    }
    if (state.kind === 'rod') {
      const s = 4 / state.L;
      const x0 = -2;
      updateFatLine(h.rod, [x0, 0.2, 0.02, x0 + state.L * s, 0.2, 0.02]);
      h.rod.visible = true;
      place(h.masses[0], x0 + state.L * s, 0.2);
      h.masses[0].material.color.set(M.gold);
      place(h.cm, x0 + computed.x * s, 0.2);
      h.name.position.set(x0 + computed.x * s, 0.7, 0);
      return;
    }
    if (state.kind === 'hoop') {
      const s = 1.6 / state.R;
      const pts = [];
      for (let i = 0; i <= 48; i += 1) {
        const a = (i / 48) * Math.PI * 2;
        pts.push(state.R * s * Math.cos(a), state.R * s * Math.sin(a), 0.02);
      }
      updateFatLine(h.hoop, pts);
      h.hoop.visible = true;
      place(h.cm, computed.x * s, computed.y * s);
      h.name.position.set(0, 0.45, 0);
      return;
    }
    const parts = fragments(state);
    const th = state.ang * Math.PI / 180;
    const pts = [];
    const tmax = Math.max(state.t, 0.4);
    for (let i = 0; i <= 40; i += 1) {
      const t = (tmax * i) / 40;
      pts.push(state.speed * Math.cos(th) * t, state.speed * Math.sin(th) * t - 0.5 * G * t * t, 0);
    }
    const xs = pts.filter((_, i) => i % 3 === 0).concat(parts.map((p) => p.x), [computed.x]);
    const ys = pts.filter((_, i) => i % 3 === 1).concat(parts.map((p) => p.y), [computed.y, 0]);
    const loX = Math.min(...xs);
    const hiX = Math.max(...xs);
    const loY = Math.min(...ys);
    const hiY = Math.max(...ys);
    const s = 7 / Math.max(hiX - loX, hiY - loY, 1);
    const mapX = (q) => -3.2 + (q - loX) * s;
    const mapY = (q) => -1.6 + (q - loY) * s;
    const drawn = [];
    for (let i = 0; i < pts.length; i += 3) drawn.push(mapX(pts[i]), mapY(pts[i + 1]), 0);
    updateFatLine(h.path, drawn);
    h.path.visible = true;
    parts.forEach((p, i) => {
      place(h.masses[i], mapX(p.x), mapY(p.y));
      h.masses[i].material.color.set(i === 0 ? M.blue : M.gold);
    });
    place(h.cm, mapX(computed.x), mapY(computed.y));
    h.name.position.set(mapX(computed.x), mapY(computed.y) + 0.4, 0);
  },
  law(state) {
    if (state.kind === 'burst') return [String.raw`x_{\mathrm{cm}} = (v\cos\theta)\,t`, String.raw`y_{\mathrm{cm}} = (v\sin\theta)\,t - \tfrac12 gt^2`];
    if (state.kind === 'rod') return [String.raw`x_{\mathrm{cm}} = \dfrac{m_{\mathrm{rod}} L/2 + m_{\mathrm{end}} L}{m_{\mathrm{rod}}+m_{\mathrm{end}}}`];
    if (state.kind === 'hoop') return [String.raw`x_{\mathrm{cm}} = 0`];
    return [String.raw`x_{\mathrm{cm}} = \dfrac{\sum m_i x_i}{\sum m_i}`];
  },
  readoutCells(state, computed) {
    return [
      ['x of the centre of mass', `${fmt(computed.x)} m`],
      ['y of the centre of mass', `${fmt(computed.y)} m`],
    ];
  },
  coach(state, computed) {
    if (state.kind === 'burst') {
      return {
        title: 'Internal forces cancel',
        body: [
          String.raw`The centre of mass is at $(${fmt(computed.x)},\ ${fmt(computed.y)})$ m. That is the parabola of the shell before it burst.`,
          'The fragments fly apart. Their momenta relative to the centre of mass add to zero, so they cannot shift it.',
        ],
      };
    }
    if (state.kind === 'hoop') {
      return {
        title: 'The centre, not the rim',
        body: [
          'Every bit of a uniform hoop has a match opposite it. The centre of mass stays at the centre, where there is no material.',
        ],
      };
    }
    if (state.kind === 'rod') {
      return {
        title: 'Not the midpoint, once the end is loaded',
        body: [
          String.raw`A uniform rod balances at $L/2$. The end mass pulls the centre of mass out to $${fmt(computed.x)}$ m.`,
        ],
      };
    }
    return {
      title: 'Weight the positions',
      body: [
        String.raw`The centre of mass is at $(${fmt(computed.x)},\ ${fmt(computed.y)})$ m. It sits closer to the heavier mass.`,
        'It is not halfway unless the masses are equal.',
      ],
    };
  },
});
