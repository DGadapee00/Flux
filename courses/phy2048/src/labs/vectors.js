/**
 * Shows that vectors add by components and not by magnitudes, that a·b is a projection (zero at a
 * right angle, largest when they are parallel), and that |a×b| is the area of the parallelogram
 * they span (zero when parallel, largest at a right angle).
 *
 * Both vectors lie in the xy plane, in metres: displacements. The components are the primary
 * computation (`dot`, `cross` and `add` from the mechanics library). The check is trigonometric:
 * the law of cosines for |a+b|, |a||b|cos φ and |a||b| sin φ with φ the signed angle from a to b,
 * and the shoelace area of the parallelogram.
 */
import * as THREE from 'three';
import { add, cross, dot, mag, v } from '@flux/subjects/mechanics/vectors.js';
import { Arrow, M, dot as dotMesh, fatLine, label, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const SCENARIOS = [
  { id: 'right', name: 'A 3–4–5 pair, at a right angle', a: { x: 3, y: 0 }, b: { x: 0, y: 4 } },
  { id: 'acute', name: 'An acute angle', a: { x: 4, y: 1 }, b: { x: 2, y: 3 } },
  { id: 'obtuse', name: 'An obtuse angle', a: { x: 3, y: 2 }, b: { x: -4, y: 1 } },
];

const LIMIT = 6;
const Z = 0.04;
const BLUE = M.blue;
const TEAL = M.teal;

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const vec = (p) => v(p.x, p.y, 0);

function placeArrow(arrow, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const L = Math.hypot(dx, dy);
  arrow.position.set(from.x, from.y, Z);
  if (L < 1e-6) {
    arrow.visible = false;
    return;
  }
  arrow.visible = true;
  arrow.setDirection(new THREE.Vector3(dx / L, dy / L, 0));
  arrow.setLength(L);
}

function fade(arrow, opacity) {
  for (const m of [arrow.line.material]) {
    m.transparent = true;
    m.opacity = opacity;
  }
}

export default defineLab({
  id: 'vectors',
  exam: 'u1',
  title: 'Vectors',
  hint: 'Drag a tip. The sum, the dot product and the cross product follow.',
  orbit: false,
  fit: { w: 14, h: 14 },
  camera: { pos: new THREE.Vector3(0, 0, 26), target: new THREE.Vector3(0, 0, 0) },
  toggles: [
    { key: 'sum', label: 'Sum, tip to tail' },
    { key: 'proj', label: 'Projection (dot)' },
    { key: 'area', label: 'Area (cross)' },
  ],
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'vec-turn',
      scenario: 'right',
      ask: 'Turn $\\vec b$ so it points along $\\vec a$, keeping its length: $\\vec b = (4, 0)$. What happens to $\\vec a\\cdot\\vec b$ and to the area they span?',
      apply(s) { s.b = { x: 4, y: 0 }; },
      watch: [
        { id: 'dot', label: 'the dot product', get: (c) => c.dot },
        { id: 'area', label: 'the area of the parallelogram', get: (c) => c.area },
      ],
      mode: 'dir',
      expect: { dot: 'bigger', area: 'smaller' },
      why: String.raw`The dot product is $ab\cos\varphi$: zero at a right angle and largest when the vectors are parallel. The area is $ab\sin\varphi$: largest at a right angle and zero when they are parallel. The two trade places.`,
    },
    {
      id: 'vec-reverse',
      scenario: 'acute',
      ask: 'Reverse $\\vec b$, so it points the opposite way and keeps its length. What happens to $\\vec a\\cdot\\vec b$ and to the area of the parallelogram?',
      apply(s) { s.b = { x: -s.b.x, y: -s.b.y }; },
      watch: [
        { id: 'dot', label: 'the dot product', get: (c) => c.dot, signed: true },
        { id: 'area', label: 'the area of the parallelogram', get: (c) => c.area },
      ],
      mode: 'dir',
      expect: { dot: 'smaller', area: 'same' },
      why: String.raw`Reversing $\vec b$ turns $\cos\varphi$ into $-\cos\varphi$, so the dot product changes sign (here from $+11$ to $-11$). The parallelogram has the same sides, so the area does not change; only the sign of the cross product would.`,
    },
    {
      id: 'vec-magnitudes',
      scenario: 'right',
      ask: 'Here $|\\vec a| = 3$ m and $|\\vec b| = 4$ m. Is the length of $\\vec a + \\vec b$ equal to $3 + 4 = 7$ m?',
      apply() {},
      watch: [{ id: 'seven', label: 'the sum has length 7 m', get: (c) => Math.abs(c.magSum - 7) < 1e-9, mode: 'bool' }],
      expect: { seven: false },
      why: String.raw`Vectors add by components, not by magnitudes. Here $\vec a + \vec b = (3, 4)$, and its length is $\sqrt{3^2 + 4^2} = 5$ m. Lengths add only when the two vectors point the same way.`,
    },
  ],
  defaultState() {
    const state = { show: { sum: true, proj: false, area: false } };
    this.applyScenario('right', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    state.scenarioId = sc.id;
    state.a = { ...sc.a };
    state.b = { ...sc.b };
  },
  controls() {
    return `<div class="lab-block">${sliderRow('vc-ax', 'a, x component (m)', 3, -LIMIT, LIMIT, 0.5)}${sliderRow('vc-ay', 'a, y component (m)', 0, -LIMIT, LIMIT, 0.5)}${sliderRow('vc-bx', 'b, x component (m)', 0, -LIMIT, LIMIT, 0.5)}${sliderRow('vc-by', 'b, y component (m)', 4, -LIMIT, LIMIT, 0.5)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'vc-ax', (s, x) => { s.a.x = x; });
    bindSlider(api, 'vc-ay', (s, x) => { s.a.y = x; });
    bindSlider(api, 'vc-bx', (s, x) => { s.b.x = x; });
    bindSlider(api, 'vc-by', (s, x) => { s.b.y = x; });
  },
  syncControls(state) {
    putSlider('vc-ax', state.a.x, 1);
    putSlider('vc-ay', state.a.y, 1);
    putSlider('vc-bx', state.b.x, 1);
    putSlider('vc-by', state.b.y, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const aArrow = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, BLUE);
    const bArrow = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, TEAL);
    const bGhost = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, TEAL);
    const sumArrow = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, M.white);
    fade(bGhost, 0.5);
    const aTip = dotMesh(BLUE, 0.2);
    const bTip = dotMesh(TEAL, 0.2);
    aTip.userData.which = 'a';
    bTip.userData.which = 'b';
    const aName = label('<i>a</i>', 0, 0, 0, 'graph-title');
    const bName = label('<i>b</i>', 0, 0, 0, 'graph-title');
    const sumName = label('<i>a</i> + <i>b</i>', 0, 0, 0, 'graph-title');
    const guides = Array.from({ length: 4 }, (_, i) => fatLine([0, 0, 0, 1, 0, 0], { color: i < 2 ? BLUE : TEAL, width: 1.2, opacity: 0.5 }));
    const arc = fatLine(new Array(25 * 3).fill(0), { color: M.white, width: 2, opacity: 0.85 });
    const phiName = label('φ', 0, 0, 0, 'graph-title');
    const projLine = fatLine([0, 0, 0, 1, 0, 0], { color: M.gold, width: 6 });
    const projDrop = fatLine([0, 0, 0, 1, 0, 0], { color: M.gold, width: 1.5, opacity: 0.7 });
    const outline = fatLine(new Array(5 * 3).fill(0), { color: M.pink, width: 2 });
    const fillGeo = new THREE.BufferGeometry();
    fillGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6 * 3), 3));
    const fill = new THREE.Mesh(fillGeo, new THREE.MeshBasicMaterial({ color: M.pink, transparent: true, opacity: 0.22, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }));
    fill.frustumCulled = false;
    const areaName = label('', 0, 0, 0, 'graph-title');
    group.add(fill, outline, projDrop, projLine, ...guides, arc, bGhost, sumArrow, aArrow, bArrow, aTip, bTip, aName, bName, sumName, phiName, areaName);
    group.visible = false;
    return { group, aArrow, bArrow, bGhost, sumArrow, aTip, bTip, aName, bName, sumName, guides, arc, phiName, projLine, projDrop, outline, fill, areaName };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const a = vec(state.a);
    const b = vec(state.b);
    const s = add(a, b);
    const ma = mag(a);
    const mb = mag(b);
    computed.ma = ma;
    computed.mb = mb;
    computed.sum = { x: s.x, y: s.y };
    computed.magSum = mag(s);
    computed.dot = dot(a, b);
    computed.cross = cross(a, b).z;
    computed.area = Math.abs(computed.cross);
    const m = ma * mb;
    computed.phi = m < 1e-12 ? 0 : (Math.acos(clamp(computed.dot / m, -1, 1)) * 180) / Math.PI;
    computed.proj = mb < 1e-12 ? 0 : computed.dot / mb;
  },
  second(state) {
    // By the angles: the signed angle from a to b, the law of cosines, and the shoelace area.
    const { a, b } = state;
    const ma = Math.hypot(a.x, a.y);
    const mb = Math.hypot(b.x, b.y);
    let phi = Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x);
    phi = Math.atan2(Math.sin(phi), Math.cos(phi));
    if (ma < 1e-12 || mb < 1e-12) phi = 0;
    const corners = [[0, 0], [a.x, a.y], [a.x + b.x, a.y + b.y], [b.x, b.y]];
    let shoelace = 0;
    for (let i = 0; i < 4; i += 1) {
      const [x1, y1] = corners[i];
      const [x2, y2] = corners[(i + 1) % 4];
      shoelace += x1 * y2 - x2 * y1;
    }
    return {
      dot: ma * mb * Math.cos(phi),
      cross: ma * mb * Math.sin(phi),
      magSum: Math.sqrt(Math.max(0, ma * ma + mb * mb + 2 * ma * mb * Math.cos(phi))),
      area: Math.abs(shoelace) / 2,
      proj: ma * Math.cos(phi),
      phi: (Math.abs(phi) * 180) / Math.PI,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = true;
    const o = { x: 0, y: 0 };
    const { a, b } = state;
    const s = computed.sum;
    const show = state.show || {};
    placeArrow(h.aArrow, o, a);
    placeArrow(h.bArrow, o, b);
    h.aTip.position.set(a.x, a.y, Z + 0.02);
    h.bTip.position.set(b.x, b.y, Z + 0.02);
    h.aName.position.set(a.x * 1.0, a.y + (a.y >= 0 ? 0.55 : -0.55), 0);
    h.bName.position.set(b.x * 1.0, b.y + (b.y >= 0 ? 0.55 : -0.55), 0);
    // Tip to tail: b again, from the tip of a, and the sum from the origin.
    h.bGhost.visible = !!show.sum;
    h.sumArrow.visible = !!show.sum;
    h.sumName.visible = !!show.sum;
    if (show.sum) {
      placeArrow(h.bGhost, a, s);
      placeArrow(h.sumArrow, o, s);
      h.sumName.position.set(s.x * 0.5 + 0.05, s.y * 0.5 - 0.6, 0);
    }
    // The components of each vector, dropped to the axes.
    updateFatLine(h.guides[0], [a.x, 0, 0, a.x, a.y, 0]);
    updateFatLine(h.guides[1], [0, a.y, 0, a.x, a.y, 0]);
    updateFatLine(h.guides[2], [b.x, 0, 0, b.x, b.y, 0]);
    updateFatLine(h.guides[3], [0, b.y, 0, b.x, b.y, 0]);
    // The angle between them, as an arc.
    const ang = (p) => Math.atan2(p.y, p.x);
    const ok = computed.ma > 0.05 && computed.mb > 0.05;
    h.arc.visible = ok;
    h.phiName.visible = ok;
    if (ok) {
      let d = ang(b) - ang(a);
      d = Math.atan2(Math.sin(d), Math.cos(d));
      const r = Math.min(1.3, 0.45 * Math.min(computed.ma, computed.mb) + 0.3);
      const pts = [];
      for (let i = 0; i <= 24; i += 1) {
        const t = ang(a) + (d * i) / 24;
        pts.push(Math.cos(t) * r, Math.sin(t) * r, Z);
      }
      updateFatLine(h.arc, pts);
      const mid = ang(a) + d / 2;
      h.phiName.position.set(Math.cos(mid) * (r + 0.45), Math.sin(mid) * (r + 0.45), 0);
    }
    // The projection of a on b, and the dashed drop from the tip of a.
    h.projLine.visible = !!show.proj && computed.mb > 0.05;
    h.projDrop.visible = h.projLine.visible;
    if (h.projLine.visible) {
      const k = computed.proj / computed.mb;
      const px = b.x * k;
      const py = b.y * k;
      updateFatLine(h.projLine, [0, 0, 0.03, px, py, 0.03]);
      updateFatLine(h.projDrop, [a.x, a.y, 0.03, px, py, 0.03]);
    }
    // The parallelogram they span.
    h.outline.visible = !!show.area;
    h.fill.visible = !!show.area;
    h.areaName.visible = !!show.area;
    if (show.area) {
      updateFatLine(h.outline, [0, 0, 0.02, a.x, a.y, 0.02, s.x, s.y, 0.02, b.x, b.y, 0.02, 0, 0, 0.02]);
      h.fill.geometry.attributes.position.array.set([0, 0, 0.01, a.x, a.y, 0.01, s.x, s.y, 0.01, 0, 0, 0.01, s.x, s.y, 0.01, b.x, b.y, 0.01]);
      h.fill.geometry.attributes.position.needsUpdate = true;
      h.areaName.element.innerHTML = `area ${fmt(computed.area, 3)} m²`;
      h.areaName.position.set(s.x / 2, s.y / 2, 0);
    }
  },
  law: () => [
    String.raw`\vec a\cdot\vec b = a_x b_x + a_y b_y = ab\cos\varphi`,
    String.raw`(\vec a\times\vec b)_z = a_x b_y - a_y b_x = ab\sin\varphi`,
  ],
  readoutCells(state, computed) {
    return [
      ['Length of the sum, |a + b|', `${fmt(computed.magSum, 4)} m`],
      ['Dot product, a·b', `${fmt(computed.dot, 4)} m²`, computed.dot < 0 ? 'warn' : ''],
      ['Cross product, (a × b)z', `${fmt(computed.cross, 4)} m²`],
      ['Angle between them', `${fmt(computed.phi, 4)}°`],
      ['|a| and |b|', `${fmt(computed.ma, 3)} m, ${fmt(computed.mb, 3)} m`],
      ['a + b, by components', `(${fmt(computed.sum.x, 4)}, ${fmt(computed.sum.y, 4)}) m`],
    ];
  },
  coach(state, computed) {
    if (Math.abs(computed.dot) < 1e-9 && computed.ma > 0 && computed.mb > 0) {
      return {
        title: 'At a right angle the dot product is zero',
        body: String.raw`$\vec a\cdot\vec b = ab\cos 90^\circ = 0$. Neither vector has any part along the other. The parallelogram is then a rectangle, and its area $ab = ${fmt(computed.area, 4)}\ \mathrm{m^2}$ is the largest the two lengths can make.`,
      };
    }
    if (computed.dot < 0) {
      return {
        title: 'An obtuse angle makes the dot product negative',
        body: String.raw`Past $90^\circ$ the cosine is negative, so $\vec a\cdot\vec b < 0$: $\vec a$ has a part pointing against $\vec b$. The area is still positive, because it is $ab\,|\sin\varphi|$.`,
      };
    }
    return {
      title: 'Add by components, never by lengths',
      body: String.raw`Each component of $\vec a + \vec b$ is the sum of the two components: $(${fmt(state.a.x, 3)} + ${fmt(state.b.x, 3)},\ ${fmt(state.a.y, 3)} + ${fmt(state.b.y, 3)})$. Its length, $${fmt(computed.magSum, 4)}$ m, is not $|a| + |b| = ${fmt(computed.ma + computed.mb, 4)}$ m unless they point the same way. The dot product $ab\cos\varphi$ is the length of one times the part of the other along it. The cross product's size is the area of the parallelogram.`,
    };
  },
  pointer: {
    down(e, ctx) {
      const hits = ctx.pick(e, [ctx.handle.aTip, ctx.handle.bTip]);
      if (!hits.length) return false;
      ctx.drag = hits[0].object.userData.which;
      return true;
    },
    move(e, ctx) {
      if (!ctx.drag) return;
      const p = ctx.onPlane(e);
      if (!p) return;
      const snap = e.altKey ? 0.05 : 0.5;
      const v2 = ctx.state[ctx.drag];
      v2.x = clamp(Math.round(p.x / snap) * snap, -LIMIT, LIMIT);
      v2.y = clamp(Math.round(p.y / snap) * snap, -LIMIT, LIMIT);
      ctx.bump();
    },
    up(e, ctx) {
      ctx.drag = null;
    },
  },
});
