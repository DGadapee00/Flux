import * as THREE from 'three';
import { mathToWorld, sceneScale } from '../engine/frame.js';
import { M, fatSegments, setFatSegments, segmentCapacity } from '@flux/core/scene3d/manim.js';

const CURVE_N = 160;
const MARK_SEGS = 24;

function world(x, y, lift = 0) {
  const u = sceneScale();
  return mathToWorld(x, y, lift, u);
}

function pushSeg(flat, x0, y0, x1, y1, lift = 0.02) {
  if (![x0, y0, x1, y1].every(Number.isFinite)) return;
  const a = world(x0, y0, lift);
  const b = world(x1, y1, lift);
  flat.push(a.x, a.y, a.z, b.x, b.y, b.z);
}

/**
 * A function in teal, its Taylor polynomial in yellow, and a mark at the probe.
 * Buffers are allocated once. Line2 cannot grow.
 */
export class GraphView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.curve = fatSegments(segmentCapacity(CURVE_N - 1), { color: M.teal, width: 3.2, opacity: 0.95 });
    this.poly = fatSegments(segmentCapacity(CURVE_N - 1), { color: M.yellow, width: 2.6, opacity: 0.95 });
    this.marks = fatSegments(segmentCapacity(MARK_SEGS), { color: M.white, width: 2, opacity: 1 });
    this.group.add(this.curve, this.poly, this.marks);
  }

  setVisible(on) {
    this.group.visible = !!on;
  }

  syncCurve(which, fn, a, b, show = true) {
    const line = which === 'poly' ? this.poly : this.curve;
    line.visible = !!show;
    if (!show) {
      setFatSegments(line, []);
      return;
    }
    const flat = [];
    let prev = null;
    for (let i = 0; i < CURVE_N; i++) {
      const x = a + ((b - a) * i) / (CURVE_N - 1);
      const y = fn(x);
      if (!Number.isFinite(y)) {
        prev = null;
        continue;
      }
      if (prev) pushSeg(flat, prev.x, prev.y, x, y, which === 'poly' ? 0.05 : 0.03);
      prev = { x, y };
    }
    setFatSegments(line, flat);
  }

  syncMark(x, y, show = true) {
    this.marks.visible = !!show && Number.isFinite(x) && Number.isFinite(y);
    if (!this.marks.visible) {
      setFatSegments(this.marks, []);
      return;
    }
    const flat = [];
    const n = 16;
    const r = 0.06;
    for (let i = 0; i < n; i++) {
      const t0 = (2 * Math.PI * i) / n;
      const t1 = (2 * Math.PI * (i + 1)) / n;
      pushSeg(flat, x + r * Math.cos(t0), y + r * Math.sin(t0), x + r * Math.cos(t1), y + r * Math.sin(t1), 0.07);
    }
    setFatSegments(this.marks, flat);
  }
}
