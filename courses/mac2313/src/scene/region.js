import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { fatSegments, setFatSegments, segmentCapacity, M } from './manim.js';

const CAP = 160;

/** Floor outline of the region of integration. Segment budget is fixed. */
export class RegionView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.line = fatSegments(segmentCapacity(CAP), { color: M.yellow, width: 2.2, opacity: 0.85 });
    this.group.add(this.line);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({ kind, xMin, xMax, yMin, yMax, R, yLo, yHi, xa, xb, show = true }) {
    this.group.visible = !!show;
    if (!show) return;
    const u = sceneScale();
    const lift = 0.012 * u;
    const push = (flat, x0, y0, x1, y1) => {
      const a = mathToWorld(x0, y0, 0, u);
      const b = mathToWorld(x1, y1, 0, u);
      flat.push(a.x, a.y + lift, a.z, b.x, b.y + lift, b.z);
    };
    const flat = [];
    if (kind === 'disk') {
      const n = 64;
      const r = R || 1;
      for (let i = 0; i < n; i++) {
        const t0 = (2 * Math.PI * i) / n;
        const t1 = (2 * Math.PI * (i + 1)) / n;
        push(flat, r * Math.cos(t0), r * Math.sin(t0), r * Math.cos(t1), r * Math.sin(t1));
      }
    } else if (kind === 'typeI' && yLo && yHi) {
      const a = xa ?? xMin;
      const b = xb ?? xMax;
      const n = 48;
      for (let i = 0; i < n; i++) {
        const t0 = i / n;
        const t1 = (i + 1) / n;
        const x0 = a + (b - a) * t0;
        const x1 = a + (b - a) * t1;
        push(flat, x0, yLo(x0), x1, yLo(x1));
        push(flat, x0, yHi(x0), x1, yHi(x1));
      }
      push(flat, a, yLo(a), a, yHi(a));
      push(flat, b, yLo(b), b, yHi(b));
    } else {
      const a = xMin;
      const b = xMax;
      const c = yMin;
      const d = yMax;
      push(flat, a, c, b, c);
      push(flat, b, c, b, d);
      push(flat, b, d, a, d);
      push(flat, a, d, a, c);
    }
    setFatSegments(this.line, flat);
  }
}
