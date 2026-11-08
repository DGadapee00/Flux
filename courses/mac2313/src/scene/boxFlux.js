import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { VectorBatch } from './arrows.js';
import { fatSegments, setFatSegments, segmentCapacity, rampColor, M } from './manim.js';

const _c = new THREE.Color();

function world(x, y, z, u) {
  const p = mathToWorld(x, y, z, u);
  return new THREE.Vector3(p.x, p.y, p.z);
}

function dirWorld(vx, vy, vz) {
  const d = mathToWorld(vx, vy, vz, 1);
  return new THREE.Vector3(d.x, d.y, d.z).normalize();
}

/**
 * A box in space: its twelve edges, a field drawn as arrows on a coarse 3D grid, and the flow
 * through each face, arrows along the outward normal where the field leaves (teal) and against it
 * where it enters (red), each as long as |F · n| there.
 */
export class BoxFluxView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.field = new VectorBatch(this.group, 0xffffff);
    this.out = new VectorBatch(this.group, M.teal);
    this.in = new VectorBatch(this.group, M.red);
    this.edges = fatSegments(segmentCapacity(12), { color: M.yellow, width: 2.6, opacity: 0.95 });
    this.group.add(this.edges);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({ field, box, half = 2, step = 1, showField = true, showFlow = true }) {
    const u = sceneScale();
    const { a, b, c, s } = box;

    this.field.begin();
    if (showField) {
      const pts = [];
      for (let x = -half; x <= half + 1e-9; x += step) {
        for (let y = -half; y <= half + 1e-9; y += step) {
          for (let z = -half; z <= half + 1e-9; z += step) {
            const f = field.F(x, y, z);
            const m = Math.hypot(...f);
            if (Number.isFinite(m) && m > 1e-9) pts.push({ x, y, z, f, m });
          }
        }
      }
      const sorted = pts.map((p) => p.m).sort((p, q) => p - q);
      const typical = Math.max(1e-9, sorted[Math.floor(0.75 * (sorted.length - 1))] || 1);
      for (const p of pts) {
        const t = Math.tanh((1.2 * p.m) / typical);
        const L = (0.06 + 0.16 * t) * step * u;
        rampColor(Math.min(1, (0.8 * p.m) / typical), _c);
        this.field.push(world(p.x, p.y, p.z, u), dirWorld(...p.f), L, _c.clone());
      }
    }
    this.field.end(!!showField);

    const corner = (i, j, k) => world(a + i * s, b + j * s, c + k * s, u);
    const flat = [];
    const edge = (p, q) => flat.push(p.x, p.y, p.z, q.x, q.y, q.z);
    for (const j of [-1, 1]) for (const k of [-1, 1]) edge(corner(-1, j, k), corner(1, j, k));
    for (const i of [-1, 1]) for (const k of [-1, 1]) edge(corner(i, -1, k), corner(i, 1, k));
    for (const i of [-1, 1]) for (const j of [-1, 1]) edge(corner(i, j, -1), corner(i, j, 1));
    setFatSegments(this.edges, flat);

    this.out.begin();
    this.in.begin();
    if (showFlow) {
      const samples = [];
      const centre = [a, b, c];
      for (const [axis, side] of [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]]) {
        const [p1, p2] = [0, 1, 2].filter((k) => k !== axis);
        for (const g of [-0.6, 0, 0.6]) for (const h of [-0.6, 0, 0.6]) {
          const p = [0, 0, 0];
          p[axis] = centre[axis] + side * s;
          p[p1] = centre[p1] + g * s;
          p[p2] = centre[p2] + h * s;
          const f = field.F(p[0], p[1], p[2]);
          const n = [0, 0, 0];
          n[axis] = side;
          samples.push({ p, n, flow: side * f[axis] });
        }
      }
      const top = Math.max(1e-9, ...samples.map((q) => Math.abs(q.flow)).filter(Number.isFinite));
      for (const q of samples) {
        if (!Number.isFinite(q.flow)) continue;
        const L = (0.45 * Math.abs(q.flow)) / top * u;
        if (!(L > 0.02 * u)) continue;
        if (q.flow > 0) this.out.push(world(...q.p, u), dirWorld(...q.n), L, null);
        else {
          const k = L / u;
          this.in.push(world(q.p[0] + q.n[0] * k, q.p[1] + q.n[1] * k, q.p[2] + q.n[2] * k, u), dirWorld(-q.n[0], -q.n[1], -q.n[2]), L, null);
        }
      }
    }
    this.out.end(!!showFlow);
    this.in.end(!!showFlow);
  }
}
