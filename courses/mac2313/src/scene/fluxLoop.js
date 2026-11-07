import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { VectorBatch } from './arrows.js';
import { fatSegments, setFatSegments, segmentCapacity, rampColor, M } from './manim.js';

const LOOP_SEGMENTS = 192;
const _o = new THREE.Vector3();
const _d = new THREE.Vector3();
const _c = new THREE.Color();

function toWorld(x, y, lift, u) {
  const p = mathToWorld(x, y, 0, u);
  const up = mathToWorld(0, 0, 1, u);
  return _o.set(p.x + up.x * lift, p.y + up.y * lift, p.z + up.z * lift);
}

function dirWorld(vx, vy) {
  const d = mathToWorld(vx, vy, 0, 1);
  return _d.set(d.x, d.y, d.z).normalize();
}

/**
 * A plane field drawn as arrows on a grid, a closed loop, and the flow across the loop: arrows
 * along the outward normal where the field leaves (teal) and against it where it enters (red),
 * each as long as |F · n| there.
 */
export class FluxLoopView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.field = new VectorBatch(this.group, 0xffffff);
    this.out = new VectorBatch(this.group, M.teal);
    this.in = new VectorBatch(this.group, M.red);
    this.loop = fatSegments(segmentCapacity(LOOP_SEGMENTS), { color: M.yellow, width: 3, opacity: 0.95 });
    this.group.add(this.loop);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  /**
   * @param {{ field: any, grid: { xMin: number, xMax: number, yMin: number, yMax: number, step: number },
   *   edge: (u: number) => { x: number, y: number, nx: number, ny: number, flow: number },
   *   showField: boolean, showFlow: boolean, flowScale: number }} spec
   */
  sync({ field, grid, edge, showField, showFlow, flowScale }) {
    const u = sceneScale();
    const lift = 0.02;

    this.field.begin();
    if (showField) {
      const mags = [];
      for (let x = grid.xMin; x <= grid.xMax + 1e-9; x += grid.step) {
        for (let y = grid.yMin; y <= grid.yMax + 1e-9; y += grid.step) {
          const P = field.P(x, y);
          const Q = field.Q(x, y);
          const m = Math.hypot(P, Q);
          if (Number.isFinite(m) && m > 1e-9) mags.push({ x, y, P, Q, m });
        }
      }
      // Scale to a typical arrow, not the largest, so one strong spot (a point source) does not
      // shrink the rest to dots.
      const sorted = mags.map((g) => g.m).sort((p, q) => p - q);
      const typical = Math.max(1e-9, sorted[Math.floor(0.75 * (sorted.length - 1))] || 1);
      for (const g of mags) {
        const t = Math.tanh((1.2 * g.m) / typical);
        const L = (0.12 + 0.3 * t) * grid.step * u;
        rampColor(Math.min(1, (0.8 * g.m) / typical), _c);
        this.field.push(toWorld(g.x, g.y, lift, u).clone(), dirWorld(g.P, g.Q).clone(), L, _c);
      }
    }
    this.field.end(!!showField);

    const flat = [];
    for (let i = 0; i < LOOP_SEGMENTS; i++) {
      const p = edge(i / LOOP_SEGMENTS);
      const q = edge((i + 1) / LOOP_SEGMENTS);
      const a = toWorld(p.x, p.y, lift * 1.5, u);
      flat.push(a.x, a.y, a.z);
      const b = toWorld(q.x, q.y, lift * 1.5, u);
      flat.push(b.x, b.y, b.z);
    }
    setFatSegments(this.loop, flat);

    this.out.begin();
    this.in.begin();
    if (showFlow) {
      const n = 32;
      for (let i = 0; i < n; i++) {
        const p = edge((i + 0.5) / n);
        const L = Math.min(0.9, Math.abs(p.flow) * flowScale) * u;
        if (!(L > 0.02 * u)) continue;
        if (p.flow > 0) {
          this.out.push(toWorld(p.x, p.y, lift * 2, u).clone(), dirWorld(p.nx, p.ny).clone(), L, null);
        } else {
          // An inward arrow starts outside the loop and ends on it.
          const s = L / u;
          this.in.push(toWorld(p.x + p.nx * s, p.y + p.ny * s, lift * 2, u).clone(), dirWorld(-p.nx, -p.ny).clone(), L, null);
        }
      }
    }
    this.out.end(!!showFlow);
    this.in.end(!!showFlow);
  }
}
